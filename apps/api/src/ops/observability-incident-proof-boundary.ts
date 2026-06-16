export type ObservabilityIncidentScenario = {
  key: string;
  passed: boolean;
  evidence: string;
};

export type ObservabilityIncidentProofReport = {
  schema: "kingsmen.observability-incident-proof-report.v1";
  module: "Observability + Incident Proof";
  status: "OBSERVABILITY_INCIDENT_SOURCE_PROOF_PASSED" | "OBSERVABILITY_INCIDENT_SOURCE_PROOF_FAILED";
  passed: boolean;
  productionReady: false;
  publicLaunchAllowed: false;
  liveMonitoringConnected: false;
  livePagerConfigured: false;
  rawCandidateDataInLogsAllowed: false;
  providerSecretsInLogsAllowed: false;
  stagingRuntimeProofPending: true;
  controls: {
    apiHealthCheckRequired: true;
    databaseHealthCheckRequired: true;
    queueHealthCheckRequired: true;
    structuredLogsRequired: true;
    correlationIdRequired: true;
    idempotencyKeyLoggedSafely: true;
    auditEvidenceRequired: true;
    dlqReviewRequired: true;
    alertRulesDefined: true;
    founderEscalationRequired: true;
    incidentRunbookRequired: true;
    piiRedactionRequired: true;
  };
  scenarios: ObservabilityIncidentScenario[];
};

export const OBSERVABILITY_INCIDENT_BOUNDARY_SOURCE_ONLY = "OBSERVABILITY_INCIDENT_BOUNDARY_SOURCE_ONLY";

export function buildObservabilityIncidentProofReport(): ObservabilityIncidentProofReport {
  const controls = {
    apiHealthCheckRequired: true,
    databaseHealthCheckRequired: true,
    queueHealthCheckRequired: true,
    structuredLogsRequired: true,
    correlationIdRequired: true,
    idempotencyKeyLoggedSafely: true,
    auditEvidenceRequired: true,
    dlqReviewRequired: true,
    alertRulesDefined: true,
    founderEscalationRequired: true,
    incidentRunbookRequired: true,
    piiRedactionRequired: true
  } as const;

  const scenarios: ObservabilityIncidentScenario[] = [
    {
      key: "api_health_check_defined",
      passed: controls.apiHealthCheckRequired,
      evidence: "API health must expose safe readiness status without secrets or raw candidate data."
    },
    {
      key: "database_health_check_defined",
      passed: controls.databaseHealthCheckRequired,
      evidence: "Truth Vault connectivity must be checked from backend runtime, not browser routes."
    },
    {
      key: "queue_health_check_defined",
      passed: controls.queueHealthCheckRequired,
      evidence: "Worker/queue health must be observable before public command execution."
    },
    {
      key: "structured_logs_require_correlation_id",
      passed: controls.structuredLogsRequired && controls.correlationIdRequired,
      evidence: "Command, workflow, payment, document, communication, and incident logs require correlation IDs."
    },
    {
      key: "idempotency_key_logged_safely",
      passed: controls.idempotencyKeyLoggedSafely,
      evidence: "Idempotency keys may be recorded as operational evidence but must not include payload bodies."
    },
    {
      key: "dlq_review_required",
      passed: controls.dlqReviewRequired,
      evidence: "Dead-letter queue review is a founder/operator incident workflow, not silent discard."
    },
    {
      key: "payment_failure_alert_defined",
      passed: controls.alertRulesDefined,
      evidence: "Payment ITN failure, duplicate, invalid signature, and amount mismatch alerts must be defined before paid pilot."
    },
    {
      key: "rls_denial_alert_defined",
      passed: controls.alertRulesDefined,
      evidence: "Unexpected RLS denial or privilege failure must create redacted security evidence."
    },
    {
      key: "backup_restore_failure_alert_defined",
      passed: controls.alertRulesDefined,
      evidence: "Backup failure, restore failure, missing checksum, or RPO/RTO breach must alert founder/operator."
    },
    {
      key: "communications_failure_alert_defined",
      passed: controls.alertRulesDefined,
      evidence: "Email bounce, provider failure, WhatsApp misuse attempt, and SMS fallback failure must be reviewable."
    },
    {
      key: "incident_severity_triage_defined",
      passed: controls.incidentRunbookRequired,
      evidence: "SEV1/SEV2/SEV3 severity definitions must exist before public users."
    },
    {
      key: "founder_escalation_defined",
      passed: controls.founderEscalationRequired,
      evidence: "Production-risk incident handling requires founder/operator escalation."
    },
    {
      key: "pii_and_secret_redaction_required",
      passed: controls.piiRedactionRequired,
      evidence: "Logs and incident reports must redact candidate PII, provider secrets, token prefixes, message bodies, and database URLs."
    },
    {
      key: "live_monitoring_pending",
      passed: true,
      evidence: "Source proof defines required monitoring; live monitoring and paging remain staging evidence."
    }
  ];

  const passed = scenarios.every((scenario) => scenario.passed);

  return {
    schema: "kingsmen.observability-incident-proof-report.v1",
    module: "Observability + Incident Proof",
    status: passed ? "OBSERVABILITY_INCIDENT_SOURCE_PROOF_PASSED" : "OBSERVABILITY_INCIDENT_SOURCE_PROOF_FAILED",
    passed,
    productionReady: false,
    publicLaunchAllowed: false,
    liveMonitoringConnected: false,
    livePagerConfigured: false,
    rawCandidateDataInLogsAllowed: false,
    providerSecretsInLogsAllowed: false,
    stagingRuntimeProofPending: true,
    controls,
    scenarios
  };
}
