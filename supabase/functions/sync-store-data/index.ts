import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decryptCredentials } from "../_shared/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const shopifyUrl = connection.store_url.replace(/\/$/, '');
    const headers = {
      'X-Shopify-Access-Token': credentials.accessToken,
      'Content-Type': 'application/json',
    };

    // Fetch orders from Shopify
    console.log(`Fetching orders from Shopify store: ${connection.store_name}`);
    const ordersResponse = await fetch(
      `${shopifyUrl}/admin/api/2024-01/orders.json?status=any&limit=250`,
      { headers }
    );
    
    if (ordersResponse.ok) {
      const ordersData = await ordersResponse.json();
      const orders = ordersData.orders || [];
      
      for (const order of orders) {
        for (const lineItem of order.line_items || []) {
          const orderRecord = {
            user_id: connection.user_id,
            store_connection_id: connection.id,
            platform: 'shopify',
            external_order_id: String(order.id),
            order_number: order.name || order.order_number,
            order_date: order.created_at,
            customer_id: order.customer?.id ? String(order.customer.id) : null,
            customer_name: order.customer ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() : null,
            customer_email: order.customer?.email || null,
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
    } else {
      result.errors.push(`Failed to fetch orders: ${ordersResponse.status}`);
    }

    // Fetch products from Shopify
    console.log(`Fetching products from Shopify store: ${connection.store_name}`);
    const productsResponse = await fetch(
      `${shopifyUrl}/admin/api/2024-01/products.json?limit=250`,
      { headers }
    );

    if (productsResponse.ok) {
      const productsData = await productsResponse.json();
      const products = productsData.products || [];

      for (const product of products) {
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
    }

    // Fetch customers from Shopify
    console.log(`Fetching customers from Shopify store: ${connection.store_name}`);
    const customersResponse = await fetch(
      `${shopifyUrl}/admin/api/2024-01/customers.json?limit=250`,
      { headers }
    );

    if (customersResponse.ok) {
      const customersData = await customersResponse.json();
      const customers = customersData.customers || [];

      for (const customer of customers) {
        const customerRecord = {
          user_id: connection.user_id,
          store_connection_id: connection.id,
          platform: 'shopify',
          external_customer_id: String(customer.id),
          email: customer.email,
          name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
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
    const credentials = await decryptCredentials(connection.credentials_encrypted);

    if (!credentials?.accessToken || !credentials?.appKey) {
      result.errors.push('Missing Lazada credentials');
      return result;
    }

    // Lazada API requires signed requests
    // This is a simplified example - production would need proper signature generation
    const baseUrl = 'https://api.lazada.com/rest';
    const timestamp = Date.now();

    // Fetch orders
    console.log(`Fetching orders from Lazada store: ${connection.store_name}`);
    const ordersUrl = `${baseUrl}/orders/get?app_key=${credentials.appKey}&access_token=${credentials.accessToken}&timestamp=${timestamp}`;
    
    const ordersResponse = await fetch(ordersUrl);
    if (ordersResponse.ok) {
      const ordersData = await ordersResponse.json();
      const orders = ordersData.data?.orders || [];

      for (const order of orders) {
        const orderItems = order.order_items || [order];
        for (const item of orderItems) {
          const orderRecord = {
            user_id: connection.user_id,
            store_connection_id: connection.id,
            platform: 'lazada',
            external_order_id: String(order.order_id || order.id),
            order_number: order.order_number,
            order_date: order.created_at,
            customer_id: order.customer_id ? String(order.customer_id) : null,
            customer_name: order.address_shipping?.first_name || order.customer_name,
            customer_email: order.customer_email,
            product_id: String(item.product_id || item.sku),
            product_name: item.name || item.product_name,
            sku: item.sku,
            quantity: item.quantity || 1,
            unit_price: parseFloat(item.item_price) || 0,
            total_amount: parseFloat(item.paid_price) || 0,
            currency: order.currency || 'USD',
            order_status: order.status || 'pending',
            payment_status: order.payment_status || 'pending',
            shipping_cost: parseFloat(order.shipping_fee) || 0,
            raw_data: { order_id: order.order_id },
            synced_at: new Date().toISOString(),
          };

          const { error } = await supabase
            .from('synced_orders')
            .upsert(orderRecord, {
              onConflict: 'user_id,platform,external_order_id,product_id',
              ignoreDuplicates: false
            });

          if (!error) result.orders++;
        }
      }
    }

    // Fetch products
    console.log(`Fetching products from Lazada store: ${connection.store_name}`);
    const productsUrl = `${baseUrl}/products/get?app_key=${credentials.appKey}&access_token=${credentials.accessToken}&timestamp=${timestamp}`;
    
    const productsResponse = await fetch(productsUrl);
    if (productsResponse.ok) {
      const productsData = await productsResponse.json();
      const products = productsData.data?.products || [];

      for (const product of products) {
        const sku = product.skus?.[0] || {};
        const productRecord = {
          user_id: connection.user_id,
          store_connection_id: connection.id,
          platform: 'lazada',
          external_product_id: String(product.item_id || product.id),
          name: product.attributes?.name || product.name,
          sku: sku.SellerSku || sku.sku,
          price: parseFloat(sku.price) || 0,
          inventory_quantity: sku.quantity || 0,
          image_url: product.images?.[0] || null,
          status: product.status || 'active',
          raw_data: { item_id: product.item_id },
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

  } catch (error) {
    console.error('Lazada sync error:', error);
    result.errors.push(`Lazada sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

async function syncShopeeData(
  supabase: ReturnType<typeof createClient>,
  connection: StoreConnection
): Promise<SyncResult> {
  const result: SyncResult = { orders: 0, products: 0, customers: 0, errors: [] };
  
  try {
    const credentials = await decryptCredentials(connection.credentials_encrypted);

    if (!credentials?.accessToken || !credentials?.shopId) {
      result.errors.push('Missing Shopee credentials');
      return result;
    }

    // Shopee API requires signed requests
    const baseUrl = 'https://partner.shopeemobile.com/api/v2';
    const timestamp = Math.floor(Date.now() / 1000);

    // Fetch orders
    console.log(`Fetching orders from Shopee store: ${connection.store_name}`);
    const ordersUrl = `${baseUrl}/order/get_order_list?access_token=${credentials.accessToken}&shop_id=${credentials.shopId}&timestamp=${timestamp}`;
    
    const ordersResponse = await fetch(ordersUrl);
    if (ordersResponse.ok) {
      const ordersData = await ordersResponse.json();
      const orders = ordersData.response?.order_list || [];

      for (const order of orders) {
        // Fetch order details for items
        const detailUrl = `${baseUrl}/order/get_order_detail?access_token=${credentials.accessToken}&shop_id=${credentials.shopId}&order_sn_list=${order.order_sn}&timestamp=${timestamp}`;
        const detailResponse = await fetch(detailUrl);
        
        if (detailResponse.ok) {
          const detailData = await detailResponse.json();
          const orderDetail = detailData.response?.order_list?.[0] || order;
          const items = orderDetail.item_list || [orderDetail];

          for (const item of items) {
            const orderRecord = {
              user_id: connection.user_id,
              store_connection_id: connection.id,
              platform: 'shopee',
              external_order_id: order.order_sn,
              order_number: order.order_sn,
              order_date: new Date(order.create_time * 1000).toISOString(),
              customer_name: orderDetail.buyer_username,
              product_id: String(item.item_id),
              product_name: item.item_name,
              sku: item.model_sku || item.item_sku,
              quantity: item.model_quantity_purchased || 1,
              unit_price: parseFloat(item.model_discounted_price) || 0,
              total_amount: parseFloat(orderDetail.total_amount) || 0,
              currency: orderDetail.currency || 'USD',
              order_status: orderDetail.order_status || 'pending',
              shipping_cost: parseFloat(orderDetail.actual_shipping_fee) || 0,
              raw_data: { order_sn: order.order_sn },
              synced_at: new Date().toISOString(),
            };

            const { error } = await supabase
              .from('synced_orders')
              .upsert(orderRecord, {
                onConflict: 'user_id,platform,external_order_id,product_id',
                ignoreDuplicates: false
              });

            if (!error) result.orders++;
          }
        }
      }
    }

    // Fetch products
    console.log(`Fetching products from Shopee store: ${connection.store_name}`);
    const productsUrl = `${baseUrl}/product/get_item_list?access_token=${credentials.accessToken}&shop_id=${credentials.shopId}&timestamp=${timestamp}&offset=0&page_size=100&item_status=NORMAL`;
    
    const productsResponse = await fetch(productsUrl);
    if (productsResponse.ok) {
      const productsData = await productsResponse.json();
      const items = productsData.response?.item || [];

      for (const item of items) {
        const productRecord = {
          user_id: connection.user_id,
          store_connection_id: connection.id,
          platform: 'shopee',
          external_product_id: String(item.item_id),
          name: item.item_name || `Product ${item.item_id}`,
          sku: item.item_sku,
          price: parseFloat(item.price_info?.[0]?.current_price) || 0,
          inventory_quantity: item.stock_info?.[0]?.current_stock || 0,
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

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for optional filters
    let userId: string | null = null;
    let storeConnectionId: string | null = null;
    let platform: string | null = null;

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        userId = body.user_id || null;
        storeConnectionId = body.store_connection_id || null;
        platform = body.platform || null;
      } catch {
        // No body or invalid JSON, sync all stores
      }
    }

    // Build query for active store connections
    let query = supabase
      .from('store_connections')
      .select('*')
      .eq('is_active', true);

    if (userId) {
      query = query.eq('user_id', userId);
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
            status: syncResult.errors.length > 0 ? 'completed_with_errors' : 'completed',
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
          sync_status: syncResult.errors.length > 0 ? 'error' : 'synced',
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
