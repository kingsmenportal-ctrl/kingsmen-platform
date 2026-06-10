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
      description: "No live API keys, payment secrets, database URLs, or Airtable keys can be committed.",
      severity: "required",
      status: "pending",
      remediation: "Run secret scan and wire secrets through environment variables only."
    },
    {
      checkKey: "database_backup_restore_test",
      checkGroup: "backup",
      title: "Database backup and restore test",
      description: "Production launch requires a proven database restore path.",
      severity: "required",
      status: "pending",
      remediation: "Run backup and restore drill against staging."
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