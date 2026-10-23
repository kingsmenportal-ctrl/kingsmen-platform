/**
 * N15 source intelligence policy: deterministic, fail-closed helpers.
 * No network crawling, eligibility decision, or official outcome is implied by these helpers.
 */
export const CORE_PATHWAYS = Object.freeze([
  "HIGHER_EDUCATION", "TVET", "SETA_LEARNERSHIPS",
  "INTERNSHIPS", "APPRENTICESHIPS", "EMPLOYMENT"
]);

export const SECTOR_TO_PATHWAYS = Object.freeze({
  UNIVERSITY: ["HIGHER_EDUCATION"],
  CAO: ["HIGHER_EDUCATION", "TVET"],
  TVET: ["TVET"],
  SETA: ["SETA_LEARNERSHIPS", "APPRENTICESHIPS"],
  QCTO: ["SETA_LEARNERSHIPS", "APPRENTICESHIPS"],
  LEARNERSHIP: ["SETA_LEARNERSHIPS", "APPRENTICESHIPS"],
  BURSARY: ["HIGHER_EDUCATION", "TVET", "SETA_LEARNERSHIPS", "INTERNSHIPS", "APPRENTICESHIPS"],
  NSFAS: ["HIGHER_EDUCATION", "TVET"],
  ACCOMMODATION: ["HIGHER_EDUCATION", "TVET", "SETA_LEARNERSHIPS", "INTERNSHIPS", "APPRENTICESHIPS", "EMPLOYMENT"],
  EMPLOYER: ["EMPLOYMENT", "INTERNSHIPS", "APPRENTICESHIPS"],
  INTERNSHIP: ["INTERNSHIPS"],
  PRIVATE_COLLEGE: ["HIGHER_EDUCATION", "TVET", "SETA_LEARNERSHIPS"]
});

const TRACKING_KEYS = /^(utm_.+|fbclid|gclid|mc_cid|mc_eid|ref|source)$/i;
const CONFIDENCE_RANK = Object.freeze({ LOW: 1, MEDIUM: 2, HIGH: 3, OFFICIAL_VERIFIED: 4 });

export function canonicalizeSourceUrl(input) {
  let url;
  try { url = new URL(input); } catch { return { ok: false, reason: "INVALID_URL" }; }
  if (url.protocol !== "https:") return { ok: false, reason: "HTTPS_REQUIRED" };
  if (url.username || url.password) return { ok: false, reason: "URL_CREDENTIALS_FORBIDDEN" };
  url.hash = "";
  url.hostname = url.hostname.toLowerCase();
  for (const key of [...url.searchParams.keys()]) if (TRACKING_KEYS.test(key)) url.searchParams.delete(key);
  url.searchParams.sort();
  if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, "");
  return { ok: true, canonicalUrl: url.toString() };
}

export function isHostWithinAuthority(hostname, authorityUrl) {
  try {
    const allowed = new URL(authorityUrl).hostname.toLowerCase();
    const host = hostname.toLowerCase();
    return host === allowed || host.endsWith("." + allowed);
  } catch { return false; }
}

export function assessSourceAuthority({ sourceUrl, registeredAuthorityUrls = [], claimedOfficial = false } = {}) {
  const canonical = canonicalizeSourceUrl(sourceUrl ?? "");
  if (!canonical.ok) return { allowed: false, confidenceCeiling: "LOW", reasons: [canonical.reason] };
  const matches = registeredAuthorityUrls.filter(url => isHostWithinAuthority(new URL(canonical.canonicalUrl).hostname, url));
  if (matches.length === 0) {
    return {
      allowed: true, canonicalUrl: canonical.canonicalUrl, authorityMatched: false,
      confidenceCeiling: "MEDIUM",
      reasons: [claimedOfficial ? "OFFICIAL_CLAIM_UNSUPPORTED_BY_REGISTERED_AUTHORITY" : "NON_REGISTERED_SOURCE_REQUIRES_REVIEW"]
    };
  }
  return {
    allowed: true, canonicalUrl: canonical.canonicalUrl, authorityMatched: true,
    matchedAuthorities: matches, confidenceCeiling: "OFFICIAL_VERIFIED", reasons: []
  };
}

export function assessFreshness({ observedAt, lastCheckedAt, staleAfter, validUntil, now = new Date().toISOString() } = {}) {
  const nowMs = Date.parse(now);
  const observedMs = Date.parse(observedAt ?? "");
  const checkedMs = Date.parse(lastCheckedAt ?? "");
  const staleMs = Date.parse(staleAfter ?? "");
  const validMs = Date.parse(validUntil ?? "");
  if (!Number.isFinite(nowMs)) return { status: "NEEDS_REVIEW", candidateFacingSafe: false, reason: "INVALID_CLOCK" };
  if (!Number.isFinite(observedMs)) return { status: "NEEDS_REVIEW", candidateFacingSafe: false, reason: "OBSERVATION_TIMESTAMP_MISSING_OR_INVALID" };
  if (!Number.isFinite(checkedMs)) return { status: "NEEDS_REVIEW", candidateFacingSafe: false, reason: "SOURCE_CHECK_TIMESTAMP_MISSING_OR_INVALID" };
  if (checkedMs > nowMs || observedMs > nowMs) return { status: "NEEDS_REVIEW", candidateFacingSafe: false, reason: "FUTURE_TIMESTAMP" };
  if (Number.isFinite(validMs) && validMs < nowMs) return { status: "STALE", candidateFacingSafe: false, reason: "VALIDITY_WINDOW_EXPIRED" };
  if (!Number.isFinite(staleMs)) return { status: "NEEDS_REVIEW", candidateFacingSafe: false, reason: "STALE_AFTER_POLICY_MISSING" };
  if (staleMs < nowMs) return { status: "STALE", candidateFacingSafe: false, reason: "STALE_AFTER_EXCEEDED" };
  if (checkedMs < observedMs) return { status: "NEEDS_REVIEW", candidateFacingSafe: false, reason: "CHECK_PRECEDES_OBSERVATION" };
  return { status: "FRESH", candidateFacingSafe: true, reason: "WITHIN_EXPLICIT_FRESHNESS_WINDOW" };
}

