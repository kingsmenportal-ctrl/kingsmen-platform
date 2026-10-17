import type { CommandEnvelope } from "../kernel/command-envelope";
import type { PolicyDecision } from "../policy/policy-middleware";
import type {
  ApplicationWorkbenchReadModel,
  CandidateReadModel
} from "../read-models/candidate-read-model";
import type { WorkflowResultEnvelope } from "../workflows/workflow-result";
import { buildEvidenceRecord, type EvidenceLedgerInput } from "../evidence/evidence-ledger";
import { createWorkerHeartbeat } from "../heartbeat/worker-heartbeat";
import { createClaim } from "../idempotency/idempotency";

type JsonObject = Record<string, unknown>;

type PgQueryResult<T = Record<string, unknown>> = {
  rows: T[];
  rowCount: number | null;
};

type PgClient = {
  query<T = Record<string, unknown>>(sql: string, values?: readonly unknown[]): Promise<PgQueryResult<T>>;
  release(): void;
};
type PgPool = {
  query<T = Record<string, unknown>>(sql: string, values?: readonly unknown[]): Promise<PgQueryResult<T>>;
  connect(): Promise<PgClient>;
  end(): Promise<void>;
};

type PgPoolConstructor = new (config: Record<string, unknown>) => PgPool;

type CandidateRow = {
  id: string;
  public_ref: string;
  email: string;
  display_name: string;
  current_state: CandidateReadModel["currentState"];
  active_package_code: string | null;
  updated_at: string;
};

type ApplicationRow = {
  id: string;
  application_ref: string;
  candidate_ref: string;
  route_type: ApplicationWorkbenchReadModel["routeType"];
  source_confidence_band: ApplicationWorkbenchReadModel["sourceConfidenceBand"];
  current_state: ApplicationWorkbenchReadModel["currentState"];
  portal_health: ApplicationWorkbenchReadModel["portalHealth"];
  map_fallback_required: boolean;
  last_evidence_ref: string | null;
  updated_at: string;
};

export interface TruthVaultWriteResult {
  ok: boolean;
  ref: string;
  message: string;
}

export interface TruthVaultStoredCommandResult {
  replay: boolean;
  commandId: string;
  responseBody: JsonObject;
}

export interface TruthVaultStoredWorkflowResult {
  replay: boolean;
  workflowRunId: string;
  responseBody: JsonObject;
}

export class TruthVaultRepository {
  readonly storageMode: "memory_development_only" | "postgres_truth_vault";

  private constructor(private readonly pool: PgPool | null) {
    this.storageMode = pool ? "postgres_truth_vault" : "memory_development_only";
  }

  static fromEnvironment(): TruthVaultRepository {
    const isProduction = process.env.NODE_ENV === "production";
    const mode = process.env.KINGSMEN_TRUTH_VAULT_MODE ?? (isProduction ? "postgres" : "memory");
    const databaseUrl = process.env.KINGSMEN_DATABASE_URL ?? process.env.DATABASE_URL;

    if (mode !== "postgres") {
      if (isProduction) {
        throw new Error("PRODUCTION_REQUIRES_DURABLE_TRUTH_VAULT");
      }
      return new TruthVaultRepository(null);
    }
    if (!databaseUrl) throw new Error("KINGSMEN_TRUTH_VAULT_MODE=postgres requires KINGSMEN_DATABASE_URL or DATABASE_URL.");

    const pg = require("pg") as { Pool: PgPoolConstructor };
    return new TruthVaultRepository(new pg.Pool({
      connectionString: databaseUrl,
      max: Number(process.env.KINGSMEN_DATABASE_POOL_MAX ?? 8),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      ssl: isProduction || process.env.KINGSMEN_DATABASE_SSL === "true"
        ? { rejectUnauthorized: true }
        : undefined
    }));
  }

  get enabled(): boolean {
    return this.pool !== null;
  }

  async close(): Promise<void> {
    await this.pool?.end();
  }

  async healthCheck(): Promise<{ ok: boolean; storageMode: string; message: string }> {
    if (!this.pool) {
      return { ok: true, storageMode: this.storageMode, message: "Truth Vault is running in memory-only development mode." };
    }

    await this.pool.query("select 1");
    return { ok: true, storageMode: this.storageMode, message: "PostgreSQL Truth Vault connection is healthy." };
  }

