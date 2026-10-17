#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const root = process.cwd();
const reportPath = join(root, "reports/n05/n05-quarantine-scan-validation-latest.json");
const files = {
  migration: "db/migrations/0005_n05_quarantine_scan_reconciliation.sql",
  complete: "apps/web/src/app/api/candidate/documents/complete/route.ts",
  read: "apps/web/src/app/api/candidate/documents/read-url/route.ts",
  status: "apps/web/src/app/api/candidate/documents/status/route.ts",
  worker: "apps/web/src/app/api/internal/documents/scan-next/route.ts",
  reconcile: "apps/web/src/app/api/internal/documents/reconcile/route.ts",
  docs: "docs/api/N05_QUARANTINE_MALWARE_SCAN_RECONCILIATION.md"
};
const source = {};
const checks = [];
function check(name, passed, detail = "") {
  checks.push({ name, passed: Boolean(passed), detail });
}
for (const [key, relative] of Object.entries(files)) {
  const full = join(root, relative);
  const exists = existsSync(full);
  check(`file_exists:${relative}`, exists, relative);
  if (exists) source[key] = readFileSync(full, "utf8");
}
function has(key, token, label = token) {
  check(`${key}:contains:${label}`, source[key]?.includes(token), `${files[key]} :: ${label}`);
}
function notHas(key, token, label = token) {
  check(`${key}:excludes:${label}`, !source[key]?.includes(token), `${files[key]} :: ${label}`);
}

// Schema: durable queue, bounded retries, audit events, and service-only RLS.
has("migration", "CREATE TABLE IF NOT EXISTS public.document_scan_jobs", "durable scan queue");
has("migration", "max_attempts BETWEEN 1 AND 10", "bounded scan retry policy");
has("migration", "idx_document_scan_jobs_one_live_job", "one live scan job per document");
has("migration", "'QUARANTINED'", "quarantine status");
has("migration", "malware_scan_status IN ('PENDING', 'SCANNING', 'CLEAN', 'INFECTED', 'ERROR', 'NOT_REQUIRED')", "explicit malware states");
has("migration", "TO service_role FOR ALL USING (true) WITH CHECK (true)", "N05 RLS policy audience is service_role");
has("migration", "QUARANTINE_CLEANUP_PENDING", "cleanup reconciliation audit type");
has("migration", "UPDATE public.document_files", "legacy non-clean rows are quarantined");

// Completion cannot release the object; it persists quarantine + a durable queue job.
has("complete", 'document_status: "QUARANTINED"', "completed upload remains quarantined");
has("complete", 'malware_scan_status: "PENDING"', "pending scan status");
has("complete", "/rest/v1/document_scan_jobs?on_conflict=job_ref", "durable idempotent scan job");
has("complete", "MALWARE_SCAN_QUEUED", "scan queue audit");
has("complete", "status: 202", "asynchronous scan response");
has("complete", "RECONCILIATION_REQUIRED", "queue failure remains recoverable");

// Download release is double-gated by persisted scan result and release state.
has("read", 'document.malware_scan_status !== "CLEAN" || document.document_status !== "READY"', "fail-closed download gate");
has("read", "DOCUMENT_QUARANTINED", "quarantine response");
has("read", "expiresIn: 600", "short-lived owner read URL");
has("status", "malware_scan_status", "candidate sees scan status");
has("status", "downloadRequiresMalwareScanClean: true", "readiness contract disclosed");

// Worker auth, real scanner adapter, checksum verification, retry/dead-letter and release ordering.
has("worker", "N05_SCAN_WORKER_TOKEN", "server-to-server worker authentication");
has("worker", "N05_MALWARE_SCANNER_URL", "scanner endpoint must be configured");
has("worker", "N05_MALWARE_SCANNER_TOKEN", "scanner token remains server-side");
has("worker", "MALWARE_SCANNER_NOT_CONFIGURED", "no scanner means no job is claimed");
has("worker", "expiresIn: 300", "five-minute private scanner URL");
has("worker", '["CLEAN", "INFECTED", "ERROR"]', "strict scanner result contract");
has("worker", "SCANNER_CHECKSUM_MISMATCH", "scanner digest must match stored checksum");
has("worker", 'status: "DEAD_LETTER"', "bounded retries end in dead letter");
has("worker", 'document_status: "READY"', "only clean scan can release");
has("worker", 'document_status: "REJECTED"', "infected document rejected");
has("worker", "QUARANTINE_CLEANUP_PENDING", "failed infected object deletion is recorded");
has("worker", "productionReady: false", "worker does not claim production readiness");

// Reconciliation is bounded, authenticated, and never self-asserts clean status.
has("reconcile", "STALE_SCAN_LEASE_RECOVERED", "stale worker lease recovery");
has("reconcile", "DOC-RECONCILE-", "missing scan job reconstruction");
has("reconcile", "QUARANTINE_CLEANUP_COMPLETED", "infected object cleanup confirmation");
has("reconcile", "malware_scan_attempts", "bounded retry history is respected");
has("reconcile", "never marks a document CLEAN", "reconciliation never releases documents");
has("docs", "No scanner vendor or working scanner is assumed", "real provider is an external deployment prerequisite");
notHas("worker", "SUPABASE_SERVICE_ROLE_KEY =", "no hardcoded service-role secret");
notHas("reconcile", "SUPABASE_SERVICE_ROLE_KEY =", "no hardcoded service-role secret");

const failed = checks.filter((item) => !item.passed);
const report = {
  schema: "kingsmen.n05.quarantine-scan-static-validation.v1",
  module: "N05 Document Quarantine, Malware Scanning and Reconciliation",
  status: failed.length ? "FAILED" : "STATIC_GUARDS_PASSED",
  passed: failed.length === 0,
  productionReady: false,
  evidenceType: "static source-contract validation only; not a build, migration execution, scanner run, or staging proof",
  generatedAtIso: new Date().toISOString(),
  summary: { checks: checks.length, failed: failed.length },
  failedChecks: failed,
  checks,
  blockers: [
    "Run the web TypeScript/build checks.",
    "Apply migration 0005 in an approved staging database.",
    "Configure and validate a real HTTPS malware scanner adapter and server-side secrets.",
    "Run authenticated staging tests for clean/infected fixtures, retries, cleanup and candidate isolation."
  ]
};
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
process.exitCode = failed.length ? 1 : 0;
