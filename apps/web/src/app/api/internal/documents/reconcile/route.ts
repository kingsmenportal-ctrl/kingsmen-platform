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
  const presented = (request.headers.get("authorization") || "").match(/^Bearer\\s+(.+)$/i)?.[1]?.trim() || "";
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
        max_attempts: Math.max(1, 5 - attempts),
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

  return Response.json({
    ok: reconciliationErrors === 0 && cleanupPending === 0,
    productionReady: false,
    recoveredStaleLeases: Array.isArray(recoveredLeases) ? recoveredLeases.length : 0,
    inspectedQuarantinedDocuments: documents.length,
    requeuedMissingScanJobs: requeued,
    skippedDocumentsAtAttemptLimit: skippedMaxAttempts,
    reconciliationErrors,
    cleanupEventsInspected: cleanupEvents.length,
    cleanupResolved,
    cleanupPending,
    note: "Reconciliation never marks a document CLEAN. A configured scanner must return CLEAN before the scan worker can release it."
  }, { status: reconciliationErrors || cleanupPending ? 207 : 200, headers: { "cache-control": "no-store" } });
}
