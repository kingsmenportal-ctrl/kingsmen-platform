import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

export type JarvisLocalInstallStatus = 'installed' | 'missing' | 'unknown';

export type JarvisLocalInstallItem = {
  id: string;
  name: string;
  nStep: string;
  repository: string;
  category: 'document_parser' | 'browser_runtime' | 'voice_runtime' | 'security_scanner';
  status: JarvisLocalInstallStatus;
  checkMethod: string;
  command: string;
  version: string | null;
  reason: string;
  safety: {
    noInstall: true;
    noMutation: true;
    noSecretOutput: true;
    allowlistedCheckOnly: true;
  };
};

export type JarvisLocalInstallationReadiness = {
  ok: true;
  mode: 'jarvis_local_installation_readiness';
  doctrine: {
    authority: string;
    checkBoundary: string;
    noInstall: string;
  };
  summary: {
    total: number;
    installed: number;
    missing: number;
    unknown: number;
    checkedAt: string;
  };
  items: JarvisLocalInstallItem[];
};

type SafeCommandResult = {
  ok: boolean;
  output: string;
};

function safeExec(command: string, args: string[], timeoutMs = 2200): SafeCommandResult {
  try {
    const output = execFileSync(command, args, {
      encoding: 'utf8',
      timeout: timeoutMs,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        PATH: process.env.PATH,
        SystemRoot: process.env.SystemRoot,
        COMSPEC: process.env.COMSPEC
      }
    });

    return {
      ok: true,
      output: sanitizeOutput(output)
    };
  } catch {
    return {
      ok: false,
      output: ''
    };
  }
}

function sanitizeOutput(value: string): string {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/[A-Za-z]:\\[^\s]+/g, '[local-path]')
    .replace(/\/[^\s]+/g, '[local-path]')
    .slice(0, 140);
}

function installedItem(base: Omit<JarvisLocalInstallItem, 'status' | 'version' | 'reason' | 'safety'>, version: string | null, reason: string): JarvisLocalInstallItem {
  return {
    ...base,
    status: 'installed',
    version,
    reason,
    safety: safetyFlags()
  };
}

function missingItem(base: Omit<JarvisLocalInstallItem, 'status' | 'version' | 'reason' | 'safety'>, reason: string): JarvisLocalInstallItem {
  return {
    ...base,
    status: 'missing',
    version: null,
    reason,
    safety: safetyFlags()
  };
}

function unknownItem(base: Omit<JarvisLocalInstallItem, 'status' | 'version' | 'reason' | 'safety'>, reason: string): JarvisLocalInstallItem {
  return {
    ...base,
    status: 'unknown',
    version: null,
    reason,
    safety: safetyFlags()
  };
}

function safetyFlags() {
  return {
    noInstall: true as const,
    noMutation: true as const,
    noSecretOutput: true as const,
    allowlistedCheckOnly: true as const
  };
}

function checkPythonModule(base: Omit<JarvisLocalInstallItem, 'status' | 'version' | 'reason' | 'safety'>, moduleName: string): JarvisLocalInstallItem {
  const script = `import importlib.util; print('present' if importlib.util.find_spec('${moduleName}') else 'missing')`;
  const python = safeExec('python', ['-c', script]);
  if (python.ok) {
    return python.output.includes('present')
      ? installedItem(base, 'python-module-present', `${moduleName} is importable in the active Python environment.`)
      : missingItem(base, `${moduleName} is not importable in the active Python environment.`);
  }

  const py = safeExec('py', ['-c', script]);
  if (py.ok) {
    return py.output.includes('present')
      ? installedItem(base, 'python-module-present', `${moduleName} is importable through py launcher.`)
      : missingItem(base, `${moduleName} is not importable through py launcher.`);
  }

  return unknownItem(base, 'Python was not available to complete this package check.');
}

function checkBinary(base: Omit<JarvisLocalInstallItem, 'status' | 'version' | 'reason' | 'safety'>, command: string, args: string[]): JarvisLocalInstallItem {
  const result = safeExec(command, args);
  if (!result.ok) return missingItem(base, `${command} did not respond to the allowlisted readiness command.`);
  return installedItem(base, result.output || 'installed', `${command} responded to the allowlisted readiness command.`);
}

