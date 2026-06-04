import fs from "node:fs";

const HIGH_RISK_COMMANDS = new Set([
  "claim_production_ready",
  "enable_live_payments",
  "enable_live_email",
  "enable_official_submissions",
  "increase_active_candidate_cap",
  "mark_candidate_paid",
  "mark_application_submitted",
  "verify_official_outcome",
  "publish_success_story",
  "share_candidate_with_partner",
  "run_raw_shell"
]);

export function loadN00Constitution() {
  const raw = fs.readFileSync("manifests/constitution/n00-constitution-doctrine-lock.json", "utf8");
  return JSON.parse(raw);
}

export function assertN02CommandAllowed(command: {
  commandType: string;
  risk?: string;
  requiresFounderApproval?: boolean;
  providerProofPresent?: boolean;
}) {
  const constitution = loadN00Constitution();

  if (constitution.productionReady !== false) {
    throw new Error("N00 must not claim productionReady=true");
  }

  if (HIGH_RISK_COMMANDS.has(command.commandType) && command.requiresFounderApproval !== true) {
    throw new Error(`High-risk command blocked without founder approval: ${command.commandType}`);
  }

  if (
    ["enable_live_payments", "enable_live_email", "enable_official_submissions", "claim_production_ready"].includes(command.commandType) &&
    command.providerProofPresent !== true
  ) {
    throw new Error(`Provider/live/production claim blocked without proof: ${command.commandType}`);
  }

  if (command.commandType === "run_raw_shell") {
    throw new Error("Raw shell command blocked by N02 policy guard");
  }

  return true;
}