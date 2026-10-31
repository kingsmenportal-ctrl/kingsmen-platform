import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const leadTypes = read("apps/api/src/public-website/public-website-types.ts");
const leadIntake = read("apps/api/src/public-website/lead-intake.ts");
const candidateChannelPolicy = read("packages/backend/src/n04/candidate-channel-policy.ts");
const n04DbPolicy = read("packages/db/src/n04-mobile-comms-policy.ts");
const n09Policy = read("packages/db/src/n09-channel-policy.ts");
const mobilePolicy = read("apps/api/src/candidate-mobile/mobile-policy.ts");
const mobilePreferences = read("apps/api/src/candidate-mobile/mobile-notification-preferences.ts");
const communicationPolicy = read("apps/api/src/communications/communication-policy.ts");
const communicationsBoundary = read("apps/api/src/communications/communications-proof-boundary.ts");
const urgentEscalation = read("apps/api/src/communications/urgent-escalation.ts");
const alertRouter = read("apps/api/src/observability/alert-router.ts");
const reportDelivery = read("apps/api/src/observability/report-delivery.ts");
const n04Contract = read("packages/contracts/src/n04-communication-channel-contract.ts");
const communicationsManifest = JSON.parse(read("manifests/communications/communications-proof-v1.json"));
const n04Manifest = JSON.parse(read("manifests/n04/n04-candidate-05-mobile-email-first-urgent-whatsapp.json"));
const handoff = read("apps/api/src/candidate-mobile/public-to-portal-handoff.ts");
const templates = read("apps/api/src/communications/template-registry.ts");
const n09Seed = read("db/seeds/n09_communications_seed.sql");
const n19Seed = read("db/seeds/n19_candidate_mobile_seed.sql");
const n04Seed = read("db/seeds/n04_runtime_config_seed.sql");
const n09InternalRouting = n09Policy;

assert.doesNotMatch(leadTypes, /consentWhatsappUrgentOnly/);
assert.doesNotMatch(leadIntake, /WHATSAPP_URGENT_ONLY_CONSENT_REQUIRED|consentWhatsappUrgentOnly/);
assert.match(leadIntake, /whatsappBoundary: "DISABLED"/);
assert.match(leadIntake, /smsBoundary: "DISABLED"/);
assert.match(leadIntake, /whatsapp: false/);
assert.match(leadIntake, /sms: false/);

assert.match(candidateChannelPolicy, /WHATSAPP_DISABLED_BY_CURRENT_CHANNEL_POLICY/);
assert.match(candidateChannelPolicy, /SMS_DISABLED_BY_CURRENT_CHANNEL_POLICY/);
assert.match(n04Contract, /whatsappEnabled: false/);
assert.match(n04Contract, /smsEnabled: false/);
assert.match(n04DbPolicy, /whatsappDisabled: true/);
assert.match(n04DbPolicy, /smsDisabled: true/);
assert.match(n09Policy, /N09_WHATSAPP_DISABLED/);
assert.match(n09Policy, /N09_SMS_DISABLED/);

assert.match(mobilePolicy, /WHATSAPP_DISABLED_BY_CURRENT_CHANNEL_POLICY/);
assert.match(mobilePolicy, /SMS_DISABLED_BY_CURRENT_CHANNEL_POLICY/);
assert.match(mobilePreferences, /whatsappUrgentOnly: false/);
assert.match(mobilePreferences, /smsBackupEnabled: false/);

assert.match(communicationPolicy, /COMMUNICATION_DOCTRINE.WHATSAPP_DISABLED/);
assert.match(communicationPolicy, /COMMUNICATION_DOCTRINE.SMS_DISABLED/);
assert.match(communicationsBoundary, /reason: "whatsappDisabled"/);
assert.match(communicationsBoundary, /reason: "smsDisabled"/);
assert.match(urgentEscalation, /WHATSAPP_DISABLED_BY_CURRENT_CHANNEL_POLICY/);
assert.match(alertRouter, /targetChannel: urgent ? "CONTROL_PLANE" : "EMAIL"/);
assert.doesNotMatch(alertRouter, /targetChannel: urgent ? "WHATSAPP_URGENT"/);
assert.match(reportDelivery, /REPORT_DELIVERY_WHATSAPP_DISABLED/);
assert.match(reportDelivery, /REPORT_DELIVERY_SMS_DISABLED/);
assert.doesNotMatch(handoff, /sms_backup/);
assert.match(templates, /templateName: "Retired WhatsApp template — disabled"/);
assert.match(templates, /isActive: false/);
assert.match(n09Seed, /candidate\.urgent\.whatsapp[^\n]*false/);
assert.match(n09Seed, /candidate\.sms\.backup[^\n]*false/);
assert.match(n09Seed, /is_active = excluded\.is_active/);
assert.match(n19Seed, /MOBILE_WHATSAPP_URGENT_ONLY', '"false"'/);
assert.match(n19Seed, /MOBILE_SMS_BACKUP_ONLY', '"false"'/);
assert.match(n04Seed, /CANDIDATE_WHATSAPP_URGENT_ONLY', '{"value": false}'/);
assert.match(n04Seed, /CANDIDATE_SMS_BACKUP_ONLY', '{"value": false}'/);
assert.match(n09InternalRouting, /return 'control_plane'/);

assert.equal(communicationsManifest.whatsappEnabled, undefined);
assert.equal(communicationsManifest.whatsappDisabled, true);
assert.equal(communicationsManifest.smsDisabled, true);
assert.equal(communicationsManifest.whatsappUrgentOnly, false);
assert.equal(communicationsManifest.smsBackupOnly, false);
assert.equal(n04Manifest.whatsappDisabled, true);
assert.equal(n04Manifest.smsDisabled, true);
assert.equal(n04Manifest.whatsappEnabled, false);
assert.equal(n04Manifest.smsEnabled, false);

console.log("Disabled candidate-channel regression checks passed: email and secure portal only.");
