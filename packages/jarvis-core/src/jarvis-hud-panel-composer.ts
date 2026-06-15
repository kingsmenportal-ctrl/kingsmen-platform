export type JarvisHudPanelSummary = {
  readonly panelRef: string;
  readonly title: string;
  readonly priority: 'low' | 'normal' | 'attention' | 'blocked';
  readonly safeSummary: string;
  readonly itemCount: number;
};

export type JarvisHudPanelComposerInput = {
  readonly composerRef: string;
  readonly routeRef: string;
  readonly panels: readonly JarvisHudPanelSummary[];
};

export type JarvisHudPanelComposition = {
  readonly composerRef: string;
  readonly routeRef: string;
  readonly mode: 'read_only_hud_composition';
  readonly panelCount: number;
  readonly attentionCount: number;
  readonly blockedCount: number;
  readonly orderedPanels: readonly JarvisHudPanelSummary[];
};

const priorityWeight: Record<JarvisHudPanelSummary['priority'], number> = {
  blocked: 0,
  attention: 1,
  normal: 2,
  low: 3,
};

export function jarvisComposeHudPanels(input: JarvisHudPanelComposerInput): JarvisHudPanelComposition {
  const orderedPanels = [...input.panels].sort((left, right) => {
    const byPriority = priorityWeight[left.priority] - priorityWeight[right.priority];
    return byPriority === 0 ? left.title.localeCompare(right.title) : byPriority;
  });

  return {
    composerRef: input.composerRef,
    routeRef: input.routeRef,
    mode: 'read_only_hud_composition',
    panelCount: orderedPanels.length,
    attentionCount: orderedPanels.filter((panel) => panel.priority === 'attention').length,
    blockedCount: orderedPanels.filter((panel) => panel.priority === 'blocked').length,
    orderedPanels,
  };
}

export const JARVIS_HUD_PANEL_COMPOSER_LIVE = true;
