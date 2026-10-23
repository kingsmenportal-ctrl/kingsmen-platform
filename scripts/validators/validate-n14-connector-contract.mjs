import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { assessWebhookEnvelope, classifyConnectorFailure, validateWorkflowResult, portalFallbackDecision } from "../../apps/api/src/integrations/n14-connector-policy.mjs";

const root = process.cwd();
const manifestPath = path.join(root, "manifests/n14/integrations-workflow-connectors.json");
const migrationPath = path.join(root, "db/migrations/0012_n14_integrations_workflow_connectors.sql");
const adapterPath = path.join(root, "apps/api/src/integrations/integration-adapters.ts");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const migration = fs.readFileSync(migrationPath, "utf8");
const adapters = fs.readFileSync(adapterPath, "utf8");
const checks = [];
const check = (name, pass, detail = "") => checks.push({ name, pass: Boolean(pass), detail });
const uniqueCodes = new Set(manifest.workflow_codes);

check("manifest has workflow codes", Array.isArray(manifest.workflow_codes) && manifest.workflow_codes.length > 0);
check("workflow codes are unique", uniqueCodes.size === manifest.workflow_codes.length);
check("doctrine keeps PostgreSQL/backend authoritative", manifest.locked_doctrine.some(x => /backend.*controller|source of truth/i.test(x)));
check("n8n is thin/stateless", manifest.locked_doctrine.some(x => /n8n.*stateless thin worker/i.test(x)));
check("Airtable mirror-only boundary", manifest.locked_doctrine.some(x => /Airtable is mirror only/i.test(x)));
check("webhook authentication doctrine", manifest.locked_doctrine.some(x => /inbound webhook.*authenticated or blocked/i.test(x)));
check("migration enforces worker node count", /worker_node_count\s*=\s*8/i.test(migration));
check("migration enforces Airtable write ceiling", /airtable_write_count\s*<=\s*1/i.test(migration));
check("adapter preserves MAP fallback vocabulary", /CAPTCHA_BLOCKED/.test(adapters) && /OTP_REQUIRED/.test(adapters));

const validEnvelope = { connectorKey: "test", eventId: "evt-1", idempotencyKey: "idem-1", payloadHash: "a".repeat(64), signatureStatus: "VERIFIED", payload: { kind: "test" } };
check("verified webhook accepted", assessWebhookEnvelope(validEnvelope).accepted);
check("unverified webhook blocked", !assessWebhookEnvelope({ ...validEnvelope, signatureStatus: "UNVERIFIED" }).accepted);
check("malformed payload hash blocked", !assessWebhookEnvelope({ ...validEnvelope, payloadHash: "bad" }).accepted);
check("auth failure is never retried", classifyConnectorFailure({ failureClass: "AUTH", attemptCount: 0 }).action === "BLOCK");
check("transient failure retries within budget", classifyConnectorFailure({ failureClass: "TRANSIENT", attemptCount: 1, maxAttempts: 3 }).action === "RETRY");
check("exhausted transient goes to DLQ", classifyConnectorFailure({ failureClass: "TRANSIENT", attemptCount: 3, maxAttempts: 3 }).action === "DLQ");
const validResult = { workerNodeCount: 8, airtableWriteCount: 1, backendResultPostCount: 1, stateChangeAllowed: true, evidenceRefs: ["proof://result/1"], idempotencyKey: "idem-1" };
check("valid workflow result accepted", validateWorkflowResult(validResult).accepted);
check("duplicate backend result rejected", !validateWorkflowResult({ ...validResult, backendResultPostCount: 2 }).accepted);
check("multiple Airtable writes rejected", !validateWorkflowResult({ ...validResult, airtableWriteCount: 2 }).accepted);
check("missing evidence rejected", !validateWorkflowResult({ ...validResult, evidenceRefs: [] }).accepted);
check("blocked portal routed to MAP", portalFallbackDecision("CAPTCHA_BLOCKED").route === "MAP_MANUAL_REVIEW");
check("unknown portal state fails closed to MAP", portalFallbackDecision("UNEXPECTED").route === "MAP_MANUAL_REVIEW");
check("open portal remains probe-only", portalFallbackDecision("OPEN").route === "PROBE_ONLY");

const failures = checks.filter(item => !item.pass);
const report = {
  module: "N14",
  validator: "validate-n14-connector-contract",
  generatedAt: new Date().toISOString(),
  status: failures.length ? "blocked" : "pass",
  checksPassed: checks.length - failures.length,
  checksTotal: checks.length,
  checks,
  limitations: ["Static contract checks do not prove a provider is configured or live.", "No external webhook, provider delivery, or candidate journey was executed."]
};
const reportPath = path.join(root, "reports/validation/n14-connector-contract-latest.json");
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
console.log(`N14 connector contract: ${report.checksPassed}/${report.checksTotal} checks passed.`);
if (failures.length) {
  for (const item of failures) console.error(`FAIL ${item.name}: ${item.detail}`);
  process.exitCode = 1;
}
