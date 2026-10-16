/**
 * Same-origin guard for cookie-authenticated state-changing browser routes.
 * Fail closed when Origin is missing or malformed; do not infer trust from
 * an arbitrary Host, Referer, or forwarded header.
 */
export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  let received: URL;
  let expected: URL;
  try {
    received = new URL(origin);
    expected = new URL(request.url);
  } catch {
    return false;
  }

  if (received.origin !== expected.origin) return false;

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite.toLowerCase() !== "same-origin" && fetchSite.toLowerCase() !== "none") {
    return false;
  }

  return true;
}