  async recordCommand(input: {
    command: CommandEnvelope;
    policy: PolicyDecision;
    status: "ACCEPTED" | "PENDING_APPROVAL";
    responseBody: JsonObject;
  }): Promise<TruthVaultStoredCommandResult> {
    this.assertEnabled();

    const existing = await this.pool!.query<{ command_id: string | null; response_body: JsonObject | null }>(
      "select command_id, response_body from idempotency_keys where idempotency_key = $1 and status = 'COMPLETED' limit 1",
      [input.command.idempotencyKey]
    );

    if (existing.rows[0]?.command_id) {
      return {
        replay: true,
        commandId: existing.rows[0].command_id,
        responseBody: existing.rows[0].response_body ?? input.responseBody
      };
    }

    const candidateUuid = await this.upsertCandidateForCommand(input.command);
    const applicationUuid = await this.upsertApplicationForCommand(input.command, candidateUuid);
    const dbStatus = input.status === "PENDING_APPROVAL" ? "APPROVAL_REQUIRED" : "ACCEPTED";

    await this.pool!.query(
      `insert into idempotency_keys (idempotency_key, command_id, correlation_id, status)
       values ($1,$2,$3,'CLAIMED')
       on conflict (idempotency_key) do update set command_id = excluded.command_id, correlation_id = excluded.correlation_id`,
      [input.command.idempotencyKey, input.command.commandId, input.command.correlationId]
    );

    await this.pool!.query(
      `insert into command_log (
         command_id, command_type, idempotency_key, correlation_id, actor_type, actor_id,
         source, candidate_id, application_id, policy_decision, payload, status
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb,$12)
       on conflict (command_id) do update set policy_decision = excluded.policy_decision, payload = excluded.payload, status = excluded.status`,
      [
        input.command.commandId,
        input.command.commandType,
        input.command.idempotencyKey,
        input.command.correlationId,
        input.command.actor.type,
        input.command.actor.id,
        input.command.source,
        candidateUuid,
        applicationUuid,
        JSON.stringify(input.policy),
        JSON.stringify(input.command.payload ?? {}),
        dbStatus
      ]
    );

    await this.insertAuditEvent({
      eventType: "command.accepted",
      severity: input.status === "PENDING_APPROVAL" ? "WARNING" : "INFO",
      correlationId: input.command.correlationId,
      actorId: input.command.actor.id,
      candidateUuid,
      applicationUuid,
      message: `Command ${input.command.commandId} persisted to PostgreSQL Truth Vault.`,
      metadata: { commandType: input.command.commandType, storageMode: this.storageMode }
    });

    if (input.status === "PENDING_APPROVAL") {
      await this.createApprovalRequest({
        approvalRef: `approval_${input.command.commandId}`,
        commandId: input.command.commandId,
        correlationId: input.command.correlationId,
        requestedBy: input.command.actor.id,
        approvalType: input.command.commandType,
        reason: "Policy requires founder/operator approval before execution.",
        payload: { commandType: input.command.commandType }
      });
    }

    await this.pool!.query(
      `update idempotency_keys set status = 'COMPLETED', response_body = $2::jsonb, completed_at = now() where idempotency_key = $1`,
      [input.command.idempotencyKey, JSON.stringify(input.responseBody)]
    );

    return { replay: false, commandId: input.command.commandId, responseBody: input.responseBody };
  }

  async recordWorkflowResult(input: {
    result: WorkflowResultEnvelope;
    responseBody: JsonObject;
  }): Promise<TruthVaultStoredWorkflowResult> {
    this.assertEnabled();

    const existing = await this.pool!.query<{ workflow_run_id: string }>(
      "select workflow_run_id from workflow_runs where workflow_run_id = $1 limit 1",
      [input.result.workflowRunId]
    );

    if (existing.rows[0]?.workflow_run_id) {
      return { replay: true, workflowRunId: input.result.workflowRunId, responseBody: input.responseBody };
    }

    const candidateUuid = await this.upsertCandidateForWorkflowResult(input.result);
    const applicationUuid = await this.upsertApplicationForWorkflowResult(input.result, candidateUuid);

    await this.pool!.query(
      `insert into workflow_runs (
         workflow_run_id, workflow_code, idempotency_key, correlation_id, candidate_id,
         application_id, previous_state, final_state, status, evidence_ref, error_code, message, payload, completed_at
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,now())`,
      [
        input.result.workflowRunId,
        input.result.workflow,
        input.result.idempotencyKey,
        input.result.correlationId,
        candidateUuid,
        applicationUuid,
        input.result.previousState,
        input.result.finalState,
        input.result.status,
        input.result.evidenceRef ?? null,
        input.result.errorCode ?? null,
        input.result.message,
        JSON.stringify(input.result.payload ?? {})
      ]
    );

    await this.pool!.query(
      `insert into evidence_ledger (evidence_ref, evidence_type, candidate_id, application_id, workflow_run_id, source_name, summary, payload)
       values ($1,'workflow_result',$2,$3,$4,$5,$6,$7::jsonb)
       on conflict (evidence_ref) do nothing`,
      [
        input.result.evidenceRef ?? `ev_${input.result.workflowRunId}`,
        candidateUuid,
        applicationUuid,
        input.result.workflowRunId,
        `workflow:${input.result.workflow}`,
        input.result.message,
        JSON.stringify({ status: input.result.status, finalState: input.result.finalState })
      ]
    );

    await this.insertAuditEvent({
      eventType: "workflow.result.received",
      severity: input.result.status === "FAILED" ? "ERROR" : input.result.status === "MANUAL_REQUIRED" ? "WARNING" : "INFO",
      correlationId: input.result.correlationId,
      actorId: `workflow:${input.result.workflow}`,
      candidateUuid,
      applicationUuid,
      evidenceRef: input.result.evidenceRef ?? `ev_${input.result.workflowRunId}`,
      message: `Workflow result ${input.result.workflowRunId} persisted to PostgreSQL Truth Vault.`,
      metadata: { workflow: input.result.workflow, status: input.result.status }
    });

    await this.pool!.query(
      `insert into idempotency_keys (idempotency_key, command_id, correlation_id, status, response_body, completed_at)
       values ($1,$2,$3,'COMPLETED',$4::jsonb,now())
       on conflict (idempotency_key) do update set status = 'COMPLETED', response_body = excluded.response_body, completed_at = now()`,
      [input.result.idempotencyKey, input.result.workflowRunId, input.result.correlationId, JSON.stringify(input.responseBody)]
    );

    return { replay: false, workflowRunId: input.result.workflowRunId, responseBody: input.responseBody };
  }

