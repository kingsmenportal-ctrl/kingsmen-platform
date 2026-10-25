import type { IncomingMessage, ServerResponse } from "node:http";
import { buildFounderLiveBrief, type FounderOperationalDomain, type FounderOperationalObservation, type FounderEvidenceState } from "./founder-live-brief";

type QueryResult<T> = { rows: T[] };
type Pool = { query<T = Record<string, unknown>>(sql: string, values?: readonly unknown[]): Promise<QueryResult<T>>; end(): Promise<void> };
type PoolCtor = new (config: Record<string, unknown>) => Pool;
type SourceRow = { source_ref: string | null; generated_at: string | null; state: string | null; summary: string | null; metrics: Record<string, number | string | boolean | null> | null };

let pool: Pool | null = null;
function database(): Pool {
  if (pool) return pool;
  const connectionString = process.env.KINGSMEN_DATABASE_URL ?? process.env.DATABASE_URL;
  if (process.env.KINGSMEN_TRUTH_VAULT_MODE !== "postgres" || !connectionString) {
    throw new Error("FOUNDER_BRIEF_POSTGRES_TRUTH_VAULT_REQUIRED");
  }
  const pg = require("pg") as { Pool: PoolCtor };
  pool = new pg.Pool({
    connectionString,
    max: 3,
    idleTimeoutMillis: 15_000,
    connectionTimeoutMillis: 8_000,
    ssl: process.env.KINGSMEN_DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined
  });
  return pool;
}

function send(response: ServerResponse, status: number, body: Record<string, unknown>): void {
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  response.end(JSON.stringify(body));
}

async function authenticatedUserId(request: IncomingMessage): Promise<string | null> {
  const header = request.headers.authorization;
  if (typeof header !== "string" || !/^Bearer\s+\S+$/i.test(header)) return null;
  const token = header.replace(/^Bearer\s+/i, "");
  const base = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!base || !anonKey) throw new Error("FOUNDER_BRIEF_SUPABASE_AUTH_NOT_CONFIGURED");
  const result = await fetch(`${base.replace(/\/$/, "")}/auth/v1/user`, {
    method: "GET",
    headers: { apikey: anonKey, authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(8_000)
  });
  if (!result.ok) return null;
  const user = await result.json() as { id?: unknown };
  return typeof user.id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(user.id) ? user.id : null;
}

