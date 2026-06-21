#!/usr/bin/env node
const target = process.argv[2] || 'script';
const report = {
  schema: 'kingsmen.no-shell-adapter.v1',
  target,
  status: 'NO_SHELL_ADAPTER_NOT_IMPLEMENTED_FOR_TARGET',
  passed: false,
  productionReady: false,
  publicLaunchAllowed: false,
  nextAction: 'Use a Node-native adapter for this target before relying on it for launch evidence.',
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
process.exit(1);
