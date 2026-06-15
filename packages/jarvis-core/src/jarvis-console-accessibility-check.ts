import { jarvisConsoleStyleContract } from '../../contracts/src/jarvis/console-style-contract';

export type JarvisConsoleAccessibilityCheck = {
  checkId: string;
  surface: 'founder-console';
  passed: boolean;
  checks: Array<{
    name: string;
    passed: boolean;
    summary: string;
  }>;
};

export function jarvisRunConsoleAccessibilityCheck(): JarvisConsoleAccessibilityCheck {
  const checks = [
    {
      name: 'mobile-first-layout',
      passed: jarvisConsoleStyleContract.layout === 'single-column-mobile-first',
      summary: 'Founder console uses a mobile-first single-column layout contract.',
    },
    {
      name: 'touch-target-size',
      passed: jarvisConsoleStyleContract.minimumTouchTargetPx >= 44,
      summary: 'Touch target minimum is at least 44px.',
    },
    {
      name: 'keyboard-navigation',
      passed: jarvisConsoleStyleContract.requiresKeyboardNavigation === true,
      summary: 'Founder console requires keyboard navigation support.',
    },
  ];

  return {
    checkId: 'jarvis-console-accessibility-check',
    surface: 'founder-console',
    passed: checks.every((check) => check.passed),
    checks,
  };
}
