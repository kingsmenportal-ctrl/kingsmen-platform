const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../../..");
const route = fs.readFileSync(path.join(root, "apps/web/src/app/api/personal-jobs/apply-now/route.ts"), "utf8");
const supportPage = fs.readFileSync(path.join(root, "apps/web/src/app/candidate/support/page.tsx"), "utf8");
const messagesPage = fs.readFileSync(path.join(root, "apps/web/src/app/candidate/messages/page.tsx"), "utf8");

test("support request lifecycle is represented in the candidate message ledger", () => {
  assert.match(route, /function recordSupportPortalMessage\(/);
  assert.match(route, /deliveryState: "PORTAL_LEDGER_ONLY"/);
  assert.match(route, /recordSupportPortalMessage\(store, requestRecord, "REQUEST_CREATED"/);
  assert.match(route, /recordSupportPortalMessage\(store, updated, eventType, updateText, now\)/);
  assert.match(route, /supportRequestId: request\.requestId/);
});

test("support email draft is generated from the candidate's own request and explicitly not sent", () => {
  assert.match(route, /action === "prepareSupportEmailDraft"/);
  assert.match(route, /deliveryState: "EMAIL_DRAFT_READY"/);
  assert.match(route, /status: "DRAFT"/);
  assert.match(route, /No email provider was called and nothing was sent/);
  assert.match(route, /Request reference: \\?\$\{request\.requestId\}/);
  assert.match(route, /emailNotificationReadiness\(\)/);
  assert.match(supportPage, /Prepare email draft/);
  assert.match(messagesPage, /Draft only — not sent/);
  assert.match(messagesPage, /Copy draft text/);
});

test("email provider readiness never reports a successful send or delivery without a provider implementation", () => {
  assert.match(route, /sendEnabled: false/);
  assert.match(route, /PROVIDER_CREDENTIALS_PRESENT_BUT_SENDING_NOT_IMPLEMENTED/);
  assert.match(route, /PROVIDER_CONFIGURATION_INCOMPLETE/);
  assert.match(route, /EMAIL_PROVIDER_ENDPOINT/);
  assert.match(route, /EMAIL_PROVIDER_SECRET/);
  assert.doesNotMatch(route, /status: "DELIVERED"/);
});
