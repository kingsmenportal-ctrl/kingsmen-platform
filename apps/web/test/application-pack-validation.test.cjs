const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const route = fs.readFileSync(path.resolve(__dirname, "../src/app/api/personal-jobs/apply-pack-builder/build/route.ts"), "utf8");

test("apply-pack build validates output shape and declared pack count before returning data", () => {
  assert.match(route, /Buffer\.byteLength\(raw, "utf8"\) > 20 \* 1024 \* 1024/);
  assert.match(route, /output\?\.status !== "COMPLETED"/);
  assert.match(route, /packs\.length !== Number\(output\.applicationPackCount\)/);
});

test("each application pack must have a unique identifier and supported review status", () => {
  assert.match(route, /seenPackIds\.has\(pack\.packId\)/);
  assert.match(route, /READY_FOR_HUMAN_REVIEW.*NEEDS_PROFILE_COMPLETION/);
});

test("pack validation rejects missing employer/source and incomplete draft content", () => {
  assert.match(route, /new URL\(source\)\.protocol === "https:"/);
  assert.match(route, /missing vacancy title or employer/);
  assert.match(route, /no usable motivation draft/);
  assert.match(route, /missing CV focus or manual application steps/);
});

test("document checklist never claims canonical files or authenticity have been verified", () => {
  assert.match(route, /CANDIDATE_CONFIRMATION_REQUIRED/);
  assert.match(route, /REQUIREMENT_NOT_CONFIRMED/);
  assert.match(route, /documentAvailabilityVerified: false/);
  assert.match(route, /documentAuthenticityVerified: false/);
  assert.match(route, /applicationSubmitted: false/);
});

test("unsafe automation flags fail the pack validation", () => {
  assert.match(route, /boundary\.sendsApplications \|\| boundary\.sendsEmail \|\| boundary\.sendsWhatsApp/);
  assert.match(route, /violates the manual-review-only safety boundary/);
});
