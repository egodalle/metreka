/** Lazada Open Platform REST client (signed requests). */

export const LAZADA_REGIONS = ["sg", "my", "th", "vn", "ph", "id"] as const;
export type LazadaRegion = (typeof LAZADA_REGIONS)[number];

const REGION_API_URL: Record<LazadaRegion, string> = {
  sg: "https://api.lazada.sg/rest",
  my: "https://api.lazada.com.my/rest",
  th: "https://api.lazada.co.th/rest",
  vn: "https://api.lazada.vn/rest",
  ph: "https://api.lazada.com.ph/rest",
  id: "https://api.lazada.co.id/rest",
};

export interface LazadaCredentials {
  appKey: string;
  appSecret: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  country?: string;
}

export interface LazadaApiResponse<T = unknown> {
  code: string;
  message?: string;
  type?: string;
  request_id?: string;
  data?: T;
}

async function hmacSha256(secret: string, message: string): Promise<Uint8Array> {
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

/** HMAC-SHA256 signature used by Lazada Open Platform. */
export async function lazadaSign(
  apiPath: string,
  params: Record<string, string>,
  appSecret: string,
): Promise<string> {
  const sorted = Object.keys(params).sort();
  const base = apiPath + sorted.map((k) => `${k}${params[k]}`).join("");
  const bytes = await hmacSha256(appSecret, base);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

export function lazadaApiBaseUrl(country?: string | null): string {
  const region = (country?.toLowerCase() ?? "sg") as LazadaRegion;
  return REGION_API_URL[region] ?? REGION_API_URL.sg;
}

export function resolveLazadaCredentials(
  stored: Record<string, string> | null,
): LazadaCredentials | null {
  if (!stored?.accessToken) return null;

  const appKey = stored.appKey || Deno.env.get("LAZADA_APP_KEY") || "";
  const appSecret = stored.appSecret || Deno.env.get("LAZADA_APP_SECRET") || "";
  if (!appKey || !appSecret) return null;

  return {
    appKey,
    appSecret,
    accessToken: stored.accessToken,
    refreshToken: stored.refreshToken,
    expiresAt: stored.expiresAt,
    country: stored.country,
  };
}

export async function lazadaRequest<T = unknown>(
  creds: LazadaCredentials,
  apiPath: string,
  businessParams: Record<string, string> = {},
  options: { method?: "GET" | "POST"; country?: string } = {},
): Promise<LazadaApiResponse<T>> {
  const timestamp = String(Date.now());
  const params: Record<string, string> = {
    app_key: creds.appKey,
    access_token: creds.accessToken,
    sign_method: "sha256",
    timestamp,
    ...businessParams,
  };
  params.sign = await lazadaSign(apiPath, params, creds.appSecret);

  const baseUrl = lazadaApiBaseUrl(options.country ?? creds.country);
  const url = `${baseUrl}${apiPath}?${new URLSearchParams(params)}`;
  const response = await fetch(url, { method: options.method ?? "GET" });
  return await response.json() as LazadaApiResponse<T>;
}

/** Try each regional endpoint until seller/get succeeds. */
export async function detectLazadaRegion(
  creds: LazadaCredentials,
): Promise<{ country: LazadaRegion; sellerName?: string } | null> {
  for (const country of LAZADA_REGIONS) {
    const result = await lazadaRequest<{ name?: string; seller_id?: string }>(
      creds,
      "/seller/get",
      {},
      { country },
    );
    if (result.code === "0") {
      return { country, sellerName: result.data?.name };
    }
  }
  return null;
}

export async function refreshLazadaToken(
  creds: LazadaCredentials,
): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: string } | null> {
  if (!creds.refreshToken) return null;

  const appKey = creds.appKey;
  const appSecret = creds.appSecret;
  const timestamp = String(Date.now());
  const params: Record<string, string> = {
    app_key: appKey,
    refresh_token: creds.refreshToken,
    sign_method: "sha256",
    timestamp,
  };
  params.sign = await lazadaSign("/auth/token/refresh", params, appSecret);

  const response = await fetch(
    `https://auth.lazada.com/rest/auth/token/refresh?${new URLSearchParams(params)}`,
    { method: "POST" },
  );
  const data = await response.json();
  if (!data?.access_token) return null;

  const expiresIn = Number(data.expires_in ?? 0);
  const expiresAt = expiresIn > 0
    ? new Date(Date.now() + expiresIn * 1000).toISOString()
    : undefined;

  return {
    accessToken: data.access_token as string,
    refreshToken: data.refresh_token as string | undefined,
    expiresAt,
  };
}

export function lazadaCustomerName(order: {
  customer_first_name?: string;
  customer_last_name?: string;
  address_billing?: { first_name?: string; last_name?: string };
  address_shipping?: { first_name?: string; last_name?: string };
}): string | null {
  const full = `${order.customer_first_name || ""} ${order.customer_last_name || ""}`.trim();
  if (full) return full;
  const billing = order.address_billing
    ? `${order.address_billing.first_name || ""} ${order.address_billing.last_name || ""}`.trim()
    : "";
  if (billing) return billing;
  const shipping = order.address_shipping
    ? `${order.address_shipping.first_name || ""} ${order.address_shipping.last_name || ""}`.trim()
    : "";
  return shipping || null;
}
