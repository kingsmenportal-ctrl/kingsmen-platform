import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const migrationPath = "db/migrations/0103_candidate_application_packet_preparation.sql";
const migration = fs.existsSync(path.join(root, migrationPath)) ? read(migrationPath) : "";
const edge = read("supabase/functions/candidate-application-preparation/index.ts");
const api = read("apps/web/src/app/api/candidate/applications/route.ts");
const page = read("apps/web/src/app/candidate/applications/page.tsx");
const errors = [];
const check = (name, ok) => {
  console.log((ok ? "PASS " : "FAIL ") + name);
  if (!ok) errors.push(name);
};

check("0103 migration is transaction-wrapped and creates both private packet tables",
  /^BEGIN;/m.test(migration) && /COMMIT;\s*$/.test(migration) &&
  /CREATE TABLE IF NOT EXISTS public\.candidate_application_packets/.test(migration) &&
  /CREATE TABLE IF NOT EXISTS public\.candidate_application_packet_documents/.test(migration));
check("packet table is constrained to six pathways and fail-closed statuses",
  ["HIGHER_EDUCATION","TVET","SETA_LEARNERSHIP","INTERNSHIP","APPRENTICESHIP","EMPLOYMENT"].every(value => migration.includes(value)) &&
  migration.includes("PROVIDER_REQUIREMENTS_PENDING") &&
  migration.includes("NO_VERIFIED_PROVIDER_TEMPLATE") &&
  migration.includes("NOT_CONNECTED"));
check("packet submission and provider receipt remain false by schema guard",
  migration.includes("provider_submission_sent boolean NOT NULL DEFAULT false") &&
  migration.includes("provider_receipt_confirmed boolean NOT NULL DEFAULT false") &&
  migration.includes("PREPARATION_PACKET_CANNOT_ASSERT_PROVIDER_SUBMISSION_OR_RECEIPT"));
check("packet target ownership is checked by a trigger and trigger function is not SECURITY DEFINER",
  migration.includes("APPLICATION_PACKET_TARGET_OWNER_MISMATCH") &&
  migration.includes("candidate_application_packets_owner_guard") &&
  migration.includes("GRANT EXECUTE ON FUNCTION private.guard_candidate_application_packet_owner() TO service_role") &&
  !/SECURITY\s+DEFINER/i.test(migration));
check("packet document ownership and allowed Document Vault statuses are checked by a trigger",
  migration.includes("APPLICATION_PACKET_DOCUMENT_OWNER_MISMATCH") &&
  migration.includes("candidate_application_packet_documents_owner_guard") &&
  migration.includes("GRANT EXECUTE ON FUNCTION private.guard_candidate_application_packet_document() TO service_role") &&
  ["UPLOADED_CANDIDATE_REPORTED","UNDER_REVIEW","VERIFIED"].every(value => migration.includes(value)));
check("RLS permits candidate-owned SELECT only and service-role writes",
  migration.includes("ALTER TABLE public.candidate_application_packets ENABLE ROW LEVEL SECURITY") &&
  migration.includes("ALTER TABLE public.candidate_application_packet_documents ENABLE ROW LEVEL SECURITY") &&
  migration.includes("candidate_application_packets_select_own") &&
  migration.includes("candidate_application_packet_documents_select_own") &&
  migration.includes("GRANT SELECT ON TABLE public.candidate_application_packets TO authenticated") &&
  migration.includes("GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.candidate_application_packets TO service_role"));
check("API allowlists packet action and only forwards packet fields",
  api.includes('"prepare_application_packet"') &&
  api.includes('payload.application_answers = incoming.application_answers') &&
  api.includes('payload.selected_document_ids = incoming.selected_document_ids') &&
  api.includes('payload.target_key = incoming.target_key'));
check("Edge packet action requires the verified candidate link and active profile-processing consent",
  edge.includes('if(p.action==="prepare_application_packet")') &&
  edge.includes('candidate_auth_identity_links') &&
  edge.includes('.eq("link_status","VERIFIED")') &&
  edge.includes('privacy_consent_records') &&
  edge.includes('consent_type","PROFILE_PROCESSING') &&
  edge.includes('consent_status!=="ACTIVE"'));
check("Edge packet resolves its provider by exact canonical key and rejects unlinked provider names",
  edge.includes("PROVIDER_REGISTRY_LINK_REQUIRED") &&
  edge.includes('from("route_providers")') &&
  edge.includes('provider.provider_name!==target.provider_name'));
check("Edge packet selects only candidate-owned Document Vault metadata and never exposes storage paths",
  edge.includes('from("candidate_private_documents")') &&
  edge.includes('.eq("candidate_id",candidateId).in("id",selectedDocumentIds)') &&
  edge.includes('document_type,original_filename,mime_type,size_bytes,status') &&
  !edge.includes('select("id,document_type,original_filename,storage_path') &&
  !/documents\.map\([^\n]*storage_path/.test(edge));
check("Edge packet preserves provider-requirement and no-submission boundaries",
  edge.includes('packet_status:"PROVIDER_REQUIREMENTS_PENDING"') &&
  edge.includes('template_status:"NO_VERIFIED_PROVIDER_TEMPLATE"') &&
  edge.includes('provider_requirements_status:"NOT_VERIFIED"') &&
  edge.includes('provider_submission_sent:false') &&
  edge.includes('provider_receipt_confirmed:false') &&
  edge.includes('provider_integration_state:"NOT_CONNECTED"'));
check("Edge load reloads candidate-owned packet, document references and available documents",
  edge.includes('from("candidate_application_packets")') &&
  edge.includes('from("candidate_application_packet_documents")') &&
  edge.includes('availableDocuments:availableDocuments??[]') &&
  edge.includes('applicationPackets:applicationPackets??[]'));
check("Candidate application workbench renders packet answers and Document Vault selectors",
  page.includes("prepare_application_packet") &&
  page.includes("Save reusable application packet") &&
  page.includes("Choose documents from your Document Vault") &&
  page.includes("selectedDocumentIds") &&
  page.includes("PACKET_ANSWER_FIELDS"));
check("Candidate UI labels reusable data as preparation, not a completed provider form or submission",
  page.includes("generic preparation packet") &&
  page.includes("template_status") &&
  page.includes("has not sent anything to this provider") &&
  page.includes("There is no submission or receipt claim"));
check("Packet UI links to the one candidate Document Vault and never renders storage paths",
  page.includes('href="/candidate/documents"') &&
  !/document\.(storage_path|storage_bucket)/.test(page));

if (errors.length) {
  console.error("Candidate application packet contract FAILED: " + errors.length + " checks");
  process.exit(1);
}
console.log("Candidate application packet contract PASSED: reusable profile, owner-checked vault references, no provider submission.");
