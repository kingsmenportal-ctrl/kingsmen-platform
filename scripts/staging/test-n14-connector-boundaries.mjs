import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const sourcePath = path.join(root, "apps/api/src/integrations/integrations.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const loaded = { exports: {} };
new Function("exports", "require", "module", "__filename", "__dirname", compiled)(
  loaded.exports, require, loaded, sourcePath, path.dirname(sourcePath)
);
const api = loaded.exports;
let assertions = 0;
function check(fn) { fn(); assertions += 1; }
function rejects(fn, pattern) { assert.throws(fn, pattern); assertions += 1; }

check(() => assert.equal(api.WORKFLOW_REGISTRY.length, 19));
check(() => assert.equal(api.findWorkflow("W24").doctrineNote, "W24 -> W17 -> worker -> /workflow/result."));
check(() => assert.equal(api.buildN8nDispatchContract().length, 8));
check(() => assert.equal(api.buildN8nDispatchContract()[6], "POST /workflow/result"));
check(() => assert.equal(api.assertBackendControlsFlow(), true));

const validEnvelope = {
  workflowCode: "W01", commandRef: "test-command", requestedState: "EVALUATION_PENDING",
  workerNodeCount: 8, airtableWriteCount: 1, backendResultPostCount: 1,
  evidenceRefs: ["test:n14"], payload: { test: true }
};
check(() => api.assertThinWorkerResult(validEnvelope));
rejects(() => api.assertThinWorkerResult({ ...validEnvelope, workerNodeCount: 7 }), /WORKER_STANDARD_8_NODE_CONTRACT_REQUIRED/);
rejects(() => api.assertThinWorkerResult({ ...validEnvelope, airtableWriteCount: 2 }), /WORKER_AIRTABLE_WRITE_LIMIT_EXCEEDED/);
rejects(() => api.assertThinWorkerResult({ ...validEnvelope, airtableWriteCount: -1 }), /WORKER_AIRTABLE_WRITE_LIMIT_EXCEEDED/);
rejects(() => api.assertThinWorkerResult({ ...validEnvelope, airtableWriteCount: 0.5 }), /WORKER_AIRTABLE_WRITE_LIMIT_EXCEEDED/);
rejects(() => api.assertThinWorkerResult({ ...validEnvelope, backendResultPostCount: 0 }), /WORKER_MUST_POST_EXACTLY_ONE_BACKEND_RESULT/);
rejects(() => api.assertThinWorkerResult({ ...validEnvelope, backendResultPostCount: 2 }), /WORKER_MUST_POST_EXACTLY_ONE_BACKEND_RESULT/);
rejects(() => api.assertThinWorkerResult({ ...validEnvelope, evidenceRefs: [] }), /WORKER_RESULT_EVIDENCE_REQUIRED/);

check(() => api.assertAirtableCannotOverrideTruth("POSTGRES_TO_AIRTABLE_MIRROR"));
rejects(() => api.assertAirtableCannotOverrideTruth("AIRTABLE_TO_POSTGRES_REVIEW_ONLY"), /AIRTABLE_TO_POSTGRES_REQUIRES_OPERATOR_REVIEW/);
check(() => assert.equal(api.buildPlaywrightProbeResult({ blockReason: "CAPTCHA", evidenceRefs: ["test:probe"] }).probeStatus, "MAP_REQUIRED"));
check(() => assert.equal(api.buildPlaywrightProbeResult({ blockReason: "OTP", evidenceRefs: ["test:probe"] }).mapRequired, true));
check(() => assert.equal(api.buildPlaywrightProbeResult({ blockReason: "UNKNOWN", evidenceRefs: ["test:probe"] }).probeStatus, "MAP_REQUIRED"));
check(() => assert.equal(api.buildPlaywrightProbeResult({ blockReason: "UNKNOWN", evidenceRefs: ["test:probe"] }).mapRequired, true));
check(() => assert.equal(api.buildPlaywrightProbeResult({ evidenceRefs: ["test:probe"] }).probeStatus, "SUCCESS"));
rejects(() => api.buildPlaywrightProbeResult({ blockReason: "CAPTCHA", evidenceRefs: [] }), /PLAYWRIGHT_PROBE_EVIDENCE_REQUIRED/);

check(() => api.assertPayfastCannotDecideRefunds(false));
rejects(() => api.assertPayfastCannotDecideRefunds(true), /PAYFAST_REFUND_DECISION_BLOCKED/);
check(() => api.assertWhatsAppUrgentOnly("WHATSAPP_URGENT", true));
rejects(() => api.assertWhatsAppUrgentOnly("WHATSAPP_URGENT", false), /WHATSAPP_CONNECTOR_URGENT_ONLY/);
check(() => api.assertWebhookVerified("VERIFIED"));
check(() => api.assertWebhookVerified("NOT_REQUIRED"));
rejects(() => api.assertWebhookVerified("MISSING"), /WEBHOOK_SIGNATURE_VERIFICATION_REQUIRED/);
rejects(() => api.assertWebhookVerified("FAILED"), /WEBHOOK_SIGNATURE_VERIFICATION_REQUIRED/);

const validFailure = {
  sourceRef: "test-source", sourceType: "OUTBOX", connectorKey: "test-connector",
  severity: "WARNING", cause: "synthetic test failure", reason: "fault injection",
  fixPath: "retry or manual review", evidenceRefs: ["test:dlq"], payload: { synthetic: true }
};
check(() => assert.equal(api.createIntegrationDlqItem(validFailure).status, "OPEN"));
rejects(() => api.createIntegrationDlqItem({ ...validFailure, cause: "" }), /INTEGRATION_DLQ_CAUSE_REQUIRED/);
rejects(() => api.createIntegrationDlqItem({ ...validFailure, reason: "" }), /INTEGRATION_DLQ_REASON_REQUIRED/);
rejects(() => api.createIntegrationDlqItem({ ...validFailure, fixPath: "" }), /INTEGRATION_DLQ_FIX_PATH_REQUIRED/);
rejects(() => api.createIntegrationDlqItem({ ...validFailure, evidenceRefs: [] }), /INTEGRATION_DLQ_EVIDENCE_REQUIRED/);

console.log(`N14 connector boundary regression tests passed: ${assertions} assertions`);
