import test from "node:test";
import assert from "node:assert/strict";
import { chooseMobileChannel, defaultMobileNotificationPreference } from "./mobile-notification-preferences";
import { assertChannelAllowed, assertCandidateStatusIsSafe } from "./mobile-policy";

test("defaults keep email primary and optional channels restricted", () => {
  const preference = defaultMobileNotificationPreference("synthetic-candidate");
  assert.equal(preference.emailEnabled, true);
  assert.equal(preference.whatsappUrgentOnly, true);
  assert.equal(preference.smsBackupEnabled, false);
  assert.equal(chooseMobileChannel(preference, "routine"), "email");
  assert.equal(chooseMobileChannel(preference, "backup"), "email");
});

test("WhatsApp is never selected for routine messages", () => {
  const preference = { ...defaultMobileNotificationPreference("synthetic-candidate"), emailEnabled: false };
  assert.equal(chooseMobileChannel(preference, "routine"), "portal");
  assert.throws(() => assertChannelAllowed("whatsapp_urgent", "routine"), /WHATSAPP_URGENT_ONLY/);
});

test("SMS cannot replace routine email-first communication", () => {
  assert.throws(() => assertChannelAllowed("sms_backup", "routine"), /SMS_BACKUP_ONLY/);
  const preference = { ...defaultMobileNotificationPreference("synthetic-candidate"), smsBackupEnabled: true };
  assert.equal(chooseMobileChannel(preference, "backup"), "sms_backup");
});

test("unverified official outcome wording is rejected", () => {
  assert.throws(() => assertCandidateStatusIsSafe("Your funding is guaranteed"), /NO_FAKE_STATUS/);
  assert.doesNotThrow(() => assertCandidateStatusIsSafe("Your application is prepared for review"));
});
