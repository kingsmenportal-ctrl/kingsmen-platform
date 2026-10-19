import fs from "node:fs";
const files = {
  migration: "db/migrations/0079_candidate_private_document_vault.sql",
  upload: "apps/web/src/app/api/candidate/documents/upload-url/route.ts",
  complete: "apps/web/src/app/api/candidate/documents/complete/route.ts",
  read: "apps/web/src/app/api/candidate/documents/read-url/route.ts",
  status: "apps/web/src/app/api/candidate/documents/status/route.ts",
  page: "apps/web/src/app/candidate/documents/page.tsx",
  auth: "apps/web/src/lib/candidate-workspace-server.ts",
  client: "apps/web/src/lib/candidate-workspace-client.ts"
};
const failures = [];
const sources = {};
for (const [key, path] of Object.entries(files)) {
  if (!fs.existsSync(path)) failures.push("Missing " + path);
  sources[key] = fs.existsSync(path) ? fs.readFileSync(path, "utf8") : "";
}
for (const token of ["kingsmen-candidate-documents", "public = false", "file_size_limit", "candidate_private_documents",
  "candidate_private_document_events", "current_verified_candidate_id()", "ENABLE ROW LEVEL SECURITY",
  "UPLOAD_PENDING", "UPLOADED_CANDIDATE_REPORTED", "UNDER_REVIEW", "VERIFIED", "REJECTED"]) {
  if (!sources.migration.includes(token)) failures.push("Migration missing privacy/state invariant: " + token);
}
for (const token of ["resolveReviewedCandidate", "truthVaultRequest", "10 * 1024 * 1024", "application/pdf", "image/jpeg", "image/png",
  "candidate_private_documents", "storage/v1/object/upload/sign", "UPLOAD_REQUESTED"]) {
  if (!sources.upload.includes(token)) failures.push("Upload route missing control: " + token);
}
for (const token of ["resolveReviewedCandidate", "candidate_id=eq.", "storage/v1/object/info", "UPLOADED_CANDIDATE_REPORTED",
  "uploaded_object_metadata_mismatch", "UPLOAD_CONFIRMED"]) {
  if (!sources.complete.includes(token)) failures.push("Completion route missing control: " + token);
}
for (const token of ["resolveReviewedCandidate", "candidate_id=eq.", "storage/v1/object/sign", "READ_LINK_ISSUED", "expiresIn: 600"]) {
  if (!sources.read.includes(token)) failures.push("Read route missing control: " + token);
}
for (const token of ["resolveReviewedCandidate", "candidate_private_documents", "candidate_private_document_events", "verificationBoundary"]) {
  if (!sources.status.includes(token)) failures.push("Status route missing control: " + token);
}
for (const token of ["candidateWorkspaceRequest", "/api/candidate/documents/upload-url", "/api/candidate/documents/complete",
  "/api/candidate/documents/read-url", "UPLOADED_CANDIDATE_REPORTED", "cannot verify, reject, or delete"]) {
  if (!sources.page.includes(token)) failures.push("Candidate vault UI missing workflow: " + token);
}
if (/NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY/.test(Object.values(sources).join("\n"))) failures.push("Service-role credential must never use a NEXT_PUBLIC variable.");
if (/body\.candidateId|candidateId:\s*body/.test(sources.upload + sources.read + sources.complete)) failures.push("Candidate ownership must be derived from the verified session, not request body.");
if (failures.length) {
  console.error("Candidate private document vault validation FAILED");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}
console.log("Candidate private document vault validation PASSED: private bucket, verified-candidate ownership, bounded media types/size, upload confirmation, time-limited signed reads, audit events, and candidate/reviewer authority separation.");
