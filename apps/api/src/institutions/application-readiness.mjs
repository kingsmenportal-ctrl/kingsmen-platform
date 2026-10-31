const PROVIDER_STATES = [
  "P0_DISCOVERED",
  "P1_IDENTITY_VERIFIED",
  "P2_ROUTE_VERIFIED",
  "P3_CONNECTOR_CONFIGURED",
  "P4_ROUTE_TESTED",
  "P5_MONITORED"
];

const OPPORTUNITY_STATES = [
  "O0_FOUND",
  "O1_SOURCE_VERIFIED",
  "O2_CURRENT_OPEN",
  "O3_REQUIREMENTS_MAPPED",
  "O4_CANDIDATE_READY",
  "O5_SUBMISSION_EVIDENCED",
  "O6_OUTCOME_VERIFIED"
];

const DAY_MS = 24 * 60 * 60 * 1000;

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function asDate(value) {
  if (!nonEmpty(value)) return null;
  // Evidence timestamps must include Z or an explicit UTC offset.
  if (!/(Z|[+-]\d{2}:?\d{2})$/i.test(value)) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function freshTimestamp(value, windowDays, now) {
  const parsed = asDate(value);
  const cutoff = now instanceof Date ? now : new Date(now);
  if (!parsed || Number.isNaN(cutoff.getTime())) return false;
  if (!Number.isInteger(windowDays) || windowDays < 1) return false;
  const age = cutoff.getTime() - parsed.getTime();
  return age >= 0 && age <= windowDays * DAY_MS;
}

function secureOfficialUrl(value, officialDomain) {
  if (!nonEmpty(value)) return false;
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:" || !parsed.hostname || parsed.username || parsed.password) return false;
  if (!nonEmpty(officialDomain)) return false;
  const domain = String(officialDomain).trim().toLowerCase().replace(/^\./, "");
  const hostname = parsed.hostname.toLowerCase();
  return Boolean(domain) && (hostname === domain || hostname.endsWith(`.${domain}`));
}

function gate(id, passed, reason) {
  return { id, passed: Boolean(passed), reason: passed ? null : reason };
}

function buildResult(states, checks, reportedSubmission = false) {
  let rank = 0;
  for (let i = 1; i < checks.length; i += 1) {
    if (!checks[i].passed) break;
    rank = i;
  }
  // State 0 is the safe fallback when the first evidence gate is missing.
  const failed = checks.find((check) => !check.passed);
  return {
    state: states[rank],
    rank,
    gates: checks,
    blocking_reason: failed?.reason ?? null,
    candidate_reported_submission_needs_confirmation: reportedSubmission,
  };
}

export function evaluateProviderReadiness(provider = {}, options = {}) {
  const now = options.asOf ?? new Date();
  const identity = provider.identity ?? {};
  const source = provider.source_evidence ?? {};
  const route = provider.application_route ?? {};
  const connector = provider.connector ?? {};
  const test = connector.last_test ?? {};
  const monitoring = provider.monitoring ?? {};
  const health = monitoring.last_health ?? {};

  const identityPass =
    nonEmpty(provider.provider_key) &&
    nonEmpty(identity.legal_or_recognised_name) &&
    identity.status === "VERIFIED" &&
    nonEmpty(source.authority) &&
    secureOfficialUrl(source.url, source.official_domain) &&
    source.status === "VERIFIED" &&
    freshTimestamp(source.observed_at, source.freshness_window_days, now) &&
    freshTimestamp(identity.verified_at, identity.freshness_window_days, now);

  const routePass =
    secureOfficialUrl(route.url, route.official_domain) &&
    nonEmpty(route.scope) &&
    route.verification_status === "VERIFIED" &&
    freshTimestamp(route.verified_at, route.freshness_window_days, now);

  const connectorPass =
    ["API", "OFFICIAL_FEED", "AUTHORISED_BROWSER", "VERIFIED_HANDOFF"].includes(connector.method) &&
    connector.state === "CONFIGURED" &&
    connector.access_review_status === "APPROVED" &&
    connector.terms_review_status === "APPROVED" &&
    connector.human_handoff_configured === true;

  const testPass =
    test.status === "PASS" &&
    nonEmpty(test.test_id) &&
    freshTimestamp(test.tested_at, test.freshness_window_days, now);

  const monitorPass =
    monitoring.enabled === true &&
    health.status === "HEALTHY" &&
    freshTimestamp(health.checked_at, health.freshness_window_days, now) &&
    monitoring.failure_handoff_configured === true;

  const checks = [
    gate("DISCOVERED", true, null),
    gate("IDENTITY_VERIFIED", identityPass, "Canonical identity and current authoritative source evidence are required."),
    gate("ROUTE_VERIFIED", routePass, "A current HTTPS application/service route with verified scope is required."),
    gate("CONNECTOR_CONFIGURED", connectorPass, "A configured connector, approved access/terms review and human handoff are required."),
    gate("ROUTE_TESTED", testPass, "A current passing route test with an evidence ID is required."),
    gate("MONITORED", monitorPass, "Fresh healthy monitoring and failure-handoff controls are required."),
  ];
  const result = buildResult(PROVIDER_STATES, checks);
  result.candidate_handoff_available = result.rank >= 2;
  result.automated_submission_capability = result.rank >= 4 &&
    connector.submission_mode === "AUTOMATED_APPROVED" &&
    Array.isArray(connector.approved_scopes) &&
    connector.approved_scopes.includes("SUBMIT");
  result.candidate_authorisation_still_required = result.automated_submission_capability;
  return result;
}

export function evaluateOpportunityReadiness(opportunity = {}, options = {}) {
  const now = options.asOf ?? new Date();
  const source = opportunity.source_evidence ?? {};
  const requirements = opportunity.requirements ?? {};
  const candidate = options.candidate ?? {};
  const providerReadiness = options.providerReadiness ?? { rank: 0 };
  const submission = opportunity.submission_evidence ?? {};
  const outcome = opportunity.outcome_evidence ?? {};

  const sourcePass =
    nonEmpty(opportunity.opportunity_key) &&
    source.status === "VERIFIED" &&
    nonEmpty(source.authority) &&
    nonEmpty(source.source_id) &&
    secureOfficialUrl(source.url, source.official_domain) &&
    freshTimestamp(source.observed_at, source.freshness_window_days, now);

  const deadlineDate = opportunity.deadline == null ? null : asDate(opportunity.deadline);
  const deadlineValid = opportunity.deadline == null || Boolean(deadlineDate);
  const notExpired = opportunity.deadline == null || (deadlineDate && deadlineDate.getTime() > new Date(now).getTime());
  const openPass =
    sourcePass &&
    opportunity.status === "OPEN" &&
    freshTimestamp(opportunity.last_checked_at, opportunity.freshness_window_days, now) &&
    deadlineValid &&
    notExpired;

  const requirementsPass =
    openPass &&
    requirements.review_status === "VERIFIED" &&
    freshTimestamp(requirements.reviewed_at, requirements.freshness_window_days, now) &&
    Array.isArray(requirements.eligibility_criteria) &&
    Array.isArray(requirements.required_documents);

  const candidatePass =
    requirementsPass &&
    providerReadiness.rank >= 2 &&
    candidate.eligibility_status === "REQUIREMENTS_MATCHED" &&
    candidate.eligibility_review_status === "VERIFIED" &&
    candidate.preflight_status === "PASS" &&
    candidate.required_documents_present === true &&
    candidate.consent_status === "CONFIRMED";

  const receiptPass =
    submission.status === "PROVIDER_RECEIPT_VERIFIED" &&
    nonEmpty(submission.receipt_reference) &&
    nonEmpty(submission.evidence_record_id) &&
    freshTimestamp(submission.submitted_at, submission.freshness_window_days, now);

  const outcomePass =
    receiptPass &&
    outcome.status === "PROVIDER_CONFIRMED" &&
    nonEmpty(outcome.outcome_type) &&
    nonEmpty(outcome.evidence_record_id) &&
    freshTimestamp(outcome.confirmed_at, outcome.freshness_window_days, now);

  const reportedSubmission = submission.reported_by_candidate === true && !receiptPass;
  const checks = [
    gate("FOUND", true, null),
    gate("SOURCE_VERIFIED", sourcePass, "A current source observation for this specific opportunity is required."),
    gate("CURRENT_OPEN", openPass, "The opportunity must be explicitly OPEN, checked within its stated freshness window and not past its deadline."),
    gate("REQUIREMENTS_MAPPED", requirementsPass, "Verified eligibility and required-document mappings with fresh review evidence are required."),
    gate("CANDIDATE_READY", candidatePass, "Verified route, candidate eligibility review, passing preflight, required documents and consent are required."),
    gate("SUBMISSION_EVIDENCED", receiptPass, "Candidate-reported submission is insufficient; an authoritative provider receipt record is required."),
    gate("OUTCOME_VERIFIED", outcomePass, "A provider-confirmed outcome with authoritative evidence is required."),
  ];
  const result = buildResult(OPPORTUNITY_STATES, checks, reportedSubmission);
  result.safe_to_display_as_open = result.rank >= 2;
  result.requirements_mapped = result.rank >= 3;
  result.candidate_ready = result.rank >= 4;
  result.provider_submission_evidenced = result.rank >= 5;
  result.provider_outcome_verified = result.rank >= 6;
  return result;
}

export const applicationReadinessStates = {
  provider: [...PROVIDER_STATES],
  opportunity: [...OPPORTUNITY_STATES],
};
