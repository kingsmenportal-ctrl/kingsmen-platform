import { isIP } from "node:net";

export const INSTITUTION_PATHWAYS = Object.freeze([
  "HIGHER_EDUCATION", "TVET", "SETA_LEARNERSHIPS",
  "INTERNSHIPS", "APPRENTICESHIPS", "EMPLOYMENT"
]);

export const SCOUT_STATUSES = Object.freeze({
  HEALTHY_PUBLIC_FORM: "HEALTHY_PUBLIC_FORM",
  HEALTHY_PUBLIC_INFORMATION: "HEALTHY_PUBLIC_INFORMATION",
  CAPTCHA_REQUIRED: "CAPTCHA_REQUIRED",
  OTP_OR_MFA_REQUIRED: "OTP_OR_MFA_REQUIRED",
  AUTHENTICATION_REQUIRED: "AUTHENTICATION_REQUIRED",
  PAYMENT_STEP_DETECTED: "PAYMENT_STEP_DETECTED",
  RATE_LIMITED: "RATE_LIMITED",
  WRITE_STEP_PRESENT: "WRITE_STEP_PRESENT",
  PORTAL_BLOCKED: "PORTAL_BLOCKED",
  PORTAL_UNAVAILABLE: "PORTAL_UNAVAILABLE",
  MAPPING_DRIFT_REVIEW_REQUIRED: "MAPPING_DRIFT_REVIEW_REQUIRED",
  PROBE_FAILED: "PROBE_FAILED"
});

function isPrivateOrLocalHost(hostname) {
  const host = String(hostname || "").toLowerCase().replace(/^\[|\]$/g, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return true;
  if (!isIP(host)) return false;
  if (host.includes(":")) {
    return host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80:");
  }
  const p = host.split(".").map(Number);
  return p[0] === 10 || p[0] === 127 || p[0] === 0 ||
    (p[0] === 169 && p[1] === 254) ||
    (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
    (p[0] === 192 && p[1] === 168);
}

export function hostMatchesApproved(hostname, approvedHosts = []) {
  const host = String(hostname || "").toLowerCase().replace(/\.$/, "");
  return approvedHosts.some((entry) => {
    const allowed = String(entry || "").toLowerCase().replace(/^\*\./, "").replace(/\.$/, "");
    return allowed && (host === allowed || host.endsWith("." + allowed));
  });
}

export function validateScoutTarget(target) {
  const problems = [];
  if (!target || typeof target !== "object") return { valid: false, problems: ["TARGET_OBJECT_REQUIRED"] };
  if (!/^[a-z0-9][a-z0-9._-]{1,99}$/i.test(String(target.id || ""))) problems.push("SAFE_TARGET_ID_REQUIRED");
  if (!String(target.name || "").trim()) problems.push("DISPLAY_NAME_REQUIRED");
  if (target.enabled !== true) problems.push("TARGET_NOT_EXPLICITLY_ENABLED");
  if (!Array.isArray(target.pathways) || target.pathways.length === 0 ||
      target.pathways.some((item) => !INSTITUTION_PATHWAYS.includes(item))) problems.push("SUPPORTED_PATHWAYS_REQUIRED");
  if (!Array.isArray(target.approvedHosts) || target.approvedHosts.length === 0) problems.push("APPROVED_HOSTS_REQUIRED");

  let parsed = null;
  try {
    parsed = new URL(String(target.url || ""));
    if (parsed.protocol !== "https:") problems.push("HTTPS_ONLY");
    if (parsed.username || parsed.password) problems.push("URL_CREDENTIALS_FORBIDDEN");
    if (parsed.port && parsed.port !== "443") problems.push("NON_STANDARD_PORT_FORBIDDEN");
    if (isPrivateOrLocalHost(parsed.hostname)) problems.push("PRIVATE_OR_LOCAL_HOST_FORBIDDEN");
    if (!hostMatchesApproved(parsed.hostname, target.approvedHosts || [])) problems.push("HOST_NOT_ALLOWLISTED");
    if (parsed.search || parsed.hash) problems.push("QUERY_AND_FRAGMENT_NOT_ALLOWED_IN_BASE_URL");
  } catch {
    problems.push("VALID_HTTPS_URL_REQUIRED");
  }

  return {
    valid: problems.length === 0,
    problems,
    safeUrl: parsed && problems.length === 0 ? parsed.origin + parsed.pathname : null,
    host: parsed && problems.length === 0 ? parsed.hostname.toLowerCase() : null
  };
}

export function validateProbeRequest({ url, method = "GET", approvedHosts = [] } = {}) {
  if (String(method).toUpperCase() !== "GET") return { allowed: false, reason: "NON_GET_REQUEST_BLOCKED" };
  let parsed;
  try {
    parsed = new URL(String(url || ""));
  } catch {
    return { allowed: false, reason: "INVALID_REQUEST_URL" };
  }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
    return { allowed: false, reason: "HTTPS_OR_CREDENTIAL_POLICY_BLOCKED" };
  }
  if (isPrivateOrLocalHost(parsed.hostname)) return { allowed: false, reason: "PRIVATE_OR_LOCAL_HOST_BLOCKED" };
  if (!hostMatchesApproved(parsed.hostname, approvedHosts)) return { allowed: false, reason: "HOST_NOT_ALLOWLISTED" };
  return { allowed: true, reason: "ALLOWLISTED_GET" };
}

export function safeEvidenceUrl(value) {
  try {
    const parsed = new URL(String(value || ""));
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) return null;
    parsed.search = "";
    parsed.hash = "";
    parsed.pathname = parsed.pathname
      .split("/")
      .map((part) => {
        if (/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(part)) return "[redacted-id]";
        if (/^[a-z0-9_-]{32,}$/i.test(part)) return "[redacted-token]";
        if (/^\d{8,}$/.test(part)) return "[redacted-number]";
        return part;
      })
      .join("/");
    return parsed.origin + parsed.pathname;
  } catch {
    return null;
  }
}

