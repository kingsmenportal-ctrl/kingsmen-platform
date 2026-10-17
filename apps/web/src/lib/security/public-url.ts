/**
 * Accept only well-formed HTTPS URLs intended to be shown as public provider
 * links or stored as reviewer evidence. This function does not fetch the URL.
 */
export function isPublicHttpsUrl(value: unknown, maxLength = 2048): value is string {
  if (typeof value !== "string" || value.length === 0 || value.length > maxLength) return false;
  if (value.trim() !== value) return false;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !url.hostname || url.username || url.password) return false;
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Keep user search text from introducing PostgREST filter grammar or wildcard
 * operators. Search remains Unicode-aware for South African names and places.
 */
export function sanitizePublicSearchQuery(value: string, maxLength = 100): string {
  return value.normalize("NFKC").replace(/[^\p{L}\p{N}\s'-]/gu, "").trim().slice(0, maxLength);
}
