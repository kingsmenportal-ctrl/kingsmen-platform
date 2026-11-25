import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");
const panel = read("apps/web/src/components/candidate/DocumentPreflightPanel.tsx");
const session = read("apps/web/src/lib/candidate-session.ts");
const documentsPage = read("apps/web/src/app/candidate/documents/page.tsx");

assert.match(panel, /import \{ getCandidateSessionState \} from ["']@\/lib\/candidate-session["']/,
  "Document upload and download must use the shared candidate session boundary.");
assert.match(panel, /const state = getCandidateSessionState\(\)/,
  "Document operations must use the shared session state result.");
assert.match(panel, /state\.status === "expired"/,
  "Expired candidate sessions must be rejected before document requests.");
assert.match(panel, /state\.status === "unreadable"/,
  "Unreadable browser sessions must fail closed.");
assert.match(panel, /state\.status === "not_configured"/,
  "Missing/invalid Supabase configuration must be reported rather than guessed.");
assert.doesNotMatch(panel, /window\.localStorage|JSON\.parse\(raw\)|let projectRef\s*=\s*["']euhubhhnumtibbyufghm["']/,
  "Document UI must not keep a second parser or fall back to a hard-coded Supabase project.");
assert.match(panel, /functions\/v1\/candidate-private-documents/,
  "Document requests must continue to go through the authenticated private-document service.");
assert.match(panel, /action: "create_upload"/);
assert.match(panel, /action: "finalize_upload"/);
assert.match(panel, /action: "create_download_url"/);
assert.match(session, /session\.expires_at[\s\S]*Date\.now\(\)/,
  "Shared session validation must enforce token expiry.");
assert.match(documentsPage, /href=["']\/candidate\/applications["']>Applications<\/a>/,
  "The document vault must link back to the canonical applications journey.");
console.log("PASS: document upload/download share the fail-closed candidate session boundary");
console.log("PASS: no hard-coded project fallback or duplicate browser-token parser remains");
console.log("PASS: document vault navigation connects to canonical applications");
console.log("Candidate document session contract: 3/3 groups passed");