const SOURCE_QUERIES: Record<FounderOperationalDomain, string> = {
  system_health: `select snapshot_ref as source_ref, captured_at as generated_at,
    case when upper(status) in ('CRITICAL','ERROR','UNHEALTHY') then 'CRITICAL'
         when upper(status) in ('WARNING','DEGRADED','WATCH') then 'WATCH' else 'OK' end as state,
    coalesce(summary, 'Latest persisted system health snapshot.') as summary,
    jsonb_build_object('activeCandidates', active_candidates, 'activeCandidateCap', active_candidate_cap,
      'pendingWorkflows', pending_workflows, 'failedWorkflows', failed_workflows,
      'documentBacklog', document_backlog, 'manualFallbackBacklog', manual_fallback_backlog,
      'paymentPendingCount', payment_pending_count, 'sourceReviewBacklog', source_review_backlog,
      'incidentOpenCount', incident_open_count) as metrics
    from public.system_health_snapshots order by captured_at desc limit 1`,
  queue: `select snapshot_ref as source_ref, generated_at,
    case when coalesce(blocked_count,0)>0 then 'WATCH' else 'OK' end as state,
    'Latest persisted control-plane queue snapshot.' as summary,
    jsonb_build_object('totalCount',total_count,'urgentCount',urgent_count,'blockedCount',blocked_count,
      'manualCount',manual_count,'oldestItemAgeMinutes',oldest_item_age_minutes,'capacityStatus',capacity_status) as metrics
    from public.control_plane_queue_snapshots order by generated_at desc limit 1`,
  finance: `select 'finance_payments:' || to_char(max(created_at) at time zone 'UTC','YYYYMMDD"T"HH24MISS"Z"') as source_ref,
    max(created_at) as generated_at,
    case when count(*) filter (where upper(payment_status) in ('FAILED','ERROR','REJECTED')) > 0 then 'WATCH' else 'OK' end as state,
    'Aggregate finance payment ledger status; no candidate-level payment details returned.' as summary,
    jsonb_build_object('paymentRecords',count(*),'pendingPayments',count(*) filter (where upper(payment_status) in ('PENDING','CREATED','PROCESSING')),
      'failedPayments',count(*) filter (where upper(payment_status) in ('FAILED','ERROR','REJECTED')),
      'verifiedPayments',count(*) filter (where verified is true)) as metrics
    from public.finance_payments having count(*) > 0`,
  documents: `select 'document_files:' || to_char(max(updated_at) at time zone 'UTC','YYYYMMDD"T"HH24MISS"Z"') as source_ref,
    max(updated_at) as generated_at,
    case when count(*) filter (where upper(verification_status) in ('REJECTED','FAILED')) > 0 then 'WATCH' else 'OK' end as state,
    'Aggregate document readiness; filenames, storage paths and candidate identifiers are excluded.' as summary,
    jsonb_build_object('documents',count(*) filter (where archived_at is null),
      'pendingVerification',count(*) filter (where archived_at is null and upper(verification_status) in ('PENDING','NEEDS_REVIEW','UNVERIFIED')),
      'verified',count(*) filter (where archived_at is null and upper(verification_status) in ('VERIFIED','APPROVED')),
      'failedVerification',count(*) filter (where archived_at is null and upper(verification_status) in ('REJECTED','FAILED'))) as metrics
    from public.document_files having count(*) > 0`,
  matching: `select 'candidate_opportunity_matches:' || to_char(max(created_at) at time zone 'UTC','YYYYMMDD"T"HH24MISS"Z"') as source_ref,
    max(created_at) as generated_at,
    case when count(*) filter (where human_review_required is true)>0 then 'WATCH' else 'OK' end as state,
    'Aggregate opportunity matching queue; candidate, provider and programme references are excluded.' as summary,
    jsonb_build_object('matchRecords',count(*),'awaitingHumanReview',count(*) filter (where human_review_required is true),
      'sealedTargets',count(*) filter (where sealed_exact_target is true)) as metrics
    from public.candidate_opportunity_matches having count(*) > 0`,
  map_playwright: `select check_ref as source_ref, checked_at as generated_at,
    case when map_fallback_required or captcha_detected or otp_detected or manual_only_detected then 'WATCH'
         when upper(health_status) in ('FAILED','ERROR','UNHEALTHY') then 'CRITICAL' else 'OK' end as state,
    'Latest persisted portal probe status; no candidate payload is returned.' as summary,
    jsonb_build_object('httpStatus',http_status,'captchaDetected',captcha_detected,'otpDetected',otp_detected,
      'manualOnlyDetected',manual_only_detected,'mapFallbackRequired',map_fallback_required) as metrics
    from public.portal_health_checks order by checked_at desc limit 1`,
  incidents: `select 'incident_events:' || to_char(max(opened_at) at time zone 'UTC','YYYYMMDD"T"HH24MISS"Z"') as source_ref,
    max(opened_at) as generated_at,
    case when count(*) filter (where upper(severity) in ('CRITICAL','SEV1','P0') and upper(status) not in ('RESOLVED','CLOSED'))>0 then 'CRITICAL'
         when count(*) filter (where upper(status) not in ('RESOLVED','CLOSED'))>0 then 'WATCH' else 'OK' end as state,
    'Aggregate incident ledger status; incident titles and candidate references are excluded.' as summary,
    jsonb_build_object('incidents',count(*),'openIncidents',count(*) filter (where upper(status) not in ('RESOLVED','CLOSED')),
      'criticalOpen',count(*) filter (where upper(severity) in ('CRITICAL','SEV1','P0') and upper(status) not in ('RESOLVED','CLOSED'))) as metrics
    from public.incident_events having count(*) > 0`,
  capacity: `select snapshot_ref as source_ref, captured_at as generated_at,
    case when active_candidates >= active_candidate_cap then 'WATCH' else 'OK' end as state,
    'Capacity and national route availability are reported separately; candidate route access is not removed at cap.' as summary,
    jsonb_build_object('activeCandidates',active_candidates,'activeCandidateCap',active_candidate_cap,
      'pendingWorkflows',pending_workflows,'manualFallbackBacklog',manual_fallback_backlog) as metrics
    from public.system_health_snapshots order by captured_at desc limit 1`,
  urgent_candidates: `select 'candidate_follow_up_tasks:' || to_char(max(updated_at) at time zone 'UTC','YYYYMMDD"T"HH24MISS"Z"') as source_ref,
    max(updated_at) as generated_at,
    case when count(*) filter (where upper(status) not in ('DONE','COMPLETED','CANCELLED') and due_at < now())>0 then 'WATCH' else 'OK' end as state,
    'Aggregate overdue follow-up count only; candidate identities and task descriptions are never returned.' as summary,
    jsonb_build_object('openFollowUps',count(*) filter (where upper(status) not in ('DONE','COMPLETED','CANCELLED')),
      'overdueFollowUps',count(*) filter (where upper(status) not in ('DONE','COMPLETED','CANCELLED') and due_at < now()),
      'dueWithin24Hours',count(*) filter (where upper(status) not in ('DONE','COMPLETED','CANCELLED') and due_at >= now() and due_at < now()+interval '24 hours')) as metrics
    from public.candidate_follow_up_tasks having count(*) > 0`
};

