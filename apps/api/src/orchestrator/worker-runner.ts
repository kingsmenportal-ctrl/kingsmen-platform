import { randomUUID } from "node:crypto";
import { DurableWorkerQueue, type DurableDispatch, type DurableWorkerResult } from "./durable-worker-queue";

export type HandlerContext = {
  workerId: string;
  dispatch: DurableDispatch;
  now: () => string;
};
export type HandlerOutcome = Omit<DurableWorkerResult, "dispatchRef" | "resultRef" | "evidenceRefs"> & {
  evidenceRefs?: string[];
};
export type WorkerHandler = {
  /** External side-effect handlers must declare this true. */
  sideEffect: boolean;
  /** Human approval is required before a side-effect handler may cross SENT. */
  requiresHumanApproval: boolean;
  execute(context: HandlerContext): Promise<HandlerOutcome>;
};

export type WorkerRunSummary = {
  workerId: string;
  claimed: number;
  succeeded: number;
  handedOff: number;
  failed: number;
  unknownHandler: number;
};

/**
 * Only handlers in this explicit registry can execute. Unknown worker codes are
 * durably handed to an operator, never dynamically imported or interpreted.
 * The staging probe is synthetic-only and cannot run unless explicitly enabled.
 */
export function createWorkerHandlerRegistry(env: NodeJS.ProcessEnv = process.env): ReadonlyMap<string, WorkerHandler> {
  const handlers = new Map<string, WorkerHandler>();

  handlers.set("evidence.verify", {
    sideEffect: false,
    requiresHumanApproval: false,
    async execute({ dispatch, now }) {
      const evidenceRefs = dispatch.evidence_refs.filter((ref) => typeof ref === "string" && ref.trim());
      if (!evidenceRefs.length) {
        return { workerStatus: "NEEDS_MANUAL", proposedState: "SAME", failureClass: "POLICY", failureCode: "EVIDENCE_REQUIRED", payload: { reason: "No linked evidence references." } };
      }
      return {
        workerStatus: "SUCCEEDED",
        proposedState: "SAME",
        evidenceRefs,
        payload: { handler: "evidence.verify", verifiedReferenceCount: evidenceRefs.length, verifiedAt: now(), readOnly: true }
      };
    }
  });

  if (env.KINGSMEN_WORKER_ENV === "staging" && env.KINGSMEN_N16_ENABLE_SYNTHETIC_PROBE === "true") {
    handlers.set("n16.staging-recovery-probe", {
      sideEffect: true,
      requiresHumanApproval: true,
      async execute({ dispatch, now }) {
        const delayMs = Math.min(60_000, Math.max(0, Number(env.KINGSMEN_N16_POST_SENT_DELAY_MS ?? 0)));
        if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs));
        if (dispatch.payload.syntheticOnly !== true || dispatch.payload.approvalGranted !== true) {
          return { workerStatus: "NEEDS_APPROVAL", proposedState: "SAME", failureClass: "POLICY", failureCode: "SYNTHETIC_PROBE_APPROVAL_REQUIRED", payload: { handler: "n16.staging-recovery-probe" } };
        }
        return {
          workerStatus: "SUCCEEDED",
          proposedState: "SAME",
          evidenceRefs: dispatch.evidence_refs,
          payload: { handler: "n16.staging-recovery-probe", syntheticOnly: true, completedAt: now(), noExternalProviderAction: true }
        };
      }
    });
  }
  return handlers;
}

export class AuthenticatedWorkerRunner {
  private readonly registry: ReadonlyMap<string, WorkerHandler>;

  constructor(
    private readonly queue: DurableWorkerQueue,
    private readonly workerId: string,
    registry: ReadonlyMap<string, WorkerHandler> = createWorkerHandlerRegistry()
  ) {
    if (!workerId.trim()) throw new Error("N16_WORKER_ID_REQUIRED");
    this.registry = registry;
  }

