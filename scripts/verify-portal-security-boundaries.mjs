#!/usr/bin/env node
/**
 * Static security-boundary checks for the Next.js portal.
 * These checks do not replace runtime security testing or RLS verification.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const srcRoot = path.join(root, "apps", "web", "src");
const errors = [];
const visited = [];
async function walk(dir) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); }
  catch (error) { errors.push(`Cannot inspect ${dir}: ${error.message}`); return; }
  for (const entry of entries) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(file);
    else if (/\.(?:[cm]?[jt]sx?)$/.test(entry.name)) visited.push(file);
  }
}
function check(condition, message) { if (!condition) errors.push(message); }

await walk(srcRoot);
const clientSecretFiles = [];
for (const file of visited) {
  const content = await readFile(file, "utf8");
  if (/^\s*["']use client["'];?/m.test(content) &&
      /SUPABASE_SERVICE_ROLE_KEY|service_role/i.test(content)) {
    clientSecretFiles.push(path.relative(root, file));
  }
}
check(clientSecretFiles.length === 0,
  `Server credential reference found in client module(s): ${clientSecretFiles.join(", ")}`);

const nextConfigPath = path.join(root, "apps", "web", "next.config.mjs");
const nextConfig = await readFile(nextConfigPath, "utf8");
check(!/KINGSMEN_PUBLIC_[A-Z0-9_]+\s*:\s*process\.env\.SUPABASE_SERVICE_ROLE_KEY/.test(nextConfig),
  "Next config exposes SUPABASE_SERVICE_ROLE_KEY through a public build-time variable.");
check(!/SUPABASE_SERVICE_ROLE_KEY/.test(nextConfig),
  "Next config must not reference SUPABASE_SERVICE_ROLE_KEY.");

const itnPath = path.join(srcRoot, "app", "api", "payments", "payfast", "itn", "route.ts");
const itn = await readFile(itnPath, "utf8");
for (const [pattern, label] of [
  [/timingSafeEqual/, "timing-safe signature comparison"],
  [/PAYFAST_ITN_ALLOWED_IPS/, "configured ITN source-IP allowlist"],
  [/eng\/query\/validate/, "server-side PayFast ITN validation endpoint"],
  [/process_payfast_itn/, "atomic database reconciliation RPC"],
  [/SUPABASE_SERVICE_ROLE_KEY/, "server-only service-role credential gate"],
  [/AbortSignal\.timeout/, "bounded provider-validation timeout"],
]) check(pattern.test(itn), `PayFast ITN route is missing expected guard: ${label}`);
check(/PAYFAST_ENABLE_LIVE_PAYMENTS/.test(itn) || /PAYFAST_RUNTIME_NOT_CONFIGURED/.test(itn),
  "PayFast ITN route should fail closed when runtime configuration is missing.");

if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exit(1);
}
console.log(`Portal security-boundary static checks passed across ${visited.length} source files.`);
console.log("Verified client/server secret separation and PayFast ITN guard markers; runtime review remains required.");
