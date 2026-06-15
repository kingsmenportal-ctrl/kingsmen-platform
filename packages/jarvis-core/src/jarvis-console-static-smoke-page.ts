import { jarvisCreateFounderConsoleStaticHtml } from './jarvis-founder-console-static-html';
import { jarvisComposeConsoleFixtures } from './jarvis-console-fixture-composer';

export type JarvisConsoleStaticSmokePage = {
  pageId: string;
  title: string;
  html: string;
  fixtureId: string;
  readOnly: true;
};

export function jarvisCreateConsoleStaticSmokePage(): JarvisConsoleStaticSmokePage {
  const fixture = jarvisComposeConsoleFixtures();

  return {
    pageId: 'jarvis-console-static-smoke-page',
    title: 'Kingsmen Jarvis Founder Console Smoke Page',
    html: jarvisCreateFounderConsoleStaticHtml(),
    fixtureId: fixture.fixtureId,
    readOnly: true,
  };
}
