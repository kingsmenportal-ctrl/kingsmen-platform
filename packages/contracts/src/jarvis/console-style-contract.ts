export type JarvisConsoleStyleContract = {
  contractId: string;
  surface: 'founder-console';
  layout: 'single-column-mobile-first';
  minimumTouchTargetPx: number;
  requiresReadableContrast: true;
  requiresKeyboardNavigation: true;
  safeSummary: string;
};

export const jarvisConsoleStyleContract: JarvisConsoleStyleContract = {
  contractId: 'jarvis-console-style-contract',
  surface: 'founder-console',
  layout: 'single-column-mobile-first',
  minimumTouchTargetPx: 44,
  requiresReadableContrast: true,
  requiresKeyboardNavigation: true,
  safeSummary: 'Founder console style contract for readable, mobile-first, keyboard-friendly Jarvis HUD views.',
};
