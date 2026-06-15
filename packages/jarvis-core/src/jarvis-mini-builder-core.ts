import type { JarvisCommandEnvelope } from '../../contracts/src/jarvis';
import { jarvisMakeRef } from '../../contracts/src/jarvis';
import { jarvisPlanCommandRun, type JarvisCommandRunResult } from './jarvis-command-runner';

export type JarvisFileChangeKind = 'create' | 'update' | 'delete_denied' | 'validate_only';

export interface JarvisBuildTask {
  readonly taskRef: string;
  readonly moduleRef: string;
  readonly safeGoal: string;
  readonly scopeRoot: string;
  readonly requestedFiles: readonly string[];
  readonly validatorCommands: readonly string[];
  readonly productionRisk: boolean;
}

export interface JarvisFileChangeIntent {
  readonly path: string;
  readonly changeKind: JarvisFileChangeKind;
  readonly safeReason: string;
}

export interface JarvisMiniBuildPlan {
  readonly planRef: string;
  readonly commandRef: string;
  readonly taskRef: string;
  readonly moduleRef: string;
  readonly scopeRoot: string;
  readonly policy: JarvisCommandRunResult;
  readonly fileIntents: readonly JarvisFileChangeIntent[];
  readonly validatorCommands: readonly string[];
  readonly blockedPaths: readonly string[];
  readonly readyForPatchWriter: boolean;
  readonly safeSummary: string;
}

const BLOCKED_PATH_PARTS = [
  '.env',
  'node_modules',
  '.git',
  'secrets',
  'credentials',
  '.pem',
  '.key',
  '.p12',
  '.pfx'
];

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').trim();
}

function isPathInsideScope(path: string, scopeRoot: string): boolean {
  const safePath = normalizePath(path);
  const safeScope = normalizePath(scopeRoot).replace(/\/$/, '');
  return safePath === safeScope || safePath.startsWith(`${safeScope}/`);
}

function isBlockedPath(path: string): boolean {
  const lower = normalizePath(path).toLowerCase();
  return lower.startsWith('/') || lower.includes('..') || BLOCKED_PATH_PARTS.some((part) => lower.includes(part));
}

function assertBuildTask(task: JarvisBuildTask): void {
  if (!task.taskRef.trim()) throw new Error('JARVIS_BUILD_TASK_REF_REQUIRED');
  if (!task.moduleRef.trim()) throw new Error('JARVIS_BUILD_MODULE_REF_REQUIRED');
  if (!task.safeGoal.trim()) throw new Error('JARVIS_BUILD_SAFE_GOAL_REQUIRED');
  if (!task.scopeRoot.trim()) throw new Error('JARVIS_BUILD_SCOPE_ROOT_REQUIRED');
  if (task.requestedFiles.length === 0) throw new Error('JARVIS_BUILD_FILES_REQUIRED');
  if (task.validatorCommands.length === 0) throw new Error('JARVIS_BUILD_VALIDATOR_REQUIRED');
}

export function jarvisCreateMiniBuildPlan(input: {
  readonly command: JarvisCommandEnvelope;
  readonly task: JarvisBuildTask;
}): JarvisMiniBuildPlan {
  assertBuildTask(input.task);

  const policy = jarvisPlanCommandRun({
    command: input.command,
    toolRef: 'jarvis.patch.writer'
  });

  const blockedPaths: string[] = [];
  const fileIntents: JarvisFileChangeIntent[] = [];

  for (const requestedFile of input.task.requestedFiles) {
    const path = normalizePath(requestedFile);
    const blocked = isBlockedPath(path) || !isPathInsideScope(path, input.task.scopeRoot);

    if (blocked) {
      blockedPaths.push(path);
      fileIntents.push({
        path,
        changeKind: 'delete_denied',
        safeReason: 'Path is outside approved scope or matches a protected path pattern.'
      });
      continue;
    }

    fileIntents.push({
      path,
      changeKind: path.endsWith('.md') || path.endsWith('.json') || path.endsWith('.ts') || path.endsWith('.mjs') ? 'update' : 'validate_only',
      safeReason: `Path is inside approved module scope ${input.task.scopeRoot}.`
    });
  }

  const readyForPatchWriter =
    blockedPaths.length === 0 &&
    policy.decision.decision !== 'BLOCK' &&
    policy.decision.decision !== 'APPROVAL_REQUIRED' &&
    !input.task.productionRisk;

  return {
    planRef: jarvisMakeRef('jarvis_plan', `${input.task.moduleRef}_${input.command.commandRef}`),
    commandRef: input.command.commandRef,
    taskRef: input.task.taskRef,
    moduleRef: input.task.moduleRef,
    scopeRoot: normalizePath(input.task.scopeRoot),
    policy,
    fileIntents,
    validatorCommands: input.task.validatorCommands,
    blockedPaths,
    readyForPatchWriter,
    safeSummary: readyForPatchWriter
      ? `Mini build plan is ready for scoped patch writing for ${input.task.moduleRef}.`
      : `Mini build plan requires review before patch writing for ${input.task.moduleRef}.`
  };
}
