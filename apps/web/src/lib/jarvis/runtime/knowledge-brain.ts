export interface KnowledgeBrainRequest {
  query: string;
  domainHint?: string;
}

export interface KnowledgeBrainPlan {
  shouldRetrieve: boolean;
  preferredDomains: string[];
  reason: string;
}

export function planKnowledgeRetrieval(request: KnowledgeBrainRequest): KnowledgeBrainPlan {
  const text = request.query.toLowerCase();
  const preferredDomains: string[] = [];

  if (text.includes('jarvis') || text.includes('pj42') || text.includes('pj43')) preferredDomains.push('pj42_jarvis_law_package');
  if (text.includes('n-series') || text.includes('n00') || text.includes('n04')) preferredDomains.push('n_series_architecture');
  if (text.includes('workflow') || text.includes('w00') || text.includes('w24')) preferredDomains.push('workflow_registry');
  if (text.includes('pricing') || text.includes('package')) preferredDomains.push('pricing_business_pack');
  if (text.includes('route') || text.includes('cao') || text.includes('nsfas')) preferredDomains.push('route_universe_public_sources');
  if (text.includes('github') || text.includes('file') || text.includes('issue')) preferredDomains.push('github_build_evidence');

  if (request.domainHint) preferredDomains.unshift(request.domainHint);

  return {
    shouldRetrieve: preferredDomains.length > 0,
    preferredDomains: [...new Set(preferredDomains)],
    reason: preferredDomains.length > 0 ? 'Kingsmen-specific query detected.' : 'No Kingsmen knowledge domain required.',
  };
}
