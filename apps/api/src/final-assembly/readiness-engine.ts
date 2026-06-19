import type { ProductionReadinessCheck } from "./final-assembly-types";

export function evaluateProductionReadiness(checks: ProductionReadinessCheck[]): {
  passed: boolean;
  blockers: string[];
  warnings: string[];
} {
  const blockers = checks
    .filter((check) => check.severity === "required" && (check.status === "failed" || check.status === "pending"))
    .map((check) => `${check.checkKey}: ${check.title}`);

  const warnings = checks
    .filter((check) => check.severity !== "required" && (check.status === "failed" || check.status === "pending"))
    .map((check) => `${check.checkKey}: ${check.title}`);

  return {
    passed: blockers.length === 0,
    blockers,
    warnings
  };
}

export function buildDefaultReadinessChecks(): ProductionReadinessCheck[] {
  return [
    {
      checkKey: "repo_validators_present",
      checkGroup: "repo",
      title: "N-series validators present",
      description: "Each repo-materialized phase must have validator evidence.",
      severity: "required",
      status: "passed",
      remediation: "Run validators and repair missing evidence."
    },
    {
      checkKey: "secrets_not_committed",
      checkGroup: "security",
      title: "Secrets not committed",
      description: "Masked runtime secret health evidence passed and reports contain no raw secrets, connection strings, token prefixes, private keys, or service-role values.",
      severity: "required",
      status: "passed",
      remediation: "Continue keeping secrets outside Git and rerun scripts/security/Test-KingsmenSecretWiring.ps1 after every environment change."
    },
    {
      checkKey: "database_backup_restore_test",
      checkGroup: "backup",
      title: "Database backup and restore test",
      description: "Staging backup and restore drill evidence passed with counts-only verification, redacted output, and operator review.",
      severity: "required",
      status: "passed",
      remediation: "Repeat restore drills before production personal data, after schema changes, and on a regular operations cadence."
    },
    {
      checkKey: "payfast_sandbox_evidence",
      checkGroup: "finance",
      title: "PayFast sandbox evidence",
      description: "Payment success must come from provider evidence only.",
      severity: "required",
      status: "pending",
      remediation: "Complete sandbox checkout, cancel, return, and ITN verification."
    }
  ];
}
