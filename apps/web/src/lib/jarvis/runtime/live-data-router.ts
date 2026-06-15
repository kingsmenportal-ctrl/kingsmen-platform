export type LiveDataRouteId =
  | 'web_research_live'
  | 'github_live'
  | 'system_health_live'
  | 'postgres_read_model_live'
  | 'playwright_scout_live'
  | 'utility_api_live'
  | 'source_registry_snapshot_live'
  | 'manual_review_live';

export interface LiveDataRouteDecision {
  routeId: LiveDataRouteId;
  freshnessRequired: boolean;
  reason: string;
}

export function decideLiveDataRoute(input: string): LiveDataRouteDecision {
  const text = input.toLowerCase();

  if (text.includes('github') || text.includes('repo') || text.includes('issue') || text.includes('commit')) {
    return { routeId: 'github_live', freshnessRequired: true, reason: 'Repository state must be live.' };
  }

  if (text.includes('portal') || text.includes('screenshot') || text.includes('captcha') || text.includes('otp')) {
    return { routeId: 'playwright_scout_live', freshnessRequired: true, reason: 'Portal state requires live scout evidence.' };
  }

  if (text.includes('health') || text.includes('status') || text.includes('online')) {
    return { routeId: 'system_health_live', freshnessRequired: true, reason: 'System status requires live health route.' };
  }

  if (text.includes('database') || text.includes('postgres') || text.includes('queue')) {
    return { routeId: 'postgres_read_model_live', freshnessRequired: true, reason: 'Operational summary requires read model route.' };
  }

  if (text.includes('weather') || text.includes('time') || text.includes('finance') || text.includes('price')) {
    return { routeId: 'utility_api_live', freshnessRequired: true, reason: 'Utility fact requires live utility route.' };
  }

  if (text.includes('deadline') || text.includes('fee') || text.includes('job') || text.includes('learnership') || text.includes('latest')) {
    return { routeId: 'web_research_live', freshnessRequired: true, reason: 'Current public fact requires web research route.' };
  }

  return { routeId: 'source_registry_snapshot_live', freshnessRequired: false, reason: 'Snapshot route is enough unless current facts are requested.' };
}
