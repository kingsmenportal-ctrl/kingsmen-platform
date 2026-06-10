export interface ReleaseRunbook {
  key: string;
  title: string;
  scenario: string;
  severity: "normal" | "urgent" | "critical";
  steps: string[];
  automationAllowed: boolean;
  humanApprovalRequired: boolean;
}

export const RELEASE_RUNBOOKS: ReleaseRunbook[] = [
  {
    key: "portal_blocked_map",
    title: "Portal blocked / MAP fallback",
    scenario: "CAPTCHA, OTP, outage, maintenance, manual-only process, or portal blocking.",
    severity: "urgent",
    steps: [
      "Stop automation attempt",
      "Record portal health evidence",
      "Generate Manual Application Package",
      "Notify candidate by email",
      "Escalate WhatsApp only if deadline urgent",
      "Keep backend state controlled"
    ],
    automationAllowed: true,
    humanApprovalRequired: true
  },
  {
    key: "payment_dispute",
    title: "Payment evidence dispute",
    scenario: "Candidate claims payment but provider evidence is missing or contradictory.",
    severity: "urgent",
    steps: [
      "Do not mark payment successful",
      "Check PayFast ITN/evidence ledger",
      "Request proof if needed",
      "Create finance review item",
      "Founder approves final correction"
    ],
    automationAllowed: false,
    humanApprovalRequired: true
  },
  {
    key: "source_conflict",
    title: "Source conflict / deadline uncertainty",
    scenario: "Official source, portal, aggregator, or candidate data conflict.",
    severity: "normal",
    steps: [
      "Prefer official source",
      "Mark confidence manual_review",
      "Pause automatic claim",
      "Create source review task",
      "Publish only verified deadline after evidence"
    ],
    automationAllowed: false,
    humanApprovalRequired: true
  },
  {
    key: "cap_pressure",
    title: "500 active candidate cap pressure",
    scenario: "Active candidates approach Oracle Lite launch cap.",
    severity: "critical",
    steps: [
      "Throttle new activations",
      "Keep free previews available",
      "Prioritize active paid routes",
      "Review queue drain report",
      "Increase capacity only after evidence"
    ],
    automationAllowed: true,
    humanApprovalRequired: true
  }
];