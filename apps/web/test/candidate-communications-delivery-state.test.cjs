const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../../..");
const route = fs.readFileSync(path.join(root, "apps/web/src/app/api/personal-jobs/apply-now/route.ts"), "utf8");
const messages = fs.readFileSync(path.join(root, "apps/web/src/app/candidate/messages/page.tsx"), "utf8");
const support = fs.readFileSync(path.join(root, "apps/web/src/app/candidate/support/page.tsx"), "utf8");

test("support request creation and updates also append private portal-ledger records", () => {
  assert.match(route, /function recordSupportPortalMessage\(/);
  assert.match(route, /recordSupportPortalMessage\(store, requestRecord, "REQUEST_CREATED"/);
  assert.match(route, /recordSupportPortalMessage\(store, updated, eventType, updateText, now\)/);
  assert.match(route, /deliveryState: "PORTAL_LEDGER_ONLY"/);
  assert.match(route, /supportRequestId: request\.requestId/);
  assert.match(route, /store\.messageLedger = \[message, \...\(store\.messageLedger \|\| \[\]\)\]\.slice\(0, 1000\)/);
});

test("email provider readiness is explicit and cannot imply sending or delivery", () => {
  assert.match(route, /process\.env\.EMAIL_PROVIDER \|\| "no_send"/);
  assert.match(route, /sendEnabled: false/);
  assert.match(route, /DISABLED_NO_SEND_MODE/);
  assert.match(route, /PROVIDER_CREDENTIALS_PRESENT_BUT_SENDING_NOT_IMPLEMENTED/);
  assert.match(route, /emailNotificationReadiness: emailNotificationReadiness\(\)/);
  assert.match(route, /No external notification was sent/);
});

test("candidate communication log displays delivery state and links support queue", () => {
  assert.match(messages, /deliveryState\?:string/);
  assert.match(messages, /x\.deliveryState\|\|"DELIVERY_STATE_NOT_RECORDED"/);
  assert.match(messages, /Linked support request/);
  assert.match(messages, /href="\/candidate\/support"/);
  assert.match(messages, /Saving here does not send an email/);
  assert.match(support, /No email, SMS, WhatsApp or operator notification is sent/);
});
