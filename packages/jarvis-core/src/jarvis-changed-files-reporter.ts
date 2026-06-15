import { jarvisMakeRef } from '../../contracts/src/jarvis';
import type { JarvisChangedFilesReport, JarvisPatchPlanContract } from '../../contracts/src/jarvis/patch-plan';

export function jarvisCreateChangedFilesReport(input: {
  readonly patchPlan: JarvisPatchPlanContract;
}): JarvisChangedFilesReport {
  return {
    reportRef: jarvisMakeRef('jarvis_changed_files', input.patchPlan.patchPlanRef),
    patchPlanRef: input.patchPlan.patchPlanRef,
    commandRef: input.patchPlan.commandRef,
    moduleRef: input.patchPlan.moduleRef,
    changedFiles: [],
    blockedFiles: [],
    validatorCommands: input.patchPlan.validatorCommands,
    safeSummary: `Changed files report prepared for ${input.patchPlan.moduleRef}.`
  };
}

export function jarvisAssertChangedFilesReport(report: JarvisChangedFilesReport): void {
  if (!report.reportRef.trim()) throw new Error('JARVIS_CHANGED_FILES_REPORT_REF_REQUIRED');
  if (!report.patchPlanRef.trim()) throw new Error('JARVIS_CHANGED_FILES_PATCH_PLAN_REF_REQUIRED');
}
