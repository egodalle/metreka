import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decryptCredentials } from "../_shared/crypto.ts";
import {
  detectLazadaRegion,
  lazadaCustomerName,
  lazadaRequest,
  refreshLazadaToken,
  resolveLazadaCredentials,
  type LazadaCredentials,
} from "../_shared/lazada.ts";
import {
  parseShopeeCredentials,
  shopeeShopGet,
} from "../_shared/shopee.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-metreka-sync-secret',
};

const SHOPIFY_API_VERSION = "2026-01";
const SHOPIFY_PAGE_LIMIT = 250;
const SHOPIFY_MAX_PAGES = 40; // safety cap (~10k records per resource)
const INCREMENTAL_LOOKBACK_MS = 2 * 24 * 60 * 60 * 1000; // overlap to avoid gaps

/** When last_sync_at exists, pull updates since then (minus lookback). */
function shopifySinceParam(lastSyncAt: string | null | undefined): string {
  if (!lastSyncAt) return "";
  const since = new Date(new Date(lastSyncAt).getTime() - INCREMENTAL_LOOKBACK_MS).toISOString();
  return `&updated_at_min=${encodeURIComponent(since)}`;
}


type AuthResult =
  | { authorized: true; userId: string | null; isPrivileged: true }
  | { authorized: true; userId: string; isPrivileged: false }
  | { authorized: false };

/** Allow service-role, cron secret, or authenticated user JWT. */
async function authorizeRequest(req: Request): Promise<AuthResult> {
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const cronSecret = Deno.env.get('SYNC_CRON_SECRET');
  const headerSecret = req.headers.get('X-Metreka-Sync-Secret');

  if (cronSecret && headerSecret && headerSecret === cronSecret) {
    return { authorized: true, userId: null, isPrivileged: true };
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { authorized: false };
  }

  const token = authHeader.slice(7).trim();
  if (serviceKey && token === serviceKey.trim()) {
    return { authorized: true, userId: null, isPrivileged: true };
  }

  // Legacy JWT service_role key (function-to-function calls)
  if (token.startsWith('eyJ') && isServiceRoleJwt(token)) {
    return { authorized: true, userId: null, isPrivileged: true };
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !anonKey) {
    return { authorized: false };
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) {
    return { authorized: false };
  }

  return { authorized: true, userId: user.id, isPrivileged: false };
}

function isServiceRoleJwt(token: string): boolean {
  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) return false;
    const padded = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(padded));
    return payload.role === 'service_role';
  } catch {
    return false;
  }
}

interface StoreConnection {
  id: string;
  user_id: string;
  platform: string;
  store_name: string;
  store_url: string | null;
  access_token_encrypted: string | null;
  credentials_encrypted: string | null;
  is_active: boolean;
}

interface SyncResult {
  orders: number;
  products: number;
  customers: number;
  errors: string[];
}

/** Normalize store_url to https://{shop}.myshopify.com for Admin API calls */
function shopifyBaseUrl(storeUrl: string): string {
  const host = storeUrl.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
  return `https://${host}`;
}

/** Shopify often omits customer names on order.customer — use billing/shipping/email fallbacks */
function shopifyAddressName(addr: {
  name?: string;
  first_name?: string;
  last_name?: string;
} | null | undefined): string {
  if (!addr) return "";
  if (addr.name?.trim()) return addr.name.trim();
  return `${addr.first_name || ""} ${addr.last_name || ""}`.trim();
}

function shopifyOrderCustomer(order: {
  customer?: { id?: number; first_name?: string; last_name?: string; email?: string };
  billing_address?: { name?: string; first_name?: string; last_name?: string };
  shipping_address?: { name?: string; first_name?: string; last_name?: string };
  email?: string;
  contact_email?: string;
}): { id: string | null; name: string | null; email: string | null } {
  const id = order.customer?.id != null ? String(order.customer.id) : null;
  const email =
    order.email?.trim() ||
    order.contact_email?.trim() ||
    order.customer?.email?.trim() ||
    null;

  const name =
    shopifyAddressName(order.customer as { first_name?: string; last_name?: string }) ||
    shopifyAddressName(order.billing_address) ||
    shopifyAddressName(order.shipping_address) ||
    (email ? email.split("@")[0] : null) ||
    (id ? `Customer #${id.slice(-6)}` : null);

  return { id, name, email };
}

