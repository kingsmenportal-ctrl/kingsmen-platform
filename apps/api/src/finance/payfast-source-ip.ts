/**
 * Verify PayFast ITN source addresses using an operator-maintained exact-IP allow-list.
 * Deliberately ignores X-Forwarded-For: it is client-controlled unless a trusted proxy
 * has explicitly normalized it. Pass the direct socket remoteAddress.
 */
export function normalizeIpAddress(value: string): string | null {
  const input = value.trim().toLowerCase();
  if (!input || input.includes("%")) return null;
  // Node commonly reports IPv4 peers as IPv4-mapped IPv6 addresses.
  const mapped = input.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  const candidate = mapped?.[1] ?? input;
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(candidate)) {
    const octets = candidate.split(".").map(Number);
    if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) return null;
    return octets.join(".");
  }
  // Canonicalize valid IPv6 using Node's URL parser without accepting zone identifiers.
  if (candidate.includes(":")) {
    try {
      const url = new URL(`http://[${candidate}]/`);
      const hostname = url.hostname.toLowerCase();
      return hostname.startsWith("[") && hostname.endsWith("]") ? hostname.slice(1, -1) : hostname;
    } catch {
      return null;
    }
  }
  return null;
}

/** Returns false when the allow-list is absent, empty, or malformed. */
export function isAllowedPayFastSourceIp(remoteAddress: string | undefined, configuredAllowList: string | undefined): boolean {
  if (!remoteAddress || !configuredAllowList?.trim()) return false;
  const remote = normalizeIpAddress(remoteAddress);
  if (!remote) return false;
  const entries = configuredAllowList.split(",").map((entry) => entry.trim()).filter(Boolean);
  if (entries.length === 0) return false;
  const normalizedEntries = entries.map(normalizeIpAddress);
  // Fail closed on any malformed configured entry, so a typo cannot silently weaken policy.
  if (normalizedEntries.some((entry) => entry === null)) return false;
  return normalizedEntries.includes(remote);
}
