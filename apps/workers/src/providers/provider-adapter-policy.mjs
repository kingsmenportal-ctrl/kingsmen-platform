export const PLAYWRIGHT_SCOUT_WORKER_CODE = "playwright.public_source.scout";
export const PLAYWRIGHT_SCOUT_OPERATION = "inspect_public_source";
export const KINGSMEN_PATHWAYS = Object.freeze([
  "higher_education",
  "tvet",
  "seta_learnership",
  "internship",
  "apprenticeship",
  "employment"
]);

const PATHWAYS = new Set(KINGSMEN_PATHWAYS);
const ID_PATTERN = /^[a-z0-9][a-z0-9._-]{1,63}$/;
const REF_PATTERN = /^[A-Za-z0-9][A-Za-z0-9:._/-]{2,240}$/;

function publicHostname(value) {
  if (typeof value !== "string" || !value || value.includes("*")) return false;
  const host = value.toLowerCase();
  if (host.endsWith(".") || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return false;
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) || host.includes(":")) return false;
  return /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(host);
}

function validHttpsUrl(value, allowedHosts) {
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      && url.port === ""
      && !url.username
      && !url.password
      && publicHostname(url.hostname)
      && allowedHosts.includes(url.hostname.toLowerCase())
      && !isSensitiveUrl(value);
  } catch {
    return false;
  }
}

export function isSensitiveUrl(value) {
  try {
    const url = new URL(value);
    if (url.username || url.password) return true;
    if (url.pathname.split("/").some((segment) => /^(?:bearer[-_.]?)?[A-Za-z0-9_~+/=-]{48,}$/i.test(segment))) return true;
    for (const [key, queryValue] of url.searchParams.entries()) {
      if (/(token|secret|password|passwd|session|auth|credential|api.?key|signature|access.?key)/i.test(key)) return true;
      if (/^(?:bearer\s+)?[A-Za-z0-9_./+=-]{32,}$/i.test(queryValue)) return true;
    }
    return false;
  } catch {
    return true;
  }
}

export function validateAdapterRegistry(registry, nowMs = Date.now()) {
  const errors = [];
  const adapters = registry && Array.isArray(registry.adapters) ? registry.adapters : [];
  if (!registry || registry.schema !== "kingsmen.playwright-provider-adapter-registry.v1" || !Array.isArray(registry.adapters)) {
    return { valid: false, errors: ["ADAPTER_REGISTRY_SCHEMA_INVALID"], enabledAdapters: [] };
  }
  const seen = new Set();
  for (const adapter of adapters) {
    if (!adapter || typeof adapter !== "object" || Array.isArray(adapter)) {
      errors.push("ADAPTER_OBJECT_REQUIRED");
      continue;
    }
    if (typeof adapter.id !== "string" || !ID_PATTERN.test(adapter.id) || seen.has(adapter.id)) errors.push("ADAPTER_ID_INVALID_OR_DUPLICATE");
    else seen.add(adapter.id);
    if (typeof adapter.providerId !== "string" || !ID_PATTERN.test(adapter.providerId)) errors.push("ADAPTER_PROVIDER_ID_INVALID");
    if (typeof adapter.version !== "string" || !/^\d+\.\d+\.\d+$/.test(adapter.version)) errors.push("ADAPTER_VERSION_INVALID");
    if (adapter.enabled !== true) continue;
    if (adapter.capability !== "PUBLIC_SOURCE_INSPECTION") errors.push("ADAPTER_CAPABILITY_NOT_SUPPORTED");
    if (adapter.accessMode !== "public_read_only") errors.push("ADAPTER_MUST_BE_PUBLIC_READ_ONLY");
    if (!Array.isArray(adapter.allowedActions)
      || adapter.allowedActions.length !== 1
      || adapter.allowedActions[0] !== PLAYWRIGHT_SCOUT_OPERATION) {
      errors.push("ADAPTER_ACTION_SCOPE_INVALID");
    }
    if (!Array.isArray(adapter.officialDomains) || adapter.officialDomains.length < 1 || adapter.officialDomains.length > 10) {
      errors.push("ADAPTER_OFFICIAL_DOMAINS_INVALID");
    }
    if (!Array.isArray(adapter.allowedHosts) || adapter.allowedHosts.length < 1 || adapter.allowedHosts.length > 10) {
      errors.push("ADAPTER_HOST_ALLOWLIST_INVALID");
      continue;
    }
    const hosts = adapter.allowedHosts.map((host) => typeof host === "string" ? host.toLowerCase() : "");
    const domains = Array.isArray(adapter.officialDomains) ? adapter.officialDomains.map((host) => String(host).toLowerCase()) : [];
    if (hosts.some((host) => !publicHostname(host)) || new Set(hosts).size !== hosts.length) errors.push("ADAPTER_HOST_ALLOWLIST_INVALID");
    if (domains.some((host) => !publicHostname(host)) || new Set(domains).size !== domains.length) errors.push("ADAPTER_OFFICIAL_DOMAINS_INVALID");
    if (hosts.some((host) => !domains.includes(host))) errors.push("ADAPTER_HOST_NOT_IN_OFFICIAL_DOMAINS");
    const auth = adapter.authorization;
    if (!auth || auth.status !== "APPROVED") errors.push("PROVIDER_AUTHORIZATION_REQUIRED");
    if (!auth || typeof auth.providerAuthorizationEvidenceRef !== "string" || !REF_PATTERN.test(auth.providerAuthorizationEvidenceRef)) errors.push("PROVIDER_AUTHORIZATION_EVIDENCE_REQUIRED");
    if (!auth || typeof auth.termsReviewEvidenceRef !== "string" || !REF_PATTERN.test(auth.termsReviewEvidenceRef)) errors.push("PROVIDER_TERMS_REVIEW_EVIDENCE_REQUIRED");
    if (!auth || typeof auth.founderApprovalEvidenceRef !== "string" || !REF_PATTERN.test(auth.founderApprovalEvidenceRef)) errors.push("FOUNDER_APPROVAL_EVIDENCE_REQUIRED");
    if (!auth || typeof auth.approvedBy !== "string" || !auth.approvedBy.trim()) errors.push("FOUNDER_APPROVER_REQUIRED");
    if (!auth || !Number.isFinite(Date.parse(auth.approvedAt)) || Date.parse(auth.approvedAt) > nowMs + 60_000) errors.push("ADAPTER_APPROVAL_TIMESTAMP_INVALID");
    if (!auth || !Number.isFinite(Date.parse(auth.expiresAt)) || Date.parse(auth.expiresAt) <= nowMs) errors.push("ADAPTER_APPROVAL_EXPIRED_OR_INVALID");
  }
  return {
    valid: errors.length === 0,
    errors: [...new Set(errors)],
    enabledAdapters: adapters.filter((adapter) => adapter && adapter.enabled === true)
  };
}

