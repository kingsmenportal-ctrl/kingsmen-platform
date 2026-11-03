import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const applications = read("apps/web/src/app/candidate/applications/page.tsx");
const opportunities = read("apps/web/src/app/candidate/opportunity-matches/page.tsx");
const messages = read("apps/web/src/app/candidate/messages/page.tsx");
const communicationPolicy = read("apps/api/src/communications/communication-policy.ts");
const communicationBoundary = read("apps/api/src/communications/communications-proof-boundary.ts");

const checks = [
  ["application tracker does not link candidates to provider application URLs",
    !/href=\{target\.provider_application_url\}|href=\{opportunity\?\.official_url\}|href=\{item\.official_source_url\}/.test(applications)],
  ["application tracker does not render external provider-source links",
    !/target="_blank"|Open official provider page|Open provider source|official confirmation URL/.test(applications)],
  ["candidate checklist does not ask candidates to enter provider source URLs",
    !/Optional official HTTPS source URL|Official source URL for checklist item/.test(applications)],
  ["opportunity discovery does not expose or link the official provider URL",
    !/href=\{item\.official_link\}|Canonical official URL|Open official opportunity/.test(opportunities)],
  ["candidate UI does not render raw provider URLs in visible application content",
    !/\{target\.provider_application_url\}|\{item\.official_link\}|\{opportunity\?\.official_url\}|\{item\.official_source_url\}/.test(applications + opportunities)],
  ["opportunity deadline exceptions are explained and handled within Kingsmen",
    opportunities.includes("Kingsmen is checking the current provider window") &&
    opportunities.includes("Kingsmen must verify the deadline before preparation can proceed")],
  ["candidate messages state that email and portal inbox are the enabled channels",
    messages.includes("Email is the enabled external communication channel") &&
    messages.includes("Kingsmen portal inbox")],
  ["candidate messages explicitly state WhatsApp and SMS are disabled",
    messages.includes("WhatsApp and SMS notifications are currently disabled")],
  ["runtime policy rejects WhatsApp for all candidate notification purposes",
    communicationPolicy.includes("WHATSAPP_DISABLED") &&
    /draft\.channel === "WHATSAPP_URGENT_ONLY"[\s\S]*?allowed: false/.test(communicationPolicy)],
  ["runtime policy rejects SMS for all candidate notification purposes",
    communicationPolicy.includes("SMS_DISABLED") &&
    /draft\.channel === "SMS_BACKUP_ONLY"[\s\S]*?allowed: false/.test(communicationPolicy)],
  ["communications proof boundary records both channels as disabled",
    communicationBoundary.includes("whatsappDisabled: true") &&
    communicationBoundary.includes("smsDisabled: true") &&
    communicationBoundary.includes('reason: "whatsappDisabled"') &&
    communicationBoundary.includes('reason: "smsDisabled"')]
];

for (const [name, passed] of checks) {
  process.stdout.write((passed ? "PASS " : "FAIL ") + name + "\n");
}
assert.ok(checks.every(([, passed]) => passed), "Candidate internal-only journey contract failed.");
process.stdout.write(`Candidate internal-only journey contract: ${checks.length}/${checks.length} passed\n`);
