#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const reportDir = path.join(root, 'reports', 'provider');
fs.mkdirSync(reportDir, { recursive: true });

const tools = [
  { id: 'git', required: true, command: 'git', args: ['--version'] },
  { id: 'gh', required: true, command: 'gh', args: ['--version'] },
  { id: 'pwsh', required: true, command: 'pwsh', args: ['--version'] },
  { id: 'node', required: true, command: 'node', args: ['--version'] },
  { id: 'pnpm', required: true, command: 'pnpm', args: ['--version'] },
  { id: 'docker', required: true, command: 'docker', args: ['--version'] },
  { id: 'netlify', required: false, command: 'netlify', args: ['--version'] },
  { id: 'supabase', required: false, command: 'supabase', args: ['--version'] },
  { id: 'oci', required: false, command: 'oci', args: ['--version'] },
  { id: 'playwright', required: false, command: 'npx', args: ['playwright', '--version'] }
];

function check(tool) {
  const result = spawnSync(tool.command, tool.args, { encoding: 'utf8', shell: process.platform === 'win32' });
  const ok = result.status === 0;
  return {
    id: tool.id,
    required: tool.required,
    installed: ok,
    command: `${tool.command} ${tool.args.join(' ')}`,
    version: ok ? String(result.stdout || result.stderr).split('\n')[0].trim() : null,
    error: ok ? null : String(result.stderr || result.error?.message || 'not found').split('\n')[0].trim()
  };
}

const results = tools.map(check);
const missingRequired = results.filter(item => item.required && !item.installed);
const report = {
  module: 'N_PROVIDER.1',
  validator: 'validate-local-tools.mjs',
  generated_at: new Date().toISOString(),
  passed: missingRequired.length === 0,
  missing_required: missingRequired.map(item => item.id),
  tools: results,
  safety: {
    optional_tools_may_remain_missing: true,
    no_secrets_read_or_printed: true,
    install_not_performed_by_validator: true
  }
};

fs.writeFileSync(path.join(reportDir, 'local-tool-health-report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.passed ? 0 : 2);
