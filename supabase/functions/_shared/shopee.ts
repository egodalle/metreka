/** Shopee Open Platform v2 HMAC helpers (Deno). */

export type ShopeeCredentials = {
  partnerId: string;
  partnerKey: string;
  shopId: string;
  accessToken: string;
};

const HOST = "https://partner.shopeemobile.com";

export function parseShopeeCredentials(
  raw: Record<string, string> | null | undefined,
): ShopeeCredentials | null {
  if (!raw?.partnerId || !raw?.partnerKey || !raw?.shopId || !raw?.accessToken) {
    return null;
  }
  return {
    partnerId: String(raw.partnerId).trim(),
    partnerKey: String(raw.partnerKey).trim(),
    shopId: String(raw.shopId).trim(),
    accessToken: String(raw.accessToken).trim(),
  };
}

/** Shop API sign: partner_id + path + timestamp + access_token + shop_id */
export async function shopeeShopSign(
  partnerKey: string,
  partnerId: string,
  path: string,
  timestamp: number,
  accessToken: string,
  shopId: string,
): Promise<string> {
  const base = `${partnerId}${path}${timestamp}${accessToken}${shopId}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(partnerKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(base));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function shopeeShopGet(
  creds: ShopeeCredentials,
  path: string,
  extraParams: Record<string, string | number> = {},
): Promise<Response> {
  const timestamp = Math.floor(Date.now() / 1000);
  const sign = await shopeeShopSign(
    creds.partnerKey,
    creds.partnerId,
    path,
    timestamp,
    creds.accessToken,
    creds.shopId,
  );

  const params = new URLSearchParams({
    partner_id: creds.partnerId,
    timestamp: String(timestamp),
    access_token: creds.accessToken,
    shop_id: creds.shopId,
    sign,
  });

  for (const [k, v] of Object.entries(extraParams)) {
    params.set(k, String(v));
  }

  return fetch(`${HOST}${path}?${params.toString()}`);
}

/** Light credential check via get_shop_info. */
export async function validateShopeeCredentials(
  creds: ShopeeCredentials,
): Promise<{ ok: true; shopName?: string } | { ok: false; error: string }> {
  try {
    const res = await shopeeShopGet(creds, "/api/v2/shop/get_shop_info");
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) {
      return {
        ok: false,
        error:
          data.message ||
          data.error ||
          `Shopee rejected credentials (HTTP ${res.status})`,
      };
    }
    return {
      ok: true,
      shopName: data.response?.shop_name ?? data.response?.shop_name,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Shopee validation failed",
    };
  }
}
