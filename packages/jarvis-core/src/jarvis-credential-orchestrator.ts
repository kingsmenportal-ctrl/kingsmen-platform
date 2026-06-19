import type { JarvisAuthorityLevel, JarvisToolCapabilityCard } from '../../contracts/src/jarvis';

export type JarvisCredentialRisk = 'low' | 'medium' | 'high' | 'critical';

export type JarvisCredentialLiveStatus =
  | 'NOT_REQUIRED'
  | 'MISSING'
  | 'PLACEHOLDER_REJECTED'
  | 'PRESENT_REDACTED'
  | 'READY_FOR_STAGING_PROOF'
  | 'READY_FOR_LIVE_AFTER_APPROVAL';

export interface JarvisCredentialRequirement {
  readonly envName: string;
  readonly provider: string;
  readonly moduleRef: string;
  readonly purpose: string;
  readonly requiredForBeta: boolean;
  readonly requiredForProduction: boolean;
  readonly risk: JarvisCredentialRisk;
  readonly secret: boolean;
  readonly allowedLocations: readonly string[];
}

export interface JarvisCredentialRuntimeCheck {
  readonly envName: string;
  readonly provider: string;
  readonly moduleRef: string;
  readonly status: JarvisCredentialLiveStatus;
  readonly secret: boolean;
  readonly valuePrinted: false;
  readonly redactedPreview: string;
  readonly risk: JarvisCredentialRisk;
}

export interface JarvisModuleCredentialReadiness {
  readonly moduleRef: string;
  readonly requiredCount: number;
  readonly presentCount: number;
  readonly missingCount: number;
  readonly placeholderCount: number;
  readonly readyForStagingProof: boolean;
  readonly readyForLiveAfterApproval: boolean;
}

export interface JarvisCredentialActivationReport {
  readonly schema: 'kingsmen.jarvis-credential-activation-report.v1';
  readonly status:
    | 'JARVIS_CREDENTIAL_ACTIVATION_READY_FOR_STAGING_PROOF'
    | 'JARVIS_CREDENTIAL_ACTIVATION_PENDING_CREDENTIALS';
  readonly productionReady: false;
  readonly publicLaunchAllowed: false;
  readonly rawSecretsPrinted: false;
  readonly rawConnectionStringsPrinted: false;
  readonly jarvisMayStoreSecrets: false;
  readonly checks: readonly JarvisCredentialRuntimeCheck[];
  readonly modules: readonly JarvisModuleCredentialReadiness[];
  readonly nextAction: string;
}

export const JARVIS_CREDENTIAL_ORCHESTRATOR_TOOL: JarvisToolCapabilityCard = {
  toolRef: 'jarvis.credential.orchestrator',
  displayName: 'Kingsmen Credential Activation Orchestrator',
  trustLevel: 'TRUST_4_PRODUCTION_APPROVAL_REQUIRED',
  allowedModes: ['controlled_command_mode', 'diagnostic_repair_mode', 'production_approval_mode'],
  allowedChannels: ['hud', 'local_terminal', 'system'],
  authorityCeiling: 'LEVEL_5_PRODUCTION_RISK_APPROVAL_REQUIRED',
  productionWriteCapable: true,
  candidateDataCapable: false,
  secretsCapable: true,
  requiresEvidenceLedger: true
};

export const JARVIS_CREDENTIAL_APPROVAL_AUTHORITY: JarvisAuthorityLevel =
  'LEVEL_5_PRODUCTION_RISK_APPROVAL_REQUIRED';

