import { jarvisCreateHudPanelDataFixture } from './jarvis-hud-panel-data-fixture';
import { jarvisCreateReviewQueueFixture } from './jarvis-review-queue-fixture';
import { jarvisCreateValidationReportFixture } from './jarvis-validation-report-fixture';

export type JarvisConsoleFixtureComposer = {
  fixtureId: string;
  createdFor: 'founder-console-smoke';
  hudPanels: ReturnType<typeof jarvisCreateHudPanelDataFixture>;
  reviewQueue: ReturnType<typeof jarvisCreateReviewQueueFixture>;
  validationReports: ReturnType<typeof jarvisCreateValidationReportFixture>;
};

export function jarvisComposeConsoleFixtures(): JarvisConsoleFixtureComposer {
  return {
    fixtureId: 'jarvis-console-fixture-composer',
    createdFor: 'founder-console-smoke',
    hudPanels: jarvisCreateHudPanelDataFixture(),
    reviewQueue: jarvisCreateReviewQueueFixture(),
    validationReports: jarvisCreateValidationReportFixture(),
  };
}
