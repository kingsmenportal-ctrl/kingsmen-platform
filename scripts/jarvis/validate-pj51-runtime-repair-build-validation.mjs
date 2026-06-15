#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const auditPath = path.join(root, 'manifests', 'jarvis', 'pj51-runtime-file-audit.json');
const buildPath = path.join(root, 'manifests', 'jarvis', 'pj51-build-validation.json');
const repairPath = path.join(root, 'manifests', 'jarvis', 'pj51-deferred-repair-tracker.json');
const validationPath = path.join(root, 'manifests', 'jarvis', 'pj51-runtime-repair-build-validation-validation.json');
const runtimeIndexPath = path.join(root, 'apps', 'web', 'src', 'lib', 'jarvis', 'runtime', 'index.ts');
const webPackagePath = path.join(root, 'apps', 'web', 'package.json');
const webTsconfigPath = path.join(root, 'apps', 'web', 'tsconfig.json');

function readText(filePath) {
  if (!existsSync(filePath)) throw new Error(`Missing file: ${path.relative(root, filePath)}`);
  return readFileSync(filePath, 'utf8');
}

function readJson(filePath) {
  return JSON.parse(readText(filePath));
}

function fail(message) {
  console.error(`PJ51 VALIDATION FAILED: ${message}`);
  process.exitCode = 1;
}

function main() {
  const audit = readJson(auditPath);
  const build = readJson(buildPath);
  const repairs = readJson(repairPath);
  const validation = readJson(validationPath);

  for (const file of validation.required_files || []) {
    if (!existsSync(path.join(root, file))) fail(`Required validation file missing: ${file}`);
  }

  for (const file of audit.required_files || []) {
    if (!existsSync(path.join(root, file))) fail(`Runtime audit file missing: ${file}`);
  }

  const runtimeIndex = readText(runtimeIndexPath);
  for (const requiredExport of audit.required_runtime_exports || []) {
    if (!runtimeIndex.includes(requiredExport)) fail(`Runtime index missing export marker: ${requiredExport}`);
  }

  const webPackage = readJson(webPackagePath);
  if (!webPackage.scripts || !webPackage.scripts.build) fail('apps/web/package.json must expose scripts.build.');

  const webTsconfig = readJson(webTsconfigPath);
  if (webTsconfig.compilerOptions?.strict !== true) fail('apps/web/tsconfig.json must keep strict true.');
  if (webTsconfig.compilerOptions?.noEmit !== true) fail('apps/web/tsconfig.json must keep noEmit true.');

  for (const routePath of audit.required_api_routes || []) {
    if (!existsSync(path.join(root, routePath))) fail(`Required API route missing: ${routePath}`);
  }

  if (!Array.isArray(repairs.items) || repairs.items.length === 0) fail('Deferred repair tracker must list repair items.');
  if (!Array.isArray(build.runtime_build_checks) || build.runtime_build_checks.length === 0) fail('Build validation manifest must list runtime build checks.');

  if (process.exitCode) return;

  console.log('PJ51 VALIDATION PASSED');
  console.log(`Runtime files checked: ${(audit.required_files || []).length}`);
  console.log(`Runtime exports checked: ${(audit.required_runtime_exports || []).length}`);
  console.log(`Deferred repairs tracked: ${(repairs.items || []).length}`);
  console.log('Web build script: present');
}

main();