function stateFromDatabase(value: string | null): FounderEvidenceState {
  const normalized = (value ?? "").toUpperCase();
  if (["CRITICAL", "ERROR", "UNHEALTHY", "FAILED"].includes(normalized)) return "CRITICAL";
  if (["WATCH", "WARNING", "DEGRADED"].includes(normalized)) return "WATCH";
  if (["OK", "HEALTHY", "READY", "GREEN"].includes(normalized)) return "OK";
  return "UNKNOWN";
}

async function loadObservations(db: Pool): Promise<{ observations: FounderOperationalObservation[]; sourceErrors: string[]; activeCandidateCount?: number; activeCandidateCap?: number }> {
  const domains = Object.keys(SOURCE_QUERIES) as FounderOperationalDomain[];
  const observations: FounderOperationalObservation[] = [];
  const sourceErrors: string[] = [];
  for (const domain of domains) {
    try {
      const result = await db.query<SourceRow>(SOURCE_QUERIES[domain]);
      const row = result.rows[0];
      if (!row || !row.generated_at || !row.source_ref) continue;
      const metrics = row.metrics ?? {};
      observations.push({
        domain,
        sourceRef: row.source_ref,
        generatedAt: new Date(row.generated_at).toISOString(),
        state: stateFromDatabase(row.state),
        summary: row.summary ?? "Persisted source returned no summary.",
        metrics
      });
    } catch {
      // A missing/incompatible source stays missing in the brief and is named only
      // as a source error; SQL details and operational payloads are not leaked.
      sourceErrors.push(domain);
    }
  }
  const capacity = observations.find((item) => item.domain === "capacity");
  const count = capacity?.metrics?.activeCandidates;
  const cap = capacity?.metrics?.activeCandidateCap;
  return {
    observations,
    sourceErrors,
    ...(typeof count === "number" ? { activeCandidateCount: count } : {}),
    ...(typeof cap === "number" ? { activeCandidateCap: cap } : {})
  };
}

function briefColumns(brief: ReturnType<typeof buildFounderLiveBrief>) {
  const byDomain = new Map(brief.sections.map((section) => [section.domain, section]));
  const json = (domain: FounderOperationalDomain) => JSON.stringify(byDomain.get(domain));
  return {
    systemHealth: json("system_health"),
    queueSummary: json("queue"),
    financeSummary: json("finance"),
    documentSummary: json("documents"),
    matchingSummary: json("matching"),
    mapPlaywrightSummary: json("map_playwright"),
    incidentSummary: json("incidents"),
    capacitySummary: json("capacity"),
    urgentCandidates: json("urgent_candidates")
  };
}

