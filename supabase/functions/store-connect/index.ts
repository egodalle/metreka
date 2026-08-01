import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { encryptCredentials } from "../_shared/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: unknown) =>
  console.log(`[STORE-CONNECT] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type Platform = "shopify" | "lazada" | "shopee";
const PLATFORMS: Platform[] = ["shopify", "lazada", "shopee"];

const SHOPIFY_SCOPES = "read_orders,read_products,read_customers";

// ---------- helpers ----------

function normalizeShopDomain(input: string): string {
  let value = input.trim().toLowerCase();
  value = value.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!value.includes(".")) value = `${value}.myshopify.com`;
  return value;
}

function isValidShopDomain(domain: string): boolean {
  return /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(domain);
}

function b64url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") +
    "===".slice((value.length + 3) % 4);
  return atob(padded);
}

async function hmac(secret: string, message: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message)),
  );
}

function stateSecret(): string {
  const secret = Deno.env.get("STORE_CREDENTIALS_KEY");
  if (!secret) throw new Error("STORE_CREDENTIALS_KEY is not set");
  return secret;
}

async function signState(payload: Record<string, unknown>): Promise<string> {
  const body = b64url(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = b64url(await hmac(stateSecret(), body));
  return `${body}.${sig}`;
}

async function verifyState(state: string): Promise<Record<string, string> | null> {
  const [body, sig] = state.split(".");
  if (!body || !sig) return null;
  const expected = b64url(await hmac(stateSecret(), body));
  if (expected !== sig) return null;
  const payload = JSON.parse(b64urlDecode(body));
  // 30 minute validity
  if (!payload.t || Date.now() - payload.t > 30 * 60 * 1000) return null;
  return payload;
}

// Lazada signs requests with HMAC-SHA256 over the sorted concatenated params.
async function lazadaSign(
  apiPath: string,
  params: Record<string, string>,
  appSecret: string,
): Promise<string> {
  const sorted = Object.keys(params).sort();
  const base = apiPath + sorted.map((k) => `${k}${params[k]}`).join("");
  const bytes = await hmac(appSecret, base);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

// ---------- credential validation ----------

async function validateShopifyCredentials(
  storeUrl: string,
  accessToken: string,
): Promise<{ ok: boolean; error?: string; shopName?: string }> {
  try {
    const response = await fetch(`https://${storeUrl}/admin/api/2024-01/shop.json`, {
      headers: { "X-Shopify-Access-Token": accessToken, "Content-Type": "application/json" },
    });
    if (!response.ok) {
      return {
        ok: false,
        error: response.status === 401 || response.status === 403
          ? "Shopify rejected these credentials. Check the Admin API access token and its scopes."
          : `Shopify returned ${response.status} for ${storeUrl}.`,
      };
    }
    const data = await response.json();
    return { ok: true, shopName: data?.shop?.name };
  } catch (error) {
    return { ok: false, error: `Could not reach ${storeUrl}: ${(error as Error).message}` };
  }
}

// ---------- persistence ----------

