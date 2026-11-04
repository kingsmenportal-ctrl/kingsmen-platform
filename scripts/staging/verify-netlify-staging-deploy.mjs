#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const reportPath = join(root, "reports/staging/netlify-deploy-evidence.json");
const siteId = process.env.NETLIFY_SITE_ID || "";
const token = process.env.NETLIFY_AUTH_TOKEN || "";
const sourceSha = process.env.KINGSMEN_NETLIFY_SOURCE_SHA || "";
const siteUrl = (process.env.KINGSMEN_NETLIFY_SITE_URL || "").replace(/\/$/, "");
const startedAtPath = join(root, "reports/staging/netlify-deploy-started-at.txt");
const failures = [];
const routeResults = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}
function writeReport(report) {
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function fetchJson(url, headers) {
  const response = await fetch(url, { headers, cache: "no-store" });
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch { throw new Error(`Netlify API returned non-JSON HTTP ${response.status}.`); }
  if (!response.ok) throw new Error(`Netlify API HTTP ${response.status}: ${body.message || body.error || "request failed"}`);
  return body;
}

async function main() {
  assert(Boolean(token), "NETLIFY_AUTH_TOKEN is missing; no deployment can be verified.");
  assert(siteId === "fb27d0db-b116-4890-8f7f-14e654c27dbc", "Unexpected Netlify site ID.");
  assert(/^[0-9a-f]{40}$/i.test(sourceSha), "GITHUB_SHA source commit is missing or invalid.");
  assert(Boolean(siteUrl), "Staging site URL is missing.");
  let startedAt = "";
  try { startedAt = readFileSync(startedAtPath, "utf8").trim(); }
  catch { failures.push("Deployment start timestamp is missing."); }
  const startedMs = Date.parse(startedAt);
  assert(Number.isFinite(startedMs), "Deployment start timestamp is invalid.");
  if (failures.length) {
    writeReport({ schema: "kingsmen.netlify.staging-deploy.v1", state: "BLOCKED", source_sha: sourceSha || null, site_id: siteId || null, failures, mutation_scope: "staging deploy only" });
    throw new Error(failures.join(" "));
  }

  const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };
  let deployment = null;
  let lastDeploys = [];
  for (let attempt = 0; attempt < 18; attempt += 1) {
    const response = await fetchJson(`https://api.netlify.com/api/v1/sites/${siteId}/deploys?per_page=20`, headers);
    lastDeploys = Array.isArray(response) ? response : Array.isArray(response.deploys) ? response.deploys : [];
    deployment = lastDeploys.find((item) => {
      const created = Date.parse(item.created_at || item.createdAt || "");
      const message = [item.title, item.commit_message, item.message].filter(Boolean).join(" ");
      return created >= startedMs - 30_000 && message.includes(sourceSha);
    }) || null;
    if (deployment && ["ready", "error", "failed"].includes(String(deployment.state || "").toLowerCase())) break;
    await sleep(10_000);
  }

  assert(Boolean(deployment), "No staging deploy record matching the workflow source SHA and deployment start time was found.");
  if (deployment) {
    const state = String(deployment.state || "").toLowerCase();
    assert(state === "ready", `Netlify deploy state is ${state || "unknown"}, not ready.`);
    assert(Boolean(deployment.id), "The matching Netlify deploy record has no deploy ID.");
  }

  if (deployment && String(deployment.state || "").toLowerCase() === "ready") {
    const paths = ["/", "/packages/", "/candidate/login", "/candidate/workbench", "/candidate/identity-review"];
    for (const path of paths) {
      let status = 0;
      let error = null;
      try {
        const response = await fetch(`${siteUrl}${path}`, { redirect: "follow", cache: "no-store" });
        status = response.status;
        if (!response.ok) error = `HTTP ${response.status}`;
      } catch (caught) {
        error = caught instanceof Error ? caught.message : "request failed";
      }
      routeResults.push({ path, status, passed: status === 200, error });
      if (status !== 200) failures.push(`Staging route smoke failed for ${path}: ${error || status}`);
    }
  }

  const report = {
    schema: "kingsmen.netlify.staging-deploy.v1",
    state: failures.length === 0 ? "DEPLOYED_AND_SMOKE_PASSED" : "DEPLOYED_BUT_VERIFICATION_FAILED",
    source_sha: sourceSha,
    site_id: siteId,
    site_url: siteUrl,
    deploy_id: deployment?.id || null,
    deploy_state: deployment?.state || null,
    deploy_created_at: deployment?.created_at || null,
    deploy_url: deployment?.deploy_ssl_url || deployment?.deploy_url || deployment?.ssl_url || deployment?.url || null,
    deploy_message: [deployment?.title, deployment?.commit_message, deployment?.message].filter(Boolean).join(" "),
    matched_by: "Netlify deploy message contains the exact GitHub source SHA",
    route_smoke: routeResults,
    failures,
    authenticated_candidate_tests: "not performed by this anonymous route smoke",
    generated_at: new Date().toISOString()
  };
  writeReport(report);
  console.log(JSON.stringify(report, null, 2));
  if (failures.length) process.exitCode = 1;
}

main().catch((error) => {
  const report = {
    schema: "kingsmen.netlify.staging-deploy.v1",
    state: "FAILED",
    source_sha: sourceSha || null,
    site_id: siteId || null,
    failures: [error instanceof Error ? error.message : "Staging deploy verification failed."],
    generated_at: new Date().toISOString()
  };
  writeReport(report);
  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 1;
});
