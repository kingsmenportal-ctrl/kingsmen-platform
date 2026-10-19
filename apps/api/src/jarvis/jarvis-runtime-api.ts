export type ApiJarvisFinalDecision = "ALLOW" | "DRY_RUN_ONLY" | "APPROVAL_REQUIRED" | "BLOCK";

export type ApiJarvisRuntimeNextStep =
  | "respond_only"
  | "dry_run_tool_plan"
  | "request_founder_approval"
  | "execute_allowed_tool"
  | "blocked";

export interface ApiJarvisRuntimeCommand {
  readonly commandRef?: string;
  readonly tenantRef?: string;
  readonly correlationId?: string;
  readonly requestId?: string;
  readonly channel?: string;
  readonly mode?: string;
  readonly actor?: {
    readonly actorType?: string;
    readonly actorRef?: string;
  };
  readonly commandTextSafe?: string;
  readonly intendedAction?: string;
  readonly targetRefs?: readonly string[];
  readonly requestedAuthorityLevel?: string;
  readonly evidenceRefs?: readonly string[];
  readonly founderApprovalRef?: string;
}

export interface ApiJarvisLaunchEvidenceState {
  readonly publicLaunchStatus?: string;
  readonly productionReady?: boolean;
  readonly publicLaunchAllowed?: boolean;
  readonly blockers?: readonly { readonly code?: string; readonly title?: string }[];
  readonly reports?: readonly {
    readonly path?: string;
    readonly status?: string;
    readonly passed?: boolean;
    readonly reviewed?: boolean;
    readonly redacted?: boolean;
  }[];
}

export interface ApiJarvisRuntimeRequest {
  readonly command?: ApiJarvisRuntimeCommand;
  readonly toolRef?: string;
  readonly launchEvidence?: ApiJarvisLaunchEvidenceState;
  readonly founderApprovalRef?: string;
  readonly dryRun?: boolean;
}

export interface ApiJarvisRuntimeLedgerEvent {
  readonly eventRef: string;
  readonly commandRef: string;
  readonly correlationId: string;
  readonly eventType: "command_received" | "policy_decision" | "validator_result" | "blocked";
  readonly safeSummary: string;
  readonly createdAtIso: string;
}

export interface ApiJarvisRuntimeResult {
  readonly ok: boolean;
  readonly status: "JARVIS_RUNTIME_ALLOWED" | "JARVIS_RUNTIME_DRY_RUN_ONLY" | "JARVIS_RUNTIME_APPROVAL_REQUIRED" | "JARVIS_RUNTIME_BLOCKED";
  readonly commandRef: string;
  readonly correlationId: string;
  readonly requestId: string;
  readonly finalDecision: ApiJarvisFinalDecision;
  readonly risk: "LOW_INFORMATIONAL" | "MEDIUM_REPO_WRITE" | "HIGH_PRODUCTION_RISK" | "BLOCKED_UNSAFE";
  readonly reasonCode: string;
  readonly safeReason: string;
  readonly approvalRequired: boolean;
  readonly evidenceRequired: boolean;
  readonly executable: boolean;
  readonly nextStep: ApiJarvisRuntimeNextStep;
  readonly launchGateChecked: boolean;
  readonly launchGateOpen: boolean;
  readonly founderApprovalRef?: string;
  readonly blockedBy: readonly string[];
  readonly toolRef?: string;
  readonly ledger: readonly ApiJarvisRuntimeLedgerEvent[];
  readonly localShellExecuted: false;
  readonly localFileWritten: false;
  readonly directDatabaseAccessFromApi: false;
  readonly dryRun: boolean;
  readonly generatedAtIso: string;
}

const BLOCKED_PATTERNS = [
  "bypass captcha",
  "bypass otp",
  "dump secrets",
  "disable rls",
  "remove approval gate",
  "ignore doctrine",
  "skip validators",
  "force production without approval"
];

const LIVE_PATTERNS = [
  "production",
  "prod",
  "release",
  "live",
  "public launch",
  "payment",
  "payfast",
  "refund",
  "candidate submission",
  "send candidate",
  "branch protection"
];

function nowIso(): string {
  return new Date().toISOString();
}

function safeText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function includesAny(text: string, patterns: readonly string[]): boolean {
  const lower = text.toLowerCase();
  return patterns.some((pattern) => lower.includes(pattern));
}

