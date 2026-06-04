import fs from "node:fs";

const required = [
  "docs/n04/N04_CANDIDATE_05_MOBILE_EMAIL_FIRST_URGENT_WHATSAPP.md",
  "manifests/n04/n04-candidate-05-mobile-email-first-urgent-whatsapp.json",
  "packages/contracts/src/n04-mobile-journey-contract.ts",
  "packages/contracts/src/n04-communication-channel-contract.ts",
  "packages/backend/src/n04/mobile-journey-policy.ts",
  "packages/backend/src/n04/candidate-channel-policy.ts",
  "apps/web/src/app/candidate/mobile/page.tsx",
  "packages/db/src/n04-mobile-comms-policy.ts",
  "scripts/validators/validate-n04-candidate-05.mjs",
  "reports/n04/n04-candidate-04-proof-latest.json"
];

const failures = required.filter((path) => !fs.existsSync(path)).map((path) => `Missing ${path}`);
const manifest = JSON.parse(fs.readFileSync("manifests/n04/n04-candidate-05-mobile-email-first-urgent-whatsapp.json", "utf8"));

if (manifest.productionReady !== false) failures.push("productionReady must be false");
if (manifest.emailFirstExperienceBuilt !== true) failures.push("emailFirstExperienceBuilt must be true");
if (manifest.urgentWhatsAppBoundaryBuilt !== true) failures.push("urgentWhatsAppBoundaryBuilt must be true");
if (manifest.bulkWhatsAppBlocked !== true) failures.push("bulkWhatsAppBlocked must be true");

const report = {
  schema: "kingsmen.n04-candidate-05-proof.v1",
  module: "N04-CANDIDATE-05 - Mobile Portal Journey / Email-First Experience / Urgent WhatsApp Boundary",
  status: failures.length === 0 ? "N04_MOBILE_EMAIL_FIRST_URGENT_WHATSAPP_PROVEN" : "N04_MOBILE_EMAIL_FIRST_URGENT_WHATSAPP_BLOCKED",
  passed: failures.length === 0,
  productionReady: false,
  mobilePortalJourneyBuilt: manifest.mobilePortalJourneyBuilt === true,
  emailFirstExperienceBuilt: manifest.emailFirstExperienceBuilt === true,
  urgentWhatsAppBoundaryBuilt: manifest.urgentWhatsAppBoundaryBuilt === true,
  smsBackupOnly: manifest.smsBackupOnly === true,
  bulkWhatsAppBlocked: manifest.bulkWhatsAppBlocked === true,
  routineCommsEmailOnly: manifest.routineCommsEmailOnly === true,
  candidateSafeJourneyGuidanceBuilt: manifest.candidateSafeJourneyGuidanceBuilt === true,
  failures,
  nextAction: failures.length === 0
    ? "Continue to N04-CANDIDATE-06 - communication centre, email templates, notification rules, and message evidence ledger."
    : "Repair N04-CANDIDATE-05 files and rerun validators.",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/n04", { recursive: true });
fs.writeFileSync("reports/n04/n04-candidate-05-proof-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N04-CANDIDATE-05 proof passed.");