const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const queue = fs.readFileSync(path.join(root, "src/app/api/founder/commands/queue/route.ts"), "utf8");
const page = fs.readFileSync(path.join(root, "src/app/founder/control-plane/command-review/page.tsx"), "utf8");

test("founder command queue is authenticated and uses private no-store responses", () => {
  assert.match(queue, /requireFounderAccess\(\)/);
  assert.match(queue, /founderAccessDenied\(access\)/);
  assert.match(queue, /founderPrivateJson/);
  assert.match(queue, /cache: "no-store"/);
  assert.match(queue, /limit=100/);
});

test("founder command review records separate-duty decisions without executing commands and displays audit references", () => {
  assert.match(page, /\/api\/founder\/commands\/queue/);
  assert.match(page, /audit_ref/);
  assert.match(page, /evidence_ref/);
  assert.match(page, /A decision is not execution/);
  assert.match(page, /will not execute the command/);
});
