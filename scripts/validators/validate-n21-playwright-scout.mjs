import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const requiredFiles = [
  'apps/web/src/lib/public-repos/live/adapters/PlaywrightScoutGateway.contract.ts',
  'apps/web/src/lib/routes/scout/RouteScoutService.ts',
  'apps/web/src/app/api/routes/scout/route.ts',
  'apps/web/src/app/api/jarvis/public-repos/playwright-scout/route.ts',
  'apps/web/src/lib/public-repos/live/adapters/index.ts',
  'apps/web/src/lib/public-repos/live/adapters/README.md'
];

const requiredContent = [
  ['apps/web/src/lib/public-repos/live/adapters/PlaywrightScoutGateway.contract.ts', 'maySubmit: false'],
  ['apps/web/src/lib/public-repos/live/adapters/PlaywrightScoutGateway.contract.ts', 'captcha_bypass'],
  ['apps/web/src/lib/routes/scout/RouteScoutService.ts', 'scoutRouteSource'],
  ['apps/web/src/lib/routes/scout/RouteScoutService.ts', 'playwright_page_probe'],
  ['apps/web/src/lib/routes/scout/RouteScoutService.ts', 'mayBypassCaptcha: false'],
  ['apps/web/src/lib/routes/scout/RouteScoutService.ts', 'manual_review'],
  ['apps/web/src/app/api/routes/scout/route.ts', 'No submit'],
  ['apps/web/src/app/api/jarvis/public-repos/playwright-scout/route.ts', 'PlaywrightScoutGateway'],
  ['apps/web/src/lib/public-repos/live/adapters/index.ts', 'PlaywrightScoutGateway.contract']
];

const results = [];
let passed = true;

for (const file of requiredFiles) {
  const ok = fs.existsSync(path.join(root, file));
  results.push({ check: 'file_exists', file, ok });
  if (!ok) passed = false;
}

for (const [file, needle] of requiredContent) {
  const full = path.join(root, file);
  const content = fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : '';
  const ok = content.includes(needle);
  results.push({ check: 'content_contains', file, needle, ok });
  if (!ok) passed = false;
}

const report = {
  validator: 'validate-n21-playwright-scout',
  passed,
  checkedAt: new Date().toISOString(),
  summary: {
    files: requiredFiles.length,
    contentChecks: requiredContent.length
  },
  results
};

const reportDir = path.join(root, 'reports', 'validation');
fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, 'n21-playwright-scout-latest.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(passed ? 0 : 1);