function checkPlaywrightPackage(): JarvisLocalInstallItem {
  const base = {
    id: 'playwright-browser-runtime',
    name: 'Playwright Browser Runtime',
    nStep: 'N21.3',
    repository: 'microsoft/playwright',
    category: 'browser_runtime' as const,
    checkMethod: 'node require plus chromium executable-path existence check',
    command: 'node -e require(playwright) readiness script'
  };

  const script = [
    "const fs=require('fs');",
    "const pkg=require('playwright/package.json');",
    "const { chromium }=require('playwright');",
    "const p=chromium.executablePath();",
    "console.log(fs.existsSync(p)?`present ${pkg.version}`:`package-only ${pkg.version}`);"
  ].join('');

  const result = safeExec('node', ['-e', script]);
  if (!result.ok) return missingItem(base, 'Playwright package is not importable from the active web runtime.');
  if (result.output.includes('present')) return installedItem(base, result.output, 'Playwright package and Chromium executable path are present.');
  return unknownItem(base, 'Playwright package is present but browser executable was not confirmed. Run playwright install only when approved.');
}

export async function buildJarvisLocalInstallationReadiness(): Promise<JarvisLocalInstallationReadiness> {
  const checkedAt = new Date().toISOString();

  const items: JarvisLocalInstallItem[] = [
    checkPythonModule({
      id: 'docling-runtime',
      name: 'Docling Runtime',
      nStep: 'N21.2',
      repository: 'DS4SD/docling',
      category: 'document_parser',
      checkMethod: 'python importlib package presence',
      command: 'python -c importlib.util.find_spec'
    }, 'docling'),
    checkPlaywrightPackage(),
    checkPythonModule({
      id: 'openwakeword-runtime',
      name: 'openWakeWord Runtime',
      nStep: 'N21.4',
      repository: 'dscripka/openWakeWord',
      category: 'voice_runtime',
      checkMethod: 'python importlib package presence',
      command: 'python -c importlib.util.find_spec'
    }, 'openwakeword'),
    checkBinary({
      id: 'whisper-cpp-runtime',
      name: 'whisper.cpp Runtime',
      nStep: 'N21.4',
      repository: 'ggml-org/whisper.cpp',
      category: 'voice_runtime',
      checkMethod: 'local binary version command',
      command: 'whisper-cli --help'
    }, 'whisper-cli', ['--help']),
    checkBinary({
      id: 'piper-runtime',
      name: 'Piper Runtime',
      nStep: 'N21.4',
      repository: 'OHF-Voice/piper1-gpl',
      category: 'voice_runtime',
      checkMethod: 'local binary version command',
      command: 'piper --version'
    }, 'piper', ['--version']),
    checkBinary({
      id: 'gitleaks-runtime',
      name: 'gitleaks Runtime',
      nStep: 'N21.6',
      repository: 'gitleaks/gitleaks',
      category: 'security_scanner',
      checkMethod: 'local binary version command',
      command: 'gitleaks version'
    }, 'gitleaks', ['version']),
    checkBinary({
      id: 'trivy-runtime',
      name: 'Trivy Runtime',
      nStep: 'N21.6',
      repository: 'aquasecurity/trivy',
      category: 'security_scanner',
      checkMethod: 'local binary version command',
      command: 'trivy --version'
    }, 'trivy', ['--version']),
    checkBinary({
      id: 'semgrep-runtime',
      name: 'Semgrep Runtime',
      nStep: 'N21.6',
      repository: 'semgrep/semgrep',
      category: 'security_scanner',
      checkMethod: 'local binary version command',
      command: 'semgrep --version'
    }, 'semgrep', ['--version'])
  ];

  const installed = items.filter((item) => item.status === 'installed').length;
  const missing = items.filter((item) => item.status === 'missing').length;
  const unknown = items.filter((item) => item.status === 'unknown').length;

  return {
    ok: true,
    mode: 'jarvis_local_installation_readiness',
    doctrine: {
      authority: 'Kingsmen backend and PostgreSQL evidence remain authority; this checker is a local readiness readout only.',
      checkBoundary: 'Allowlisted local version and package-presence checks only. It does not scan files, read private env values, or run installer commands.',
      noInstall: 'No install, update, repair, mutation, commit, push, or deployment block is performed by this readiness checker.'
    },
    summary: {
      total: items.length,
      installed,
      missing,
      unknown,
      checkedAt
    },
    items
  };
}
