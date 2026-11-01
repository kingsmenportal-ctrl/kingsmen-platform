const CONNECTION_STATES = [
  "C0_NOT_CONNECTED",
  "C1_AUTHORIZATION_VERIFIED",
  "C2_TERMS_APPROVED",
  "C3_CONNECTOR_CONFIGURED",
  "C4_ROUTE_TESTED",
  "C5_MONITORED"
];

const METHODS = ["API", "OFFICIAL_FEED", "AUTHORISED_BROWSER", "VERIFIED_HANDOFF"];
const SCOPES = [
  "READ_PUBLIC_DATA",
  "READ_PROVIDER_STATUS",
  "PREPARE_APPLICATION",
  "SUBMIT",
  "READ_RECEIPT",
  "READ_OUTCOME"
];
const DAY_MS = 24 * 60 * 60 * 1000;

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function timestamp(value) {
  if (!nonEmpty(value) || !/(Z|[+-]\d{2}:?\d{2})$/i.test(value)) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function historical(value, now) {
  const parsed = timestamp(value);
  return Boolean(parsed) && parsed.getTime() <= now.getTime();
}

function fresh(value, days, now) {
  const parsed = timestamp(value);
  if (!parsed || !Number.isInteger(days) || days < 1) return false;
  const age = now.getTime() - parsed.getTime();
  return age >= 0 && age <= days * DAY_MS;
}

function future(value, now) {
  const parsed = timestamp(value);
  return Boolean(parsed) && parsed.getTime() > now.getTime();
}

function secureOfficialUrl(value, domain) {
  if (!nonEmpty(value) || !nonEmpty(domain)) return false;
  try {
    const url = new URL(value);
    const expected = domain.trim().toLowerCase().replace(/^\./, "");
    const host = url.hostname.toLowerCase();
    return url.protocol === "https:"
      && !url.username
      && !url.password
      && (host === expected || host.endsWith("." + expected));
  } catch {
    return false;
  }
}

function validScopeList(value) {
  return Array.isArray(value)
    && value.length > 0
    && value.every((scope) => SCOPES.includes(scope))
    && new Set(value).size === value.length;
}

function includesAll(container, requested) {
  return Array.isArray(container) && requested.every((scope) => container.includes(scope));
}

function gate(id, passed, reason) {
  return { id, passed: Boolean(passed), reason: passed ? null : reason };
}

const SENSITIVE_CREDENTIAL_KEY = /(?:^|_)(?:api_?(?:key|secret|token)|access_?token|refresh_?token|id_?token|bearer_?token|auth(?:entication)?_?(?:token|key|secret|header)|client_?(?:secret|token)|private_?key|signing_?(?:key|secret)|shared_?secret|service_?account_?key|password|passwd|secret|credential_?value|jwt|token)(?:_|$)/i;

function canonicalCredentialKey(key) {
  return String(key)
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function hasRawCredentialMaterial(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object" || seen.has(value)) return false;
  seen.add(value);
  return Object.entries(value).some(([key, entry]) => {
    const canonicalKey = canonicalCredentialKey(key);
    if (SENSITIVE_CREDENTIAL_KEY.test(canonicalKey) && entry != null && entry !== "") return true;
    return hasRawCredentialMaterial(entry, seen);
  });
}

function buildResult(checks, now, provider, connector) {
  let rank = 0;
  for (let index = 0; index < checks.length; index += 1) {
    if (!checks[index].passed) break;
    rank = index + 1;
  }
  const approvedScopes = provider.authorization?.approved_scopes ?? [];
  const configuredScopes = connector.configured_scopes ?? [];
  const testedScopes = connector.last_test?.tested_scopes ?? [];
  const method = connector.method;
  const automatedSubmission = rank >= 5
    && ["API", "AUTHORISED_BROWSER"].includes(method)
    && connector.submission_mode === "AUTOMATED_APPROVED"
    && approvedScopes.includes("SUBMIT")
    && configuredScopes.includes("SUBMIT")
    && testedScopes.includes("SUBMIT")
    && connector.candidate_authorization_required === true
    && nonEmpty(connector.candidate_authorization_policy_ref)
    && connector.candidate_consent_enforced === true;

  return {
    state: CONNECTION_STATES[rank],
    rank,
    gates: checks,
    blocking_reason: checks.find((item) => !item.passed)?.reason ?? null,
    connection_enabled: rank >= 3,
    tested_connection: rank >= 4,
    monitored_connection: rank >= 5,
    read_only_sync_capability: rank >= 4
      && configuredScopes.some((scope) => ["READ_PUBLIC_DATA", "READ_PROVIDER_STATUS", "READ_RECEIPT", "READ_OUTCOME"].includes(scope)),
    automated_submission_capability: automatedSubmission,
    candidate_authorisation_still_required: automatedSubmission,
    raw_credentials_must_remain_outside_application_data: true,
    evaluated_at: now.toISOString()
  };
}

/**
 * Policy/readiness evaluator only. It does not create credentials, contact provider
 * systems, submit candidate data, or change provider state.
 */
export function evaluateProviderConnectionLifecycle(provider = {}, options = {}) {
  const nowValue = options.asOf ?? new Date();
  const now = nowValue instanceof Date ? nowValue : new Date(nowValue);
  if (Number.isNaN(now.getTime())) {
    throw new TypeError("asOf must be a valid Date or ISO-8601 timestamp");
  }

  const domain = provider.official_domain ?? provider.source_evidence?.official_domain;
  const authorization = provider.authorization ?? {};
  const terms = provider.terms ?? {};
  const connector = provider.connector ?? {};
  const test = connector.last_test ?? {};
  const monitoring = provider.monitoring ?? {};
  const health = monitoring.last_health ?? {};

  const approvedScopesValid = validScopeList(authorization.approved_scopes);
  const authorisationPass =
    nonEmpty(provider.provider_key)
    && authorization.status === "APPROVED"
    && nonEmpty(authorization.authority_name)
    && nonEmpty(authorization.authority_role)
    && nonEmpty(authorization.approved_by)
    && nonEmpty(authorization.evidence_ref)
    && secureOfficialUrl(authorization.evidence_url, domain)
    && historical(authorization.approved_at, now)
    && future(authorization.expires_at, now)
    && (authorization.revoked_at == null)
    && approvedScopesValid
    && nonEmpty(authorization.reviewed_by)
    && fresh(authorization.reviewed_at, authorization.freshness_window_days, now);

  const termsScopesValid = validScopeList(terms.approved_scopes);
  const termsPass =
    terms.status === "APPROVED"
    && nonEmpty(terms.evidence_ref)
    && secureOfficialUrl(terms.terms_url, domain)
    && nonEmpty(terms.reviewed_by)
    && fresh(terms.reviewed_at, terms.freshness_window_days, now)
    && approvedScopesValid
    && termsScopesValid
    && includesAll(terms.approved_scopes, authorization.approved_scopes);

  const configuredScopesValid = validScopeList(connector.configured_scopes);
  const scopesStayWithinGrant =
    configuredScopesValid
    && approvedScopesValid
    && termsScopesValid
    && includesAll(authorization.approved_scopes, connector.configured_scopes)
    && includesAll(terms.approved_scopes, connector.configured_scopes);

  let methodTargetPass = false;
  if (connector.method === "API") {
    methodTargetPass = secureOfficialUrl(connector.endpoint_url, domain);
  } else if (connector.method === "OFFICIAL_FEED") {
    methodTargetPass = secureOfficialUrl(connector.feed_url, domain);
  } else if (connector.method === "AUTHORISED_BROWSER") {
    methodTargetPass = secureOfficialUrl(connector.portal_url, domain)
      && connector.automation_safety_review_status === "APPROVED";
  } else if (connector.method === "VERIFIED_HANDOFF") {
    methodTargetPass = secureOfficialUrl(connector.handoff_url, domain);
  }

  const credentialReferencePass = ["API", "AUTHORISED_BROWSER"].includes(connector.method)
    ? /^vault:\/\/[a-zA-Z0-9/_-]+$/.test(connector.credential_ref ?? "")
    : connector.credential_ref == null;

  const connectorPass =
    METHODS.includes(connector.method)
    && connector.state === "CONFIGURED"
    && nonEmpty(connector.config_evidence_ref)
    && historical(connector.configured_at, now)
    && scopesStayWithinGrant
    && methodTargetPass
    && credentialReferencePass
    && !hasRawCredentialMaterial(provider)
    && connector.privacy_review_status === "APPROVED"
    && nonEmpty(connector.privacy_review_evidence_ref)
    && connector.candidate_consent_enforced === true
    && connector.data_minimization_enforced === true
    && connector.human_handoff_configured === true
    && ["NONE", "HUMAN_HANDOFF", "AUTOMATED_APPROVED"].includes(connector.submission_mode);

  const testedScopes = test.tested_scopes;
  const testPass =
    test.status === "PASS"
    && nonEmpty(test.test_id)
    && nonEmpty(test.evidence_ref)
    && fresh(test.tested_at, test.freshness_window_days, now)
    && ["SANDBOX", "STAGING"].includes(test.environment)
    && test.synthetic_data_only === true
    && test.side_effects === false
    && validScopeList(testedScopes)
    && configuredScopesValid
    && includesAll(testedScopes, connector.configured_scopes);

  const monitoringPass =
    monitoring.enabled === true
    && monitoring.failure_handoff_configured === true
    && nonEmpty(monitoring.failure_handoff_owner)
    && nonEmpty(monitoring.failure_handoff_ref)
    && health.status === "HEALTHY"
    && nonEmpty(health.evidence_ref)
    && fresh(health.checked_at, health.freshness_window_days, now);

  const checks = [
    gate("AUTHORIZATION_VERIFIED", authorisationPass,
      "Current provider-issued authority, unexpired scope grant and non-revoked evidence are required."),
    gate("TERMS_APPROVED", termsPass,
      "Current provider terms must be reviewed and cover every authorised scope."),
    gate("CONNECTOR_CONFIGURED", connectorPass,
      "A least-privilege connector, privacy review, secure target, opaque secret reference and human fallback are required."),
    gate("ROUTE_TESTED", testPass,
      "A fresh passing SANDBOX/STAGING test using synthetic data, no side effects and all configured scopes is required."),
    gate("MONITORED", monitoringPass,
      "Fresh healthy monitoring and a named, evidenced failure handoff are required.")
  ];

  return buildResult(checks, now, provider, connector);
}

export const providerConnectionLifecycleStates = [...CONNECTION_STATES];
export const providerConnectionMethods = [...METHODS];
export const providerConnectionScopes = [...SCOPES];
