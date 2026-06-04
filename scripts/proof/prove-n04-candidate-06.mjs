import fs from "node:fs";

const required = [
  "docs/n04/N04_CANDIDATE_06_COMMUNICATION_CENTRE_MESSAGE_EVIDENCE.md",
  "manifests/n04/n04-candidate-06-communication-centre-message-evidence.json",
  "packages/contracts/src/n04-message-centre-contract.ts",
  "packages/contracts/src/n04-email-template-contract.ts",
  "packages/contracts/src/n04-notification-rule-contract.ts",
  "packages/backend/src/n04/message-channel-policy.ts",
  "packages/backend/src/n04/email-template-policy.ts",
  "packages/backend/src/n04/notification-rule-policy.ts",
  "apps/web/src/app/candidate/messages/page.tsx",
  "packages/db/src/n04-message-evidence-policy.ts",
  "scripts/validators/validate-n04-candidate-06.mjs",
  "reports/n04/n04-candidate-05-proof-latest.json"
];

const failures = required.filter((path) => !fs.existsSync(path)).map((path) => `Missing ${path}`);
const manifest = JSON.parse(fs.readFileSync("manifests/n04/n04-candidate-06-communication-centre-message-evidence.json", "utf8"));

if (manifest.productionReady !== false) failures.push("productionReady must be false");
if (manifest.emailFirst !== true) failures.push("emailFirst must be true");
if (manifest.whatsappUrgentOnly !== true) failures.push("whatsappUrgentOnly must be true");
if (manifest.messageEvidenceLedgerBuilt !== true) failures.push("messageEvidenceLedgerBuilt must be true");

const report = {
  schema: "kingsmen.n04-candidate-06-proof.v1",
  module: "N04-CANDIDATE-06 - Communication Centre / Email Templates / Notification Rules / Message Evidence Ledger",
  status: failures.length === 0 ? "N04_COMMUNICATION_CENTRE_MESSAGE_EVIDENCE_PROVEN" : "N04_COMMUNICATION_CENTRE_MESSAGE_EVIDENCE_BLOCKED",
  passed: failures.length === 0,
  productionReady: false,
  communicationCentreBuilt: manifest.communicationCentreBuilt === true,
  emailTemplatesBuilt: manifest.emailTemplatesBuilt === true,
  notificationRulesBuilt: manifest.notificationRulesBuilt === true,
  messageEvidenceLedgerBuilt: manifest.messageEvidenceLedgerBuilt === true,
  emailFirst: manifest.emailFirst === true,
  whatsappUrgentOnly: manifest.whatsappUrgentOnly === true,
  smsBackupOnly: manifest.smsBackupOnly === true,
  bulkWhatsAppBlocked: manifest.bulkWhatsAppBlocked === true,
  candidateSafeMessageReadModelOnly: manifest.candidateSafeMessageReadModelOnly === true,
  failures,
  nextAction: failures.length === 0
    ? "Continue to N04-CANDIDATE-07 - portal security, device trust, account recovery, and RLS enforcement."
    : "Repair N04-CANDIDATE-06 files and rerun validators.",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/n04", { recursive: true });
fs.writeFileSync("reports/n04/n04-candidate-06-proof-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N04-CANDIDATE-06 proof passed.");