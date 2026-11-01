import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const edge = read("supabase/functions/candidate-application-preparation/index.ts");
const page = read("apps/web/src/app/candidate/applications/page.tsx");
const packageJson = JSON.parse(read("package.json"));

const sectionStart = edge.indexOf("let applicationEvidence:any[]=[];");
const sectionEnd = edge.indexOf("return reply(200,{ready:true,trackers:trackers??[],items", sectionStart);
const evidenceRead = sectionStart >= 0 && sectionEnd > sectionStart ? edge.slice(sectionStart, sectionEnd) : "";
const checks = [
  ["evidence read occurs only after bearer-authenticated verified candidate lookup", edge.indexOf("const candidateId=link.candidate_id as string") >= 0 && sectionStart > edge.indexOf("const candidateId=link.candidate_id as string")],
  ["evidence reads are limited to the verified candidate's linked application IDs", evidenceRead.includes('.eq("candidate_id",candidateId)') && evidenceRead.includes('.in("application_id",applicationIds)')],
  ["evidence read is limited to provider-receipt and provider-reference types", evidenceRead.includes('.in("evidence_type",["PROVIDER_SUBMISSION_RECEIPT","PROVIDER_REFERENCE"])')],
  ["returned metadata is allow-listed, omits raw reviewer IDs and private storage locators, and exposes only reviewer-attribution presence", evidenceRead.includes("reviewer_attributed:Boolean(item.verified_by_auth_user_id)") && !evidenceRead.includes("verified_by_auth_user_id:item.") && !evidenceRead.includes("evidence_locator") && !evidenceRead.includes("storage_path") && !evidenceRead.includes("signed_url")],
  ["database errors fail closed rather than silently hiding evidence lookup failure", evidenceRead.includes("if(result.error)") && evidenceRead.includes("return reply(503")],
  ["evidence metadata query has a bounded result size and deterministic recency ordering", evidenceRead.includes('.order("created_at",{ascending:false})') && evidenceRead.includes(".limit(200)")],
  ["candidate UI loads evidence metadata from the authenticated backend response", page.includes("setApplicationEvidence(Array.isArray(body.applicationEvidence)") && page.includes("useState<ApplicationEvidence[]>([])")],
  ["provider receipt state requires VERIFIED status, reviewer-attribution presence and timestamp", page.includes('item.verification_status === "VERIFIED"') && page.includes("item.reviewer_attributed === true") && page.includes("Boolean(item.verified_at)")],
  ["unverified receipt evidence is explicitly not treated as provider confirmation", page.includes("not yet reviewer-verified") && page.includes("not treating it as proof of provider receipt")],
  ["submission attempt and provider receipt are displayed as separate states", page.includes("submissionAttemptRecorded") && page.includes("submission attempt is recorded, but a provider-confirmed receipt has not been verified")],
  ["receipt timeline is bound to the exact parent application ID", page.includes("item.application_id === target.application_id") && page.includes("event.application_id === target.application_id")],
  ["candidate-facing timeline never renders storage locators or signed URLs", !page.includes("evidence_locator") && !page.includes("signed_url") && page.includes("Private storage paths and download locators are not exposed")],
  ["candidate-facing tracker never receives a raw reviewer Auth user ID", !page.includes("verified_by_auth_user_id") && page.includes("reviewer_attributed: boolean")],
  ["provider receipt panel shows reference, label and verification time when verified", page.includes("Provider receipt &amp; evidence") && page.includes("verifiedReceipt.evidence_ref") && page.includes("verifiedReceipt.source_label") && page.includes("verifiedReceipt.verified_at")],
  ["source contract runs in candidate experience CI", packageJson.scripts["candidate:experience:check"].includes("validate-provider-receipt-evidence-tracking.mjs")]
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write((passed ? "PASS " : "FAIL ") + name + "\n");
  if (!passed) failed++;
}
process.stdout.write("Provider receipt evidence tracking contract: " + (checks.length - failed) + "/" + checks.length + " passed\n");
if (failed) process.exit(1);
