export type JarvisHudPanelDataFixture = {
  readonly panelRef: string;
  readonly label: string;
  readonly stage: 'idle' | 'planning' | 'review' | 'validation' | 'blocked';
  readonly safeSummary: string;
  readonly updatedAtIso: string;
};

export const jarvisCreateHudPanelDataFixture = (): JarvisHudPanelDataFixture => ({
  panelRef: 'jarvis-hud-panel-fixture-001',
  label: 'Kingsmen Jarvis HUD',
  stage: 'planning',
  safeSummary: 'Jarvis live build panel fixture for founder console smoke checks.',
  updatedAtIso: '2026-06-15T00:00:00.000Z',
});
