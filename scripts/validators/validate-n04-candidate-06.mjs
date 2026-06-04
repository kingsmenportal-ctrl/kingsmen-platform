import fs from "node:fs";

const requiredFiles = [
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
  "reports/n04/n04-candidate-05-proof-latest.json"
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const manifest = fs.existsSync("manifests/n04/n04-candidate-06-communication-centre-message-evidence.json")
  ? JSON.parse(fs.readFileSync("manifests/n04/n04-candidate-06-communication-centre-message-evidence.json", "utf8"))
  : {};

for (const key of [
  "requiresN04Candidate05",
  "communicationCentreBuilt",
  "emailTemplatesBuilt",
  "notificationRulesBuilt",
  "messageEvidenceLedgerBuilt",
  "emailFirst",
  "whatsappUrgentOnly",
  "smsBackupOnly",
  "bulkWhatsAppBlocked",
  "candidateSafeMessageReadModelOnly"
]) {
  if (manifest[key] !== true) failures.push(`${key} must be true`);
}

if (manifest.productionReady !== false) failures.push("productionReady must be false");

const channel = fs.existsSync("packages/backend/src/n04/message-channel-policy.ts")
  ? fs.readFileSync("packages/backend/src/n04/message-channel-policy.ts", "utf8")
  : "";

for (const phrase of ["evidence ledger entry", "email-first", "WhatsApp is urgent-only", "SMS is backup-only", "bulk WhatsApp reminders are blocked"]) {
  if (!channel.includes(phrase)) failures.push(`Message channel policy missing phrase: ${phrase}`);
}

const page = fs.existsSync("apps/web/src/app/candidate/messages/page.tsx")
  ? fs.readFileSync("apps/web/src/app/candidate/messages/page.tsx", "utf8")
  : "";

for (const phrase of ["Email is the primary", "WhatsApp is urgent-only", "SMS is backup-only", "Every message requires"]) {
  if (!page.includes(phrase)) failures.push(`Messages page missing phrase: ${phrase}`);
}

const report = {
  schema: "kingsmen.n04-candidate-06-validation.v1",
  module: "N04-CANDIDATE-06",
  passed: failures.length === 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/n04-candidate-06-validation-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N04-CANDIDATE-06 validation passed.");