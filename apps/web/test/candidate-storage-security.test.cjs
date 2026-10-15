const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const storagePath = path.resolve(__dirname, "../src/lib/candidate-portal-storage.ts");
const authPath = path.resolve(__dirname, "../src/lib/supabase-auth.ts");
const routePath = path.resolve(__dirname, "../src/app/api/personal-jobs/apply-now/route.ts");
const storage = fs.readFileSync(storagePath, "utf8");
const auth = fs.readFileSync(authPath, "utf8");
const route = fs.readFileSync(routePath, "utf8");

test("candidate state reads are explicitly scoped to the authenticated UUID", () => {
  assert.match(storage, /auth_user_id: \`eq\.\$\{context\.userId\}\`/);
  assert.match(storage, /select: "state"/);
  assert.match(storage, /limit: "1"/);
  assert.match(storage, /Authorization: \`Bearer \$\{context\.accessToken\}\`/);
});

test("candidate state writes bind the row to the authenticated UUID", () => {
  assert.match(storage, /on_conflict=auth_user_id/);
  assert.match(storage, /JSON\.stringify\(\{ auth_user_id: context\.userId, state \}\)/);
  assert.match(storage, /resolution=merge-duplicates,return=minimal/);
  assert.match(storage, /if \(!response\.ok\) throw new Error\("Candidate storage could not be saved\."\)/);
});

test("candidate data requests use anon key plus candidate access token, never service role", () => {
  assert.match(storage, /apikey: context\.anonKey/);
  assert.match(storage, /Authorization: \`Bearer \$\{context\.accessToken\}\`/);
  assert.doesNotMatch(storage, /SERVICE_ROLE|service_role|SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(auth, /if \(!user\.id \|\| user\.role === "service_role"\) return \{ configured: true as const, user: null \}/);
});

test("auth lookup rejects malformed tokens and disables caching", () => {
  assert.match(auth, /token\.length > 8_192/);
  assert.match(auth, /!\/\^\[A-Za-z0-9\._~-\]\+\$\/\.test\(token\)/);
  assert.match(auth, /cache: "no-store"/);
  assert.match(auth, /AbortSignal\.timeout\(AUTH_LOOKUP_TIMEOUT_MS\)/);
});

test("private documents are stored beneath the authenticated user's UUID prefix", () => {
  assert.match(storage, /const storagePath = \`\$\{context\.userId\}\/\$\{objectKey\}\`/);
  assert.match(storage, /candidate-documents\/\$\{storagePath\.split\("\/"\)\.map\(encodeURIComponent\)\.join\("\/"\)\}/);
  assert.match(storage, /"x-upsert": "false"/);
  assert.match(storage, /if \(!response\.ok\) throw new Error\("Private document storage rejected the upload\."\)/);
});

test("private document deletion refuses references outside the current user's prefix", () => {
  assert.match(route, /const prefix = \`\$\{context\.userId\}\/\`/);
  assert.match(route, /document\.storagePath\.startsWith\(prefix\)/);
  assert.match(route, /objectName\.includes\("\/"\)/);
  assert.match(route, /document storage reference is invalid; no records were removed/);
});

test("production requests fail closed when candidate storage/auth is unavailable", () => {
  assert.match(route, /resolved\.status === "not_configured" && process\.env\.NODE_ENV !== "production"/);
  assert.match(route, /if \(resolved\.status !== "ready" && !localDevelopment\) return authOrStorageResponse\(resolved\.status\)/);
  assert.match(route, /process\.env\.NODE_ENV === "production"/);
  assert.match(route, /status: "STORAGE_NOT_CONFIGURED"/);
});

test("candidate responses are private and not cacheable", () => {
  assert.match(route, /headers\.set\("Cache-Control", "private, no-store, max-age=0"\)/);
  assert.match(route, /headers\.set\("Pragma", "no-cache"\)/);
});


test("private document uploads reject non-UUID identities and unsafe object keys before network access", () => {
  assert.match(storage, /Authenticated candidate identity is invalid for private storage/);
  assert.match(storage, /objectKey === "\." \|\| objectKey === "\.\."/);
});

test("private storage uploads enforce extension and MIME compatibility and use bounded requests", () => {
  assert.match(storage, /Document type does not match an allowed private-storage type/);
  assert.match(storage, /signal: AbortSignal\.timeout\(20_000\)/);
  assert.match(storage, /cache: "no-store"/);
});


test("session revocation has a timeout and local cookie clearing remains unconditional", () => {
  const sessionRoute = fs.readFileSync(path.resolve(__dirname, "../src/app/api/auth/session/route.ts"), "utf8");
  assert.match(sessionRoute, /signal: AbortSignal\.timeout\(5_000\)/);
  assert.match(sessionRoute, /response\.cookies\.set\(candidateAccessCookie, ""/);
  assert.match(sessionRoute, /catch \{\s*\/\/ The local cookie is cleared even if the remote revoke endpoint is unavailable\./);
});


test("candidate state storage validates identity, response shape, and maximum serialized size", () => {
  assert.match(storage, /function assertCandidateIdentity\(context: PortalContext\)/);
  assert.match(storage, /assertCandidateIdentity\(context\);/);
  assert.match(storage, /MAX_CANDIDATE_STATE_BYTES = 2 \* 1024 \* 1024/);
  assert.match(storage, /Candidate state exceeds the storage limit/);
  assert.match(storage, /if \(!Array\.isArray\(rows\)\) throw new Error\("Candidate storage returned an invalid response\."\)/);
  assert.match(storage, /Candidate storage returned an invalid state/);
});


test("authentication rejects malformed UUID identities before candidate data access", () => {
  assert.match(auth, /!\/\^\[0-9a-f\]\{8\}-\[0-9a-f\]\{4\}-\[1-8\]\[0-9a-f\]\{3\}-\[89ab\]\[0-9a-f\]\{3\}-\[0-9a-f\]\{12\}\$\/i\.test\(user\.id\)/);
  assert.match(auth, /user\.role === "service_role"/);
});


test("candidate state reads and uploads have explicit byte limits and reject malformed JSON", () => {
  assert.match(storage, /MAX_CANDIDATE_STATE_BYTES = 2 \* 1024 \* 1024/);
  assert.match(storage, /MAX_CANDIDATE_DOCUMENT_BYTES = 15 \* 1024 \* 1024/);
  assert.match(storage, /const raw = await response\.text\(\)/);
  assert.match(storage, /Candidate storage returned invalid JSON/);
  assert.match(storage, /Document must be non-empty and no larger than 15 MiB/);
  assert.match(storage, /Buffer\.byteLength\(raw, "utf8"\) > MAX_CANDIDATE_STATE_BYTES/);
});

test("candidate state serialization failures are handled without making a storage request", () => {
  assert.match(storage, /Candidate state could not be serialized/);
  assert.match(storage, /try \{ body = JSON\.stringify\(\{ auth_user_id: context\.userId, state \}\); \}/);
});


test("Apply Desk unexpected errors do not expose internal exception messages", () => {
  assert.match(route, /catch \{\s*\/\/ Do not disclose database, storage, filesystem, or upstream service details to clients\./);
  assert.match(route, /status: "INTERNAL_ERROR"/);
  assert.match(route, /error: "The request could not be completed\. Please try again\."/);
  assert.doesNotMatch(route, /error: error instanceof Error \? error\.message/);
});


test("bounded request-body reader is async and enforces actual streamed byte counts", () => {
  assert.match(route, /async function readBoundedJson\(request: Request\): Promise<Record<string, any>>/);
  assert.match(route, /const reader = request\.body\.getReader\(\)/);
  assert.match(route, /total \+= value\.byteLength/);
  assert.match(route, /if \(total > MAX_JSON_BODY_BYTES\)/);
  assert.match(route, /new TextDecoder\("utf-8", \{ fatal: true \}\)/);
});


test("document upload performs best-effort storage cleanup if extraction or persistence fails", () => {
  const uploadStart = route.indexOf('if (action === "uploadDocument")');
  const uploadEnd = route.indexOf('if (action === "addOpportunity")', uploadStart);
  const upload = route.slice(uploadStart, uploadEnd);
  assert.match(upload, /catch \(error\) \{[\s\S]*?A file must not be orphaned in private storage/);
  assert.match(upload, /method: "DELETE"/);
  assert.match(upload, /body: JSON\.stringify\(\{ prefixes: \[storagePath\] \}\)/);
  assert.match(upload, /fs\.unlinkSync\(filePath\)/);
  assert.match(upload, /throw error;/);
});


test("local candidate store preserves corrupt data and bounds disk reads and writes", () => {
  assert.match(route, /const MAX_LOCAL_STORE_BYTES = 2 \* 1024 \* 1024/);
  assert.match(route, /if \(stat\.size > MAX_LOCAL_STORE_BYTES\)/);
  assert.match(route, /Candidate local store is invalid; existing data was preserved/);
  assert.match(route, /if \(\(error as NodeJS\.ErrnoException\)\.code === "ENOENT"\) return defaultStore\(\)/);
  assert.match(route, /Buffer\.byteLength\(serialized, "utf8"\) > MAX_LOCAL_STORE_BYTES/);
  assert.match(route, /fs\.writeFileSync\(temporaryPath, serialized, \{ encoding: "utf8", mode: 0o600, flag: "wx" \}\)/);
  assert.match(route, /fs\.renameSync\(temporaryPath, STORE_PATH\)/);
  assert.doesNotMatch(route, /function readStore\(\): Store \{[\s\S]*?catch \{\s*return defaultStore\(\);/);
});

test("local store rejects malformed existing collections instead of silently hiding saved data", () => {
  assert.match(route, /if \(key in parsed && !Array\.isArray\(parsed\[key\]\)\)/);
  assert.match(route, /Candidate local store collection \$\{key\} is invalid; existing data was preserved/);
  assert.match(route, /if \("profile" in parsed && \(!parsed\.profile \|\| typeof parsed\.profile !== "object" \|\| Array\.isArray\(parsed\.profile\)\)\)/);
});

test("development GET returns a controlled 503 when local candidate storage cannot be read", () => {
  const getStart = route.indexOf("export async function GET()");
  const getEnd = route.indexOf("export async function POST(", getStart);
  const getRoute = route.slice(getStart, getEnd);
  assert.match(getRoute, /try \{[\s\S]*?const store = readStore\(\);[\s\S]*?catch \{\s*return privateJson\(\{ status: "STORAGE_UNAVAILABLE", error: "Candidate workspace could not be loaded\." \}, \{ status: 503 \}\);/);
});

test("deleteOpportunity requires an existing non-empty ID before mutating linked records", () => {
  const start = route.indexOf('if (action === "deleteOpportunity")');
  const end = route.indexOf('return privateJson({\n      status: "FAILED",\n      error: "Unknown action."', start);
  const block = route.slice(start, end);
  assert.match(block, /if \(!opportunityId \|\| opportunityId\.length > 180\)/);
  assert.match(block, /if \(!store\.opportunities\.some\(\(item\) => item\.opportunityId === opportunityId\)\)/);
  assert.ok(block.indexOf("Opportunity not found.") < block.indexOf("store.applicationPacks ="));
});

test("document deletion converts private storage network failures to controlled 503 responses", () => {
  const start = route.indexOf('if (action === "deleteDocument")');
  const end = route.indexOf('if (action === "deleteOpportunity")', start);
  const block = route.slice(start, end);
  assert.match(block, /let response: Response;\s*try \{[\s\S]*?response = await fetch\(endpoint,[\s\S]*?catch \{\s*return privateJson\(\{ status: "STORAGE_FAILED"/);
  assert.match(block, /The document record was kept\./);
});

test("deleteDocument rejects empty and oversized identifiers before lookup or storage mutation", () => {
  const start = route.indexOf('if (action === "deleteDocument")');
  const end = route.indexOf('if (action === "deleteOpportunity")', start);
  const block = route.slice(start, end);
  assert.match(block, /typeof body\.documentId === "string" \? body\.documentId\.trim\(\) : ""/);
  assert.match(block, /if \(!documentId \|\| documentId\.length > 180\)/);
  assert.ok(block.indexOf("A valid document ID is required.") < block.indexOf("store.documents.find"));
  assert.ok(block.indexOf("A valid document ID is required.") < block.indexOf('method: "DELETE"'));
});

test("candidate storage workflow runs the regression suite with read-only repository permissions", () => {
  const workflowPath = path.resolve(__dirname, "../../../.github/workflows/kingsmen-candidate-storage.yml");
  const workflow = fs.readFileSync(workflowPath, "utf8");
  assert.match(workflow, /permissions:\s*contents: read/);
  assert.match(workflow, /node --test apps\/web\/test\/candidate-storage-security\.test\.cjs/);
  assert.match(workflow, /node-version: 22/);
});


test("candidate dashboard loads the private workspace and presents live workspace modules", () => {
  const page = fs.readFileSync(path.resolve(__dirname, "../src/app/candidate/dashboard/page.tsx"), "utf8");
  assert.match(page, /fetch\("\/api\/personal-jobs\/apply-now"/);
  assert.match(page, /cache: "no-store"/);
  assert.match(page, /Readiness checklist/);
  assert.match(page, /Six opportunity gates/);
  assert.match(page, /Please sign in to view your private candidate workspace/);
});

test("candidate profile persists edits through the validated saveProfile API action", () => {
  const page = fs.readFileSync(path.resolve(__dirname, "../src/app/candidate/profile/page.tsx"), "utf8");
  assert.match(page, /action: "saveProfile"/);
  assert.match(page, /Full name, email and phone number are required/);
  assert.match(page, /Your profile could not be saved/);
  assert.match(page, /type="submit"/);
});

test("candidate document vault uses bounded supported uploads and private document endpoints", () => {
  const page = fs.readFileSync(path.resolve(__dirname, "../src/app/candidate/documents/page.tsx"), "utf8");
  assert.match(page, /MAX_UPLOAD_BYTES = 10 \* 1024 \* 1024/);
  assert.match(page, /action: "uploadDocument"/);
  assert.match(page, /action: "deleteDocument"/);
  assert.match(page, /\/api\/personal-jobs\/apply-now\/documents\//);
  assert.match(page, /credentials: "same-origin"/);
  assert.match(page, /cache: "no-store"/);
});


test("candidate workbench connects opportunity stages, pack generation, proof and follow-up tasks to the workspace API", () => {
  const page = fs.readFileSync(path.resolve(__dirname, "../src/app/candidate/workbench/page.tsx"), "utf8");
  for (const action of ["updateOpportunityStatus", "generatePack", "markApplied", "addTask", "updateTask", "deleteTask", "addContactLog", "deleteContactLog"]) {
    assert.match(page, new RegExp('mutate\\("' + action + '"'));
  }
  assert.match(page, /fetch\("\/api\/personal-jobs\/apply-now"/);
  assert.match(page, /cache: "no-store"/);
  assert.match(page, /credentials: "same-origin"/);
  assert.match(page, /Evidence notes are candidate-recorded and are not independently verified/);
  assert.match(page, /Application pack library/);
  assert.match(page, /Follow-up tasks/);
  assert.match(page, /Contact history/);
});


test("candidate finance view reads the private ledger and never provides a candidate payment-confirmation control", () => {
  const page = fs.readFileSync(path.resolve(__dirname, "../src/app/candidate/finance/page.tsx"), "utf8");
  assert.match(page, /fetch\("\/api\/personal-jobs\/apply-now"/);
  assert.match(page, /cache: "no-store"/);
  assert.match(page, /data\.financeLedger/);
  assert.match(page, /Confirmed incoming payments/);
  assert.match(page, /Candidates cannot mark their own payments as confirmed/);
  assert.match(page, /refund entries require finance review/i);
  assert.doesNotMatch(page, /action:\s*["']updateFinanceEntry["']/);
});


test("support requests are validated and persisted in the authenticated candidate workspace", () => {
  assert.match(route, /type SupportRequest/);
  assert.match(route, /action === "createSupportRequest"/);
  assert.match(route, /subject\.length < 4/);
  assert.match(route, /description\.length < 10/);
  assert.match(route, /store\.supportRequests = \[requestRecord/);
  assert.match(route, /await persistStore\(context, store\)/);
  const page = fs.readFileSync(path.resolve(__dirname, "../src/app/candidate/support/page.tsx"), "utf8");
  assert.match(page, /action: "createSupportRequest"/);
  assert.match(page, /cache: "no-store"/);
  assert.match(page, /credentials: "same-origin"/);
  assert.match(page, /Urgent requests are recorded only/);
});

test("message ledger records communications without claiming external delivery", () => {
  assert.match(route, /type MessageRecord/);
  assert.match(route, /action === "recordMessage"/);
  assert.match(route, /store\.messageLedger = \[messageRecord/);
  assert.match(route, /messageBody\.length > 4000/);
  const page = fs.readFileSync(path.resolve(__dirname, "../src/app/candidate/messages/page.tsx"), "utf8");
  assert.match(page, /action: "recordMessage"/);
  assert.match(page, /No external message was sent/);
  assert.match(page, /credentials: "same-origin"/);
  assert.match(page, /cache: "no-store"/);
});

test("founder command centre consolidates operational modules and exposes readiness without claiming live execution", () => {
  const page = fs.readFileSync(path.resolve(__dirname, "../src/app/founder/page.tsx"), "utf8");
  for (const href of ["/founder/master-index", "/founder/control-plane/commands", "/founder/control-plane/digest", "/founder/providers/airtable", "/founder/launch-control/jarvis-live-proof-acceptance-gate"]) {
    assert.ok(page.includes(href), `Founder command centre missing module link: ${href}`);
  }
  assert.match(page, /fetch\("\/api\/founder\/backend-readiness"/);
  assert.match(page, /cache: "no-store"/);
  assert.match(page, /no authorization boundary/i);
  assert.match(page, /no live action is claimed/i);
  assert.match(page, /productionReady/);
});

test("discovered job import validates public source URLs and deduplicates per candidate workspace", () => {
  const start = route.indexOf('if (action === "addOpportunity")');
  const end = route.indexOf('if (action === "updateOpportunityStatus")', start);
  const block = route.slice(start, end);
  assert.match(block, /new URL\(sourceUrl\)/);
  assert.match(block, /\["http:", "https:"\]\.includes\(parsedSource\.protocol\)/);
  assert.match(block, /parsedSource\.username \|\| parsedSource\.password/);
  assert.match(block, /OPPORTUNITY_ALREADY_EXISTS/);
  assert.match(block, /store\.opportunities\.find/);
  assert.match(block, /notes\.length > 1800/);
  assert.match(block, /sourceUrl\.length > 1000/);
});

test("job finder exposes a candidate-workspace save action and does not auto-submit applications", () => {
  const pagePath = path.resolve(__dirname, "../src/app/personal-job-desk/job-finder/JobFinderClient.tsx");
  const page = fs.readFileSync(pagePath, "utf8");
  assert.match(page, /saveLeadToWorkspace/);
  assert.match(page, /\/api\/personal-jobs\/apply-now/);
  assert.match(page, /action: "addOpportunity"/);
  assert.match(page, /Save to candidate workspace/);
  assert.match(page, /manualApprovalRequired: true/);
  assert.match(page, /does not submit applications/);
});


test("authenticated uploads register canonical document and evidence references before workspace persistence", () => {
  const start = route.indexOf('if (action === "uploadDocument")');
  const end = route.indexOf('if (action === "addOpportunity")', start);
  const block = route.slice(start, end);
  assert.match(block, /register_candidate_document_upload/);
  assert.match(block, /Authorization: `Bearer ${context\.accessToken}`/);
  assert.match(block, /p_storage_path: storagePath/);
  assert.match(block, /canonicalRegistration\.documentRef/);
  assert.match(block, /registryStatus: "REGISTERED"/);
  assert.match(block, /Canonical document registration failed/);
  assert.ok(block.indexOf("register_candidate_document_upload") < block.indexOf("await persistStore(context, store)"));
  assert.match(block, /A file must not be orphaned in private storage/);
});

test("canonical upload registration is ownership-scoped, storage-backed and non-verifying", () => {
  const migration = fs.readFileSync(path.resolve(__dirname, "../../../db/migrations/0020_candidate_document_upload_registration.sql"), "utf8");
  assert.match(migration, /auth\.uid\(\)/);
  assert.match(migration, /c\.owner_user_id = auth\.uid\(\)/);
  assert.match(migration, /cardinality\(v_candidate_ids\),0\) <> 1/);
  assert.match(migration, /storage\.objects/);
  assert.match(migration, /o\.bucket_id = v_bucket/);
  assert.match(migration, /o\.owner_id = auth\.uid\(\)::text/);
  assert.match(migration, /public\.document_files/);
  assert.match(migration, /public\.document_storage_events/);
  assert.match(migration, /'verificationStatus', 'PENDING'/);
  assert.match(migration, /'documentStatus', 'UPLOADED'/);
  assert.match(migration, /revoke all on function public\.register_candidate_document_upload/);
  assert.doesNotMatch(migration, /verification_status\s*=\s*'VERIFIED'|document_status\s*=\s*'READY'/i);
});


test("post-registration workspace failures preserve objects referenced by canonical records", () => {
  const start = route.indexOf('if (action === "uploadDocument")');
  const end = route.indexOf('if (action === "addOpportunity")', start);
  const block = route.slice(start, end);
  assert.match(block, /let canonicalRegistered = false/);
  assert.match(block, /canonicalRegistered = true/);
  assert.match(block, /if \(context && storagePath && !canonicalRegistered\)/);
  assert.match(block, /registryStatus: "REGISTERED"/);
});

test("candidate document page distinguishes registry registration from verification", () => {
  const page = fs.readFileSync(path.resolve(__dirname, "../src/app/candidate/documents/page.tsx"), "utf8");
  assert.match(page, /canonicalDocumentRef\?: string/);
  assert.match(page, /registryStatus\?: "REGISTERED" \| "LOCAL_ONLY"/);
  assert.match(page, /Canonical vault: registered/);
  assert.match(page, /Verification pending/);
  assert.match(page, /Canonical vault registration not confirmed/);
});

test("canonical document deletion retires review eligibility before storage cleanup and records the outcome", () => {
  const migration = fs.readFileSync(path.resolve(__dirname, "../../../db/migrations/0021_candidate_document_retirement.sql"), "utf8");
  assert.match(migration, /function public\.retire_candidate_document_upload/);
  assert.match(migration, /d\.candidate_id = v_candidate_id/);
  assert.match(migration, /document_status = 'DELETED'/);
  assert.match(migration, /archived_at = coalesce\(archived_at, now\(\)\)/);
  assert.match(migration, /function public\.record_candidate_document_deletion_result/);
  assert.match(migration, /event_type,event_ref/);
  assert.match(migration, /case when p_success then 'OK' else 'FAILED' end/);
  assert.match(migration, /revoke all on function public\.retire_candidate_document_upload/);
  assert.match(migration, /revoke all on function public\.record_candidate_document_deletion_result/);

  const start = route.indexOf('if (action === "deleteDocument")');
  const end = route.indexOf('if (action === "deleteOpportunity")', start);
  const block = route.slice(start, end);
  assert.match(block, /retire_candidate_document_upload/);
  assert.match(block, /record_candidate_document_deletion_result/);
  assert.ok(block.indexOf("retire_candidate_document_upload") < block.indexOf('method: "DELETE"'));
  assert.ok(block.indexOf('method: "DELETE"') < block.indexOf("recordCanonicalCleanup(true)"));
  assert.match(block, /canonical document is retired, but private file cleanup is pending/i);
  assert.match(block, /CANONICAL_EVIDENCE_FAILED/);
});

test("candidate storage workflow watches the canonical retirement migration", () => {
  const workflowPath = path.resolve(__dirname, "../../../.github/workflows/kingsmen-candidate-storage.yml");
  const workflow = fs.readFileSync(workflowPath, "utf8");
  assert.equal((workflow.match(/db\/migrations\/0021_candidate_document_retirement\.sql/g) || []).length, 2);
});