export function normalizeDuplicateKey({ providerName, title, sector, location = "", qualification = "" } = {}) {
  const norm = value => String(value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
  const fields = [norm(providerName), norm(title), norm(sector), norm(location), norm(qualification)];
  if (!fields[0] || !fields[1] || !fields[2]) return { ok: false, reason: "PROVIDER_TITLE_SECTOR_REQUIRED" };
  return { ok: true, key: fields.join("|") };
}

export function reconcileDuplicateObservations(observations = []) {
  const groups = new Map();
  const rejected = [];
  for (const item of observations) {
    const key = normalizeDuplicateKey(item);
    if (!key.ok) { rejected.push({ item, reason: key.reason }); continue; }
    const group = groups.get(key.key) ?? [];
    group.push(item);
    groups.set(key.key, group);
  }
  return {
    groups: [...groups.entries()].filter(([, items]) => items.length > 1)
      .map(([key, items]) => ({ key, count: items.length, refs: items.map(x => x.observationRef ?? null) })),
    uniqueCount: [...groups.values()].filter(items => items.length === 1).length,
    duplicateObservationCount: [...groups.values()].reduce((sum, items) => sum + Math.max(0, items.length - 1), 0),
    rejected
  };
}

export function assessDeadline({ closesAt, deadlineStatus = "UNKNOWN", evidenceRefs = [], now = new Date().toISOString() } = {}) {
  if (!Array.isArray(evidenceRefs) || evidenceRefs.length === 0) {
    return { status: "MANUAL_CHECK_REQUIRED", candidateFacingSafe: false, reason: "DEADLINE_EVIDENCE_REQUIRED" };
  }
  if (!closesAt || !Number.isFinite(Date.parse(closesAt))) {
    return { status: "UNKNOWN", candidateFacingSafe: false, reason: "NO_CONFIRMED_DEADLINE" };
  }
  if (Date.parse(closesAt) <= Date.parse(now)) {
    return { status: "STALE", candidateFacingSafe: false, reason: "DEADLINE_HAS_PASSED" };
  }
  if (deadlineStatus !== "CONFIRMED") {
    return { status: "MANUAL_CHECK_REQUIRED", candidateFacingSafe: false, reason: "DEADLINE_NOT_CONFIRMED" };
  }
  return { status: "CONFIRMED", candidateFacingSafe: true, reason: "FUTURE_CONFIRMED_DEADLINE_WITH_EVIDENCE" };
}

export function assessEligibility({ rules = [], evidenceRefs = [] } = {}) {
  if (!rules.length) return { status: "UNKNOWN", candidateFacingSafe: false, humanReviewRequired: true, reason: "ELIGIBILITY_RULES_MISSING" };
  const unverified = rules.some(rule => rule.reviewRequired !== false ||
    !["HIGH", "OFFICIAL_VERIFIED"].includes(rule.sourceConfidence) ||
    !Array.isArray(rule.evidenceRefs) || rule.evidenceRefs.length === 0);
  if (unverified || !Array.isArray(evidenceRefs) || evidenceRefs.length === 0) {
    return { status: "NEEDS_REVIEW", candidateFacingSafe: false, humanReviewRequired: true, reason: "ELIGIBILITY_EVIDENCE_OR_REVIEW_INCOMPLETE" };
  }
  return { status: "EVIDENCE_BACKED_RULES", candidateFacingSafe: true, humanReviewRequired: true, reason: "RULES_EVIDENCED_BUT_CANDIDATE_FIT_REQUIRES_REVIEW" };
}

export function assessCandidateMatch({ sector, sourceConfidence, openingStatus, freshness, eligibility, providerSafe = false, programmeEvidenceRefs = [], candidateEvidenceRefs = [] } = {}) {
  const reasons = [];
  if (!CORE_PATHWAYS.some(pathway => (SECTOR_TO_PATHWAYS[sector] ?? []).includes(pathway))) reasons.push("SECTOR_HAS_NO_SUPPORTED_PATHWAY");
  if ((CONFIDENCE_RANK[sourceConfidence] ?? 0) < CONFIDENCE_RANK.HIGH) reasons.push("SOURCE_CONFIDENCE_BELOW_HIGH");
  if (openingStatus !== "OPEN") reasons.push("OPENING_NOT_VERIFIED_OPEN");
  if (freshness?.status !== "FRESH" || freshness?.candidateFacingSafe !== true) reasons.push("SOURCE_NOT_FRESH");
  if (eligibility?.candidateFacingSafe !== true) reasons.push("ELIGIBILITY_NOT_EVIDENCED");
  if (providerSafe !== true) reasons.push("PROVIDER_NOT_APPROVED_FOR_RECOMMENDATION");
  if (!programmeEvidenceRefs.length || !candidateEvidenceRefs.length) reasons.push("MATCH_EVIDENCE_INCOMPLETE");
  return {
    status: reasons.length ? "READY_FOR_REVIEW" : "ELIGIBLE_FOR_HUMAN_REVIEW",
    candidateFacingSafe: false,
    humanReviewRequired: true,
    pathwayCoverage: SECTOR_TO_PATHWAYS[sector] ?? [],
    reasons
  };
}
