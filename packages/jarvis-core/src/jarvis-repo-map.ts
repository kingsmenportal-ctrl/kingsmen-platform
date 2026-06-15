export interface JarvisRepoMapInput {
  readonly moduleRef: string;
  readonly scopeRoot: string;
  readonly candidateFiles: readonly string[];
  readonly maxFiles: number;
}

export interface JarvisRepoMapResult {
  readonly moduleRef: string;
  readonly scopeRoot: string;
  readonly selectedFiles: readonly string[];
  readonly ignoredFiles: readonly string[];
  readonly blockedFiles: readonly string[];
  readonly safeSummary: string;
}

const DEFAULT_BLOCKED_PATTERNS = [
  '.env',
  '.git/',
  'node_modules/',
  'secrets/',
  'credentials/',
  '.pem',
  '.key',
  '.p12',
  '.pfx'
];

const DEFAULT_LOW_VALUE_PATTERNS = [
  'dist/',
  'coverage/',
  '.next/',
  '.cache/',
  '.tsbuildinfo',
  '.log'
];

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').trim();
}

function insideScope(path: string, scopeRoot: string): boolean {
  const safePath = normalizePath(path);
  const safeScope = normalizePath(scopeRoot).replace(/\/$/, '');
  return safePath === safeScope || safePath.startsWith(`${safeScope}/`);
}

function matchesAny(path: string, patterns: readonly string[]): boolean {
  const lower = normalizePath(path).toLowerCase();
  return patterns.some((pattern) => lower.includes(pattern.toLowerCase()));
}

function scoreFile(path: string, moduleRef: string): number {
  const lower = normalizePath(path).toLowerCase();
  let score = 0;
  if (lower.includes(moduleRef.toLowerCase())) score += 20;
  if (lower.endsWith('.ts') || lower.endsWith('.tsx')) score += 10;
  if (lower.endsWith('.mjs') || lower.endsWith('.js')) score += 8;
  if (lower.endsWith('.json')) score += 6;
  if (lower.endsWith('.md')) score += 4;
  if (lower.includes('/src/')) score += 5;
  if (lower.includes('/validators/')) score += 5;
  if (lower.includes('/manifests/')) score += 3;
  return score;
}

export function jarvisSelectRepoContext(input: JarvisRepoMapInput): JarvisRepoMapResult {
  if (!input.moduleRef.trim()) throw new Error('JARVIS_REPO_MAP_MODULE_REQUIRED');
  if (!input.scopeRoot.trim()) throw new Error('JARVIS_REPO_MAP_SCOPE_REQUIRED');
  if (input.maxFiles < 1) throw new Error('JARVIS_REPO_MAP_MAX_FILES_REQUIRED');

  const blockedFiles: string[] = [];
  const ignoredFiles: string[] = [];
  const eligible: string[] = [];

  for (const rawFile of input.candidateFiles) {
    const file = normalizePath(rawFile);
    if (!insideScope(file, input.scopeRoot) || matchesAny(file, DEFAULT_BLOCKED_PATTERNS)) {
      blockedFiles.push(file);
      continue;
    }

    if (matchesAny(file, DEFAULT_LOW_VALUE_PATTERNS)) {
      ignoredFiles.push(file);
      continue;
    }

    eligible.push(file);
  }

  const selectedFiles = eligible
    .sort((a, b) => scoreFile(b, input.moduleRef) - scoreFile(a, input.moduleRef) || a.localeCompare(b))
    .slice(0, input.maxFiles);

  return {
    moduleRef: input.moduleRef,
    scopeRoot: normalizePath(input.scopeRoot),
    selectedFiles,
    ignoredFiles,
    blockedFiles,
    safeSummary: `Selected ${selectedFiles.length} file(s) for ${input.moduleRef}; blocked ${blockedFiles.length}; ignored ${ignoredFiles.length}.`
  };
}