export const JARVIS_CREDENTIAL_REQUIREMENTS: readonly JarvisCredentialRequirement[] = [
  {
    envName: 'KINGSMEN_DATABASE_URL',
    provider: 'postgresql',
    moduleRef: 'truth_vault',
    purpose: 'Primary PostgreSQL Truth Vault connection string used by Kingsmen backend.',
    requiredForBeta: true,
    requiredForProduction: true,
    risk: 'critical',
    secret: true,
    allowedLocations: ['local_env', 'oracle_env', 'vault_or_kms_later']
  },
  {
    envName: 'DATABASE_URL',
    provider: 'postgresql',
    moduleRef: 'truth_vault',
    purpose: 'Runtime alias consumed by Node/validation tooling.',
    requiredForBeta: true,
    requiredForProduction: true,
    risk: 'critical',
    secret: true,
    allowedLocations: ['local_env', 'oracle_env', 'vault_or_kms_later']
  },
  {
    envName: 'REDIS_URL',
    provider: 'redis',
    moduleRef: 'queue_fabric',
    purpose: 'Queue, lock, rate limit, DLQ, and worker coordination endpoint.',
    requiredForBeta: true,
    requiredForProduction: true,
    risk: 'high',
    secret: true,
    allowedLocations: ['local_env', 'oracle_env', 'vault_or_kms_later']
  },
  {
    envName: 'KINGSMEN_BACKEND_BASE_URL',
    provider: 'kingsmen-api',
    moduleRef: 'web_backend_boundary',
    purpose: 'Web/control-plane boundary target for backend API calls.',
    requiredForBeta: true,
    requiredForProduction: true,
    risk: 'medium',
    secret: false,
    allowedLocations: ['local_env', 'oracle_env', 'deployment_env']
  },
  {
    envName: 'SMTP_HOST',
    provider: 'email',
    moduleRef: 'communications',
    purpose: 'Email provider host for candidate and founder notifications.',
    requiredForBeta: false,
    requiredForProduction: true,
    risk: 'medium',
    secret: false,
    allowedLocations: ['local_env', 'oracle_env', 'deployment_env']
  },
  {
    envName: 'SMTP_USER',
    provider: 'email',
    moduleRef: 'communications',
    purpose: 'Email provider username.',
    requiredForBeta: false,
    requiredForProduction: true,
    risk: 'medium',
    secret: true,
    allowedLocations: ['local_env', 'oracle_env', 'vault_or_kms_later']
  },
  {
    envName: 'SMTP_PASSWORD',
    provider: 'email',
    moduleRef: 'communications',
    purpose: 'Email provider password or API key.',
    requiredForBeta: false,
    requiredForProduction: true,
    risk: 'high',
    secret: true,
    allowedLocations: ['local_env', 'oracle_env', 'vault_or_kms_later']
  },
  {
    envName: 'PAYFAST_MERCHANT_ID',
    provider: 'payfast',
    moduleRef: 'payments',
    purpose: 'PayFast sandbox/live merchant identifier; redacted in reports.',
    requiredForBeta: false,
    requiredForProduction: true,
    risk: 'critical',
    secret: true,
    allowedLocations: ['local_env', 'oracle_env', 'vault_or_kms_later']
  },
  {
    envName: 'PAYFAST_MERCHANT_KEY',
    provider: 'payfast',
    moduleRef: 'payments',
    purpose: 'PayFast sandbox/live merchant key; redacted in reports.',
    requiredForBeta: false,
    requiredForProduction: true,
    risk: 'critical',
    secret: true,
    allowedLocations: ['local_env', 'oracle_env', 'vault_or_kms_later']
  },
  {
    envName: 'PAYFAST_PASSPHRASE',
    provider: 'payfast',
    moduleRef: 'payments',
    purpose: 'PayFast signature passphrase; never committed or printed.',
    requiredForBeta: false,
    requiredForProduction: true,
    risk: 'critical',
    secret: true,
    allowedLocations: ['local_env', 'oracle_env', 'vault_or_kms_later']
  },
  {
    envName: 'PAYFAST_NOTIFY_URL',
    provider: 'payfast',
    moduleRef: 'payments',
    purpose: 'Reachable staging notify URL for real PayFast sandbox ITN evidence.',
    requiredForBeta: false,
    requiredForProduction: true,
    risk: 'high',
    secret: false,
    allowedLocations: ['local_env', 'oracle_env', 'deployment_env']
  },
  {
    envName: 'PAYMENT_PROVIDER_SECRET',
    provider: 'payment',
    moduleRef: 'payments',
    purpose: 'Generic payment provider secret used by Kingsmen payment boundary.',
    requiredForBeta: false,
    requiredForProduction: true,
    risk: 'critical',
    secret: true,
    allowedLocations: ['local_env', 'oracle_env', 'vault_or_kms_later']
  },
  {
    envName: 'STORAGE_ACCESS_KEY',
    provider: 'object_storage',
    moduleRef: 'document_vault',
    purpose: 'Document Vault object storage access key.',
    requiredForBeta: false,
    requiredForProduction: true,
    risk: 'critical',
    secret: true,
    allowedLocations: ['local_env', 'oracle_env', 'vault_or_kms_later']
  },
  {
    envName: 'STORAGE_SECRET_KEY',
    provider: 'object_storage',
    moduleRef: 'document_vault',
    purpose: 'Document Vault object storage secret key.',
    requiredForBeta: false,
    requiredForProduction: true,
    risk: 'critical',
    secret: true,
    allowedLocations: ['local_env', 'oracle_env', 'vault_or_kms_later']
  },
  {
    envName: 'STORAGE_BUCKET',
    provider: 'object_storage',
    moduleRef: 'document_vault',
    purpose: 'Document Vault bucket/container name.',
    requiredForBeta: false,
    requiredForProduction: true,
    risk: 'medium',
    secret: false,
    allowedLocations: ['local_env', 'oracle_env', 'deployment_env']
  }
];

