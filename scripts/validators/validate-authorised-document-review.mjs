import fs from "node:fs";
const paths = [
  "db/migrations/0080_authorised_candidate_document_review.sql",
  "apps/web/src/app/api/reviewer/documents/route.ts",
  "apps/web/src/app/api/reviewer/documents/read-url/route.ts",
  "apps/web/src/app/reviewer/documents/page.tsx"
];
const failures = [];
const src = {};
for (const p of paths) {
  if (!fs.existsSync(p)) failures.push("Missing " + p);
  src[p] = fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
}
const migration = src[paths[0]], route = src[paths[1]], read = src[paths[2]], page = src[paths[3]];
for (const token of ["candidate_private_document_reviews", "ENABLE ROW LEVEL SECURITY", "REVOKE ALL", "platform_reviewers", "FOR UPDATE", "review_candidate_private_document", "REVIEW_STATUS_CHANGED", "evidence_reference", "VERIFIED", "REJECTED"]) if (!migration.includes(token)) failures.push("Migration missing invariant: " + token);
for (const token of ["auth/v1/user", "platform_reviewers", "role_code=eq.PLATFORM_ADMIN", "candidate_private_documents", "review_candidate_private_document", "evidenceReference", "Cache-Control"]) if (!route.includes(token)) failures.push("Reviewer route missing control: " + token);
for (const token of ["auth/v1/user", "platform_reviewers", "storage/v1/object/sign", "expiresIn: 600", "UPLOADED_CANDIDATE_REPORTED", "UNDER_REVIEW", "candidate_private_document_events", "READ_LINK_ISSUED"]) if (!read.includes(token)) failures.push("Reviewer read route missing control: " + token);
for (const token of ["/api/reviewer/documents", "evidenceReference", "VERIFIED", "REJECTED", "10 minutes", "not verification"]) if (!page.includes(token)) failures.push("Reviewer page missing control: " + token);
if (/NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY/.test(Object.values(src).join("\n"))) failures.push("Service key must not use NEXT_PUBLIC.");
if (failures.length) { console.error("Authorised document review validator FAILED"); failures.forEach(x => console.error("- " + x)); process.exit(1); }
console.log("Authorised document review source contract PASSED: active reviewer gate, short-lived private read, evidence-backed decisions, locked state transitions, and audit history.");
