import { timingSafeEqual, randomUUID } from "node:crypto";
import { getDocumentRuntimeConfig, supabaseAdminFetch } from "../../../../../lib/candidate-document-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ScanJob = {
  id: string;
  job_ref: string;
  document_id: string;
  candidate_id: string;
  storage_bucket: string;
  storage_path: string;
  checksum_sha256: string;
  file_size_bytes: number | string;
  mime_type: string;
  attempts: number;
  max_attempts: number;
};

type ScannerResult = {
  status?: string;
  provider?: string;
  version?: string;
  signature?: string;
  sha256?: string;
  errorCode?: string;
  message?: string;
};

function secureEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function jsonError(status: number, code: string, message: string) {
  return Response.json({ ok: false, productionReady: false, code, error: message }, {
    status,
    headers: { "cache-control": "no-store" }
  });
}

async function audit(
  cfg: NonNullable<ReturnType<typeof getDocumentRuntimeConfig>>,
  input: {
    documentId: string;
    jobRef: string;
    eventType: string;
    bucket: string;
    path: string;
    size: number;
    checksum: string;
    status: "OK" | "WARNING" | "FAILED";
    message: string;
    metadata?: Record<string, unknown>;
  }
): Promise<boolean> {
  const response = await supabaseAdminFetch(cfg, "/rest/v1/document_storage_events?on_conflict=event_ref", {
    method: "POST",
    headers: { "content-type": "application/json", Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify({
      document_id: input.documentId,
      event_ref: input.jobRef,
      event_type: input.eventType,
      storage_provider: "SUPABASE",
      storage_bucket: input.bucket,
      storage_path: input.path,
      file_size_bytes: input.size,
      checksum_sha256: input.checksum,
      status: input.status,
      message: input.message,
      metadata: input.metadata || {}
    })
  });
  return response.ok;
}

export async function POST(request: Request) {
  const workerToken = process.env.N05_SCAN_WORKER_TOKEN?.trim() || "";
  const authorization = request.headers.get("authorization") || "";
  const presented = authorization.match(/^Bearer\\s+(.+)$/i)?.[1]?.trim() || "";
  if (workerToken.length < 32 || !presented || !secureEqual(workerToken, presented)) {
    return jsonError(401, "SCAN_WORKER_AUTH_REQUIRED", "A configured server-to-server scan worker token is required.");
  }

  const scannerUrl = process.env.N05_MALWARE_SCANNER_URL?.trim() || "";
  const scannerToken = process.env.N05_MALWARE_SCANNER_TOKEN?.trim() || "";
  if (!scannerUrl || scannerToken.length < 16) {
    return jsonError(503, "MALWARE_SCANNER_NOT_CONFIGURED", "No approved malware scanner adapter is configured. Jobs remain queued and documents remain quarantined.");
  }

  let parsedScannerUrl: URL;
  try {
    parsedScannerUrl = new URL(scannerUrl);
  } catch {
    return jsonError(503, "MALWARE_SCANNER_CONFIG_INVALID", "The configured scanner endpoint is invalid.");
  }
  if (parsedScannerUrl.protocol !== "https:" && process.env.NODE_ENV === "production") {
    return jsonError(503, "MALWARE_SCANNER_TLS_REQUIRED", "The production scanner endpoint must use HTTPS.");
  }

  const cfg = getDocumentRuntimeConfig();
  if (!cfg) return jsonError(503, "DOCUMENT_STORE_NOT_CONFIGURED", "The server-side document store is not configured.");

  const now = new Date();
  const jobsUrl = new URL(`${cfg.url}/rest/v1/document_scan_jobs`);
  jobsUrl.searchParams.set("select", "id,job_ref,document_id,candidate_id,storage_bucket,storage_path,checksum_sha256,file_size_bytes,mime_type,attempts,max_attempts");
  jobsUrl.searchParams.set("status", "in.(QUEUED,RETRY_WAIT)");
  jobsUrl.searchParams.set("available_at", `lte.${now.toISOString()}`);
  jobsUrl.searchParams.set("order", "available_at.asc,created_at.asc");
  jobsUrl.searchParams.set("limit", "1");

  let jobsResponse: Response;
  try {
    jobsResponse = await supabaseAdminFetch(cfg, `/rest/v1/document_scan_jobs?${jobsUrl.searchParams.toString()}`);
  } catch {
    return jsonError(503, "SCAN_QUEUE_UNAVAILABLE", "The durable scan queue could not be reached.");
  }
  if (!jobsResponse.ok) return jsonError(502, "SCAN_QUEUE_QUERY_FAILED", "The durable scan queue query failed.");
  const jobs = await jobsResponse.json().catch(() => null) as ScanJob[] | null;
  const job = Array.isArray(jobs) ? jobs[0] : undefined;
  if (!job) {
    return Response.json({ ok: true, productionReady: false, noWork: true, message: "No due scan jobs." }, { headers: { "cache-control": "no-store" } });
  }

  const leaseToken = randomUUID();
  const claimUrl = new URL(`${cfg.url}/rest/v1/document_scan_jobs`);
  claimUrl.searchParams.set("id", `eq.${job.id}`);
  claimUrl.searchParams.set("status", "in.(QUEUED,RETRY_WAIT)");
  claimUrl.searchParams.set("available_at", `lte.${now.toISOString()}`);
  const claimResponse = await supabaseAdminFetch(cfg, `/rest/v1/document_scan_jobs?${claimUrl.searchParams.toString()}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({
      status: "LEASED",
      lease_token: leaseToken,
      leased_at: now.toISOString(),
      attempts: Number(job.attempts || 0) + 1,
      updated_at: now.toISOString()
    })
  });
  const claimed = claimResponse.ok ? await claimResponse.json().catch(() => []) as unknown[] : [];
  if (!claimResponse.ok) return jsonError(502, "SCAN_JOB_CLAIM_FAILED", "The scan job could not be claimed.");
  if (!Array.isArray(claimed) || claimed.length !== 1) {
    return Response.json({ ok: true, productionReady: false, claimed: false, retry: true }, { headers: { "cache-control": "no-store" } });
  }

  const attempts = Number(job.attempts || 0) + 1;
  const safeJobRef = String(job.job_ref).replace(/[^a-zA-Z0-9_-]/g, "_");
  const scanStarted = await audit(cfg, {
    documentId: job.document_id,
    jobRef: `DOC-SCAN-STARTED-${safeJobRef}-${attempts}`,
    eventType: "MALWARE_SCAN_STARTED",
    bucket: job.storage_bucket,
    path: job.storage_path,
    size: Number(job.file_size_bytes),
    checksum: job.checksum_sha256,
    status: "OK",
    message: "A server-side scan worker claimed this quarantined document.",
    metadata: { jobRef: job.job_ref, attempt: attempts }
  });
  if (!scanStarted) {
    return await retryOrDeadLetter(cfg, job, leaseToken, attempts, "SCAN_START_AUDIT_FAILED", "The scan-start audit could not be persisted; the document remains quarantined.");
  }

  // Signed object URL is short-lived and sent only to the configured server-side scanner.
  const encodedPath = job.storage_path.split("/").map(encodeURIComponent).join("/");
  const signResponse = await supabaseAdminFetch(cfg, `/storage/v1/object/sign/${encodeURIComponent(job.storage_bucket)}/${encodedPath}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ expiresIn: 300 })
  });
  const signed = signResponse.ok ? await signResponse.json().catch(() => null) as { signedURL?: string; signedUrl?: string; url?: string } | null : null;
  const rawSignedUrl = signed?.signedURL || signed?.signedUrl || signed?.url;
  if (!rawSignedUrl) {
    return await retryOrDeadLetter(cfg, job, leaseToken, attempts, "SIGNED_OBJECT_URL_FAILED", "Storage could not create a short-lived scanner URL.");
  }
  const objectUrl = rawSignedUrl.startsWith("http") ? rawSignedUrl : `${cfg.url}/storage/v1${rawSignedUrl.startsWith("/") ? rawSignedUrl : `/${rawSignedUrl}`}`;

  let scannerResponse: Response;
  try {
    scannerResponse = await fetch(new URL("/scan", parsedScannerUrl), {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${scannerToken}` },
      body: JSON.stringify({
        jobRef: job.job_ref,
        objectUrl,
        sha256: job.checksum_sha256,
        mimeType: job.mime_type,
        sizeBytes: Number(job.file_size_bytes)
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000)
    });
  } catch {
    return await retryOrDeadLetter(cfg, job, leaseToken, attempts, "SCANNER_UNAVAILABLE", "The configured scanner did not return a response.");
  }

  const result = scannerResponse.ok ? await scannerResponse.json().catch(() => null) as ScannerResult | null : null;
  if (!scannerResponse.ok || !result || !["CLEAN", "INFECTED", "ERROR"].includes(String(result.status))) {
    return await retryOrDeadLetter(cfg, job, leaseToken, attempts, "SCANNER_RESPONSE_INVALID", "Scanner response was unavailable or did not match the required result contract.");
  }

  if (String(result.sha256 || "").toLowerCase() !== String(job.checksum_sha256).toLowerCase()) {
    return await retryOrDeadLetter(cfg, job, leaseToken, attempts, "SCANNER_CHECKSUM_MISMATCH", "Scanner response digest did not match the persisted object checksum.");
  }

  const scannedAt = new Date().toISOString();
  const provider = String(result.provider || parsedScannerUrl.hostname).slice(0, 120);
  const version = String(result.version || "unspecified").slice(0, 120);

  if (result.status === "CLEAN") {
    const jobUpdate = await supabaseAdminFetch(cfg, `/rest/v1/document_scan_jobs?id=eq.${job.id}&lease_token=eq.${leaseToken}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ status: "CLEAN", scanner_provider: provider, scanner_version: version, scanner_result: "CLEAN", completed_at: scannedAt, lease_token: null, leased_at: null, updated_at: scannedAt, last_error_code: null, last_error_message: null })
    });
    if (!jobUpdate.ok) return jsonError(502, "SCAN_RESULT_PERSIST_FAILED", "The clean result could not be persisted to the durable queue; document remains quarantined.");
    const eventOk = await audit(cfg, {
      documentId: job.document_id,
      jobRef: `DOC-SCAN-CLEAN-${safeJobRef}`,
      eventType: "MALWARE_SCAN_CLEAN",
      bucket: job.storage_bucket,
      path: job.storage_path,
      size: Number(job.file_size_bytes),
      checksum: job.checksum_sha256,
      status: "OK",
      message: "Configured malware scanner returned CLEAN for the stored object checksum.",
      metadata: { jobRef: job.job_ref, provider, version, scannerSignaturePresent: Boolean(result.signature) }
    });
    if (!eventOk) return jsonError(502, "SCAN_RESULT_AUDIT_FAILED", "The clean scan result is persisted but its audit event failed; the document remains quarantined until reconciliation.");
    const docUpdate = await supabaseAdminFetch(cfg, `/rest/v1/document_files?id=eq.${job.document_id}&document_status=eq.QUARANTINED&malware_scan_status=in.(PENDING,ERROR,SCANNING)`, {
      method: "PATCH",
      headers: { "content-type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ malware_scan_status: "CLEAN", malware_scanned_at: scannedAt, malware_scanner_provider: provider, malware_scanner_version: version, document_status: "READY", updated_at: scannedAt, malware_scan_last_error: null, malware_scan_next_attempt_at: null })
    });
    if (!docUpdate.ok) return jsonError(502, "DOCUMENT_RELEASE_PERSIST_FAILED", "The clean scan is recorded but the document remains quarantined until release-state reconciliation succeeds.");
    return Response.json({ ok: true, productionReady: false, jobRef: job.job_ref, result: "CLEAN", documentReleased: true, scanner: { provider, version } }, { headers: { "cache-control": "no-store" } });
  }

  if (result.status === "INFECTED") {
    await supabaseAdminFetch(cfg, `/rest/v1/document_scan_jobs?id=eq.${job.id}&lease_token=eq.${leaseToken}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ status: "INFECTED", scanner_provider: provider, scanner_version: version, scanner_result: "INFECTED", completed_at: scannedAt, lease_token: null, leased_at: null, updated_at: scannedAt })
    });
    await supabaseAdminFetch(cfg, `/rest/v1/document_files?id=eq.${job.document_id}&document_status=eq.QUARANTINED`, {
      method: "PATCH",
      headers: { "content-type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ malware_scan_status: "INFECTED", malware_scanned_at: scannedAt, malware_scanner_provider: provider, malware_scanner_version: version, document_status: "REJECTED", updated_at: scannedAt, malware_scan_last_error: "Scanner reported INFECTED." })
    });
    const eventOk = await audit(cfg, {
      documentId: job.document_id,
      jobRef: `DOC-SCAN-INFECTED-${safeJobRef}`,
      eventType: "MALWARE_SCAN_INFECTED",
      bucket: job.storage_bucket,
      path: job.storage_path,
      size: Number(job.file_size_bytes),
      checksum: job.checksum_sha256,
      status: "FAILED",
      message: "Configured malware scanner reported INFECTED; document is rejected and never released.",
      metadata: { jobRef: job.job_ref, provider, version }
    });
    // Delete is best-effort; failed deletion is recorded for reconciliation and never re-released.
    const deleteResponse = await supabaseAdminFetch(cfg, `/storage/v1/object/${encodeURIComponent(job.storage_bucket)}/${encodedPath}`, { method: "DELETE" });
    if (!deleteResponse.ok) {
      await audit(cfg, {
        documentId: job.document_id,
        jobRef: `DOC-QUARANTINE-CLEANUP-PENDING-${safeJobRef}`,
        eventType: "QUARANTINE_CLEANUP_PENDING",
        bucket: job.storage_bucket,
        path: job.storage_path,
        size: Number(job.file_size_bytes),
        checksum: job.checksum_sha256,
        status: "WARNING",
        message: "Infected private object deletion failed and requires cleanup reconciliation.",
        metadata: { jobRef: job.job_ref, provider, version }
      });
    }
    return Response.json({ ok: eventOk, productionReady: false, jobRef: job.job_ref, result: "INFECTED", documentReleased: false, objectDeleted: deleteResponse.ok, cleanupReconciliationRequired: !deleteResponse.ok }, { status: eventOk ? 200 : 502, headers: { "cache-control": "no-store" } });
  }

  return await retryOrDeadLetter(cfg, job, leaseToken, attempts, String(result.errorCode || "SCANNER_ERROR").slice(0, 100), "Scanner returned ERROR; document remains quarantined.");
}

async function retryOrDeadLetter(
  cfg: NonNullable<ReturnType<typeof getDocumentRuntimeConfig>>,
  job: ScanJob,
  leaseToken: string,
  attempts: number,
  code: string,
  message: string
): Promise<Response> {
  const now = new Date();
  const exhausted = attempts >= Number(job.max_attempts || 5);
  const delayMs = Math.min(60 * 60_000, 30_000 * (2 ** Math.min(attempts - 1, 7)));
  const next = new Date(now.getTime() + delayMs).toISOString();
  const status = exhausted ? "DEAD_LETTER" : "RETRY_WAIT";
  await supabaseAdminFetch(cfg, `/rest/v1/document_scan_jobs?id=eq.${job.id}&lease_token=eq.${leaseToken}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({
      status,
      available_at: next,
      lease_token: null,
      leased_at: null,
      last_error_code: code,
      last_error_message: message,
      scanner_result: "ERROR",
      completed_at: exhausted ? now.toISOString() : null,
      updated_at: now.toISOString()
    })
  });
  await supabaseAdminFetch(cfg, `/rest/v1/document_files?id=eq.${job.document_id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({
      malware_scan_status: "ERROR",
      malware_scan_attempts: attempts,
      malware_scan_last_error: code,
      malware_scan_next_attempt_at: exhausted ? null : next,
      updated_at: now.toISOString()
    })
  });
  await audit(cfg, {
    documentId: job.document_id,
    jobRef: `DOC-SCAN-FAILED-${String(job.job_ref).replace(/[^a-zA-Z0-9_-]/g, "_")}-${attempts}`,
    eventType: "MALWARE_SCAN_FAILED",
    bucket: job.storage_bucket,
    path: job.storage_path,
    size: Number(job.file_size_bytes),
    checksum: job.checksum_sha256,
    status: "FAILED",
    message,
    metadata: { jobRef: job.job_ref, attempt: attempts, retryStatus: status, errorCode: code }
  });
  return Response.json({
    ok: false,
    productionReady: false,
    jobRef: job.job_ref,
    code,
    status,
    attempts,
    nextAttemptAt: exhausted ? null : next,
    documentReleased: false
  }, { status: exhausted ? 422 : 503, headers: { "cache-control": "no-store" } });
}
