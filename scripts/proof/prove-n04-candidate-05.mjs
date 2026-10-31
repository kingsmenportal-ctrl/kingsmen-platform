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
const contract = fs.readFileSync("packages/contracts/src/n04-communication-channel-contract.ts", "utf8");
const backendPolicy = fs.readFileSync("packages/backend/src/n04/candidate-channel-policy.ts", "utf8");
const mobilePolicy = fs.readFileSync("packages/db/src/n04-mobile-comms-policy.ts", "utf8");
const page = fs.readFileSync("apps/web/src/app/candidate/mobile/page.tsx", "utf8");

for (const key of ["mobilePortalJourneyBuilt", "emailFirstExperienceBuilt", "whatsappDisabled", "smsDisabled", "bulkWhatsAppBlocked", "routineCommsEmailOnly", "candidateSafeJourneyGuidanceBuilt"]) {
  if (manifest[key] !== true) failures.push(key + " must be true");
}
if (manifest.productionReady !== false) failures.push("productionReady must be false");
for (const token of ["whatsappEnabled: false", "smsEnabled: false", "whatsappDisabled: true", "smsDisabled: true"]) {
  if (!contract.includes(token)) failures.push("Contract missing " + token);
  if (!mobilePolicy.includes(token)) failures.push("DB policy missing " + token);
}
for (const token of ["WHATSAPP_DISABLED_BY_CURRENT_CHANNEL_POLICY", "SMS_DISABLED_BY_CURRENT_CHANNEL_POLICY"]) {
  if (!backendPolicy.includes(token)) failures.push("Backend policy missing " + token);
}
for (const token of ["WhatsApp: disabled.", "SMS: disabled.", "Email: the only enabled external candidate communication channel."]) {
  if (!page.includes(token)) failures.push("Mobile page missing " + token);
}

const report = {
  schema: "kingsmen.n04-candidate-05-proof.v2",
  module: "N04-CANDIDATE-05 - Mobile Candidate Journey / Email and Portal Only",
  status: failures.length === 0 ? "N04_MOBILE_EMAIL_PORTAL_ONLY_POLICY_PROVEN" : "N04_MOBILE_EMAIL_PORTAL_ONLY_POLICY_BLOCKED",
  passed: failures.length === 0,
  productionReady: false,
  mobilePortalJourneyBuilt: manifest.mobilePortalJourneyBuilt === true,
  emailFirstExperienceBuilt: manifest.emailFirstExperienceBuilt === true,
  whatsappDisabled: manifest.whatsappDisabled === true,
  smsDisabled: manifest.smsDisabled === true,
  bulkWhatsAppBlocked: manifest.bulkWhatsAppBlocked === true,
  routineCommsEmailOnly: manifest.routineCommsEmailOnly === true,
  candidateSafeJourneyGuidanceBuilt: manifest.candidateSafeJourneyGuidanceBuilt === true,
  failures,
  nextAction: failures.length === 0
    ? "Continue with the communication centre, email templates, provider sandbox evidence and message audit ledger."
    : "Repair the N04 email/portal-only channel boundary and rerun proof.",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/n04", { recursive: true });
fs.writeFileSync("reports/n04/n04-candidate-05-proof-latest.json", JSON.stringify(report, null, 2) + "\n");

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
console.log("N04-CANDIDATE-05 email/portal-only proof passed.");