export function classifyPortal({ httpStatus = null, url = "", bodyText = "", fields = [], structureChanged = false } = {}) {
  const body = String(bodyText || "").toLowerCase();
  const route = String(url || "").toLowerCase();
  const labels = fields.map((field) =>
    [field.label, field.ariaLabel, field.autoComplete, field.name, field.inputType]
      .filter(Boolean).join(" ")
  ).join(" ").toLowerCase();
  const signals = body + " " + route + " " + labels;

  if (httpStatus === 429 || /too many requests|rate.?limit|request limit exceeded/.test(signals)) return SCOUT_STATUSES.RATE_LIMITED;
  if (/captcha|recaptcha|hcaptcha|turnstile|verify you are human|robot check/.test(signals)) return SCOUT_STATUSES.CAPTCHA_REQUIRED;
  if (/one[- ]time[- ]code|one.time code|one time password|\botp\b|verification code|authenticator code|multi.factor|mfa/.test(signals)) return SCOUT_STATUSES.OTP_OR_MFA_REQUIRED;
  if (fields.some((field) => String(field.inputType).toLowerCase() === "password") ||
      /sign in|log in|login required|authentication required/.test(signals)) return SCOUT_STATUSES.AUTHENTICATION_REQUIRED;
  if (/\/payment|\/checkout|payment gateway/.test(route) || /pay now|secure payment|make payment/.test(body)) return SCOUT_STATUSES.PAYMENT_STEP_DETECTED;
  if (httpStatus === 401 || httpStatus === 403) return SCOUT_STATUSES.PORTAL_BLOCKED;
  if (httpStatus === null || httpStatus >= 500 || httpStatus < 200) return SCOUT_STATUSES.PORTAL_UNAVAILABLE;
  if (structureChanged) return SCOUT_STATUSES.MAPPING_DRIFT_REVIEW_REQUIRED;
  if (fields.some((field) => String(field.formMethod || "").toUpperCase() === "POST")) return SCOUT_STATUSES.WRITE_STEP_PRESENT;
  return fields.length ? SCOUT_STATUSES.HEALTHY_PUBLIC_FORM : SCOUT_STATUSES.HEALTHY_PUBLIC_INFORMATION;
}

export function proposeAccessibleLocator(field = {}) {
  const label = String(field.label || field.ariaLabel || "").trim();
  if (label) return { strategy: "getByLabel", value: label, confidence: "HIGH" };
  const name = String(field.accessibleName || "").trim();
  if (String(field.tagName || "").toLowerCase() === "button" && name) {
    return { strategy: "getByRole", value: name, confidence: "MEDIUM" };
  }
  return { strategy: "manual_review", value: null, confidence: "NONE" };
}

export function healthFromStatus(status) {
  if ([SCOUT_STATUSES.CAPTCHA_REQUIRED, SCOUT_STATUSES.OTP_OR_MFA_REQUIRED,
    SCOUT_STATUSES.AUTHENTICATION_REQUIRED, SCOUT_STATUSES.PAYMENT_STEP_DETECTED,
    SCOUT_STATUSES.PORTAL_BLOCKED, SCOUT_STATUSES.RATE_LIMITED].includes(status)) return "BLOCKED";
  if ([SCOUT_STATUSES.PORTAL_UNAVAILABLE, SCOUT_STATUSES.PROBE_FAILED].includes(status)) return "BROKEN";
  if ([SCOUT_STATUSES.MAPPING_DRIFT_REVIEW_REQUIRED, SCOUT_STATUSES.WRITE_STEP_PRESENT].includes(status)) return "DEGRADED";
  if ([SCOUT_STATUSES.HEALTHY_PUBLIC_FORM, SCOUT_STATUSES.HEALTHY_PUBLIC_INFORMATION].includes(status)) return "HEALTHY";
  return "UNKNOWN";
}

export function handoffFromStatus(status) {
  if ([SCOUT_STATUSES.CAPTCHA_REQUIRED, SCOUT_STATUSES.OTP_OR_MFA_REQUIRED,
    SCOUT_STATUSES.AUTHENTICATION_REQUIRED, SCOUT_STATUSES.PAYMENT_STEP_DETECTED].includes(status)) {
    return "CANDIDATE_CONTROLLED_HANDOFF";
  }
  if ([SCOUT_STATUSES.RATE_LIMITED, SCOUT_STATUSES.PORTAL_BLOCKED,
    SCOUT_STATUSES.PORTAL_UNAVAILABLE, SCOUT_STATUSES.MAPPING_DRIFT_REVIEW_REQUIRED].includes(status)) {
    return "MANUAL_APPLICATION_PACKET";
  }
  return "HUMAN_MAPPING_REVIEW";
}
