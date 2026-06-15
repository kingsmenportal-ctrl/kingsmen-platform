export interface JarvisAppRoutePlanV1 {
  readonly planRef: string;
  readonly commandRef: string;
  readonly appRef: string;
  readonly routeTrust: string;
  readonly routeDecision: string;
  readonly dryRun: boolean;
  readonly founderApprovalRequired: boolean;
  readonly evidenceRequired: boolean;
  readonly safeSummary: string;
}
