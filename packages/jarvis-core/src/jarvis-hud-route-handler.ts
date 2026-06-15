export type JarvisHudRouteStage =
  | 'idle'
  | 'intake'
  | 'planning'
  | 'review_required'
  | 'validation'
  | 'blocked'
  | 'complete';

export type JarvisHudRouteInput = {
  readonly routeRef: string;
  readonly sessionRef: string;
  readonly founderRef: string;
  readonly stage: JarvisHudRouteStage;
  readonly visibleSummary: string;
  readonly safeNextAction: string;
  readonly riskLevel: 'low' | 'medium' | 'high' | 'production_review_required';
  readonly changedPathCount?: number;
  readonly validatorStatus?: 'not_run' | 'passed' | 'warning' | 'failed';
};

export type JarvisHudRouteResponse = {
  readonly ok: boolean;
  readonly routeRef: string;
  readonly sessionRef: string;
  readonly stage: JarvisHudRouteStage;
  readonly founderRef: string;
  readonly visibleSummary: string;
  readonly safeNextAction: string;
  readonly badges: readonly string[];
  readonly requiresFounderReview: boolean;
};

export function jarvisCreateHudRouteHandler(input: JarvisHudRouteInput): JarvisHudRouteResponse {
  const badges = [
    `stage:${input.stage}`,
    `risk:${input.riskLevel}`,
    `validators:${input.validatorStatus ?? 'not_run'}`,
    `changed_paths:${input.changedPathCount ?? 0}`
  ];

  return {
    ok: input.stage !== 'blocked',
    routeRef: input.routeRef,
    sessionRef: input.sessionRef,
    stage: input.stage,
    founderRef: input.founderRef,
    visibleSummary: input.visibleSummary,
    safeNextAction: input.safeNextAction,
    badges,
    requiresFounderReview: input.riskLevel === 'production_review_required' || input.stage === 'review_required'
  };
}

export const JARVIS_HUD_ROUTE_HANDLER_LIVE = true;
