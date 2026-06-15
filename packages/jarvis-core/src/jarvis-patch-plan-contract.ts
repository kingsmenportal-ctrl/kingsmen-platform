import { jarvisMakeRef } from '../../contracts/src/jarvis';
import type { JarvisPatchOperation, JarvisPatchPlanContract } from '../../contracts/src/jarvis/patch-plan';

export function jarvisCreatePatchPlanContract(input: {
  readonly commandRef: string;
  readonly taskRef: string;
  readonly moduleRef: string;
  readonly scopeRoot: string;
  readonly operations: readonly JarvisPatchOperation[];
  readonly validatorCommands: readonly string[];
  readonly readyForPatchWriter: boolean;
}): JarvisPatchPlanContract {
  return {
    patchPlanRef: jarvisMakeRef('jarvis_patch_plan', `${input.moduleRef}_${input.taskRef}`),
    commandRef: input.commandRef,
    taskRef: input.taskRef,
    moduleRef: input.moduleRef,
    scopeRoot: input.scopeRoot,
    operations: input.operations,
    validatorCommands: input.validatorCommands,
    requiresFounderApproval: !input.readyForPatchWriter,
    readyForPatchWriter: input.readyForPatchWriter,
    safeSummary: `Patch plan contract prepared for ${input.moduleRef}.`
  };
}

export function jarvisAssertPatchPlanContract(contract: JarvisPatchPlanContract): void {
  if (!contract.patchPlanRef.trim()) throw new Error('JARVIS_PATCH_PLAN_REF_REQUIRED');
  if (!contract.commandRef.trim()) throw new Error('JARVIS_PATCH_COMMAND_REF_REQUIRED');
  if (!contract.moduleRef.trim()) throw new Error('JARVIS_PATCH_MODULE_REF_REQUIRED');
  if (!contract.scopeRoot.trim()) throw new Error('JARVIS_PATCH_SCOPE_ROOT_REQUIRED');
  if (contract.operations.length === 0) throw new Error('JARVIS_PATCH_OPERATIONS_REQUIRED');
  if (contract.validatorCommands.length === 0) throw new Error('JARVIS_PATCH_VALIDATORS_REQUIRED');
}