export async function handleFounderLiveBrief(request: IncomingMessage, response: ServerResponse): Promise<void> {
  if (request.method !== "GET" && request.method !== "POST") {
    send(response, 405, { ok: false, code: "METHOD_NOT_ALLOWED" });
    return;
  }
  let userId: string | null;
  try {
    userId = await authenticatedUserId(request);
  } catch {
    send(response, 503, { ok: false, code: "FOUNDER_AUTH_UNAVAILABLE" });
    return;
  }
  if (!userId) {
    send(response, 401, { ok: false, code: "AUTHENTICATION_REQUIRED" });
    return;
  }

  let db: Pool;
  try {
    db = database();
    const result = await db.query<{ role_key: string; operator_ref: string }>(
      `select operator_ref, role_key from public.founder_operator_profiles
       where operator_ref = $1 and active is true and role_key = 'FOUNDER' limit 1`,
      [userId]
    );
    if (!result.rows[0]) {
      send(response, 403, { ok: false, code: "FOUNDER_ACCESS_DENIED" });
      return;
    }
  } catch {
    send(response, 503, { ok: false, code: "FOUNDER_AUTHORIZATION_UNAVAILABLE" });
    return;
  }

  try {
    const loaded = await loadObservations(db);
    const brief = buildFounderLiveBrief({
      briefType: request.method === "POST" ? "EVENING" : "MORNING",
      activeCandidateCount: loaded.activeCandidateCount,
      activeCandidateCap: loaded.activeCandidateCap,
      observations: loaded.observations
    });
    if (loaded.sourceErrors.length) {
      brief.warnings.push(`Source query unavailable: ${loaded.sourceErrors.join(", ")}.`);
      brief.recommendedActions.push("Repair failed operational read-model queries before treating the brief as complete.");
    }

    const ref = `founder_brief_${Date.now()}_${Math.random().toString(36).slice(2,10)}`;
    const cols = briefColumns(brief);
    const evidenceRefs = brief.evidenceRefs;
    const inserted = await db.query<{ brief_ref: string; created_at: string }>(
      \`with inserted as (
         insert into public.founder_daily_briefs
         (brief_ref, brief_type, brief_date, brief_status, system_health, queue_summary, finance_summary,
          document_summary, matching_summary, map_playwright_summary, incident_summary, capacity_summary,
          urgent_candidates, recommended_actions, evidence_refs)
         values ($1,$2,(now() at time zone 'Africa/Johannesburg')::date,$3,$4::jsonb,$5::jsonb,$6::jsonb,
          $7::jsonb,$8::jsonb,$9::jsonb,$10::jsonb,$11::jsonb,$12::jsonb,$13::jsonb,$14::text[])
         returning brief_ref, created_at
       ), audited as (
         insert into public.founder_ops_audit_events
         (audit_ref, actor_ref, action_key, target_ref, severity, audit_message, audit_payload, evidence_refs)
         select $15, $16, 'FOUNDER_LIVE_BRIEF_READ', inserted.brief_ref, $17, $18, $19::jsonb, $20::text[]
         from inserted returning audit_ref
       )
       select inserted.brief_ref, inserted.created_at::text
       from inserted join audited on audited.audit_ref = $15\`,
      [ref, brief.briefType, brief.overallState === "HEALTHY" || brief.overallState === "WATCH" ? "READY" : "DRAFT",
        cols.systemHealth, cols.queueSummary, cols.financeSummary, cols.documentSummary, cols.matchingSummary,
        cols.mapPlaywrightSummary, cols.incidentSummary, cols.capacitySummary,
        JSON.stringify({ ...brief.sections.find((section) => section.domain === "urgent_candidates"), aggregateOnly: true }),
        JSON.stringify(brief.recommendedActions), evidenceRefs,
        \`audit_\${ref}\`, userId,
        brief.overallState === "CRITICAL" ? "CRITICAL" : brief.overallState === "DEGRADED" ? "WARNING" : "INFO",
        "Authenticated founder generated a persisted operational brief.",
        JSON.stringify({ briefType: brief.briefType, overallState: brief.overallState, sectionStates: brief.sections.map((section) => ({ domain: section.domain, state: section.state })), sourceErrors: loaded.sourceErrors }),
        evidenceRefs]
    );
    send(response, 200, {
      ok: true,
      brief: { ...brief, briefRef: inserted.rows[0]?.brief_ref ?? ref, persistedAt: inserted.rows[0]?.created_at ?? null },
      sourceErrors: loaded.sourceErrors,
      dataClassification: "FOUNDER_ONLY_AGGREGATE",
      productionReady: false
    });
  } catch {
    send(response, 503, { ok: false, code: "FOUNDER_BRIEF_SOURCE_UNAVAILABLE" });
  }
}
