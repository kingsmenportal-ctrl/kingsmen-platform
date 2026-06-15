export interface JarvisFounderConsoleRouteReadonlyInput {
  readonly routeRef: string;
  readonly founderRef: string;
  readonly visibleTitle: string;
  readonly visibleSummary: string;
  readonly status: 'idle' | 'working' | 'needs_review' | 'blocked' | 'complete';
  readonly updatedAtIso: string;
}

export interface JarvisFounderConsoleRouteReadonlyModel {
  readonly routeRef: string;
  readonly founderRef: string;
  readonly readonly: true;
  readonly visibleTitle: string;
  readonly visibleSummary: string;
  readonly status: JarvisFounderConsoleRouteReadonlyInput['status'];
  readonly updatedAtIso: string;
  readonly allowedView: 'founder_console';
  readonly authorityNotice: 'read_model_only';
}

export function jarvisCreateFounderConsoleRouteReadonly(
  input: JarvisFounderConsoleRouteReadonlyInput,
): JarvisFounderConsoleRouteReadonlyModel {
  return {
    routeRef: input.routeRef,
    founderRef: input.founderRef,
    readonly: true,
    visibleTitle: input.visibleTitle,
    visibleSummary: input.visibleSummary,
    status: input.status,
    updatedAtIso: input.updatedAtIso,
    allowedView: 'founder_console',
    authorityNotice: 'read_model_only',
  };
}