async function upsertConnection(
  admin: ReturnType<typeof createClient>,
  params: {
    userId: string;
    platform: Platform;
    storeName: string;
    storeUrl: string | null;
    credentials: Record<string, string>;
  },
) {
  const encrypted = await encryptCredentials(params.credentials);

  const { data: existing } = await admin
    .from("store_connections")
    .select("id")
    .eq("user_id", params.userId)
    .eq("platform", params.platform)
    .maybeSingle();

  const row = {
    user_id: params.userId,
    platform: params.platform,
    store_name: params.storeName,
    store_url: params.storeUrl,
    credentials_encrypted: encrypted,
    access_token_encrypted: params.credentials.accessToken ? encrypted : null,
    is_active: true,
    sync_status: "pending",
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { data, error } = await admin
      .from("store_connections")
      .update(row)
      .eq("id", existing.id)
      .select("id, platform, store_name, store_url, sync_status, is_active, last_sync_at, created_at, updated_at, user_id")
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  const { data, error } = await admin
    .from("store_connections")
    .insert(row)
    .select("id, platform, store_name, store_url, sync_status, is_active, last_sync_at, created_at, updated_at, user_id")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function triggerSync(storeConnectionId: string) {
  const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/sync-store-data`;
  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({ storeConnectionId }),
    });
  } catch (error) {
    console.error("Failed to trigger sync:", error);
  }
}

// ---------- handler ----------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization header" }, 401);

    const anon = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userError } = await anon.auth.getUser();
    const user = userData?.user;
    if (userError || !user) return json({ error: "Not authenticated" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "");
    log("request", { action, userId: user.id });

    // --- 1. Save API-key credentials ---
    if (action === "save_credentials") {
      const platform = String(body.platform ?? "") as Platform;
      if (!PLATFORMS.includes(platform)) return json({ error: "Unsupported platform" }, 400);

      const credentials: Record<string, string> = {};
      for (const [key, value] of Object.entries(body.credentials ?? {})) {
        if (typeof value === "string" && value.trim()) credentials[key] = value.trim();
      }

      let storeUrl: string | null = null;
      let storeName = typeof body.storeName === "string" && body.storeName.trim()
        ? body.storeName.trim()
        : null;

      if (platform === "shopify") {
        if (!credentials.storeUrl && !body.storeUrl) {
          return json({ error: "Store URL is required" }, 400);
        }
        storeUrl = normalizeShopDomain(String(credentials.storeUrl ?? body.storeUrl));
        delete credentials.storeUrl;
        if (!isValidShopDomain(storeUrl)) {
          return json({ error: "Enter a valid Shopify domain, e.g. my-store.myshopify.com" }, 400);
        }
        if (!credentials.accessToken) {
          return json({ error: "Admin API access token is required" }, 400);
        }
        const check = await validateShopifyCredentials(storeUrl, credentials.accessToken);
        if (!check.ok) return json({ error: check.error }, 400);
        storeName = storeName ?? check.shopName ?? storeUrl;
      }

      if (platform === "lazada") {
        if (!credentials.appKey || !credentials.accessToken) {
          return json({ error: "App Key and Access Token are required" }, 400);
        }
        storeName = storeName ?? "Lazada Store";
      }

      if (platform === "shopee") {
        if (!credentials.shopId || !credentials.accessToken) {
          return json({ error: "Shop ID and Access Token are required" }, 400);
        }
        storeName = storeName ?? `Shopee Shop ${credentials.shopId}`;
      }

      const connection = await upsertConnection(admin, {
        userId: user.id,
        platform,
        storeName: storeName ?? `${platform} store`,
        storeUrl,
        credentials,
      });

      await triggerSync(connection.id as string);
      return json({ connection });
    }

    // --- 2. Start OAuth ---
    if (action === "oauth_start") {
      const platform = String(body.platform ?? "") as Platform;
      const redirectUri = String(body.redirectUri ?? "");
      if (!redirectUri.startsWith("http")) return json({ error: "Invalid redirect URI" }, 400);

      if (platform === "shopify") {
        const clientId = Deno.env.get("SHOPIFY_CLIENT_ID");
        if (!clientId) {
          return json({
            error: "Shopify OAuth is not configured yet. Connect with an Admin API access token instead.",
            code: "oauth_not_configured",
          }, 400);
        }
        const shop = normalizeShopDomain(String(body.storeUrl ?? ""));
        if (!isValidShopDomain(shop)) {
          return json({ error: "Enter your store domain, e.g. my-store.myshopify.com" }, 400);
        }
        const state = await signState({ u: user.id, p: platform, s: shop, t: Date.now() });
        const authorizeUrl =
          `https://${shop}/admin/oauth/authorize?client_id=${encodeURIComponent(clientId)}` +
          `&scope=${encodeURIComponent(SHOPIFY_SCOPES)}` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&state=${encodeURIComponent(state)}`;
        return json({ authorizeUrl });
      }

      if (platform === "lazada") {
        const appKey = Deno.env.get("LAZADA_APP_KEY");
        if (!appKey) {
          return json({
            error: "Lazada OAuth is not configured yet. Connect with your App Key and Access Token instead.",
            code: "oauth_not_configured",
          }, 400);
        }
        const state = await signState({ u: user.id, p: platform, t: Date.now() });
        const authorizeUrl = `https://auth.lazada.com/oauth/authorize?response_type=code&force_auth=true` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&client_id=${encodeURIComponent(appKey)}` +
          `&state=${encodeURIComponent(state)}`;
        return json({ authorizeUrl });
      }

      return json({ error: "This platform does not support OAuth. Use API credentials." }, 400);
    }

    // --- 3. Complete OAuth (token exchange) ---
    if (action === "oauth_callback") {
      const code = String(body.code ?? "");
      const state = String(body.state ?? "");
      const redirectUri = String(body.redirectUri ?? "");
      if (!code || !state) return json({ error: "Missing code or state" }, 400);

      const payload = await verifyState(state);
      if (!payload) return json({ error: "Invalid or expired OAuth state" }, 400);
      if (payload.u !== user.id) return json({ error: "OAuth state does not match this user" }, 403);

      const platform = payload.p as Platform;

      if (platform === "shopify") {
        const clientId = Deno.env.get("SHOPIFY_CLIENT_ID");
        const clientSecret = Deno.env.get("SHOPIFY_CLIENT_SECRET");
        if (!clientId || !clientSecret) return json({ error: "Shopify OAuth is not configured" }, 400);

        const shop = String(payload.s);
        const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
        });
        if (!tokenResponse.ok) {
          const text = await tokenResponse.text();
          log("Shopify token exchange failed", { status: tokenResponse.status, text });
          return json({ error: "Shopify rejected the authorization code" }, 400);
        }
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token as string | undefined;
        if (!accessToken) return json({ error: "Shopify did not return an access token" }, 400);

        const check = await validateShopifyCredentials(shop, accessToken);
        const connection = await upsertConnection(admin, {
          userId: user.id,
          platform: "shopify",
          storeName: check.shopName ?? shop,
          storeUrl: shop,
          credentials: { accessToken, scope: tokenData.scope ?? SHOPIFY_SCOPES },
        });
        await triggerSync(connection.id as string);
        return json({ connection });
      }

      if (platform === "lazada") {
        const appKey = Deno.env.get("LAZADA_APP_KEY");
        const appSecret = Deno.env.get("LAZADA_APP_SECRET");
        if (!appKey || !appSecret) return json({ error: "Lazada OAuth is not configured" }, 400);

        const params: Record<string, string> = {
          app_key: appKey,
          code,
          sign_method: "sha256",
          timestamp: String(Date.now()),
        };
        if (redirectUri) params.redirect_uri = redirectUri;
        params.sign = await lazadaSign("/auth/token/create", params, appSecret);

        const tokenResponse = await fetch(
          `https://auth.lazada.com/rest/auth/token/create?${new URLSearchParams(params)}`,
          { method: "POST" },
        );
        const tokenData = await tokenResponse.json().catch(() => ({}));
        const accessToken = tokenData.access_token as string | undefined;
        if (!accessToken) {
          log("Lazada token exchange failed", tokenData);
          return json({ error: tokenData?.message ?? "Lazada rejected the authorization code" }, 400);
        }

        const shopName = tokenData.country_user_info?.[0]?.short_code ?? "Lazada Store";
        const connection = await upsertConnection(admin, {
          userId: user.id,
          platform: "lazada",
          storeName: `Lazada ${shopName}`,
          storeUrl: null,
          credentials: {
            accessToken,
            refreshToken: tokenData.refresh_token ?? "",
            appKey,
            expiresIn: String(tokenData.expires_in ?? ""),
          },
        });
        await triggerSync(connection.id as string);
        return json({ connection });
      }

      return json({ error: "Unsupported OAuth platform" }, 400);
    }

    // --- 4. Manual re-sync ---
    if (action === "sync_now") {
      const storeConnectionId = String(body.storeConnectionId ?? "");
      const { data: owned } = await admin
        .from("store_connections")
        .select("id")
        .eq("id", storeConnectionId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!owned) return json({ error: "Store connection not found" }, 404);

      await admin
        .from("store_connections")
        .update({ sync_status: "syncing" })
        .eq("id", storeConnectionId);
      await triggerSync(storeConnectionId);
      return json({ success: true });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (error) {
    console.error("[STORE-CONNECT] error", error);
    return json({ error: (error as Error).message ?? "Unexpected error" }, 500);
  }
});
