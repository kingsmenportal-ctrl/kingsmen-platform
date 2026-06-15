export type SecurityScanToolId = 'gitleaks' | 'trivy' | 'semgrep';
export type SecurityScanScope = 'repo_text' | 'dependency_manifest' | 'container_manifest' | 'code_pattern_summary';
export type SecurityScanDecision = 'clear' | 'review_required' | 'blocked_until_review';

export interface SecurityScanGateRequest {
  source: string;
  actor: string;
  scope: SecurityScanScope;
  tools?: SecurityScanToolId[];
  scanText?: string;
  changedFiles?: string[];
  commandId?: string;
  approvalToken?: string;
}

export interface SecurityScanFinding {
  tool: SecurityScanToolId;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  category: string;
  file?: string;
  line?: number;
  redactedSummary: string;
  rawValueStored: false;
}

export interface SecurityScanGateResult {
  ok: boolean;
  decision: SecurityScanDecision;
  findings: SecurityScanFinding[];
  blockedReasons: string[];
  warnings: string[];
  evidence: {
    adapterId: 'SecurityScanGate';
    repositories: ['gitleaks/gitleaks', 'aquasecurity/trivy', 'semgrep/semgrep'];
    source: string;
    actor: string;
    checkedAt: string;
    detectionOnly: true;
    destructiveFixesAllowed: false;
    rawSensitiveValuesStored: false;
    deploymentBlockRequiresPolicy: true;
  };
}

export const SecurityScanGateContract = {
  adapterId: 'SecurityScanGate',
  repositories: ['gitleaks/gitleaks', 'aquasecurity/trivy', 'semgrep/semgrep'],
  mode: 'detection_report_only',
  destructiveFixesAllowed: false,
  autoCommitAllowed: false,
  autoDeployBlockAllowed: false,
  deploymentBlockRequiresPolicy: true,
  rawSensitiveValuesStored: false,
  kingsmenAuthority: 'PostgreSQL evidence ledger remains authority; tool output is supporting evidence only.',
  allowedActions: [
    'scan provided summaries',
    'classify risk signals',
    'redact sensitive-looking values',
    'return evidence summary',
    'request human review when required'
  ],
  blockedActions: [
    'store raw sensitive values',
    'print detected private values',
    'rewrite source automatically',
    'push commits automatically',
    'block deployment without policy decision'
  ]
} as const;

export function assertSecurityScanGateRequestSafe(request: SecurityScanGateRequest): string[] {
  const warnings: string[] = [];
  if (!request.source?.trim()) warnings.push('source is required.');
  if (!request.actor?.trim()) warnings.push('actor is required.');
  if (!request.scope?.trim()) warnings.push('scope is required.');
  if (request.approvalToken) warnings.push('approvalToken was supplied but this gate remains detection-only.');
  return warnings;
}
