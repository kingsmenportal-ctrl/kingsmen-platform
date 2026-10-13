const message = {
  schema: "kingsmen.runtime-evidence-prerequisite.v1",
  status: "pending_external_runtime_access",
  passed: false,
  productionReady: false,
  publicLaunchAllowed: false,
  reason: "This command requires real staging credentials, external service access, or a human review. Source checks and mocks are not runtime proof.",
  action: "Configure credentials through protected staging settings, run the named real acceptance journey, then write a redacted evidence report. Never place secret values in reports."
};
console.error(JSON.stringify(message, null, 2));
process.exitCode = 2;
