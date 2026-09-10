export const ADMIN_SESSION_COOKIE = "xingyu_admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7;

type AdminSessionPayload = {
  version: 1;
  expiresAt: number;
};

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

function fromBase64Url(value: string) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function hmacKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createAdminSessionToken(
  secret: string,
  now = Date.now(),
) {
  const payload: AdminSessionPayload = {
    version: 1,
    expiresAt: now + ADMIN_SESSION_MAX_AGE * 1000,
  };
  const encodedPayload = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(secret),
    encoder.encode(encodedPayload),
  );
  return `${encodedPayload}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifyAdminSessionToken(
  token: string | undefined,
  secret: string | undefined,
  now = Date.now(),
) {
  if (!token || !secret) return false;
  const [encodedPayload, encodedSignature, extra] = token.split(".");
  if (!encodedPayload || !encodedSignature || extra) return false;
  try {
    const validSignature = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(secret),
      fromBase64Url(encodedSignature),
      encoder.encode(encodedPayload),
    );
    if (!validSignature) return false;
    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(encodedPayload)),
    ) as Partial<AdminSessionPayload>;
    return (
      payload.version === 1 &&
      typeof payload.expiresAt === "number" &&
      Number.isFinite(payload.expiresAt) &&
      payload.expiresAt > now
    );
  } catch {
    return false;
  }
}