const JARVIS_PLACEHOLDER_VALUES = new Set([
  '...',
  'changeme',
  'change_me',
  'todo',
  'tbd',
  'placeholder',
  'your_value_here',
  'replace_me',
  'real',
  'real_value',
  'real_bucket',
  'real_secret',
  'real_key',
  'real_token',
  'real_password',
  'real_host',
  'real_user',
  'dummy',
  'dummy_value',
  'fake',
  'fake_value'
]);

export function jarvisIsCredentialPlaceholder(value: string | undefined | null): boolean {
  if (value == null) return true;
  const normalized = value.trim().toLowerCase();
  return (
    normalized.length === 0 ||
    JARVIS_PLACEHOLDER_VALUES.has(normalized) ||
    normalized.startsWith('your_') ||
    normalized.startsWith('replace_') ||
    normalized.startsWith('real_') ||
    normalized.startsWith('dummy_') ||
    normalized.startsWith('fake_') ||
    normalized.includes('example.com')
  );
}

export function jarvisRedactCredential(value: string | undefined | null): string {
  if (jarvisIsCredentialPlaceholder(value)) return 'missing_or_placeholder';
  const safe = String(value);
  if (safe.length <= 8) return 'present_redacted';
  return `${safe.slice(0, 2)}***${safe.slice(-2)}`;
}

export function jarvisEvaluateCredentialRequirement(
  requirement: JarvisCredentialRequirement,
  getEnv: (name: string) => string | undefined
): JarvisCredentialRuntimeCheck {
  const value = getEnv(requirement.envName);
  const placeholder = jarvisIsCredentialPlaceholder(value);
  return {
    envName: requirement.envName,
    provider: requirement.provider,
    moduleRef: requirement.moduleRef,
    status: placeholder ? 'PLACEHOLDER_REJECTED' : 'PRESENT_REDACTED',
    secret: requirement.secret,
    valuePrinted: false,
    redactedPreview: jarvisRedactCredential(value),
    risk: requirement.risk
  };
}

export function jarvisBuildCredentialActivationReport(
  getEnv: (name: string) => string | undefined,
  requirements: readonly JarvisCredentialRequirement[] = JARVIS_CREDENTIAL_REQUIREMENTS
): JarvisCredentialActivationReport {
  const checks = requirements.map((requirement) => jarvisEvaluateCredentialRequirement(requirement, getEnv));
  const moduleRefs = [...new Set(requirements.map((requirement) => requirement.moduleRef))].sort();
  const modules = moduleRefs.map((moduleRef) => {
    const moduleRequirements = requirements.filter((requirement) => requirement.moduleRef === moduleRef);
    const moduleChecks = checks.filter((check) => check.moduleRef === moduleRef);
    const presentCount = moduleChecks.filter((check) => check.status === 'PRESENT_REDACTED').length;
    const placeholderCount = moduleChecks.filter((check) => check.status === 'PLACEHOLDER_REJECTED').length;
    const missingCount = moduleRequirements.length - presentCount;
    return {
      moduleRef,
      requiredCount: moduleRequirements.length,
      presentCount,
      missingCount,
      placeholderCount,
      readyForStagingProof: missingCount === 0 && placeholderCount === 0,
      readyForLiveAfterApproval: missingCount === 0 && placeholderCount === 0
    } satisfies JarvisModuleCredentialReadiness;
  });
  const allReady = modules.every((module) => module.readyForStagingProof);
  return {
    schema: 'kingsmen.jarvis-credential-activation-report.v1',
    status: allReady
      ? 'JARVIS_CREDENTIAL_ACTIVATION_READY_FOR_STAGING_PROOF'
      : 'JARVIS_CREDENTIAL_ACTIVATION_PENDING_CREDENTIALS',
    productionReady: false,
    publicLaunchAllowed: false,
    rawSecretsPrinted: false,
    rawConnectionStringsPrinted: false,
    jarvisMayStoreSecrets: false,
    checks,
    modules,
    nextAction: allReady
      ? 'Run the module-specific staging proofs and founder approvals before enabling live operations.'
      : 'Configure missing credentials outside Git, rerun Jarvis credential readiness, then run staging proofs.'
  };
}
