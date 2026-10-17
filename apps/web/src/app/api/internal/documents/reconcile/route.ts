import { timingSafeEqual } from "node:crypto";
import { getDocumentRuntimeConfig, supabaseAdminFetch } from "../../../../../lib/candidate-document-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type QuarantinedDocument = {
  id: string;
  candidate_id: string;
  storage_bucket: string;
  storage_path: string;
  checksum_sha256: string | null;
  file_size_bytes: number | string;
  mime_type: string;
  malware_scan_status: string;
  malware_scan_attempts: number;
  quarantine_started_at: string | null;
};

type CleanupEvent = {
  id: string;
  event_ref: string;
  document_id: string | null;
  storage_bucket: string;
  storage_path: string;
  file_size_bytes: number | string;
  checksum_sha256: string | null;
  metadata?: Record<string, unknown>;
};

type SignedUploadEvent = CleanupEvent & { created_at: string };

type CleanScanJob = {
  id: string;
  job_ref: string;
  document_id: string;
  candidate_id: string;
  storage_bucket: string;
  storage_path: string;
  checksum_sha256: string;
  file_size_bytes: number | string;
  mime_type: string;
  scanner_provider: string | null;
  scanner_version: string | null;
  scanner_result: string | null;
  completed_at: string | null;
  reconciled_at?: string | null;
};

function secureEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function getRows<T>(cfg: NonNullable<ReturnType<typeof getDocumentRuntimeConfig>>, path: string): Promise<T[] | null> {
  try {
    const response = await supabaseAdminFetch(cfg, path);
    if (!response.ok) return null;
    const rows = await response.json().catch(() => null);
    return Array.isArray(rows) ? rows as T[] : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const expected = process.env.N05_SCAN_WORKER_TOKEN?.trim() || "";
  const presented = (request.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || "";
  if (expected.length < 32 || !presented || !secureEqual(expected, presented)) {
    return Response.json({ ok: false, productionReady: false, code: "SCAN_WORKER_AUTH_REQUIRED" }, { status: 401, headers: { "cache-control": "no-store" } });
  }

  const cfg = getDocumentRuntimeConfig();
  if (!cfg) return Response.json({ ok: false, productionReady: false, code: "DOCUMENT_STORE_NOT_CONFIGURED" }, { status: 503, headers: { "cache-control": "no-store" } });

  const now = new Date();
  const staleLeaseBefore = new Date(now.getTime() - 5 * 60_000).toISOString();
  const staleLeaseUrl = new URL(`${cfg.url}/rest/v1/document_scan_jobs`);
  staleLeaseUrl.searchParams.set("status", "eq.LEASED");
  staleLeaseUrl.searchParams.set("leased_at", `lt.${staleLeaseBefore}`);
  const staleLeaseResponse = await supabaseAdminFetch(cfg, `/rest/v1/document_scan_jobs?${staleLeaseUrl.searchParams.toString()}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({
      status: "RETRY_WAIT",
      available_at: now.toISOString(),
      lease_token: null,
      leased_at: null,
      last_error_code: "STALE_SCAN_LEASE_RECOVERED",
      last_error_message: "Reconciler recovered a worker lease older than five minutes.",
      updated_at: now.toISOString()
    })
  });
  if (!staleLeaseResponse.ok) {
    return Response.json({ ok: false, productionReady: false, code: "STALE_LEASE_RECOVERY_FAILED" }, { status: 502, headers: { "cache-control": "no-store" } });
  }
  const recoveredLeases = await staleLeaseResponse.json().catch(() => []) as unknown[];

  // Requeue old quarantined rows whose queue write was interrupted. Never auto-release or trust them.
  const docsUrl = new URL(`${cfg.url}/rest/v1/document_files`);
  docsUrl.searchParams.set("select", "id,candidate_id,storage_bucket,storage_path,checksum_sha256,file_size_bytes,mime_type,malware_scan_status,malware_scan_attempts,quarantine_started_at");
  docsUrl.searchParams.set("document_status", "in.(QUARANTINED,SCANNING)");
  docsUrl.searchParams.set("malware_scan_status", "in.(PENDING,ERROR)");
  docsUrl.searchParams.set("archived_at", "is.null");
  docsUrl.searchParams.set("quarantine_started_at", `lt.${new Date(now.getTime() - 2 * 60_000).toISOString()}`);
  docsUrl.searchParams.set("order", "quarantine_started_at.asc");
  docsUrl.searchParams.set("limit", "100");
  const documents = await getRows<QuarantinedDocument>(cfg, `/rest/v1/document_files?${docsUrl.searchParams.toString()}`);
  if (!documents) return Response.json({ ok: false, productionReady: false, code: "QUARANTINE_QUERY_FAILED" }, { status: 502, headers: { "cache-control": "no-store" } });

  let requeued = 0;
  let skippedMaxAttempts = 0;
  let reconciliationErrors = 0;
  for (const doc of documents) {
    const attempts = Number(doc.malware_scan_attempts || 0);
    if (attempts >= 5) {
      skippedMaxAttempts += 1;
      continue;
    }
    if (!doc.checksum_sha256 || !Number.isSafeInteger(Number(doc.file_size_bytes)) || Number(doc.file_size_bytes) < 1) {
      reconciliationErrors += 1;
      continue;
    }

    const activeUrl = new URL(`${cfg.url}/rest/v1/document_scan_jobs`);
    activeUrl.searchParams.set("select", "id");
    activeUrl.searchParams.set("document_id", `eq.${doc.id}`);
    activeUrl.searchParams.set("status", "in.(QUEUED,LEASED,RETRY_WAIT)");
    activeUrl.searchParams.set("limit", "1");
    const activeJobs = await getRows<{ id: string }>(cfg, `/rest/v1/document_scan_jobs?${activeUrl.searchParams.toString()}`);
    if (!activeJobs) {
      reconciliationErrors += 1;
      continue;
    }
    if (activeJobs.length) continue;

    const stableEpoch = doc.quarantine_started_at ? new Date(doc.quarantine_started_at).getTime() : 0;
    const jobRef = `DOC-RECONCILE-${doc.id}-${stableEpoch}`;
    const insert = await supabaseAdminFetch(cfg, "/rest/v1/document_scan_jobs?on_conflict=job_ref", {
      method: "POST",
      headers: { "content-type": "application/json", Prefer: "resolution=ignore-duplicates,return=minimal" },
      body: JSON.stringify({
        job_ref: jobRef,
        document_id: doc.id,
        candidate_id: doc.candidate_id,
        storage_bucket: doc.storage_bucket,
        storage_path: doc.storage_path,
        checksum_sha256: doc.checksum_sha256,
        file_size_bytes: Number(doc.file_size_bytes),
        mime_type: doc.mime_type,
        status: "QUEUED",
        attempts,
        max_attempts: 5,
        available_at: now.toISOString()
      })
    });
    if (!insert.ok) {
      reconciliationErrors += 1;
      continue;
    }

    const event = await supabaseAdminFetch(cfg, "/rest/v1/document_storage_events?on_conflict=event_ref", {
      method: "POST",
      headers: { "content-type": "application/json", Prefer: "resolution=ignore-duplicates,return=minimal" },
      body: JSON.stringify({
        document_id: doc.id,
        event_ref: `DOC-SCAN-RECONCILED-${doc.id}-${stableEpoch}`,
        event_type: "SCAN_RECONCILIATION",
        storage_provider: "SUPABASE",
        storage_bucket: doc.storage_bucket,
        storage_path: doc.storage_path,
        file_size_bytes: Number(doc.file_size_bytes),
        checksum_sha256: doc.checksum_sha256,
        status: "OK",
        message: "Reconciler re-created a missing durable scan job; document remains quarantined.",
        metadata: { jobRef, previousAttempts: attempts }
      })
    });
    if (!event.ok) reconciliationErrors += 1;
    else requeued += 1;
  }

  // Retry deletion of objects previously marked infected whose cleanup failed. The candidate route
  // never issues links for INFECTED/REJECTED records even while cleanup is pending.
  const cleanupUrl = new URL(`${cfg.url}/rest/v1/document_storage_events`);
  cleanupUrl.searchParams.set("select", "id,event_ref,document_id,storage_bucket,storage_path,file_size_bytes,checksum_sha256,metadata");
  cleanupUrl.searchParams.set("event_type", "eq.QUARANTINE_CLEANUP_PENDING");
  cleanupUrl.searchParams.set("status", "eq.WARNING");
  cleanupUrl.searchParams.set("order", "created_at.asc");
  cleanupUrl.searchParams.set("limit", "100");
  const cleanupEvents = await getRows<CleanupEvent>(cfg, `/rest/v1/document_storage_events?${cleanupUrl.searchParams.toString()}`);
  if (!cleanupEvents) return Response.json({ ok: false, productionReady: false, code: "CLEANUP_QUEUE_QUERY_FAILED" }, { status: 502, headers: { "cache-control": "no-store" } });

  let cleanupResolved = 0;
  let cleanupPending = 0;
  for (const event of cleanupEvents) {
    const encodedPath = event.storage_path.split("/").map(encodeURIComponent).join("/");
    const deletion = await supabaseAdminFetch(cfg, `/storage/v1/object/${encodeURIComponent(event.storage_bucket)}/${encodedPath}`, { method: "DELETE" });
    if (deletion.ok || deletion.status === 404) {
      const completed = await supabaseAdminFetch(cfg, "/rest/v1/document_storage_events?on_conflict=event_ref", {
        method: "POST",
        headers: { "content-type": "application/json", Prefer: "resolution=ignore-duplicates,return=minimal" },
        body: JSON.stringify({
          document_id: event.document_id,
          event_ref: `${event.event_ref}-RESOLVED`,
          event_type: "QUARANTINE_CLEANUP_COMPLETED",
          storage_provider: "SUPABASE",
          storage_bucket: event.storage_bucket,
          storage_path: event.storage_path,
          file_size_bytes: Number(event.file_size_bytes),
          checksum_sha256: event.checksum_sha256,
          status: "OK",
          message: "Infected object deletion confirmed or object already absent during reconciliation.",
          metadata: { originalEventRef: event.event_ref }
        })
      });
      if (completed.ok) {
        await supabaseAdminFetch(cfg, `/rest/v1/document_storage_events?id=eq.${event.id}&status=eq.WARNING`, {
          method: "PATCH",
          headers: { "content-type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify({ status: "OK", message: "Resolved by quarantine cleanup reconciler.", metadata: { ...(event.metadata || {}), resolvedAt: now.toISOString() } })
        });
        cleanupResolved += 1;
      } else cleanupPending += 1;
    } else cleanupPending += 1;
  }

  // Expired signed-upload intents with no document record are storage orphans. After 24 hours,
  // delete the private object (or queue cleanup) and mark the source event to make this idempotent.
  const orphanUrl = new URL(`${cfg.url}/rest/v1/document_storage_events`);
  orphanUrl.searchParams.set("select", "id,event_ref,document_id,storage_bucket,storage_path,file_size_bytes,checksum_sha256,metadata,created_at");
  orphanUrl.searchParams.set("event_type", "eq.SIGNED_UPLOAD_CREATED");
  orphanUrl.searchParams.set("status", "eq.OK");
  orphanUrl.searchParams.set("created_at", `lt.${new Date(now.getTime() - 24 * 60 * 60_000).toISOString()}`);
  orphanUrl.searchParams.set("metadata->>orphanReconciledAt", "is.null");
  orphanUrl.searchParams.set("order", "created_at.asc");
  orphanUrl.searchParams.set("limit", "100");
  const orphanEvents = await getRows<SignedUploadEvent>(cfg, `/rest/v1/document_storage_events?${orphanUrl.searchParams.toString()}`);
  if (!orphanEvents) return Response.json({ ok: false, productionReady: false, code: "ORPHAN_QUERY_FAILED" }, { status: 502, headers: { "cache-control": "no-store" } });

  let orphanChecked = 0;
  let orphanDeleted = 0;
  let orphanCleanupPending = 0;
  for (const event of orphanEvents) {
    const docUrl = new URL(`${cfg.url}/rest/v1/document_files`);
    docUrl.searchParams.set("select", "id");
    docUrl.searchParams.set("storage_path", `eq.${event.storage_path}`);
    docUrl.searchParams.set("limit", "1");
    const existingDocs = await getRows<{ id: string }>(cfg, `/rest/v1/document_files?${docUrl.searchParams.toString()}`);
    if (!existingDocs) {
      orphanCleanupPending += 1;
      continue;
    }
    if (existingDocs.length) {
      const marked = await supabaseAdminFetch(cfg, `/rest/v1/document_storage_events?id=eq.${event.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ metadata: { ...(event.metadata || {}), orphanReconciledAt: now.toISOString(), orphanCleanupResult: "DOCUMENT_RECORD_EXISTS" } })
      });
      if (marked.ok) orphanChecked += 1;
      else orphanCleanupPending += 1;
      continue;
    }

    const encodedPath = event.storage_path.split("/").map(encodeURIComponent).join("/");
    const deletion = await supabaseAdminFetch(cfg, `/storage/v1/object/${encodeURIComponent(event.storage_bucket)}/${encodedPath}`, { method: "DELETE" });
    const deleted = deletion.ok || deletion.status === 404;
    const safeRef = event.event_ref.replace(/[^a-zA-Z0-9_-]/g, "_");
    const cleanupEvent = await supabaseAdminFetch(cfg, "/rest/v1/document_storage_events?on_conflict=event_ref", {
      method: "POST",
      headers: { "content-type": "application/json", Prefer: "resolution=ignore-duplicates,return=minimal" },
      body: JSON.stringify({
        document_id: null,
        event_ref: deleted ? `DOC-ORPHAN-CLEANUP-DONE-${safeRef}` : `DOC-ORPHAN-CLEANUP-${safeRef}`,
        event_type: deleted ? "QUARANTINE_CLEANUP_COMPLETED" : "QUARANTINE_CLEANUP_PENDING",
        storage_provider: "SUPABASE",
        storage_bucket: event.storage_bucket,
        storage_path: event.storage_path,
        file_size_bytes: Number(event.file_size_bytes),
        checksum_sha256: event.checksum_sha256,
        status: deleted ? "OK" : "WARNING",
        message: deleted ? "Expired upload object with no document record was deleted or already absent." : "Expired upload object could not be deleted and requires cleanup retry.",
        metadata: { sourceEventRef: event.event_ref, cleanupReason: "EXPIRED_SIGNED_UPLOAD_WITHOUT_DOCUMENT" }
      })
    });
    if (!cleanupEvent.ok) {
      orphanCleanupPending += 1;
      continue;
    }
    const marked = await supabaseAdminFetch(cfg, `/rest/v1/document_storage_events?id=eq.${event.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ metadata: { ...(event.metadata || {}), orphanReconciledAt: now.toISOString(), orphanCleanupResult: deleted ? "DELETED" : "PENDING_CLEANUP" } })
    });
    if (!marked.ok) {
      orphanCleanupPending += 1;
      continue;
    }
    orphanChecked += 1;
    if (deleted) orphanDeleted += 1;
    else orphanCleanupPending += 1;
  }

  // Recover the interrupted CLEAN transition: the scanner result is already durable in the queue,
  // but the audit or document READY update may have failed after the queue was marked CLEAN.
  const cleanJobsUrl = new URL(`${cfg.url}/rest/v1/document_scan_jobs`);
  cleanJobsUrl.searchParams.set("select", "id,job_ref,document_id,candidate_id,storage_bucket,storage_path,checksum_sha256,file_size_bytes,mime_type,scanner_provider,scanner_version,scanner_result,completed_at");
  cleanJobsUrl.searchParams.set("status", "eq.CLEAN");
  cleanJobsUrl.searchParams.set("scanner_result", "eq.CLEAN");
  cleanJobsUrl.searchParams.set("completed_at", "not.is.null");
  cleanJobsUrl.searchParams.set("reconciled_at", "is.null");
  cleanJobsUrl.searchParams.set("order", "completed_at.asc");
  cleanJobsUrl.searchParams.set("limit", "100");
  const cleanJobs = await getRows<CleanScanJob>(cfg, `/rest/v1/document_scan_jobs?${cleanJobsUrl.searchParams.toString()}`);
  if (!cleanJobs) return Response.json({ ok: false, productionReady: false, code: "CLEAN_RESULT_RECONCILIATION_QUERY_FAILED" }, { status: 502, headers: { "cache-control": "no-store" } });

  let cleanResultsInspected = 0;
  let cleanDocumentsReleased = 0;
  let cleanReleaseErrors = 0;
  for (const job of cleanJobs) {
    if (!job.checksum_sha256 || !job.completed_at || !job.scanner_provider) {
      cleanReleaseErrors += 1;
      continue;
    }
    const safeJobRef = job.job_ref.replace(/[^a-zA-Z0-9_-]/g, "_");
    const cleanEventRef = `DOC-SCAN-CLEAN-${safeJobRef}`;
    const auditUrl = new URL(`${cfg.url}/rest/v1/document_storage_events`);
    auditUrl.searchParams.set("select", "id");
    auditUrl.searchParams.set("event_ref", `eq.${cleanEventRef}`);
    auditUrl.searchParams.set("status", "eq.OK");
    auditUrl.searchParams.set("limit", "1");
    const auditRows = await getRows<{ id: string }>(cfg, `/rest/v1/document_storage_events?${auditUrl.searchParams.toString()}`);
    if (!auditRows) {
      cleanReleaseErrors += 1;
      continue;
    }
    if (!auditRows.length) {
      const auditWrite = await supabaseAdminFetch(cfg, "/rest/v1/document_storage_events?on_conflict=event_ref", {
        method: "POST",
        headers: { "content-type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({
          document_id: job.document_id,
          event_ref: cleanEventRef,
          event_type: "MALWARE_SCAN_CLEAN",
          storage_provider: "SUPABASE",
          storage_bucket: job.storage_bucket,
          storage_path: job.storage_path,
          file_size_bytes: Number(job.file_size_bytes),
          checksum_sha256: job.checksum_sha256,
          status: "OK",
          message: "Reconciler recovered the persisted CLEAN scan result; checksum and queue state were verified.",
          metadata: { jobRef: job.job_ref, provider: job.scanner_provider, version: job.scanner_version || "unspecified", recovered: true }
        })
      });
      if (!auditWrite.ok) {
        cleanReleaseErrors += 1;
        continue;
      }
    }

    const releaseUrl = new URL(`${cfg.url}/rest/v1/document_files`);
    releaseUrl.searchParams.set("id", `eq.${job.document_id}`);
    releaseUrl.searchParams.set("checksum_sha256", `eq.${job.checksum_sha256}`);
    releaseUrl.searchParams.set("document_status", "eq.QUARANTINED");
    releaseUrl.searchParams.set("malware_scan_status", "in.(PENDING,ERROR,SCANNING)");
    const release = await supabaseAdminFetch(cfg, `/rest/v1/document_files?${releaseUrl.searchParams.toString()}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({
        malware_scan_status: "CLEAN",
        malware_scanned_at: job.completed_at,
        malware_scanner_provider: job.scanner_provider,
        malware_scanner_version: job.scanner_version || "unspecified",
        document_status: "READY",
        malware_scan_last_error: null,
        malware_scan_next_attempt_at: null,
        updated_at: now.toISOString()
      })
    });
    const released = release.ok ? await release.json().catch(() => []) as unknown[] : [];
    let releaseConfirmed = Array.isArray(released) && released.length === 1;
    if (releaseConfirmed) {
      cleanDocumentsReleased += 1;
    } else if (!release.ok) {
      cleanReleaseErrors += 1;
      continue;
    } else {
      // A concurrent worker may already have released this exact checksum. Treat only that exact
      // persisted state as success; all other no-row updates remain an error for operator review.
      const currentUrl = new URL(`${cfg.url}/rest/v1/document_files`);
      currentUrl.searchParams.set("select", "id");
      currentUrl.searchParams.set("id", `eq.${job.document_id}`);
      currentUrl.searchParams.set("checksum_sha256", `eq.${job.checksum_sha256}`);
      currentUrl.searchParams.set("document_status", "eq.READY");
      currentUrl.searchParams.set("malware_scan_status", "eq.CLEAN");
      currentUrl.searchParams.set("limit", "1");
      const currentRows = await getRows<{ id: string }>(cfg, `/rest/v1/document_files?${currentUrl.searchParams.toString()}`);
      releaseConfirmed = Boolean(currentRows?.length);
      if (!releaseConfirmed) {
        cleanReleaseErrors += 1;
        continue;
      }
    }

    // Mark the durable queue row so a successful historical result does not starve newer work
    // on every bounded reconciliation run. A failed marker write is safe to retry idempotently.
    const marked = await supabaseAdminFetch(cfg, `/rest/v1/document_scan_jobs?id=eq.${job.id}&status=eq.CLEAN&reconciled_at=is.null`, {
      method: "PATCH",
      headers: { "content-type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({ reconciled_at: now.toISOString(), updated_at: now.toISOString() })
    });
    const markedRows = marked.ok ? await marked.json().catch(() => []) as unknown[] : [];
    if (!Array.isArray(markedRows) || markedRows.length !== 1) {
      cleanReleaseErrors += 1;
      continue;
    }
    cleanResultsInspected += 1;
  }

  return Response.json({
    ok: reconciliationErrors === 0 && cleanupPending === 0 && orphanCleanupPending === 0 && cleanReleaseErrors === 0,
    productionReady: false,
    recoveredStaleLeases: Array.isArray(recoveredLeases) ? recoveredLeases.length : 0,
    inspectedQuarantinedDocuments: documents.length,
    requeuedMissingScanJobs: requeued,
    skippedDocumentsAtAttemptLimit: skippedMaxAttempts,
    reconciliationErrors,
    cleanupEventsInspected: cleanupEvents.length,
    cleanupResolved,
    cleanupPending,
    orphanUploadEventsInspected: orphanEvents.length,
    orphanUploadEventsChecked: orphanChecked,
    orphanObjectsDeleted: orphanDeleted,
    orphanCleanupPending,
    cleanResultsInspected,
    cleanDocumentsReleased,
    cleanReleaseErrors,
    note: "Reconciliation never marks a document CLEAN. A configured scanner must return CLEAN before the scan worker can release it."
  }, { status: reconciliationErrors || cleanupPending || orphanCleanupPending || cleanReleaseErrors ? 207 : 200, headers: { "cache-control": "no-store" } });
}
