import { isIP } from "node:net";

export const KINGSMEN_PATHWAYS = Object.freeze([
  "higher_education",
  "tvet",
  "seta_learnership",
  "internship",
  "apprenticeship",
  "employment"
]);

const PATHWAY_SET = new Set(KINGSMEN_PATHWAYS);
const ID_PATTERN = /^[a-z0-9][a-z0-9._-]{1,63}$/;
const SECRET_QUERY_KEY = /(token|secret|password|passwd|session|auth|credential|api.?key|signature)/i;
const SENSITIVE_QUERY_VALUE = /^(?:bearer\s+)?[A-Za-z0-9_./+=-]{32,}$/i;

function isPublicHost(hostname) {
  const host = String(hostname || "").toLowerCase();
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return false;
  if (isIP(host)) return false;
  if (!/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(host)) return false;
  return true;
}

function validateHttpsUrl(value, allowedHosts) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return { valid: false, code: "SOURCE_URL_INVALID" };
  }
  if (url.protocol !== "https:" || url.port !== "" || url.username || url.password) {
    return { valid: false, code: "SOURCE_URL_MUST_BE_PUBLIC_HTTPS" };
  }
  if (!isPublicHost(url.hostname) || !allowedHosts.includes(url.hostname.toLowerCase())) {
    return { valid: false, code: "SOURCE_HOST_NOT_ALLOWLISTED" };
  }
  for (const [key, valuePart] of url.searchParams.entries()) {
    if (SECRET_QUERY_KEY.test(key) || SENSITIVE_QUERY_VALUE.test(valuePart)) {
      return { valid: false, code: "SOURCE_URL_CONTAINS_SENSITIVE_QUERY" };
    }
  }
  return { valid: true, url };
}

/**
 * This policy authorises public GET-only source inspection. It deliberately
 * does not authorise login, form interaction, uploads, submissions or payments.
 */
export function validateProviderScoutPlan(plan, nowMs = Date.now()) {
  const errors = [];
  const add = (code) => errors.push(code);

  if (!plan || typeof plan !== "object" || Array.isArray(plan)) {
    return { valid: false, errors: ["PLAN_OBJECT_REQUIRED"], sourceCount: 0 };
  }
  if (plan.schema !== "kingsmen.provider-scout-plan.v1") add("PLAN_SCHEMA_INVALID");
  if (plan.concurrency !== 1) add("CONCURRENCY_MUST_EQUAL_ONE");
  if (!Number.isInteger(plan.maxSources) || plan.maxSources < 1 || plan.maxSources > 25) {
    add("MAX_SOURCES_MUST_BE_1_TO_25");
  }
  if (!Array.isArray(plan.sources) || plan.sources.length === 0) {
    add("AT_LEAST_ONE_APPROVED_SOURCE_REQUIRED");
  } else if (plan.sources.length > 25 || plan.sources.length > (Number.isInteger(plan.maxSources) ? plan.maxSources : 25)) {
    add("SOURCE_COUNT_EXCEEDS_PLAN_LIMIT");
  }

  const seen = new Set();
  const sources = Array.isArray(plan.sources) ? plan.sources : [];
  for (const source of sources) {
    if (!source || typeof source !== "object" || Array.isArray(source)) {
      add("SOURCE_OBJECT_REQUIRED");
      continue;
    }
    if (typeof source.id !== "string" || !ID_PATTERN.test(source.id) || seen.has(source.id)) {
      add("SOURCE_ID_INVALID_OR_DUPLICATE");
    } else {
      seen.add(source.id);
    }
    if (typeof source.providerId !== "string" || !ID_PATTERN.test(source.providerId)) add("PROVIDER_ID_INVALID");
    if (typeof source.providerName !== "string" || !source.providerName.trim() || source.providerName.length > 160) add("PROVIDER_NAME_INVALID");
    if (!PATHWAY_SET.has(source.pathway)) add("PATHWAY_INVALID");
    if (source.authorityType !== "official_provider_website") add("OFFICIAL_SOURCE_TYPE_REQUIRED");
    if (source.accessMode !== "public_read_only") add("PUBLIC_READ_ONLY_REQUIRED");
    if (source.approved !== true) add("FOUNDER_APPROVAL_REQUIRED");
    if (typeof source.approvedBy !== "string" || !source.approvedBy.trim()) add("APPROVER_REQUIRED");
    if (typeof source.approvalEvidenceRef !== "string" || !source.approvalEvidenceRef.trim()) add("APPROVAL_EVIDENCE_REQUIRED");
    if (typeof source.approvedAt !== "string" || !Number.isFinite(Date.parse(source.approvedAt))) {
      add("APPROVAL_TIMESTAMP_INVALID");
    } else if (Date.parse(source.approvedAt) > nowMs + 60_000) {
      add("APPROVAL_TIMESTAMP_IN_FUTURE");
    }
    if (typeof source.expiresAt !== "string" || !Number.isFinite(Date.parse(source.expiresAt)) || Date.parse(source.expiresAt) <= nowMs) {
      add("APPROVAL_EXPIRED_OR_INVALID");
    }
    if (!Array.isArray(source.allowedHosts) || source.allowedHosts.length < 1 || source.allowedHosts.length > 10) {
      add("HOST_ALLOWLIST_INVALID");
      continue;
    }
    const hosts = source.allowedHosts.map((host) => typeof host === "string" ? host.toLowerCase() : "");
    if (hosts.some((host) => !isPublicHost(host)) || new Set(hosts).size !== hosts.length) {
      add("HOST_ALLOWLIST_INVALID");
      continue;
    }
    const urlResult = validateHttpsUrl(source.officialSourceUrl, hosts);
    if (!urlResult.valid) add(urlResult.code);
  }

  return { valid: errors.length === 0, errors: [...new Set(errors)], sourceCount: sources.length };
}

export function detectProviderPageBlocker({ title = "", bodyText = "", url = "" } = {}) {
  const text = `${title} ${bodyText} ${url}`.toLowerCase();
  if (/captcha|recaptcha|verify you are human|cloudflare challenge|security challenge/.test(text)) return "BLOCKED_BY_CAPTCHA";
  if (/sign in|log in|login required|authentication required|create an account to continue/.test(text)) return "BLOCKED_BY_LOGIN";
  if (/access denied|request blocked|automated access is prohibited/.test(text)) return "BLOCKED_BY_ACCESS_POLICY";
  return null;
}

export function isSensitiveUrl(urlValue) {
  try {
    const url = new URL(urlValue);
    for (const [key, value] of url.searchParams.entries()) {
      if (SECRET_QUERY_KEY.test(key) || SENSITIVE_QUERY_VALUE.test(value)) return true;
    }
    return Boolean(url.username || url.password);
  } catch {
    return true;
  }
}