function shopifyCustomerRecordName(customer: {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  default_address?: { name?: string; first_name?: string; last_name?: string };
}): string {
  const fullName = `${customer.first_name || ""} ${customer.last_name || ""}`.trim();
  if (fullName) return fullName;
  const fromAddress = shopifyAddressName(customer.default_address);
  if (fromAddress) return fromAddress;
  if (customer.email?.trim()) return customer.email.split("@")[0];
  return `Customer #${String(customer.id).slice(-6)}`;
}

/** Delete sync logs older than 30 days to prevent unbounded growth */
async function pruneSyncLogs(
  supabase: ReturnType<typeof createClient>,
): Promise<void> {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from("sync_logs")
    .delete()
    .lt("started_at", cutoff);
  if (error) {
    console.warn("sync_logs prune failed:", error.message);
  }
}

function parseShopifyNextUrl(linkHeader: string | null): string | null {
  if (!linkHeader) return null;
  // e.g. <https://shop.myshopify.com/admin/api/2026-01/orders.json?page_info=...&limit=250>; rel="next"
  const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
  return match?.[1] ?? null;
}

async function fetchShopifyPages<T>(
  initialUrl: string,
  headers: Record<string, string>,
  extract: (body: Record<string, unknown>) => T[],
): Promise<{ items: T[]; error?: string }> {
  const items: T[] = [];
  let nextUrl: string | null = initialUrl;
  let pages = 0;

  while (nextUrl && pages < SHOPIFY_MAX_PAGES) {
    pages += 1;
    const response = await fetch(nextUrl, { headers });
    if (!response.ok) {
      return { items, error: `HTTP ${response.status} on page ${pages}` };
    }
    const body = await response.json() as Record<string, unknown>;
    items.push(...extract(body));
    nextUrl = parseShopifyNextUrl(response.headers.get("Link"));
  }

  return { items };
}

