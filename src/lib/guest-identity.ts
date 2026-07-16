import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const GUEST_COOKIE = "gb_guest";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function getSecret() {
  const secret = process.env.GUEST_SESSION_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV !== "production") {
    return "grok-building-local-guest-secret-change-me";
  }
  throw new Error("GUEST_SESSION_SECRET must contain at least 32 characters.");
}

function hmac(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

function signGuestId(id: string) {
  return `${id}.${hmac(`cookie:${id}`)}`;
}

function verifyGuestCookie(value: string | null) {
  if (!value) return null;
  const separator = value.lastIndexOf(".");
  if (separator < 1) return null;
  const id = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  const expected = hmac(`cookie:${id}`);
  if (signature.length !== expected.length) return null;
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected)) ? id : null;
}

function parseCookie(request: Request) {
  const header = request.headers.get("cookie") || "";
  const pair = header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${GUEST_COOKIE}=`));
  return pair ? decodeURIComponent(pair.slice(GUEST_COOKIE.length + 1)) : null;
}

function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function resolveGuestIdentity(request: Request) {
  const storedId = verifyGuestCookie(parseCookie(request));
  const id = storedId || randomUUID();
  const userAgent = request.headers.get("user-agent") || "unknown";

  return {
    guestHash: hmac(`guest:${id}:${userAgent}`),
    ipHash: hmac(`ip:${getClientIp(request)}`),
    setCookie: storedId
      ? null
      : `${GUEST_COOKIE}=${encodeURIComponent(signGuestId(id))}; Path=/; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
  };
}
