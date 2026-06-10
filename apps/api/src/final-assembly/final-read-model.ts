import type { FinalAssemblyReadModel, LaunchGateDecision } from "./final-assembly-types";
import { KINGSMEN_RELEASE_MODULES } from "./module-registry";
import { RELEASE_DOCTRINE } from "./release-doctrine";
import { buildDefaultReadinessChecks, evaluateProductionReadiness } from "./readiness-engine";

export function buildDefaultLaunchGates(): LaunchGateDecision[] {
  return [
    {
      gateKey: "gate_repo_lock",
      gateName: "Repo lock gate",
      gateStatus: "open",
      requiredBefore: "DB apply / staging deploy",
      decisionBy: "founder-primary",
      decisionReason: "N00-N20 repo-materialized and validators passed."
    },
    {
      gateKey: "gate_database_apply",
      gateName: "Database apply gate",
      gateStatus: "manual_review",
      requiredBefore: "staging runtime",
      decisionBy: "founder-primary",
      decisionReason: "Apply migrations only when DATABASE_URL points to intended database."
    },
    {
      gateKey: "gate_secret_wiring",
      gateName: "Secret wiring gate",
      gateStatus: "closed",
      requiredBefore: "production runtime",
      decisionReason: "Live secrets must be wired outside git."
    },
    {
      gateKey: "gate_public_launch",
      gateName: "Public launch gate",
      gateStatus: "closed",
      requiredBefore: "public users",
      decisionReason: "Public launch requires DB apply, secrets, email, PayFast, RLS, backup, and incident readiness."
    }
  ];
}

export function buildFinalAssemblyReadModel(): FinalAssemblyReadModel {
  const checks = buildDefaultReadinessChecks();
  const gates = buildDefaultLaunchGates();
  const readiness = evaluateProductionReadiness(checks);

  return {
    releaseName: "Kingsmen Meta Ultra National - Oracle Lite Founder Release",
    doctrine: RELEASE_DOCTRINE,
    modules: KINGSMEN_RELEASE_MODULES,
    checks,
    gates,
    blockers: readiness.blockers,
    nextActions: [
      "Apply database migrations only after confirming DATABASE_URL.",
      "Wire secrets through environment variables, never git.",
      "Run PayFast sandbox evidence tests.",
      "Run email provider tests.",
      "Run backup/restore drill.",
      "Run RLS/security review before public traffic.",
      "Then connect web routing and deployment."
    ]
  };
}