function isLiveCommand(command: Required<Pick<ApiJarvisRuntimeCommand, "commandTextSafe" | "intendedAction" | "mode" | "requestedAuthorityLevel">>, toolRef?: string): boolean {
  const text = `${command.commandTextSafe} ${command.intendedAction} ${toolRef ?? ""}`;
  return command.mode === "production_approval_mode" || command.requestedAuthorityLevel === "LEVEL_5_PRODUCTION_RISK_APPROVAL_REQUIRED" || includesAny(text, LIVE_PATTERNS);
}

function isLaunchGateOpen(launchEvidence?: ApiJarvisLaunchEvidenceState): boolean {
  if (!launchEvidence) return false;
  if (launchEvidence.publicLaunchStatus !== "open") return false;
  if (launchEvidence.productionReady !== true) return false;
  if (launchEvidence.publicLaunchAllowed !== true) return false;
  if ((launchEvidence.blockers ?? []).length > 0) return false;
  return true;
}

function launchBlockers(launchEvidence?: ApiJarvisLaunchEvidenceState): readonly string[] {
  if (!launchEvidence) return ["launch_evidence_missing"];
  const blockers = new Set<string>();
  if (launchEvidence.publicLaunchStatus !== "open") blockers.add(`publicLaunchStatus:${launchEvidence.publicLaunchStatus ?? "unknown"}`);
  if (launchEvidence.productionReady !== true) blockers.add("productionReady:false");
  if (launchEvidence.publicLaunchAllowed !== true) blockers.add("publicLaunchAllowed:false");
  for (const blocker of launchEvidence.blockers ?? []) blockers.add(blocker.code ?? "launch_blocker");
  for (const report of launchEvidence.reports ?? []) {
    if (!(report.passed === true && report.reviewed === true && report.redacted === true)) {
      blockers.add(`${report.path ?? "report"}:${report.status ?? "not_ready"}`);
    }
  }
  return [...blockers];
}

function makeEvent(commandRef: string, correlationId: string, sequence: number, eventType: ApiJarvisRuntimeLedgerEvent["eventType"], safeSummary: string): ApiJarvisRuntimeLedgerEvent {
  return {
    eventRef: `jarvis_api_ev_${commandRef}_${sequence}`.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 180),
    commandRef,
    correlationId,
    eventType,
    safeSummary,
    createdAtIso: nowIso()
  };
}

function statusFromDecision(finalDecision: ApiJarvisFinalDecision): ApiJarvisRuntimeResult["status"] {
  if (finalDecision === "ALLOW") return "JARVIS_RUNTIME_ALLOWED";
  if (finalDecision === "DRY_RUN_ONLY") return "JARVIS_RUNTIME_DRY_RUN_ONLY";
  if (finalDecision === "APPROVAL_REQUIRED") return "JARVIS_RUNTIME_APPROVAL_REQUIRED";
  return "JARVIS_RUNTIME_BLOCKED";
}

function nextStepFromDecision(finalDecision: ApiJarvisFinalDecision, toolRef?: string): ApiJarvisRuntimeNextStep {
  if (finalDecision === "BLOCK") return "blocked";
  if (finalDecision === "APPROVAL_REQUIRED") return "request_founder_approval";
  if (finalDecision === "DRY_RUN_ONLY") return "dry_run_tool_plan";
  return toolRef ? "execute_allowed_tool" : "respond_only";
}

