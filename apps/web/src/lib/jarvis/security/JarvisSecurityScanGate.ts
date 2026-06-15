import type {
  SecurityScanFinding,
  SecurityScanGateRequest,
  SecurityScanGateResult,
  SecurityScanToolId,
} from '@/lib/public-repos/live/adapters/SecurityScanGate.contract';
import { assertSecurityScanGateRequestSafe } from '@/lib/public-repos/live/adapters/SecurityScanGate.contract';

const DEFAULT_TOOLS: SecurityScanToolId[] = ['gitleaks', 'trivy', 'semgrep'];

const RISK_RULES: Array<{
  tool: SecurityScanToolId;
  severity: SecurityScanFinding['severity'];
  category: string;
  terms: string[];
  summary: string;
}> = [
  {
    tool: 'gitleaks',
    severity: 'critical',
    category: 'credential_exposure_signal',
    terms: ['private_key', 'secret=', 'token=', 'password=', 'service_role', 'bearer '],
    summary: 'Credential-like text signal detected. Raw value withheld.',
  },
  {
    tool: 'trivy',
    severity: 'medium',
    category: 'dependency_or_container_risk_signal',
    terms: ['critical vulnerability', 'high vulnerability', 'cve-', 'outdated base image', 'privileged container'],
    summary: 'Dependency/container risk language detected. Review required.',
  },
  {
    tool: 'semgrep',
    severity: 'high',
    category: 'unsafe_code_pattern_signal',
    terms: ['eval(', 'exec(', 'shell=true', 'dangerouslysetinnerhtml', 'disable csrf', 'bypass approval'],
    summary: 'Unsafe code pattern language detected. Review required.',
  },
];

function normalize(value: string) {
  return value.toLowerCase();
}

function redactScanText(value: string) {
  return value
    .replace(/[A-Za-z0-9_\-.]{20,}/g, '[REDACTED_LONG_VALUE]')
    .replace(/([=:]\s*)[^\s,;]{8,}/g, '$1[REDACTED_VALUE]')
    .slice(0, 1200);
}

function requestedTools(request: SecurityScanGateRequest) {
  return request.tools?.length ? request.tools : DEFAULT_TOOLS;
}

function buildFindings(request: SecurityScanGateRequest): SecurityScanFinding[] {
  const tools = new Set(requestedTools(request));
  const text = normalize(`${request.scanText ?? ''} ${(request.changedFiles ?? []).join(' ')}`);

  return RISK_RULES.filter((rule) => tools.has(rule.tool) && rule.terms.some((term) => text.includes(term))).map((rule) => ({
    tool: rule.tool,
    severity: rule.severity,
    category: rule.category,
    file: request.changedFiles?.[0],
    redactedSummary: rule.summary,
    rawValueStored: false,
  }));
}

function decisionFor(findings: SecurityScanFinding[]): SecurityScanGateResult['decision'] {
  if (findings.some((finding) => finding.severity === 'critical')) return 'blocked_until_review';
  if (findings.length > 0) return 'review_required';
  return 'clear';
}

export function runJarvisSecurityScanGate(request: SecurityScanGateRequest): SecurityScanGateResult {
  const warnings = assertSecurityScanGateRequestSafe(request);
  const findings = buildFindings(request);
  const decision = decisionFor(findings);
  const redactedPreview = request.scanText ? redactScanText(request.scanText) : undefined;

  return {
    ok: decision === 'clear' && warnings.length === 0,
    decision,
    findings,
    blockedReasons: decision === 'blocked_until_review' ? ['Critical security signal requires human review before release.'] : [],
    warnings: [
      ...warnings,
      'Detection/report only. No automatic fix, commit, push, or deployment block is performed.',
      ...(redactedPreview ? [`redactedPreview=${redactedPreview}`] : []),
    ],
    evidence: {
      adapterId: 'SecurityScanGate',
      repositories: ['gitleaks/gitleaks', 'aquasecurity/trivy', 'semgrep/semgrep'],
      source: request.source,
      actor: request.actor,
      checkedAt: new Date().toISOString(),
      detectionOnly: true,
      destructiveFixesAllowed: false,
      rawSensitiveValuesStored: false,
      deploymentBlockRequiresPolicy: true,
    },
  };
}