  /** Returns safe document metadata for the verified owner; never exposes storage paths or signed URLs. */
  async listDocumentMetadataForOwner(candidateUuid: string): Promise<Array<{
    documentRef: string;
    documentType: string;
    displayName: string;
    mimeType: string;
    fileSizeBytes: number;
    documentStatus: string;
    verificationStatus: string;
    extractionStatus: string;
    uploadedAt: string;
  }>> {
    this.assertEnabled();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidateUuid)) return [];
    const result = await this.pool!.query<{
      document_ref: string; document_type: string; display_name: string; mime_type: string;
      file_size_bytes: string | number; document_status: string; verification_status: string;
      extraction_status: string; uploaded_at: string;
    }>(
      `select document_ref, document_type, display_name, mime_type, file_size_bytes::text,
              document_status, verification_status, extraction_status, uploaded_at::text
       from document_files
       where candidate_id = $1::uuid and archived_at is null and document_status <> 'DELETED'
       order by uploaded_at desc
       limit 200`,
      [candidateUuid]
    );
    return result.rows.map((row) => ({
      documentRef: row.document_ref,
      documentType: row.document_type,
      displayName: row.display_name,
      mimeType: row.mime_type,
      fileSizeBytes: Number(row.file_size_bytes),
      documentStatus: row.document_status,
      verificationStatus: row.verification_status,
      extractionStatus: row.extraction_status,
      uploadedAt: row.uploaded_at
    }));
  }

  /** Lists only open document requests owned by the authenticated candidate. */
  async listOpenDocumentRequestsForOwner(candidateUuid: string): Promise<Array<{
    requestRef: string;
    documentType: string;
    reason: string;
    priority: string;
    dueAt: string | null;
    createdAt: string;
  }>> {
    this.assertEnabled();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidateUuid)) return [];
    const result = await this.pool!.query<{
      request_ref: string;
      document_type: string;
      reason: string;
      priority: string;
      due_at: string | null;
      created_at: string;
    }>(
      `select request_ref, document_type, reason, priority, due_at::text, created_at::text
       from document_requests
       where candidate_id = $1::uuid and request_status = 'OPEN'
       order by due_at asc nulls last, created_at desc
       limit 100`,
      [candidateUuid]
    );
    return result.rows.map((row) => ({
      requestRef: row.request_ref,
      documentType: row.document_type,
      reason: row.reason,
      priority: row.priority,
      dueAt: row.due_at,
      createdAt: row.created_at
    }));
  }

  /** Lists only application tracker rows belonging to the authenticated candidate UUID.
   * The owner filter, RLS context, and access-audit event share one transaction.
   * Fetch one row beyond the response cap so large accounts never see a silent partial list.
   */
  async listOwnedApplicationsForOwner(candidateUuid: string): Promise<ApplicationWorkbenchReadModel[]> {
    this.assertEnabled();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidateUuid)) return [];
    const client = await this.pool!.connect();
    const correlationId = `candidate_applications_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    try {
      await client.query("BEGIN");
      await client.query(
        "select set_config('app.kingsmen_role', $1, true), set_config('app.service_context', $2, true)",
        ["service_role", "backend_api"]
      );
      const result = await client.query<ApplicationRow>(
        `select a.id::text,
                coalesce(a.metadata->>'applicationRef', a.id::text) as application_ref,
                c.public_ref as candidate_ref,
                a.route_type, a.source_confidence_band, a.current_state,
                a.portal_health, a.map_fallback_required, a.last_evidence_ref,
                a.updated_at::text
           from applications a
           join candidates c on c.id = a.candidate_id
          where a.candidate_id = $1::uuid
          order by a.updated_at desc, a.id asc
          limit 201`,
        [candidateUuid]
      );
      if (result.rows.length > 200) {
        throw new Error("CANDIDATE_APPLICATION_RESULT_LIMIT_EXCEEDED");
      }
      await client.query(
        `insert into audit_events
           (event_id, event_type, severity, correlation_id, actor_id, candidate_id, message, metadata)
         values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)`,
        [
          `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
          "candidate.applications.listed",
          "INFO",
          correlationId,
          candidateUuid,
          candidateUuid,
          "Authenticated candidate application tracker read completed.",
          JSON.stringify({ returnedCount: result.rows.length, responseLimit: 200 })
        ]
      );
      await client.query("COMMIT");
      return result.rows.map((row) => ({
        applicationId: row.application_ref,
        candidateId: row.candidate_ref,
        routeType: row.route_type,
        sourceConfidenceBand: row.source_confidence_band,
        currentState: row.current_state,
        portalHealth: row.portal_health,
        mapFallbackRequired: row.map_fallback_required,
        lastEvidenceRef: row.last_evidence_ref ?? undefined,
        lastUpdatedAt: row.updated_at
      }));
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  /** Lists application rows via the explicit Supabase Auth UUID binding used by staging RLS. */
  async listApplicationsForVerifiedSupabaseUser(supabaseUserId: string): Promise<ApplicationWorkbenchReadModel[] | null> {
    this.assertEnabled();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(supabaseUserId)) return null;
    const client = await this.pool!.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "select set_config('app.kingsmen_role', $1, true), set_config('app.service_context', $2, true)",
        ["service_role", "backend_api"]
      );
      const linked = await client.query<{ candidate_id: string }>(
        `select ca.candidate_id::text
           from public.candidate_auth_identity_links ca
           join public.candidates c on c.id=ca.candidate_id and c.is_active=true
          where ca.supabase_user_id=$1::uuid and ca.link_status='VERIFIED'
          limit 1`,
        [supabaseUserId]
      );
      if (!linked.rows[0]) {
        await client.query("COMMIT");
        return null;
      }
      const result = await client.query<ApplicationRow>(
        `select a.id::text,
                coalesce(a.metadata->>'applicationRef', a.id::text) as application_ref,
                c.public_ref as candidate_ref,
                a.route_type, a.source_confidence_band, a.current_state,
                a.portal_health, a.map_fallback_required, a.last_evidence_ref,
                a.updated_at::text
           from public.applications a
           join public.candidates c on c.id=a.candidate_id and c.is_active=true
          where a.candidate_id=$1::uuid
          order by a.updated_at desc, a.id asc
          limit 201`,
        [linked.rows[0].candidate_id]
      );
      if (result.rows.length > 200) {
        throw new Error("CANDIDATE_APPLICATION_RESULT_LIMIT_EXCEEDED");
      }
      const auditCorrelationId = `candidate_applications_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      await client.query(
        `insert into audit_events
           (event_id, event_type, severity, correlation_id, actor_id, candidate_id, message, metadata)
         values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)`,
        [
          `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
          "candidate.applications.listed",
          "INFO",
          auditCorrelationId,
          linked.rows[0].candidate_id,
          linked.rows[0].candidate_id,
          "Verified Supabase identity application tracker read completed.",
          JSON.stringify({ returnedCount: result.rows.length, responseLimit: 200 })
        ]
      );
      await client.query("COMMIT");
      return result.rows.map((row) => ({
        applicationId: row.application_ref, candidateId: row.candidate_ref, routeType: row.route_type,
        sourceConfidenceBand: row.source_confidence_band, currentState: row.current_state,
        portalHealth: row.portal_health, mapFallbackRequired: row.map_fallback_required,
        lastEvidenceRef: row.last_evidence_ref ?? undefined, lastUpdatedAt: row.updated_at
      }));
    } catch (error) {
      try { await client.query("ROLLBACK"); } catch { /* preserve original error */ }
      throw error;
    } finally {
      client.release();
    }
  }

  /** Lists safe document metadata by the Supabase Auth UUID-to-candidate binding. */
  async listDocumentsForVerifiedSupabaseUser(supabaseUserId: string): Promise<Array<{
    documentRef: string; documentType: string; displayName: string; mimeType: string;
    fileSizeBytes: number; documentStatus: string; verificationStatus: string;
    extractionStatus: string; uploadedAt: string;
  }> | null> {
    this.assertEnabled();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(supabaseUserId)) return null;
    const client = await this.pool!.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "select set_config('app.kingsmen_role', $1, true), set_config('app.service_context', $2, true)",
        ["service_role", "backend_api"]
      );
      const result = await client.query<{
        document_ref: string; document_type: string; display_name: string; mime_type: string;
        file_size_bytes: string | number; document_status: string; verification_status: string;
        extraction_status: string; uploaded_at: string;
      }>(
        `select d.document_ref, d.document_type, d.display_name, d.mime_type,
                d.file_size_bytes::text, d.document_status, d.verification_status,
                d.extraction_status, d.uploaded_at::text
           from public.candidate_auth_identity_links ca
           join public.candidates c on c.id = ca.candidate_id and c.is_active = true
           join public.document_files d on d.candidate_id = c.id
          where ca.supabase_user_id = $1::uuid and ca.link_status = 'VERIFIED'
            and d.archived_at is null
            and d.document_status <> 'DELETED'
          order by d.uploaded_at desc, d.id asc
          limit 201`,
        [supabaseUserId]
      );
      // No matching account means the identity is not linked. An empty array
      // with a matching account means the candidate has no visible documents.
      const linked = await client.query<{ linked: boolean }>(
        "select exists(select 1 from public.candidate_auth_identity_links ca join public.candidates c on c.id=ca.candidate_id and c.is_active=true where ca.supabase_user_id=$1::uuid and ca.link_status='VERIFIED') as linked",
        [supabaseUserId]
      );
      if (linked.rows[0]?.linked === true && result.rows.length > 200) {
        throw new Error("CANDIDATE_DOCUMENT_RESULT_LIMIT_EXCEEDED");
      }
      if (linked.rows[0]?.linked === true) {
        const correlationId = `candidate_documents_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        await client.query(
          `insert into audit_events
             (event_id, event_type, severity, correlation_id, actor_id, candidate_id, message, metadata)
           values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)`,
          [
            `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
            "candidate.documents.listed",
            "INFO",
            correlationId,
            linked.rows[0] ? supabaseUserId : "unknown",
            null,
            "Verified Supabase identity candidate document metadata read completed.",
            JSON.stringify({ returnedCount: result.rows.length, responseLimit: 200 })
          ]
        );
      }
      await client.query("COMMIT");
      if (linked.rows[0]?.linked !== true) return null;
      return result.rows.map((row) => ({
        documentRef: row.document_ref, documentType: row.document_type, displayName: row.display_name,
        mimeType: row.mime_type, fileSizeBytes: Number(row.file_size_bytes),
        documentStatus: row.document_status, verificationStatus: row.verification_status,
        extractionStatus: row.extraction_status, uploadedAt: row.uploaded_at
      }));
    } catch (error) {
      try { await client.query("ROLLBACK"); } catch { /* preserve original error */ }
      throw error;
    } finally {
      client.release();
    }
  }

  /** Resolves Supabase Auth UUID to the candidate ID using the same explicit binding used by RLS. */
  async resolveCandidateUuidForSupabaseUser(supabaseUserId: string): Promise<string | null> {
    this.assertEnabled();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(supabaseUserId)) return null;
    const client = await this.pool!.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "select set_config('app.kingsmen_role', $1, true), set_config('app.service_context', $2, true)",
        ["service_role", "backend_api"]
      );
      const result = await client.query<{ candidate_id: string }>(
        `select ca.candidate_id::text
           from public.candidate_auth_identity_links ca
           join public.candidates c on c.id=ca.candidate_id and c.is_active=true
          where ca.supabase_user_id=$1::uuid and ca.link_status='VERIFIED'
          limit 1`,
        [supabaseUserId]
      );
      await client.query("COMMIT");
      return result.rows[0]?.candidate_id ?? null;
    } catch (error) {
      try { await client.query("ROLLBACK"); } catch { /* preserve original error */ }
      throw error;
    } finally {
      client.release();
    }
  }

  /** Identity-scoped candidate read; candidateUuid must come from a verified session. */
  async readCandidateStatusForOwner(candidateUuid: string, candidateRef: string): Promise<CandidateReadModel | null> {
    this.assertEnabled();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidateUuid)) return null;
    const result = await this.pool!.query<CandidateRow>(
      "select id::text, public_ref, email, display_name, current_state, active_package_code, updated_at::text from candidates where id = $1::uuid and public_ref = $2 limit 1",
      [candidateUuid, candidateRef]
    );
    const row = result.rows[0];
    if (!row) return null;
    return { candidateId: row.public_ref, displayName: row.display_name, email: row.email, currentState: row.current_state, activePackageCode: row.active_package_code ?? undefined, profileConfidence: "LOW", documentReadiness: "PARTIAL", applicationReadiness: "NOT_READY", lastUpdatedAt: row.updated_at };
  }

  /** Returns an application only when it belongs to the verified candidate UUID. */
  async readOwnedApplicationWorkbench(applicationRef: string, candidateUuid: string): Promise<ApplicationWorkbenchReadModel | null> {
    this.assertEnabled();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidateUuid)) return null;
    const result = await this.pool!.query<ApplicationRow>(
      "select a.id::text, coalesce(a.metadata->>'applicationRef', a.id::text) as application_ref, c.public_ref as candidate_ref, a.route_type, a.source_confidence_band, a.current_state, a.portal_health, a.map_fallback_required, a.last_evidence_ref, a.updated_at::text from applications a join candidates c on c.id = a.candidate_id where a.metadata->>'applicationRef' = $1 and a.candidate_id = $2::uuid limit 1",
      [applicationRef, candidateUuid]
    );
    const row = result.rows[0];
    if (!row) return null;
    return { applicationId: row.application_ref, candidateId: row.candidate_ref, routeType: row.route_type, sourceConfidenceBand: row.source_confidence_band, currentState: row.current_state, portalHealth: row.portal_health, mapFallbackRequired: row.map_fallback_required, lastEvidenceRef: row.last_evidence_ref ?? undefined, lastUpdatedAt: row.updated_at };
  }
  async readCandidateStatus(candidateRef: string): Promise<CandidateReadModel | null> {
    this.assertEnabled();
    const result = await this.pool!.query<CandidateRow>(
      `select id::text, public_ref, email, display_name, current_state, active_package_code, updated_at::text
       from candidates where public_ref = $1 limit 1`,
      [candidateRef]
    );

    const row = result.rows[0];
    if (!row) return null;

    return {
      candidateId: row.public_ref,
      displayName: row.display_name,
      email: row.email,
      currentState: row.current_state,
      activePackageCode: row.active_package_code ?? undefined,
      profileConfidence: "LOW",
      documentReadiness: "PARTIAL",
      applicationReadiness: "NOT_READY",
      lastUpdatedAt: row.updated_at
    };
  }

  async readApplicationWorkbench(applicationRef: string): Promise<ApplicationWorkbenchReadModel | null> {
    this.assertEnabled();
    const result = await this.pool!.query<ApplicationRow>(
      `select
         a.id::text,
         coalesce(a.metadata->>'applicationRef', a.id::text) as application_ref,
         c.public_ref as candidate_ref,
         a.route_type,
         a.source_confidence_band,
         a.current_state,
         a.portal_health,
         a.map_fallback_required,
         a.last_evidence_ref,
         a.updated_at::text
       from applications a
       join candidates c on c.id = a.candidate_id
       where a.metadata->>'applicationRef' = $1
       limit 1`,
      [applicationRef]
    );

    const row = result.rows[0];
    if (!row) return null;

    return {
      applicationId: row.application_ref,
      candidateId: row.candidate_ref,
      routeType: row.route_type,
      sourceConfidenceBand: row.source_confidence_band,
      currentState: row.current_state,
      portalHealth: row.portal_health,
      mapFallbackRequired: row.map_fallback_required,
      lastEvidenceRef: row.last_evidence_ref ?? undefined,
      lastUpdatedAt: row.updated_at
    };
  }

  async createEvidence(input: EvidenceLedgerInput): Promise<TruthVaultWriteResult> {
    const record = buildEvidenceRecord(input);
    if (!this.pool) return { ok: true, ref: record.evidenceRef, message: "Evidence record prepared in memory-only mode." };

    await this.pool.query(
      `insert into evidence_ledger (evidence_ref, evidence_type, source_name, source_confidence_band, summary, payload)
       values ($1,$2,$3,$4,$5,$6::jsonb)
       on conflict (evidence_ref) do nothing`,
      [record.evidenceRef, record.evidenceType, record.sourceName, record.sourceConfidenceBand, record.summary, JSON.stringify(record.payload ?? {})]
    );

    return { ok: true, ref: record.evidenceRef, message: "Evidence record persisted to PostgreSQL Truth Vault." };
  }

  async createIdempotencyClaim(input: {
    idempotencyKey: string;
    commandId?: string;
    correlationId: string;
    ttlHours?: number;
  }): Promise<TruthVaultWriteResult> {
    const claim = createClaim(input);
    if (!this.pool) return { ok: true, ref: claim.idempotencyKey, message: "Idempotency claim prepared in memory-only mode." };

    await this.pool.query(
      `insert into idempotency_keys (idempotency_key, command_id, correlation_id, expires_at)
       values ($1,$2,$3, now() + ($4::text || ' hours')::interval)
       on conflict (idempotency_key) do nothing`,
      [claim.idempotencyKey, input.commandId ?? null, input.correlationId, input.ttlHours ?? 24]
    );

    return { ok: true, ref: claim.idempotencyKey, message: "Idempotency claim persisted to PostgreSQL Truth Vault." };
  }

  async createHeartbeat(input: {
    workerCode: string;
    workflowRunId?: string;
    correlationId: string;
    metadata?: Record<string, unknown>;
  }): Promise<TruthVaultWriteResult> {
    const heartbeat = createWorkerHeartbeat(input);
    if (!this.pool) return { ok: true, ref: `${heartbeat.workerCode}:${heartbeat.correlationId}`, message: "Worker heartbeat prepared in memory-only mode." };

    await this.pool.query(
      `insert into worker_heartbeats (worker_code, workflow_run_id, correlation_id, status, metadata)
       values ($1,$2,$3,$4,$5::jsonb)`,
      [heartbeat.workerCode, heartbeat.workflowRunId ?? null, heartbeat.correlationId, heartbeat.status, JSON.stringify(heartbeat.metadata ?? {})]
    );

    return { ok: true, ref: `${heartbeat.workerCode}:${heartbeat.correlationId}`, message: "Worker heartbeat persisted to PostgreSQL Truth Vault." };
  }

  async createDeadLetter(input: {
    source: string;
    correlationId: string;
    idempotencyKey?: string;
    errorCode: string;
    errorMessage: string;
    payload?: Record<string, unknown>;
  }): Promise<TruthVaultWriteResult> {
    this.assertEnabled();
    await this.pool!.query(
      `insert into dead_letter_queue (source, correlation_id, idempotency_key, error_code, error_message, payload)
       values ($1,$2,$3,$4,$5,$6::jsonb)`,
      [input.source, input.correlationId, input.idempotencyKey ?? null, input.errorCode, input.errorMessage, JSON.stringify(input.payload ?? {})]
    );
    return { ok: true, ref: input.correlationId, message: "Dead-letter record persisted to PostgreSQL Truth Vault." };
  }

  async createApprovalRequest(input: {
    approvalRef: string;
    commandId?: string;
    correlationId: string;
    requestedBy: string;
    approvalType: string;
    reason: string;
    payload?: Record<string, unknown>;
  }): Promise<TruthVaultWriteResult> {
    this.assertEnabled();
    await this.pool!.query(
      `insert into approval_requests (approval_ref, command_id, correlation_id, requested_by, approval_type, reason, payload)
       values ($1,$2,$3,$4,$5,$6,$7::jsonb)
       on conflict (approval_ref) do nothing`,
      [input.approvalRef, input.commandId ?? null, input.correlationId, input.requestedBy, input.approvalType, input.reason, JSON.stringify(input.payload ?? {})]
    );
    return { ok: true, ref: input.approvalRef, message: "Approval request persisted to PostgreSQL Truth Vault." };
  }

  private async upsertCandidateForCommand(command: CommandEnvelope): Promise<string | null> {
    const payload = this.objectPayload(command.payload);
    const candidateRef = command.candidateId ?? this.safeString(payload.candidateId, "");
    if (!candidateRef) return null;

    const currentState = this.stateForCommand(command.commandType);
    const result = await this.pool!.query<{ id: string }>(
      `insert into candidates (public_ref, email, display_name, current_state, active_package_code)
       values ($1,$2,$3,$4,$5)
       on conflict (public_ref) do update set
         email = excluded.email,
         display_name = excluded.display_name,
         current_state = excluded.current_state,
         active_package_code = coalesce(excluded.active_package_code, candidates.active_package_code),
         updated_at = now()
       returning id::text`,
      [
        candidateRef,
        this.safeString(payload.email, `unknown+${candidateRef}@kingsmen.invalid`),
        this.safeString(payload.displayName ?? payload.fullName ?? payload.name, "Unknown candidate"),
        currentState,
        this.safeString(payload.activePackageCode, "") || null
      ]
    );

    return result.rows[0]?.id ?? null;
  }

  private async upsertCandidateForWorkflowResult(result: WorkflowResultEnvelope): Promise<string | null> {
    if (!result.candidateId) return null;

    const query = await this.pool!.query<{ id: string }>(
      `insert into candidates (public_ref, email, display_name, current_state)
       values ($1,$2,$3,$4)
       on conflict (public_ref) do update set current_state = excluded.current_state, updated_at = now()
       returning id::text`,
      [result.candidateId, `unknown+${result.candidateId}@kingsmen.invalid`, "Unknown candidate", result.finalState]
    );

    return query.rows[0]?.id ?? null;
  }

  private async upsertApplicationForCommand(command: CommandEnvelope, candidateUuid: string | null): Promise<string | null> {
    const payload = this.objectPayload(command.payload);
    const applicationRef = command.applicationId ?? this.safeString(payload.applicationId, "");
    if (!applicationRef || !candidateUuid) return null;

    const lookup = await this.pool!.query<{ id: string }>(
      "select id::text from applications where metadata->>'applicationRef' = $1 limit 1",
      [applicationRef]
    );

    if (lookup.rows[0]?.id) return lookup.rows[0].id;

    const routeType = this.safeRouteType(payload.routeType);
    const currentState = this.stateForCommand(command.commandType);
    const result = await this.pool!.query<{ id: string }>(
      `insert into applications (candidate_id, route_type, route_name, institution_or_provider, current_state, metadata)
       values ($1,$2,$3,$4,$5,$6::jsonb)
       returning id::text`,
      [
        candidateUuid,
        routeType,
        this.safeString(payload.routeName ?? payload.programmeName ?? payload.opportunityName, applicationRef),
        this.safeString(payload.providerName ?? payload.institutionOrProvider, "") || null,
        currentState,
        JSON.stringify({ applicationRef })
      ]
    );

    return result.rows[0]?.id ?? null;
  }

  private async upsertApplicationForWorkflowResult(result: WorkflowResultEnvelope, candidateUuid: string | null): Promise<string | null> {
    if (!result.applicationId || !candidateUuid) return null;

    const lookup = await this.pool!.query<{ id: string }>(
      "select id::text from applications where metadata->>'applicationRef' = $1 limit 1",
      [result.applicationId]
    );

    if (lookup.rows[0]?.id) {
      await this.pool!.query(
        `update applications set current_state = $2, map_fallback_required = map_fallback_required or $3, last_evidence_ref = coalesce($4, last_evidence_ref), updated_at = now() where id::text = $1`,
        [lookup.rows[0].id, result.finalState, result.status === "MANUAL_REQUIRED", result.evidenceRef ?? null]
      );
      return lookup.rows[0].id;
    }

    const inserted = await this.pool!.query<{ id: string }>(
      `insert into applications (candidate_id, route_type, route_name, current_state, source_confidence_band, map_fallback_required, last_evidence_ref, metadata)
       values ($1,'UNIVERSITY',$2,$3,'D',$4,$5,$6::jsonb)
       returning id::text`,
      [candidateUuid, result.applicationId, result.finalState, result.status === "MANUAL_REQUIRED", result.evidenceRef ?? null, JSON.stringify({ applicationRef: result.applicationId })]
    );

    return inserted.rows[0]?.id ?? null;
  }

  private async insertAuditEvent(input: {
    eventType: string;
    severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
    correlationId: string;
    actorId: string;
    candidateUuid?: string | null;
    applicationUuid?: string | null;
    evidenceRef?: string | null;
    message: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.pool!.query(
      `insert into audit_events (event_id, event_type, severity, correlation_id, actor_id, candidate_id, application_id, evidence_ref, message, metadata)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)`,
      [
        `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
        input.eventType,
        input.severity,
        input.correlationId,
        input.actorId,
        input.candidateUuid ?? null,
        input.applicationUuid ?? null,
        input.evidenceRef ?? null,
        input.message,
        JSON.stringify(input.metadata ?? {})
      ]
    );
  }

  /** Lists open document requests through the server-verified Supabase Auth binding. */
  async listDocumentRequestsForVerifiedSupabaseUser(supabaseUserId: string): Promise<Array<{
    requestRef: string; documentType: string; reason: string; priority: string;
    dueAt: string | null; createdAt: string;
  }> | null> {
    this.assertEnabled();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(supabaseUserId)) return null;
    const client = await this.pool!.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "select set_config('app.kingsmen_role', $1, true), set_config('app.service_context', $2, true)",
        ["service_role", "backend_api"]
      );
      const linked = await client.query<{ candidate_id: string }>(
        `select ca.candidate_id::text
           from public.candidate_auth_identity_links ca
           join public.candidates c on c.id = ca.candidate_id and c.is_active = true
          where ca.supabase_user_id = $1::uuid and ca.link_status = 'VERIFIED'
          limit 1`,
        [supabaseUserId]
      );
      if (!linked.rows[0]) {
        await client.query("COMMIT");
        return null;
      }
      const result = await client.query<{
        request_ref: string; document_type: string; reason: string; priority: string;
        due_at: string | null; created_at: string;
      }>(
        `select request_ref, document_type, reason, priority, due_at::text, created_at::text
           from public.document_requests
          where candidate_id = $1::uuid and request_status = 'OPEN'
          order by due_at asc nulls last, created_at desc
          limit 100`,
        [linked.rows[0].candidate_id]
      );
      await client.query("COMMIT");
      return result.rows.map((row) => ({
        requestRef: row.request_ref, documentType: row.document_type, reason: row.reason,
        priority: row.priority, dueAt: row.due_at, createdAt: row.created_at
      }));
    } catch (error) {
      try { await client.query("ROLLBACK"); } catch { /* preserve original error */ }
      throw error;
    } finally {
      client.release();
    }
  }


  /** Lists safe support-ticket status metadata for the active candidate bound to verified Auth. */
  async listSupportTicketsForVerifiedSupabaseUser(supabaseUserId: string): Promise<Array<{
    ticketRef: string; category: string; priority: string; status: string;
    title: string; createdAt: string; updatedAt: string; closedAt: string | null;
  }> | null> {
    this.assertEnabled();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(supabaseUserId)) return null;
    const client = await this.pool!.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "select set_config('app.kingsmen_role', $1, true), set_config('app.service_context', $2, true)",
        ["service_role", "backend_api"]
      );
      const linked = await client.query<{ candidate_id: string }>(
        `select ca.candidate_id::text
           from public.candidate_auth_identity_links ca
           join public.candidates c on c.id = ca.candidate_id and c.is_active = true
          where ca.supabase_user_id = $1::uuid and ca.link_status = 'VERIFIED'
          limit 1`,
        [supabaseUserId]
      );
      if (!linked.rows[0]) {
        await client.query("COMMIT");
        return null;
      }
      const result = await client.query<{
        ticket_ref: string; category: string; priority: string; status: string;
        title: string; created_at: string; updated_at: string; closed_at: string | null;
      }>(
        `select ticket_ref, category, priority, status, title,
                created_at::text, updated_at::text, closed_at::text
           from public.candidate_support_tickets
          where candidate_id = $1::uuid
          order by updated_at desc, created_at desc
          limit 100`,
        [linked.rows[0].candidate_id]
      );
      await client.query("COMMIT");
      return result.rows.map((row) => ({
        ticketRef: row.ticket_ref, category: row.category, priority: row.priority,
        status: row.status, title: row.title, createdAt: row.created_at,
        updatedAt: row.updated_at, closedAt: row.closed_at
      }));
    } catch (error) {
      try { await client.query("ROLLBACK"); } catch { /* preserve original error */ }
      throw error;
    } finally {
      client.release();
    }
  }

  private assertEnabled(): void {
    if (!this.pool) throw new Error("PostgreSQL Truth Vault persistence is not enabled for this process.");
  }

  private objectPayload(value: unknown): JsonObject {
    return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : {};
  }

  private safeString(value: unknown, fallback: string): string {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
  }

  private stateForCommand(commandType: CommandEnvelope["commandType"]): CandidateReadModel["currentState"] {
    switch (commandType) {
      case "candidate.intake.received": return "INTAKE_PENDING";
      case "candidate.profile.reviewed":
      case "application.evaluate.requested": return "EVALUATION_PENDING";
      case "document.uploaded": return "DOCUMENT_PENDING";
      case "application.execute.requested": return "EXECUTION_PENDING";
      default: return "NEW";
    }
  }

  private safeRouteType(value: unknown): ApplicationWorkbenchReadModel["routeType"] {
    const allowed: readonly ApplicationWorkbenchReadModel["routeType"][] = ["UNIVERSITY", "TVET", "SETA", "LEARNERSHIP", "BURSARY", "ACCOMMODATION", "EMPLOYER", "PRIVATE_COLLEGE"];
    return allowed.includes(value as ApplicationWorkbenchReadModel["routeType"]) ? value as ApplicationWorkbenchReadModel["routeType"] : "UNIVERSITY";
  }
}
