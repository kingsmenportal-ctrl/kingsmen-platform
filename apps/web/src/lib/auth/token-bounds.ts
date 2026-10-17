export const MAX_AUTH_ACCESS_TOKEN_CHARS = 16_384;
export const MAX_AUTH_REFRESH_TOKEN_CHARS = 4_096;
export const MIN_AUTH_TOKEN_CHARS = 16;

export interface ValidAuthTokenPair {
  access_token: string;
  refresh_token: string;
}

/** Validate untrusted provider JSON before storing any token in a cookie. */
export function hasValidAuthTokenPair(payload: unknown): payload is ValidAuthTokenPair {
  if (!payload || typeof payload !== "object") return false;
  const value = payload as Record<string, unknown>;
  return typeof value.access_token === "string" &&
    value.access_token.length >= MIN_AUTH_TOKEN_CHARS &&
    value.access_token.length <= MAX_AUTH_ACCESS_TOKEN_CHARS &&
    typeof value.refresh_token === "string" &&
    value.refresh_token.length >= MIN_AUTH_TOKEN_CHARS &&
    value.refresh_token.length <= MAX_AUTH_REFRESH_TOKEN_CHARS;
}
