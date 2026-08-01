// Shared credential encryption helpers (AES-GCM) for store connections.
// Values are stored as: enc:v1:<base64(iv|ciphertext)>
// Legacy plaintext JSON values are still readable via decryptCredentials().

const PREFIX = "enc:v1:";

async function getKey(): Promise<CryptoKey> {
  const secret = Deno.env.get("STORE_CREDENTIALS_KEY");
  if (!secret) throw new Error("STORE_CREDENTIALS_KEY is not set");
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return await crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function encryptCredentials(payload: Record<string, unknown>): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify(payload));
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data),
  );
  const combined = new Uint8Array(iv.length + cipher.length);
  combined.set(iv, 0);
  combined.set(cipher, iv.length);
  return PREFIX + toBase64(combined);
}

export async function decryptCredentials(
  value: string | null,
): Promise<Record<string, string> | null> {
  if (!value) return null;

  if (!value.startsWith(PREFIX)) {
    // Legacy plaintext JSON
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  try {
    const key = await getKey();
    const combined = fromBase64(value.slice(PREFIX.length));
    const iv = combined.slice(0, 12);
    const cipher = combined.slice(12);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
    return JSON.parse(new TextDecoder().decode(plain));
  } catch (error) {
    console.error("Failed to decrypt credentials:", error);
    return null;
  }
}
