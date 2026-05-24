import { createHmac, timingSafeEqual } from "crypto";

/**
 * Stateless HMAC-based unsubscribe tokens.
 *
 * Email recipients click /unsubscribe?u=<user_id>&t=<token>. The page
 * verifies the HMAC matches, so we never have to look up tokens in the
 * DB — but we still know which user is opting out.
 *
 * The signing key is SUPABASE_SERVICE_ROLE_KEY (server-only). If that
 * key is rotated, all outstanding unsubscribe links become invalid; this
 * is acceptable since rotation is rare and the user can opt out from
 * their profile page.
 */
function getSecret(): string {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!k) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY for token signing");
  return k;
}

export function makeUnsubscribeToken(userId: string): string {
  return createHmac("sha256", getSecret()).update(userId).digest("hex").slice(0, 32);
}

export function verifyUnsubscribeToken(userId: string, token: string): boolean {
  const expected = makeUnsubscribeToken(userId);
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch {
    return false;
  }
}

export function buildUnsubscribeUrl(
  baseUrl: string,
  userId: string
): string {
  const token = makeUnsubscribeToken(userId);
  return `${baseUrl}/unsubscribe?u=${userId}&t=${token}`;
}
