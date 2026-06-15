export interface JarvisConsoleViewModelAssemblerInput {
  readonly sourceRef: string;
  readonly status: 'ready' | 'partial' | 'empty';
  readonly generatedAt: string;
  readonly hudPanelCount: number;
  readonly reviewItemCount: number;
  readonly validationReportCount: number;
  readonly buildSessionCount: number;
  readonly safeSummary: string;
}

export interface JarvisConsoleViewModel {
  readonly viewRef: string;
  readonly title: 'Kingsmen Jarvis Founder Console';
  readonly status: 'ready' | 'partial' | 'empty';
  readonly generatedAt: string;
  readonly counts: {
    readonly hudPanels: number;
    readonly reviewItems: number;
    readonly validationReports: number;
    readonly buildSessions: number;
  };
  readonly safeSummary: string;
}

export function jarvisAssembleConsoleViewModel(input: JarvisConsoleViewModelAssemblerInput): JarvisConsoleViewModel {
  return {
    viewRef: `jarvis-console-view-${input.sourceRef}`,
    title: 'Kingsmen Jarvis Founder Console',
    status: input.status,
    generatedAt: input.generatedAt,
    counts: {
      hudPanels: input.hudPanelCount,
      reviewItems: input.reviewItemCount,
      validationReports: input.validationReportCount,
      buildSessions: input.buildSessionCount,
    },
    safeSummary: input.safeSummary,
  };
}

export const JARVIS_CONSOLE_VIEW_MODEL_ASSEMBLER = 'JarvisConsoleViewModelAssembler';
