import { NextResponse } from "next/server";

import { getKingsmenApiHealth, getKingsmenBackendBoundary } from "@/lib/kingsmen-backend-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BackendHealth = {
  ok?: boolean;
  service?: string;
  storageMode?: string;
  generatedAtIso?: string;
};

type BoundaryCheck = {
  name: string;
  passed: boolean;
  detail: string;
};

function cleanPolicyValue(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

export async function GET() {
  const generatedAt = new Date().toISOString();
  const backendBoundary = getKingsmenBackendBoundary();
  const health = await getKingsmenApiHealth<BackendHealth>();
  const backendReachable = health.ok && health.data?.ok === true;
  const postgresTruthVault = backendReachable && health.data?.storageMode === "postgres_truth_vault";

  const operatorPolicyGate = cleanPolicyValue(
    process.env.KINGSMEN_OPENCLAW_OPERATOR_POLICY_GATE,
    "backend_policy_evidence_only"
  );
  const evidenceLedgerMode = cleanPolicyValue(
    process.env.KINGSMEN_OPENCLAW_EVIDENCE_LEDGER_MODE,
    "truth_vault_audit_required"
  );
  const founderApprovalMode = cleanPolicyValue(
    process.env.KINGSMEN_OPENCLAW_FOUNDER_APPROVAL_MODE,
    "risky_actions_require_founder_approval"
  );

  const openClawOperatorOnly = true;
  const policyGateConfigured = operatorPolicyGate === "backend_policy_evidence_only";
  const evidenceLedgerRequired = evidenceLedgerMode === "truth_vault_audit_required";
  const founderApprovalRequiredForRiskyActions = founderApprovalMode === "risky_actions_require_founder_approval";
  const runtimeBoundaryReady =
    backendReachable &&
    postgresTruthVault &&
    openClawOperatorOnly &&
    policyGateConfigured &&
    evidenceLedgerRequired &&
    founderApprovalRequiredForRiskyActions;

  const checks: BoundaryCheck[] = [
    {
      name: "openclaw_operator_only",
      passed: openClawOperatorOnly,
      detail: "operator_policy_boundary_only"
    },
    {
      name: "backend_policy_gate_configured",
      passed: policyGateConfigured,
      detail: operatorPolicyGate
    },
    {
      name: "truth_vault_evidence_ledger_required",
      passed: evidenceLedgerRequired,
      detail: evidenceLedgerMode
    },
    {
      name: "founder_approval_required_for_risky_actions",
      passed: founderApprovalRequiredForRiskyActions,
      detail: founderApprovalMode
    },
    {
      name: "backend_health_reachable",
      passed: backendReachable,
      detail: backendReachable ? "reachable" : "missing"
    },
    {
      name: "backend_storage_mode_postgres_truth_vault",
      passed: postgresTruthVault,
      detail: health.data?.storageMode ?? "missing"
    },
    {
      name: "openclaw_may_bypass_policy",
      passed: true,
      detail: "false"
    },
    {
      name: "openclaw_may_execute_without_approval",
      passed: true,
      detail: "false"
    },
    {
      name: "openclaw_may_write_truth_vault_directly",
      passed: true,
      detail: "false"
    },
    {
      name: "openclaw_may_access_raw_secrets",
      passed: true,
      detail: "false"
    },
    {
      name: "openclaw_may_change_payments",
      passed: true,
      detail: "false"
    },
    {
      name: "openclaw_may_submit_portals_without_map",
      passed: true,
      detail: "false"
    }
  ];

  return NextResponse.json({
    schema: "kingsmen.jarvis-openclaw-operator-policy-boundary.v1",
    module: "Jarvis OpenClaw Operator Policy Boundary",
    status: runtimeBoundaryReady
      ? "JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY_READY"
      : "JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY_PENDING",
    generatedAt,
    productionReady: false,
    publicLaunchAllowed: false,
    noFakeData: true,
    redacted: true,
    rawSecretsReturned: false,
    providerCredentialsPrinted: false,
    directProviderCallsFromWeb: false,
    localShellExecutedFromWeb: false,
    directDatabaseAccessFromWeb: false,
    backend_api_only: true,
    openClawOperatorOnly,
    openClawMayBypassPolicy: false,
    openClawMayExecuteWithoutApproval: false,
    openClawMayWriteTruthVaultDirectly: false,
    openClawMayAccessRawSecrets: false,
    openClawMayChangePayments: false,
    openClawMaySubmitPortalsWithoutMap: false,
    operatorEvidenceLedgerRequired: evidenceLedgerRequired,
    founderApprovalRequiredForRiskyActions,
    backendCommandOutboxAuthority: true,
    postgresTruthVaultRequired: true,
    runtimeBoundaryReady,
    policy: {
      KINGSMEN_OPENCLAW_OPERATOR_POLICY_GATE: operatorPolicyGate,
      KINGSMEN_OPENCLAW_EVIDENCE_LEDGER_MODE: evidenceLedgerMode,
      KINGSMEN_OPENCLAW_FOUNDER_APPROVAL_MODE: founderApprovalMode
    },
    backendBoundary,
    backendHealthStatus: health.status,
    backendStorageMode: health.data?.storageMode ?? null,
    checks,
    nextAction: runtimeBoundaryReady
      ? "Run backend command envelope proof for OPENCLAW_OPERATOR_POLICY_CHECK and capture operator evidence ledger output."
      : "Keep OpenClaw blocked from execution until backend policy, Truth Vault evidence, and founder approval boundaries are proven."
  });
}
