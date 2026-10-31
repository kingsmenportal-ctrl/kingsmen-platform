#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const path = "scripts/institutions/build-dhet-private-register-evidence-migration.mjs";
const source = fs.readFileSync(path, "utf8");
const required = [
  "DISCONTINUATION_REQUESTED_REVIEW",
  "REGISTRATION_IDENTIFIER_NOT_UNIQUE",
  "CANONICAL_IDENTITY_NOT_VERIFIED",
  "ALIAS_PROVIDER_KEY_NOT_RECONCILED",
  "CAMPUS_SITE_NOT_REVIEWED",
  "DHET_REGISTER_REGISTRATION_IDENTITY_CONFLICT",
  "DHET_REGISTER_REGISTRATION_STATUS_CONFLICT",
  "DHET_REGISTER_UNRESOLVED_RECORD_CONFLICT",
  "DHET_REGISTER_EXISTING_CANONICAL_IDENTITY_CONFLICT",
  "DHET_REGISTER_ROUTE_SAFETY_POSTFLIGHT_FAILED",
  "NOT_VERIFIED",
  "NOT_CONNECTED"
];
const missing = required.filter((token) => !source.includes(token));
assert.deepEqual(missing, [], "DHET evidence-migration builder must fail closed on unresolved identity, status, aliases, campus, and route state");
console.log("PASS DHET import-generator fail-closed source contract");
