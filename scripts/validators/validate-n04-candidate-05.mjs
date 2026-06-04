import fs from "node:fs";

const requiredFiles = [
  "docs/n04/N04_CANDIDATE_05_MOBILE_EMAIL_FIRST_URGENT_WHATSAPP.md",
  "manifests/n04/n04-candidate-05-mobile-email-first-urgent-whatsapp.json",
  "packages/contracts/src/n04-mobile-journey-contract.ts",
  "packages/contracts/src/n04-communication-channel-contract.ts",
  "packages/backend/src/n04/mobile-journey-policy.ts",
  "packages/backend/src/n04/candidate-channel-policy.ts",
  "apps/web/src/app/candidate/mobile/page.tsx",
  "packages/db/src/n04-mobile-comms-policy.ts",
  "reports/n04/n04-candidate-04-proof-latest.json"
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const manifest = fs.existsSync("manifests/n04/n04-candidate-05-mobile-email-first-urgent-whatsapp.json")
  ? JSON.parse(fs.readFileSync("manifests/n04/n04-candidate-05-mobile-email-first-urgent-whatsapp.json", "utf8"))
  : {};

for (const key of [
  "requiresN04Candidate04",
  "mobilePortalJourneyBuilt",
  "emailFirstExperienceBuilt",
  "urgentWhatsAppBoundaryBuilt",
  "smsBackupOnly",
  "bulkWhatsAppBlocked",
  "routineCommsEmailOnly",
  "candidateSafeJourneyGuidanceBuilt"
]) {
  if (manifest[key] !== true) failures.push(`${key} must be true`);
}

if (manifest.productionReady !== false) failures.push("productionReady must be false");

const channel = fs.existsSync("packages/backend/src/n04/candidate-channel-policy.ts")
  ? fs.readFileSync("packages/backend/src/n04/candidate-channel-policy.ts", "utf8")
  : "";

for (const phrase of ["email-first", "WhatsApp is urgent-only", "SMS is backup-only", "Bulk WhatsApp reminders are blocked"]) {
  if (!channel.includes(phrase)) failures.push(`Channel policy missing phrase: ${phrase}`);
}

const page = fs.existsSync("apps/web/src/app/candidate/mobile/page.tsx")
  ? fs.readFileSync("apps/web/src/app/candidate/mobile/page.tsx", "utf8")
  : "";

for (const phrase of ["Mobile-first", "email-first", "urgent-only", "backup-only", "No bulk WhatsApp reminders"]) {
  if (!page.includes(phrase)) failures.push(`Mobile page missing phrase: ${phrase}`);
}

const report = {
  schema: "kingsmen.n04-candidate-05-validation.v1",
  module: "N04-CANDIDATE-05",
  passed: failures.length === 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/n04-candidate-05-validation-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N04-CANDIDATE-05 validation passed.");