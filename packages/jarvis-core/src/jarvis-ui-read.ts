import { jarvisMakeRef } from '../../contracts/src/jarvis';
import type { JarvisCommandEnvelope, JarvisDecision } from '../../contracts/src/jarvis';
import type { JarvisHudReadModel, JarvisHudStage, JarvisValidatorStatus } from '../../contracts/src/jarvis/patch-plan';

export const JARVIS_HUD_READ_MODEL = 'built';

export function jarvisCreateHudReadModel(input: {
  readonly command: JarvisCommandEnvelope;
  readonly decision: JarvisDecision;
  readonly stage: JarvisHudStage;
  readonly nextAction: string;
  readonly visibleSummary: string;
  readonly moduleRef?: string;
  readonly changedFileCount?: number;
  readonly blockedFileCount?: number;
  readonly validatorStatus?: JarvisValidatorStatus;
  readonly founderApprovalRequired?: boolean;
}): JarvisHudReadModel {
  return {
    hudRef: jarvisMakeRef('jarvis_hud', input.command.commandRef),
    commandRef: input.command.commandRef,
    mode: input.command.mode,
    stage: input.stage,
    decision: input.decision,
    moduleRef: input.moduleRef,
    nextAction: input.nextAction,
    visibleSummary: input.visibleSummary,
    changedFileCount: input.changedFileCount ?? 0,
    blockedFileCount: input.blockedFileCount ?? 0,
    validatorStatus: input.validatorStatus ?? 'not_run',
    founderApprovalRequired: input.founderApprovalRequired ?? false
  };
}