// Platform-specific sync handlers
async function syncShopifyData(
  supabase: ReturnType<typeof createClient>,
  connection: StoreConnection
): Promise<SyncResult> {
  const result: SyncResult = { orders: 0, products: 0, customers: 0, errors: [] };
  
  try {
    // Decrypt credentials (in production, use proper encryption)
    const credentials = await decryptCredentials(connection.credentials_encrypted);
    
    if (!credentials?.accessToken || !connection.store_url) {
      result.errors.push('Missing Shopify credentials or store URL');
      return result;
    }

    const shopifyUrl = shopifyBaseUrl(connection.store_url);
    const headers = {
      'X-Shopify-Access-Token': credentials.accessToken,
      'Content-Type': 'application/json',
    };
    const since = shopifySinceParam(connection.last_sync_at);
    if (since) {
      console.log(`Incremental Shopify sync since ${connection.last_sync_at} (with lookback)`);
    }

    // Fetch orders from Shopify (paginated)
    console.log(`Fetching orders from Shopify store: ${connection.store_name}`);
    const ordersPage = await fetchShopifyPages(
      `${shopifyUrl}/admin/api/${SHOPIFY_API_VERSION}/orders.json?status=any&limit=${SHOPIFY_PAGE_LIMIT}${since}`,
      headers,
      (body) => (body.orders as unknown[]) || [],
    );
    if (ordersPage.error) {
      result.errors.push(`Failed to fetch orders: ${ordersPage.error}`);
    }

    for (const order of ordersPage.items as Array<Record<string, any>>) {
        const customer = shopifyOrderCustomer(order);
        for (const lineItem of order.line_items || []) {
          const orderRecord = {
            user_id: connection.user_id,
            store_connection_id: connection.id,
            platform: 'shopify',
            external_order_id: String(order.id),
            order_number: order.name || order.order_number,
            order_date: order.created_at,
            customer_id: customer.id,
            customer_name: customer.name,
            customer_email: customer.email,
            product_id: String(lineItem.product_id),
            product_name: lineItem.title,
            sku: lineItem.sku,
            quantity: lineItem.quantity,
            unit_price: parseFloat(lineItem.price) || 0,
            total_amount: parseFloat(lineItem.price) * lineItem.quantity,
            currency: order.currency || 'USD',
            order_status: order.fulfillment_status || 'unfulfilled',
            payment_status: order.financial_status || 'pending',
            shipping_cost: parseFloat(order.total_shipping_price_set?.shop_money?.amount || '0'),
            discount_amount: parseFloat(order.total_discounts || '0'),
            raw_data: { order_id: order.id, line_item_id: lineItem.id },
            synced_at: new Date().toISOString(),
          };

          const { error } = await supabase
            .from('synced_orders')
            .upsert(orderRecord, { 
              onConflict: 'user_id,platform,external_order_id,product_id',
              ignoreDuplicates: false 
            });

          if (error) {
            console.error('Error upserting order:', error);
            result.errors.push(`Order ${order.id}: ${error.message}`);
          } else {
            result.orders++;
          }
        }
    }

    // Fetch products from Shopify (paginated)
    console.log(`Fetching products from Shopify store: ${connection.store_name}`);
    const productsPage = await fetchShopifyPages(
      `${shopifyUrl}/admin/api/${SHOPIFY_API_VERSION}/products.json?limit=${SHOPIFY_PAGE_LIMIT}${since}`,
      headers,
      (body) => (body.products as unknown[]) || [],
    );
    if (productsPage.error) {
      result.errors.push(`Failed to fetch products: ${productsPage.error}`);
    }

    for (const product of productsPage.items as Array<Record<string, any>>) {
        const variant = product.variants?.[0] || {};
        const productRecord = {
          user_id: connection.user_id,
          store_connection_id: connection.id,
          platform: 'shopify',
          external_product_id: String(product.id),
          name: product.title,
          sku: variant.sku,
          price: parseFloat(variant.price) || 0,
          cost: parseFloat(variant.cost) || 0,
          inventory_quantity: variant.inventory_quantity || 0,
          image_url: product.image?.src || null,
          category: product.product_type || null,
          status: product.status || 'active',
          raw_data: { product_id: product.id },
          synced_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('synced_products')
          .upsert(productRecord, {
            onConflict: 'user_id,platform,external_product_id',
            ignoreDuplicates: false
          });

        if (error) {
          result.errors.push(`Product ${product.id}: ${error.message}`);
        } else {
          result.products++;
        }
    }

    // Fetch customers from Shopify (paginated)
    console.log(`Fetching customers from Shopify store: ${connection.store_name}`);
    const customersPage = await fetchShopifyPages(
      `${shopifyUrl}/admin/api/${SHOPIFY_API_VERSION}/customers.json?limit=${SHOPIFY_PAGE_LIMIT}${since}`,
      headers,
      (body) => (body.customers as unknown[]) || [],
    );
    if (customersPage.error) {
      result.errors.push(`Failed to fetch customers: ${customersPage.error}`);
    }

    for (const customer of customersPage.items as Array<Record<string, any>>) {
        const customerRecord = {
          user_id: connection.user_id,
          store_connection_id: connection.id,
          platform: 'shopify',
          external_customer_id: String(customer.id),
          email: customer.email,
          name: shopifyCustomerRecordName(customer),
          phone: customer.phone,
          total_orders: customer.orders_count || 0,
          total_spent: parseFloat(customer.total_spent) || 0,
          first_order_date: customer.created_at,
          last_order_date: customer.last_order_date,
          raw_data: { customer_id: customer.id },
          synced_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('synced_customers')
          .upsert(customerRecord, {
            onConflict: 'user_id,platform,external_customer_id',
            ignoreDuplicates: false
          });

        if (error) {
          result.errors.push(`Customer ${customer.id}: ${error.message}`);
        } else {
          result.customers++;
        }
    }

  } catch (error) {
    console.error('Shopify sync error:', error);
    result.errors.push(`Shopify sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

async function syncLazadaData(
  supabase: ReturnType<typeof createClient>,
  connection: StoreConnection
): Promise<SyncResult> {
  const result: SyncResult = { orders: 0, products: 0, customers: 0, errors: [] };

  try {
    const stored = await decryptCredentials(connection.credentials_encrypted);
    let creds = resolveLazadaCredentials(stored);
    if (!creds) {
      result.errors.push('Missing Lazada credentials (App Key, App Secret, Access Token)');
      return result;
    }

    if (creds.refreshToken && creds.expiresAt && new Date(creds.expiresAt) <= new Date()) {
      const refreshed = await refreshLazadaToken(creds);
      if (refreshed) {
        creds = { ...creds, accessToken: refreshed.accessToken, refreshToken: refreshed.refreshToken ?? creds.refreshToken, expiresAt: refreshed.expiresAt };
        const encrypted = await encryptCredentialsForUpdate(creds);
        await supabase.from('store_connections').update({
          credentials_encrypted: encrypted,
          access_token_encrypted: encrypted,
          updated_at: new Date().toISOString(),
        }).eq('id', connection.id);
      }
    }

    if (!creds.country) {
      const detected = await detectLazadaRegion(creds);
      if (!detected) {
        result.errors.push('Could not reach Lazada API. Check credentials and regional access.');
        return result;
      }
      creds = { ...creds, country: detected.country };
    }

    const createdAfter = new Date();
    createdAfter.setDate(createdAfter.getDate() - 90);
    const createdAfterIso = createdAfter.toISOString().replace(/\.\d{3}Z$/, '+00:00');

    // --- Orders ---
    console.log(`Fetching orders from Lazada store: ${connection.store_name}`);
    const orderSummaries: Array<Record<string, unknown>> = [];
    let offset = 0;
    const orderLimit = 100;

    while (true) {
      const ordersResult = await lazadaRequest<{ orders?: Array<Record<string, unknown>>; count?: number }>(
        creds,
        '/orders/get',
        {
          sort_by: 'created_at',
          sort_direction: 'DESC',
          created_after: createdAfterIso,
          offset: String(offset),
          limit: String(orderLimit),
        },
      );

      if (ordersResult.code !== '0') {
        result.errors.push(`Lazada orders/get: ${ordersResult.message ?? ordersResult.code}`);
        break;
      }

      const batch = ordersResult.data?.orders ?? [];
      orderSummaries.push(...batch);
      if (batch.length < orderLimit) break;
      offset += orderLimit;
      if (offset >= 500) break; // safety cap per sync
    }

    const orderMap = new Map<string, Record<string, unknown>>();
    for (const order of orderSummaries) {
      orderMap.set(String(order.order_id), order);
    }

    const orderIds = [...orderMap.keys()];
    const customerAgg = new Map<string, {
      name: string | null;
      email: string | null;
      totalOrders: number;
      totalSpent: number;
      firstOrderDate: string | null;
      lastOrderDate: string | null;
    }>();

    for (let i = 0; i < orderIds.length; i += 50) {
      const chunk = orderIds.slice(i, i + 50);
      const itemsResult = await lazadaRequest<Array<{ order_items?: Array<Record<string, unknown>> }>>(
        creds,
        '/orders/items/get',
        { order_ids: `[${chunk.join(',')}]` },
      );

      if (itemsResult.code !== '0') {
        result.errors.push(`Lazada orders/items/get: ${itemsResult.message ?? itemsResult.code}`);
        continue;
      }

      const orderGroups = Array.isArray(itemsResult.data) ? itemsResult.data : [];
      for (const group of orderGroups) {
        const items = group.order_items ?? [];
        for (const item of items) {
          const orderId = String(item.order_id ?? '');
          const order = orderMap.get(orderId);
          const customerName = order ? lazadaCustomerName(order as Parameters<typeof lazadaCustomerName>[0]) : null;
          const customerId = order?.buyer_id ? String(order.buyer_id) : orderId;
          const orderDate = String(order?.created_at ?? item.created_at ?? new Date().toISOString());
          const lineTotal = parseFloat(String(item.paid_price ?? item.item_price ?? 0)) || 0;
          const qty = parseInt(String(item.quantity ?? 1), 10) || 1;
          const unitPrice = parseFloat(String(item.item_price ?? 0)) || (qty > 0 ? lineTotal / qty : lineTotal);

          const orderRecord = {
            user_id: connection.user_id,
            store_connection_id: connection.id,
            platform: 'lazada',
            external_order_id: orderId,
            order_number: String(order?.order_number ?? orderId),
            order_date: orderDate,
            customer_id: customerId,
            customer_name: customerName,
            customer_email: null,
            product_id: String(item.product_id ?? item.shop_sku ?? item.sku ?? item.order_item_id),
            product_name: String(item.name ?? item.product_name ?? 'Unknown item'),
            sku: item.sku ? String(item.sku) : null,
            quantity: qty,
            unit_price: unitPrice,
            total_amount: lineTotal,
            currency: String(order?.currency ?? 'USD'),
            order_status: String(item.status ?? order?.statuses ?? 'pending'),
            payment_status: String(order?.payment_method ?? 'pending'),
            shipping_cost: parseFloat(String(item.shipping_amount ?? 0)) || 0,
            raw_data: { order_id: orderId, order_item_id: item.order_item_id },
            synced_at: new Date().toISOString(),
          };

          const { error } = await supabase
            .from('synced_orders')
            .upsert(orderRecord, {
              onConflict: 'user_id,platform,external_order_id,product_id',
              ignoreDuplicates: false,
            });

          if (error) {
            result.errors.push(`Order ${orderId}: ${error.message}`);
          } else {
            result.orders++;
          }

          if (customerId) {
            const existing = customerAgg.get(customerId) ?? {
              name: customerName,
              email: null,
              totalOrders: 0,
              totalSpent: 0,
              firstOrderDate: orderDate,
              lastOrderDate: orderDate,
            };
            existing.totalOrders += 1;
            existing.totalSpent += lineTotal;
            if (!existing.name && customerName) existing.name = customerName;
            if (orderDate < (existing.firstOrderDate ?? orderDate)) existing.firstOrderDate = orderDate;
            if (orderDate > (existing.lastOrderDate ?? orderDate)) existing.lastOrderDate = orderDate;
            customerAgg.set(customerId, existing);
          }
        }
      }
    }

    // --- Products ---
    console.log(`Fetching products from Lazada store: ${connection.store_name}`);
    let productOffset = 0;
    const productLimit = 50;

    while (true) {
      const productsResult = await lazadaRequest<{ products?: Array<Record<string, unknown>> }>(
        creds,
        '/products/get',
        {
          filter: 'all',
          offset: String(productOffset),
          limit: String(productLimit),
        },
      );

      if (productsResult.code !== '0') {
        result.errors.push(`Lazada products/get: ${productsResult.message ?? productsResult.code}`);
        break;
      }

      const products = productsResult.data?.products ?? [];
      for (const product of products) {
        const sku = (product.skus as Array<Record<string, unknown>> | undefined)?.[0] ?? {};
        const attributes = product.attributes as Record<string, unknown> | undefined;
        const images = sku.Images as string[] | undefined;
        const productRecord = {
          user_id: connection.user_id,
          store_connection_id: connection.id,
          platform: 'lazada',
          external_product_id: String(product.item_id ?? product.id),
          name: String(attributes?.name ?? product.name ?? 'Unnamed product'),
          sku: sku.SellerSku ? String(sku.SellerSku) : (sku.sku ? String(sku.sku) : null),
          price: parseFloat(String(sku.price ?? 0)) || 0,
          inventory_quantity: parseInt(String(sku.quantity ?? 0), 10) || 0,
          image_url: images?.[0] ?? null,
          status: String(product.status ?? 'active'),
          raw_data: { item_id: product.item_id },
          synced_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('synced_products')
          .upsert(productRecord, {
            onConflict: 'user_id,platform,external_product_id',
            ignoreDuplicates: false,
          });

        if (error) {
          result.errors.push(`Product ${product.item_id}: ${error.message}`);
        } else {
          result.products++;
        }
      }

      if (products.length < productLimit) break;
      productOffset += productLimit;
      if (productOffset >= 500) break;
    }

    // --- Customers (derived from orders) ---
    for (const [customerId, customer] of customerAgg) {
      const customerRecord = {
        user_id: connection.user_id,
        store_connection_id: connection.id,
        platform: 'lazada',
        external_customer_id: customerId,
        email: customer.email,
        name: customer.name ?? `Buyer #${customerId.slice(-6)}`,
        phone: null,
        total_orders: customer.totalOrders,
        total_spent: customer.totalSpent,
        first_order_date: customer.firstOrderDate,
        last_order_date: customer.lastOrderDate,
        raw_data: { customer_id: customerId },
        synced_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('synced_customers')
        .upsert(customerRecord, {
          onConflict: 'user_id,platform,external_customer_id',
          ignoreDuplicates: false,
        });

      if (error) {
        result.errors.push(`Customer ${customerId}: ${error.message}`);
      } else {
        result.customers++;
      }
    }

  } catch (error) {
    console.error('Lazada sync error:', error);
    result.errors.push(`Lazada sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

async function encryptCredentialsForUpdate(creds: LazadaCredentials): Promise<string> {
  const { encryptCredentials } = await import("../_shared/crypto.ts");
  return encryptCredentials({
    appKey: creds.appKey,
    appSecret: creds.appSecret,
    accessToken: creds.accessToken,
    refreshToken: creds.refreshToken ?? '',
    expiresAt: creds.expiresAt ?? '',
    country: creds.country ?? '',
  });
}

async function syncShopeeData(
  supabase: ReturnType<typeof createClient>,
  connection: StoreConnection
): Promise<SyncResult> {
  const result: SyncResult = { orders: 0, products: 0, customers: 0, errors: [] };
  
  try {
    const raw = await decryptCredentials(connection.credentials_encrypted);
    const credentials = parseShopeeCredentials(raw as Record<string, string>);

    if (!credentials) {
      result.errors.push(
        'Missing Shopee credentials (Partner ID, Partner Key, Shop ID, and Access Token are required)',
      );
      return result;
    }

    const now = Math.floor(Date.now() / 1000);
    const timeFrom = now - 30 * 24 * 60 * 60; // last 30 days

    // Fetch order list (cursor pagination)
    console.log(`Fetching orders from Shopee store: ${connection.store_name}`);
    let cursor = "";
    let orderPages = 0;
    const orderSns: string[] = [];

    while (orderPages < 20) {
      orderPages += 1;
      const listParams: Record<string, string | number> = {
        time_range_field: "create_time",
        time_from: timeFrom,
        time_to: now,
        page_size: 50,
      };
      if (cursor) listParams.cursor = cursor;

      const ordersResponse = await shopeeShopGet(
        credentials,
        "/api/v2/order/get_order_list",
        listParams,
      );

      if (!ordersResponse.ok) {
        result.errors.push(`Shopee order list HTTP ${ordersResponse.status}`);
        break;
      }

      const ordersData = await ordersResponse.json();
      if (ordersData.error) {
        result.errors.push(`Shopee order list: ${ordersData.message || ordersData.error}`);
        break;
      }

      const batch = ordersData.response?.order_list || [];
      for (const order of batch) {
        if (order.order_sn) orderSns.push(order.order_sn);
      }

      const more = ordersData.response?.more;
      cursor = ordersData.response?.next_cursor || "";
      if (!more || !cursor) break;
    }

    // Fetch details in chunks of 50
    for (let i = 0; i < orderSns.length; i += 50) {
      const chunk = orderSns.slice(i, i + 50);
      const detailResponse = await shopeeShopGet(
        credentials,
        "/api/v2/order/get_order_detail",
        {
          order_sn_list: chunk.join(","),
          response_optional_fields: "item_list,buyer_user_id,buyer_username,total_amount,actual_shipping_fee,currency",
        },
      );

      if (!detailResponse.ok) {
        result.errors.push(`Shopee order detail HTTP ${detailResponse.status}`);
        continue;
      }

      const detailData = await detailResponse.json();
      if (detailData.error) {
        result.errors.push(`Shopee order detail: ${detailData.message || detailData.error}`);
        continue;
      }

      for (const orderDetail of detailData.response?.order_list || []) {
        const items = orderDetail.item_list || [];
        if (items.length === 0) continue;

        let lineIndex = 0;
        for (const item of items) {
          const qty = Number(item.model_quantity_purchased) || 1;
          const unitPrice = parseFloat(item.model_discounted_price ?? item.model_original_price) || 0;
          const lineTotal = unitPrice * qty;

          const orderRecord = {
            user_id: connection.user_id,
            store_connection_id: connection.id,
            platform: 'shopee',
            external_order_id: orderDetail.order_sn,
            order_number: orderDetail.order_sn,
            order_date: new Date((orderDetail.create_time || now) * 1000).toISOString(),
            customer_name: orderDetail.buyer_username || null,
            product_id: String(item.item_id ?? item.model_id ?? lineIndex),
            product_name: item.item_name || item.model_name || 'Item',
            sku: item.model_sku || item.item_sku || null,
            quantity: qty,
            unit_price: unitPrice,
            // Line-level amount only — do NOT use order total_amount per line
            total_amount: lineTotal,
            currency: orderDetail.currency || 'USD',
            order_status: orderDetail.order_status || 'pending',
            // Attribute shipping once on the first line item
            shipping_cost: lineIndex === 0 ? (parseFloat(orderDetail.actual_shipping_fee) || 0) : 0,
            raw_data: { order_sn: orderDetail.order_sn, item_id: item.item_id },
            synced_at: new Date().toISOString(),
          };

          const { error } = await supabase
            .from('synced_orders')
            .upsert(orderRecord, {
              onConflict: 'user_id,platform,external_order_id,product_id',
              ignoreDuplicates: false
            });

          if (!error) result.orders++;
          else result.errors.push(`Order ${orderDetail.order_sn}: ${error.message}`);
          lineIndex += 1;
        }
      }
    }

    // Fetch products (item list + base info)
    console.log(`Fetching products from Shopee store: ${connection.store_name}`);
    const productsResponse = await shopeeShopGet(
      credentials,
      "/api/v2/product/get_item_list",
      {
        offset: 0,
        page_size: 100,
        item_status: "NORMAL",
      },
    );

    if (productsResponse.ok) {
      const productsData = await productsResponse.json();
      if (productsData.error) {
        result.errors.push(`Shopee products: ${productsData.message || productsData.error}`);
      } else {
        const itemIds = (productsData.response?.item || [])
          .map((item: { item_id?: number }) => item.item_id)
          .filter(Boolean);

        if (itemIds.length > 0) {
          const baseInfoRes = await shopeeShopGet(
            credentials,
            "/api/v2/product/get_item_base_info",
            { item_id_list: itemIds.slice(0, 50).join(",") },
          );

          if (baseInfoRes.ok) {
            const baseInfo = await baseInfoRes.json();
            for (const item of baseInfo.response?.item_list || []) {
              const price =
                parseFloat(item.price_info?.[0]?.current_price) ||
                parseFloat(item.price_info?.[0]?.original_price) ||
                0;
              const productRecord = {
                user_id: connection.user_id,
                store_connection_id: connection.id,
                platform: 'shopee',
                external_product_id: String(item.item_id),
                name: item.item_name || `Product ${item.item_id}`,
                sku: item.item_sku || null,
                price,
                inventory_quantity: item.stock_info_v2?.summary_info?.total_available_stock
                  ?? item.stock_info?.[0]?.current_stock
                  ?? 0,
                image_url: item.image?.image_url_list?.[0] || null,
                status: item.item_status || 'active',
                raw_data: { item_id: item.item_id },
                synced_at: new Date().toISOString(),
              };

              const { error } = await supabase
                .from('synced_products')
                .upsert(productRecord, {
                  onConflict: 'user_id,platform,external_product_id',
                  ignoreDuplicates: false
                });

              if (!error) result.products++;
            }
          }
        }
      }
    } else {
      result.errors.push(`Shopee products HTTP ${productsResponse.status}`);
    }

  } catch (error) {
    console.error('Shopee sync error:', error);
    result.errors.push(`Shopee sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const auth = await authorizeRequest(req);
  if (!auth.authorized) {
    return new Response(
      JSON.stringify({ success: false, error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for optional filters
    let userId: string | null = auth.isPrivileged ? null : auth.userId;
    let storeConnectionId: string | null = null;
    let platform: string | null = null;

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (auth.isPrivileged) {
          userId = body.user_id || body.userId || null;
        }
        storeConnectionId =
          body.store_connection_id || body.storeConnectionId || null;
        platform = body.platform || null;
      } catch {
        // No body or invalid JSON
      }
    }

    // Non-privileged callers may only sync their own stores
    if (!auth.isPrivileged) {
      userId = auth.userId;
    }

    // Verify store ownership when a specific connection is requested
    if (storeConnectionId && userId) {
      const { data: owned } = await supabase
        .from('store_connections')
        .select('id')
        .eq('id', storeConnectionId)
        .eq('user_id', userId)
        .maybeSingle();
      if (!owned) {
        return new Response(
          JSON.stringify({ success: false, error: 'Store connection not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    }

    await pruneSyncLogs(supabase);

    // Build query for active store connections
    let query = supabase
      .from('store_connections')
      .select('*')
      .eq('is_active', true);

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (!auth.isPrivileged) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    if (storeConnectionId) {
      query = query.eq('id', storeConnectionId);
    }
    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data: connections, error: connectionsError } = await query;

    if (connectionsError) {
      throw new Error(`Failed to fetch store connections: ${connectionsError.message}`);
    }

    console.log(`Found ${connections?.length || 0} active store connections to sync`);

    const results: Record<string, SyncResult> = {};

    for (const connection of connections || []) {
      console.log(`Syncing ${connection.platform} store: ${connection.store_name}`);

      // Create sync log entry
      const { data: syncLog } = await supabase
        .from('sync_logs')
        .insert({
          user_id: connection.user_id,
          store_connection_id: connection.id,
          platform: connection.platform,
          sync_type: 'full',
          status: 'running',
        })
        .select()
        .single();

      let syncResult: SyncResult;

      switch (connection.platform.toLowerCase()) {
        case 'shopify':
          syncResult = await syncShopifyData(supabase, connection);
          break;
        case 'lazada':
          syncResult = await syncLazadaData(supabase, connection);
          break;
        case 'shopee':
          syncResult = await syncShopeeData(supabase, connection);
          break;
        default:
          syncResult = { orders: 0, products: 0, customers: 0, errors: [`Unsupported platform: ${connection.platform}`] };
      }

      results[`${connection.platform}_${connection.store_name}`] = syncResult;

      // Update sync log
      if (syncLog?.id) {
        await supabase
          .from('sync_logs')
          .update({
            status: syncResult.errors.length > 0 ? 'failed' : 'completed',
            records_synced: syncResult.orders + syncResult.products + syncResult.customers,
            error_message: syncResult.errors.length > 0 ? syncResult.errors.join('; ') : null,
            completed_at: new Date().toISOString(),
          })
          .eq('id', syncLog.id);
      }

      // Update last_sync_at on store connection
      await supabase
        .from('store_connections')
        .update({
          last_sync_at: new Date().toISOString(),
          // Canonical statuses match UI + sync_logs (completed/failed).
          // Legacy rows may still have synced/error; frontend normalizes those.
          sync_status: syncResult.errors.length > 0 ? 'failed' : 'completed',
        })
        .eq('id', connection.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${connections?.length || 0} store(s)`,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