  async runOnce(limit = 1): Promise<WorkerRunSummary> {
    const summary: WorkerRunSummary = { workerId: this.workerId, claimed: 0, succeeded: 0, handedOff: 0, failed: 0, unknownHandler: 0 };
    const reclaimed = await this.queue.claim(this.workerId, limit, 60);
    summary.claimed = reclaimed.length;

    for (const dispatch of reclaimed) {
      const evidenceRefs = Array.isArray(dispatch.evidence_refs) ? dispatch.evidence_refs.filter((ref) => typeof ref === "string" && ref.trim()) : [];
      if (evidenceRefs.length === 0) {
        // Do not cross SENT when the dispatch has no auditable evidence.
        summary.handedOff++;
        continue; // Lease expires; recovery safely reclaims LOCKED work.
      }

      const handler = this.registry.get(dispatch.worker_code);
      if (!handler) {
        const resultRef = `n16-unknown-handler-${dispatch.dispatch_ref}-${dispatch.attempt_count}`;
        await this.queue.recordResult({
          dispatchRef: dispatch.dispatch_ref, resultRef, workerStatus: "NEEDS_MANUAL",
          proposedState: "SAME", evidenceRefs,
          failureClass: "POLICY", failureCode: "WORKER_CODE_NOT_REGISTERED",
          payload: { workerCode: dispatch.worker_code, decision: "manual_handoff_only" }
        });
        summary.unknownHandler++;
        summary.handedOff++;
        continue;
      }

      if (handler.requiresHumanApproval) {
        const approved = dispatch.payload.approvalGranted === true;
        const approvalEvidenceRef = dispatch.payload.approvalEvidenceRef;
        if (!approved || typeof approvalEvidenceRef !== "string" || !evidenceRefs.includes(approvalEvidenceRef)) {
          await this.queue.recordResult({
            dispatchRef: dispatch.dispatch_ref,
            resultRef: `n16-approval-required-${dispatch.dispatch_ref}-${dispatch.attempt_count}`,
            workerStatus: "NEEDS_APPROVAL", proposedState: "SAME", evidenceRefs,
            failureClass: "POLICY", failureCode: "HUMAN_APPROVAL_OR_APPROVAL_EVIDENCE_REQUIRED",
            payload: { workerCode: dispatch.worker_code, decision: "blocked_before_sent" }
          });
          summary.handedOff++;
          continue;
        }
      }

      try {
        if (handler.sideEffect && dispatch.worker_code === "n16.staging-recovery-probe" && process.env.KINGSMEN_WORKER_ENV === "staging") {
          const delayMs = Math.min(60_000, Math.max(0, Number(process.env.KINGSMEN_N16_PRE_SENT_DELAY_MS ?? 0)));
          if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
        if (handler.sideEffect) await this.queue.markSent(dispatch.dispatch_ref, this.workerId, 120);
        const outcome = await handler.execute({ workerId: this.workerId, dispatch, now: () => new Date().toISOString() });
        const finalEvidence = outcome.evidenceRefs ?? evidenceRefs;
        await this.queue.recordResult({
          dispatchRef: dispatch.dispatch_ref,
          resultRef: `n16-result-${dispatch.dispatch_ref}-${dispatch.attempt_count}`,
          ...outcome,
          evidenceRefs: finalEvidence
        });
        if (outcome.workerStatus === "SUCCEEDED") summary.succeeded++;
        else if (outcome.workerStatus === "NEEDS_MANUAL" || outcome.workerStatus === "NEEDS_APPROVAL" || outcome.workerStatus === "BLOCKED") summary.handedOff++;
        else summary.failed++;
      } catch (error) {
        // If the exception happened after SENT, recovery will quarantine the
        // ambiguous side effect. Do not manufacture a success or replay it.
        console.error(JSON.stringify({
          service: "kingsmen-n16-worker", event: "handler_exception",
          dispatchRef: dispatch.dispatch_ref, workerCode: dispatch.worker_code,
          errorCode: error instanceof Error ? error.name : "UNKNOWN",
          resultRef: randomUUID(), at: new Date().toISOString()
        }));
        summary.failed++;
      }
    }
    return summary;
  }

  async recover(): Promise<{ expiredSent: number; exhaustedLocked: number }> {
    const expiredSent = await this.queue.recoverExpiredSent(50);
    const exhaustedLocked = await this.queue.deadLetterExhaustedLocked(50);
    return { expiredSent, exhaustedLocked };
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}

/** Creates a runner only when a privileged DB secret and explicit durable mode exist. */
export function createWorkerRunnerFromEnvironment(): AuthenticatedWorkerRunner {
  if (process.env.KINGSMEN_WORKER_ENABLED !== "true") throw new Error("N16_WORKER_NOT_ENABLED");
  if (process.env.KINGSMEN_TRUTH_VAULT_MODE !== "postgres") throw new Error("N16_POSTGRES_TRUTH_VAULT_MODE_REQUIRED");
  if (!process.env.KINGSMEN_DATABASE_URL && !process.env.DATABASE_URL) throw new Error("N16_SERVER_ONLY_DATABASE_SECRET_REQUIRED");
  return new AuthenticatedWorkerRunner(
    DurableWorkerQueue.fromEnvironment(),
    process.env.KINGSMEN_WORKER_ID ?? `kingsmen-worker-${process.pid}`
  );
}
