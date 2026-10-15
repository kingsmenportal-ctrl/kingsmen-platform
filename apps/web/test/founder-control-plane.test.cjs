const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const page = fs.readFileSync(path.join(root, "src/app/founder/control-plane/page.tsx"), "utf8");
const health = fs.readFileSync(path.join(root, "src/app/api/founder/control-plane/health/route.ts"), "utf8");

test("founder control plane links distinct operations and proof surfaces", () => {
  assert.match(page, /\/founder\/control-plane\/commands\//);
  assert.match(page, /\/founder\/proof-centre\//);
  assert.match(page, /\/founder\/master-index\//);
  assert.match(page, /\/founder\/stop-selling\//);
});

test("founder control plane labels health response and production readiness truthfully", () => {
  assert.match(page, /A route response is not proof of production health/);
  assert.match(page, /productionReady === true \? "Declared ready" : "Not verified"/);
  assert.match(page, /does not execute operational commands/);
  assert.match(page, /Runtime evidence, authenticated founder-role enforcement, connected telemetry and staging acceptance remain separate gates/);
});

test("founder dashboard only reads health shell and does not invoke command mutation", () => {
  assert.match(page, /fetch\("\/api\/founder\/control-plane\/health", \{ cache: "no-store", credentials: "same-origin" \}\)/);
  assert.doesNotMatch(page, /\/api\/founder\/commands\/execute/);
  assert.match(health, /productionReady: false/);
  assert.match(health, /serviceRoleVisibleToBrowser: false/);
});
