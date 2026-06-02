import {
  buildFreeDestinyMapIntakeResult,
  normalizeFreeDestinyMapIntakePayload
} from "./free-destiny-map-intake.service";
import { FreeDestinyMapLocalRepository } from "../repositories/free-destiny-map-local.repository";
import {
  FREE_DESTINY_MAP_LOCAL_PERSISTENCE_NOTICE,
  buildFreeDestinyMapAuditEvent,
  type FreeDestinyMapPersistenceResult,
  type StoredFreeDestinyMapIntakeSummary
} from "../../../../packages/contracts/src/free-destiny-map-persistence";

export interface FreeDestinyMapPersistenceOptions {
  enableLocalWrite?: boolean;
  repository?: FreeDestinyMapLocalRepository;
}

export async function persistFreeDestinyMapIntakeShell(
  input: unknown,
  options: FreeDestinyMapPersistenceOptions = {}
): Promise<FreeDestinyMapPersistenceResult> {
  const payload = normalizeFreeDestinyMapIntakePayload(input);
  const result = buildFreeDestinyMapIntakeResult(payload);

  const localPersistenceEnabled = options.enableLocalWrite === true;
  const repository = options.repository ?? new FreeDestinyMapLocalRepository();

  if (!localPersistenceEnabled) {
    return {
      accepted: result.accepted,
      reference: result.reference,
      productionReady: false,
      localPersistenceEnabled: false,
      localWriteAttempted: false,
      localWriteSucceeded: false,
      storageMode: "disabled",
      safeNotice: FREE_DESTINY_MAP_LOCAL_PERSISTENCE_NOTICE,
      issues: result.issues,
      nextAction: "Local write is disabled. Set KINGSMEN_ENABLE_LOCAL_INTAKE_WRITE=true only for controlled local runtime proof."
    };
  }

  const storedSummary: StoredFreeDestinyMapIntakeSummary = {
    reference: result.reference,
    status: result.accepted ? "LOCAL_SHELL_ACCEPTED" : "LOCAL_SHELL_REJECTED",
    createdAt: new Date().toISOString(),
    productionReady: false,
    storesProductionData: false,
    payload,
    result,
    auditEvents: [
      buildFreeDestinyMapAuditEvent("FREE_DESTINY_MAP_LOCAL_SHELL_RECEIVED", "Free Destiny Map intake reached local runtime shell."),
      buildFreeDestinyMapAuditEvent("FREE_DESTINY_MAP_LOCAL_SHELL_VALIDATED", result.accepted ? "Shell validation accepted intake." : "Shell validation returned issues.")
    ]
  };

  await repository.appendIntake(storedSummary);

  return {
    accepted: result.accepted,
    reference: result.reference,
    productionReady: false,
    localPersistenceEnabled: true,
    localWriteAttempted: true,
    localWriteSucceeded: true,
    storageMode: "local_jsonl_shell",
    safeNotice: FREE_DESTINY_MAP_LOCAL_PERSISTENCE_NOTICE,
    issues: result.issues,
    nextAction: result.accepted
      ? "Local shell wrote intake summary. Later batches must move this to governed database persistence."
      : "Local shell wrote rejected/issue summary for proof. Fix issues before progressing."
  };
}
