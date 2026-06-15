#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => JSON.parse(readFileSync(path.join(root, p), 'utf8'));
let failed = false;
const fail = (m) => { console.error(`PJ42 CLOSEOUT FAILED: ${m}`); failed = true; };

const validation = read('manifests/jarvis/pj42-closeout-validation.json');
const assembly = read('manifests/jarvis/pj42-real-jarvis-kernel-assembly.json');
const modules = read('manifests/jarvis/pj42-runtime-module-map.json');
const suite = read('manifests/jarvis/pj42-validator-suite.json');
const order = read('manifests/jarvis/pj42-to-pj43-build-order.json');

for (const file of validation.required_files || []) {
  if (!existsSync(path.join(root, file))) fail(`missing required file: ${file}`);
}

const phases = new Set((assembly.required_layers || []).map((x) => x.phase));
for (const phase of validation.required_phases || []) {
  if (!phases.has(phase)) fail(`missing phase: ${phase}`);
}

if (!Array.isArray(assembly.kernel_flow) || assembly.kernel_flow.length < 5) fail('kernel flow incomplete');
if (!Array.isArray(modules.runtime_modules) || modules.runtime_modules.length < 5) fail('runtime module map incomplete');
if (!Array.isArray(suite.validators) || suite.validators.length < 5) fail('validator suite incomplete');
if (!Array.isArray(order.build_order) || order.build_order.length < 5) fail('build order incomplete');

for (const validator of suite.validators || []) {
  if (!existsSync(path.join(root, validator))) fail(`missing validator: ${validator}`);
}

const steps = (order.build_order || []).map((x) => x.step);
const sorted = [...steps].sort((a, b) => a - b);
if (JSON.stringify(steps) !== JSON.stringify(sorted)) fail('build order steps not sorted');
if (order.next_phase !== 'PJ43 Jarvis Runtime Implementation') fail('wrong next phase in build order');
if (assembly.next_phase !== 'PJ43 Jarvis Runtime Implementation') fail('wrong next phase in assembly');

if (failed) process.exit(1);
console.log('PJ42 CLOSEOUT VALIDATION PASSED');
console.log(`phases: ${phases.size}`);
console.log(`modules: ${modules.runtime_modules.length}`);
console.log(`validators: ${suite.validators.length}`);
console.log(`build steps: ${order.build_order.length}`);
console.log('next: PJ43 Jarvis Runtime Implementation');
