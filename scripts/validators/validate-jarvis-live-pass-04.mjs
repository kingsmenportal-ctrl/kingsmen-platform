import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const reportDir = path.join(root, 'reports', 'jarvis');
fs.mkdirSync(reportDir, { recursive: true });

const checks = [
  {
    file: 'packages/contracts/src/jarvis/review-record.ts',
    tokens: ['JarvisFounderReviewRecordSafeName', 'jarvisReviewRecordRequiresFounder'],
  },
  {
    file: 'packages/contracts/src/jarvis/safe-work-plan.ts',
    tokens: ['JarvisSafeWorkPlanWithoutCommandText', 'jarvisSafeWorkPlanIsScoped'],
  },
  {
    file: 'packages/jarvis-core/src/jarvis-safe-review-record.ts',
    tokens: ['jarvisCreateFounderReviewRecordSafeName'],
  },
  {
    file: 'packages/jarvis-core/src/jarvis-planned-scope.ts',
    tokens: ['JarvisPlannedScope', 'jarvisCreatePlannedScope'],
  },
  {
    file: 'packages/jarvis-core/src/jarvis-hud-api-route.ts',
    tokens: ['JarvisHudApiRoute', '/api/jarvis/hud/read'],
  },
  {
    file: 'packages/jarvis-core/src/jarvis-request-inbox-read-model.ts',
    tokens: ['JarvisRequestInboxReadModel', 'jarvisCreateRequestInboxReadModel'],
  },
  {
    file: 'packages/jarvis-core/src/jarvis-patch-review-queue.ts',
    tokens: ['JarvisPatchReviewQueueEntry', 'jarvisCreatePatchReviewQueueEntry'],
  },
  {
    file: 'packages/jarvis-core/src/jarvis-repo-change-report-view.ts',
    tokens: ['JarvisRepoChangeReportView', 'jarvisCreateRepoChangeReportView'],
  },
];

const results = checks.map((check) => {
  const fullPath = path.join(root, check.file);
  const exists = fs.existsSync(fullPath);
  const content = exists ? fs.readFileSync(fullPath, 'utf8') : '';
  const missingTokens = check.tokens.filter((token) => !content.includes(token));
  return {
    file: check.file,
    exists,
    missingTokens,
    status: exists && missingTokens.length === 0 ? 'pass' : 'fail',
  };
});

const failed = results.filter((result) => result.status === 'fail');
const report = {
  validatorRef: 'validate-jarvis-live-pass-04',
  status: failed.length === 0 ? 'pass' : 'fail',
  results,
  createdAtIso: new Date().toISOString(),
};

const reportPath = path.join(reportDir, 'validate-jarvis-live-pass-04.json');
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

if (failed.length > 0) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(report, null, 2));
