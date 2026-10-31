export const N15_ALLOWED_SECTORS = Object.freeze([
  "UNIVERSITY", "TVET", "SETA", "QCTO", "LEARNERSHIP", "BURSARY",
  "ACCOMMODATION", "EMPLOYER", "INTERNSHIP", "NSFAS", "CAO", "PRIVATE_COLLEGE"
]);

export function canonicalHttpsUrl(value) {
  try {
    const url = new URL(String(value ?? ""));
    if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) return null;
    url.hash = "";
    return url;
  } catch {
    return null;
  }
}

function isLiteralOrLocalHost(hostname) {
  const host = String(hostname || "").toLowerCase().replace(/^\\[|\\]$/g, "");
  return host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") ||
    host.endsWith(".internal") || host.endsWith(".test") || host.endsWith(".invalid") ||
    host.includes(":") || /^(?:\\d{1,3}\\.){3}\\d{1,3}$/.test(host);
}

export function isWithinAuthority(candidate, authority) {
  const candidateUrl = candidate instanceof URL ? candidate : canonicalHttpsUrl(candidate);
  const authorityUrl = authority instanceof URL ? authority : canonicalHttpsUrl(authority);
  if (!candidateUrl || !authorityUrl ||
      isLiteralOrLocalHost(candidateUrl.hostname) || isLiteralOrLocalHost(authorityUrl.hostname)) return false;
  const host = candidateUrl.hostname.toLowerCase();
  const allowed = authorityUrl.hostname.toLowerCase();
  return candidateUrl.protocol === "https:" && (host === allowed || host.endsWith("." + allowed));
}

function validReference(value) {
  return /^[a-z0-9][a-z0-9._:-]{2,119}$/i.test(String(value || ""));
}

function validTimestamp(value) {
  return typeof value === "string" && value.trim().length > 0 && Number.isFinite(Date.parse(value));
}

export function validateN15PromotionPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return "REVIEW_PAYLOAD_INVALID";
  if (!validReference(payload.observation_ref)) return "OBSERVATION_REFERENCE_INVALID";
  if (typeof payload.review_reason !== "string" || payload.review_reason.trim().length < 10 ||
      typeof payload.decision_notes !== "string" || payload.decision_notes.trim().length < 10) {
    return "REVIEW_REASON_AND_DECISION_NOTES_REQUIRED";
  }
  if (!payload.provider || typeof payload.provider !== "object" || Array.isArray(payload.provider) ||
      !payload.programme || typeof payload.programme !== "object" || Array.isArray(payload.programme)) {
    return "PROVIDER_AND_PROGRAMME_REQUIRED";
  }
  if (!validReference(payload.provider.provider_ref) || !validReference(payload.programme.programme_ref)) {
    return "PROVIDER_OR_PROGRAMME_REFERENCE_INVALID";
  }
  const providerSector = String(payload.provider.sector || "").toUpperCase();
  const programmeSector = String(payload.programme.sector || "").toUpperCase();
  if (!N15_ALLOWED_SECTORS.includes(providerSector) || providerSector !== programmeSector) {
    return "SECTOR_MISMATCH_OR_UNSUPPORTED";
  }
  if (!String(payload.provider.provider_name || "").trim() ||
      !String(payload.provider.provider_type || "").trim() ||
      !String(payload.programme.programme_name || "").trim()) return "PROVIDER_OR_PROGRAMME_NAME_REQUIRED";
  const accreditation = String(payload.provider.accreditation_status || "").toUpperCase();
  if (!["UNKNOWN", "OFFICIAL_VERIFIED", "NEEDS_REVIEW", "REJECTED", "NOT_APPLICABLE"].includes(accreditation)) {
    return "PROVIDER_ACCREDITATION_STATUS_INVALID";
  }
  if ((String(payload.provider.provider_type).toUpperCase() === "PRIVATE_COLLEGE" || providerSector === "PRIVATE_COLLEGE") &&
      accreditation !== "OFFICIAL_VERIFIED") return "PRIVATE_PROVIDER_ACCREDITATION_NOT_VERIFIED";
  const opening = String(payload.programme.opening_status || "").toUpperCase();
  if (!["OPEN", "CLOSED", "UPCOMING", "UNKNOWN", "MANUAL_CHECK_REQUIRED"].includes(opening)) {
    return "PROGRAMME_OPENING_STATUS_INVALID";
  }
  const rules = payload.eligibility_rules ?? [];
  if (!Array.isArray(rules) || rules.length > 20) return "ELIGIBILITY_RULES_INVALID";
  for (const rule of rules) {
    if (!validReference(rule?.rule_ref) || !String(rule?.rule_type || "").trim() ||
        !String(rule?.rule_text || "").trim()) return "ELIGIBILITY_RULE_FIELDS_REQUIRED";
  }
  const deadline = payload.deadline ?? null;
  if (deadline !== null) {
    if (typeof deadline !== "object" || Array.isArray(deadline) ||
        !validReference(deadline.deadline_ref) || !validTimestamp(deadline.closes_at)) {
      return "DEADLINE_PAYLOAD_INVALID";
    }
    if (deadline.opens_at && !validTimestamp(deadline.opens_at)) return "DEADLINE_OPEN_TIMESTAMP_INVALID";
    if (deadline.opens_at && Date.parse(deadline.opens_at) > Date.parse(deadline.closes_at)) {
      return "DEADLINE_WINDOW_INVALID";
    }
  }
  return null;
}

export function validateN15EvidenceReferences(values, authorityUrl) {
  if (!Array.isArray(values) || values.length > 20) return { valid: false, refs: [], reason: "EVIDENCE_REFERENCE_LIST_INVALID" };
  const refs = [];
  for (const value of values) {
    if (typeof value !== "string" || value.trim().length === 0 || value.trim().length > 500) {
      return { valid: false, refs: [], reason: "EVIDENCE_REFERENCE_INVALID" };
    }
    const ref = value.trim();
    if (/^sha256:[0-9a-f]{64}$/i.test(ref)) {
      refs.push(ref.toLowerCase());
      continue;
    }
    const url = canonicalHttpsUrl(ref);
    if (!url || !isWithinAuthority(url, authorityUrl)) {
      return { valid: false, refs: [], reason: "EVIDENCE_URL_OUTSIDE_REGISTERED_AUTHORITY" };
    }
    refs.push(url.toString());
  }
  return { valid: true, refs: [...new Set(refs)], reason: "EVIDENCE_REFERENCES_VALID" };
}

export function canPublishVerifiedOpportunity({
  openingStatus,
  accreditationStatus,
  sourceConfidence,
  sourceFresh,
  hasEvidence
} = {}) {
  return String(openingStatus || "").toUpperCase() === "OPEN" &&
    ["OFFICIAL_VERIFIED", "NOT_APPLICABLE"].includes(String(accreditationStatus || "").toUpperCase()) &&
    String(sourceConfidence || "").toUpperCase() === "OFFICIAL_VERIFIED" &&
    sourceFresh === true && hasEvidence === true;
}