export function authorizeScoutDispatch(registry, dispatch, nowMs = Date.now()) {
  const registryResult = validateAdapterRegistry(registry, nowMs);
  if (!registryResult.valid) return { valid: false, code: "ADAPTER_REGISTRY_INVALID", errors: registryResult.errors };
  if (!dispatch || dispatch.worker_code !== PLAYWRIGHT_SCOUT_WORKER_CODE) {
    return { valid: false, code: "WORKER_CODE_NOT_ALLOWED" };
  }
  const payload = dispatch.payload;
  const allowedPayloadKeys = ["adapterId", "adapterVersion", "operation", "providerId", "schema", "source"];
  if (!payload || typeof payload !== "object" || Array.isArray(payload)
      || Object.keys(payload).sort().join("|") !== allowedPayloadKeys.sort().join("|")) {
    return { valid: false, code: "DISPATCH_PAYLOAD_SHAPE_INVALID" };
  }
  if (payload.schema !== "kingsmen.playwright-scout-dispatch.v1"
      || payload.operation !== PLAYWRIGHT_SCOUT_OPERATION) {
    return { valid: false, code: "DISPATCH_OPERATION_NOT_ALLOWED" };
  }
  const adapter = registryResult.enabledAdapters.find((item) =>
    item.id === payload.adapterId
    && item.version === payload.adapterVersion
    && item.providerId === payload.providerId
  );
  if (!adapter) return { valid: false, code: "APPROVED_PROVIDER_ADAPTER_NOT_FOUND" };

  const source = payload.source;
  const sourceKeys = ["id", "officialSourceUrl", "pathway", "providerId", "providerName"];
  if (!source || typeof source !== "object" || Array.isArray(source)
      || Object.keys(source).sort().join("|") !== sourceKeys.sort().join("|")) {
    return { valid: false, code: "SOURCE_PAYLOAD_SHAPE_INVALID" };
  }
  if (source.providerId !== adapter.providerId
      || typeof source.id !== "string" || !ID_PATTERN.test(source.id)
      || typeof source.providerName !== "string" || !source.providerName.trim() || source.providerName.length > 160
      || !PATHWAYS.has(source.pathway)) {
    return { valid: false, code: "SOURCE_IDENTITY_INVALID" };
  }
  if (!validHttpsUrl(source.officialSourceUrl, adapter.allowedHosts)) {
    return { valid: false, code: "SOURCE_URL_NOT_APPROVED" };
  }
  const evidence = Array.isArray(dispatch.evidence_refs) ? dispatch.evidence_refs : [];
  const requiredEvidence = [
    adapter.authorization.providerAuthorizationEvidenceRef,
    adapter.authorization.termsReviewEvidenceRef,
    adapter.authorization.founderApprovalEvidenceRef
  ];
  if (requiredEvidence.some((ref) => !evidence.includes(ref))) {
    return { valid: false, code: "DISPATCH_APPROVAL_EVIDENCE_MISSING" };
  }
  return {
    valid: true,
    adapter,
    source,
    allowedHosts: adapter.allowedHosts.map((host) => host.toLowerCase()),
    evidenceRefs: evidence
  };
}
