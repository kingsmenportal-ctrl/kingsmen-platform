import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => readFile(resolve(root, name), "utf8");

test("candidate workspace has responsive accessible shell and demo disclosure", async () => {
  const html = await read("index.html");
  assert.match(html, /name="viewport"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /DEMO MODE/);
  assert.match(html, /No real account, provider submission, payment or verified outcome/);
  assert.match(html, /styles\.css/);
  assert.match(html, /app\.js/);
});

test("workflow implements pathways, saving, preparation and document readiness", async () => {
  const js = await read("app.js");
  for (const marker of ["higher-education", "tvet", "seta", "employment", "entrepreneurship", "unconfirmed-sixth", "data-save", "data-application", "data-document", "candidate-reported", "localStorage", "function profileView()", "profile-form", "Profile readiness"]) {
    assert.ok(js.includes(marker), `expected workflow marker: ${marker}`);
  }
  assert.match(js, /not submitted/i);
  assert.match(js, /demo profile saved in this browser/i);
  assert.match(js, /profile-form/);
  assert.match(js, /not a verified live listing/i);
});

test("no client-side privileged secret or production credential is embedded", async () => {
  const files = [await read("index.html"), await read("app.js"), await read("styles.css")].join("\n");
  assert.doesNotMatch(files, /service_role|SUPABASE_SERVICE_ROLE_KEY|sk-[A-Za-z0-9]{20,}/i);
});

test("canonical sixth pathway is explicitly blocked pending source confirmation", async () => {
  const js = await read("app.js");
  assert.match(js, /Sixth pathway — name to confirm/);
  assert.match(js, /Canonical name not yet confirmed/);
});
test("account entry point uses Supabase Auth without claiming candidate identity", async () => {
  const html = await read("index.html");
  const js = await read("app.js");
  const client = await read("supabase-client.js");
  assert.match(html, /data-view="account"/);
  assert.match(html, /supabase-js@2/);
  assert.match(client, /sb_publishable_/);
  assert.doesNotMatch(client, /service_role|SUPABASE_SERVICE_ROLE_KEY/i);
  assert.match(js, /signInWithPassword/);
  assert.match(js, /resetPasswordForEmail/);
  assert.match(js, /candidate identity has not been linked or verified/i);
  assert.match(js, /onAuthStateChange/);
});