export function evaluateApiJarvisRuntime(input: ApiJarvisRuntimeRequest): ApiJarvisRuntimeResult {
  const rawCommand = input.command ?? {};
  const now = Date.now().toString(36);
  const commandRef = safeText(rawCommand.commandRef, `jarvis_api_cmd_${now}`);
  const correlationId = safeText(rawCommand.correlationId, `jarvis_api_corr_${now}`);
  const requestId = safeText(rawCommand.requestId, `jarvis_api_req_${now}`);
  const commandTextSafe = safeText(rawCommand.commandTextSafe, "Jarvis API runtime command.");
  const intendedAction = safeText(rawCommand.intendedAction, "api_runtime_control");
  const mode = safeText(rawCommand.mode, "controlled_command_mode");
  const requestedAuthorityLevel = safeText(rawCommand.requestedAuthorityLevel, "LEVEL_3_TEST_VALIDATE");
  const founderApprovalRef = safeText(input.founderApprovalRef ?? rawCommand.founderApprovalRef, "");
  const toolRef = safeText(input.toolRef, "");
  const policyText = `${commandTextSafe} ${intendedAction}`;

  const ledger: ApiJarvisRuntimeLedgerEvent[] = [
    makeEvent(commandRef, correlationId, 1, "command_received", `Jarvis API command received in ${mode}.`)
  ];

  let finalDecision: ApiJarvisFinalDecision = "ALLOW";
  let risk: ApiJarvisRuntimeResult["risk"] = "LOW_INFORMATIONAL";
  let reasonCode = "JARVIS_API_ALLOWED_BY_POLICY";
  let safeReason = "Jarvis API command is allowed inside runtime policy and evidence gates.";
  let approvalRequired = false;
  let evidenceRequired = true;

  if (includesAny(policyText, BLOCKED_PATTERNS)) {
    finalDecision = "BLOCK";
    risk = "BLOCKED_UNSAFE";
    reasonCode = "JARVIS_API_BLOCKED_UNSAFE_ACTION";
    safeReason = "Jarvis API blocked the command because it matches an unsafe action pattern.";
  }

  const live = isLiveCommand({ commandTextSafe, intendedAction, mode, requestedAuthorityLevel }, toolRef || undefined);
  const gateOpen = live ? isLaunchGateOpen(input.launchEvidence) : true;
  const blockedBy = live && !gateOpen ? launchBlockers(input.launchEvidence) : [];

  if (finalDecision !== "BLOCK" && live && !gateOpen) {
    finalDecision = "BLOCK";
    risk = "HIGH_PRODUCTION_RISK";
    reasonCode = "JARVIS_API_LAUNCH_EVIDENCE_GATE_BLOCKED";
    safeReason = `Jarvis API blocked the live action because launch evidence is incomplete: ${blockedBy.join(", ")}.`;
  } else if (finalDecision !== "BLOCK" && live && !founderApprovalRef) {
    finalDecision = "APPROVAL_REQUIRED";
    risk = "HIGH_PRODUCTION_RISK";
    reasonCode = "JARVIS_API_FOUNDER_APPROVAL_REQUIRED";
    safeReason = "Jarvis API requires founder approval before this live/high-risk action can run.";
    approvalRequired = true;
  } else if (finalDecision !== "BLOCK" && live && founderApprovalRef) {
    finalDecision = "ALLOW";
    risk = "HIGH_PRODUCTION_RISK";
    reasonCode = "JARVIS_API_APPROVAL_PRESENT_RUNTIME_ALLOWED";
    safeReason = "Founder approval reference is present and launch/evidence gates allow this action.";
  }

  ledger.push(makeEvent(commandRef, correlationId, 2, finalDecision === "BLOCK" ? "blocked" : "policy_decision", `${reasonCode}: ${safeReason}`));
  ledger.push(makeEvent(commandRef, correlationId, 3, "validator_result", `Jarvis API runtime final decision ${finalDecision}: ${reasonCode}.`));

  const executable = finalDecision === "ALLOW";

  return {
    ok: executable,
    status: statusFromDecision(finalDecision),
    commandRef,
    correlationId,
    requestId,
    finalDecision,
    risk,
    reasonCode,
    safeReason,
    approvalRequired,
    evidenceRequired,
    executable,
    nextStep: nextStepFromDecision(finalDecision, toolRef || undefined),
    launchGateChecked: live,
    launchGateOpen: gateOpen,
    founderApprovalRef: founderApprovalRef || undefined,
    blockedBy,
    toolRef: toolRef || undefined,
    ledger,
    localShellExecuted: false,
    localFileWritten: false,
    directDatabaseAccessFromApi: false,
    dryRun: input.dryRun !== false,
    generatedAtIso: nowIso()
  };
}

export function apiJarvisDecisionToHttpStatus(result: ApiJarvisRuntimeResult): number {
  if (result.finalDecision === "BLOCK") return 403;
  if (result.finalDecision === "APPROVAL_REQUIRED") return 423;
  if (result.finalDecision === "DRY_RUN_ONLY") return 202;
  return 200;
}
