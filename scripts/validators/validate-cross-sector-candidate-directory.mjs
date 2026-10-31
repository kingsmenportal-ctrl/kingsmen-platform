import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const seed = JSON.parse(fs.readFileSync(path.join(root, "manifests/institutions/seed/public-universities-and-tvet-2026-10-31.json"), "utf8"));
const extension = JSON.parse(fs.readFileSync(path.join(root, "manifests/institutions/cross-sector-institution-source-extension.json"), "utf8"));
const page = fs.readFileSync(path.join(root, "apps/web/src/app/candidate/institutions/page.tsx"), "utf8");
const apiPath = path.join(root, "apps/web/src/app/api/candidate/institutions/route.ts");
const api = fs.existsSync(apiPath) ? fs.readFileSync(apiPath, "utf8") : "";
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const failures = [];
const check = (name, condition) => {
  const passed = Boolean(condition);
  console.log((passed ? "PASS " : "FAIL ") + name);
  if (!passed) failures.push(name);
};

const records = seed.records ?? [];
const sources = extension.sources ?? [];
const pathways = ["HIGHER_EDUCATION", "TVET", "SETA_LEARNERSHIPS", "INTERNSHIPS", "APPRENTICESHIPS", "EMPLOYMENT"];
const requiredFilters = [
  "setQuery", "setSector", "setLocation", "setCapability", "setPathway",
  "item.sectorKeys.includes(sector)", "item.serviceCapabilities.includes(capability)", "item.pathways.includes(pathway)"
];

check("candidate page calls authenticated live directory endpoint and supports failure recovery", page.includes("/api/candidate/institutions") && page.includes("getCandidateAccessToken") && page.includes("Authorization:") && page.includes("UNAVAILABLE") && page.includes("setRetryKey"));
check("read-only API requires bearer authentication and passes it to Supabase", api.includes("AUTHENTICATION_REQUIRED") && api.includes("Authorization: authorization") && api.includes("method: \"GET\""));
check("read-only API filters to verified, public-safe A/B records and never uses service role", api.includes('endpoint.searchParams.set("public_safe", "eq.true")') && api.includes('endpoint.searchParams.set("verification_status", "eq.VERIFIED")') && api.includes('endpoint.searchParams.set("default_confidence_band", "in.(A,B)")') && !/SERVICE_ROLE|service_role/i.test(api));
check("read-only API fails closed on upstream errors, redirects, timeout and oversized response", api.includes('redirect: "error"') && api.includes("AbortSignal.timeout") && api.includes("RESPONSE_LIMIT") && api.includes("cache: \"no-store\""));
check("one page imports both canonical institution seed and cross-sector source manifest",
  page.includes("public-universities-and-tvet-2026-10-31.json") && page.includes("cross-sector-institution-source-extension.json"));
check("provider seed remains intact and review-only", records.length === 76 &&
  records.every(row => row.identity_verification_status === "DIRECTORY_EVIDENCE_ONLY" &&
    row.accreditation_or_delivery_scope_status === "NOT_VERIFIED" &&
    row.intake_status === "UNKNOWN" && row.eligibility_status === "UNKNOWN" &&
    row.application_route_status === "NOT_VERIFIED" && row.integration_status === "NOT_CONNECTED" &&
    row.partnership_status === "NOT_A_PARTNER" && row.provider_receipt_supported === false));
check("service categories are mapped per source rather than inferred generically from institution class", page.includes("capabilityBySource") && page.includes("capabilityBySource[source.source_id] ?? []") && !page.includes("capabilityByClass"));
check("source pathway tags require an explicit source mapping rather than generic class inference", page.includes("pathwayBySource[source.source_id] ?? []"));
check("cross-sector anchor inventory retains at least 24 records and 15 classes",
  sources.length >= 24 && extension.institution_classes.length === 15);
check("every source anchor remains review-required and disconnected",
  sources.every(row => row.review_required === true && row.connector_state === "NOT_CONNECTED" &&
    Array.isArray(row.supports) && Array.isArray(row.does_not_prove)));
check("all six Kingsmen pathways are exposed as selectable filters",
  pathways.every(key => page.includes(key) && extension.service_capabilities.length > 0));
check("sector, location, capability and pathway filters are wired to result matching",
  requiredFilters.every(fragment => page.includes(fragment)) &&
  page.includes('value="NATIONAL_SOURCE"') && page.includes("item.province === location"));
check("database-backed route records remain distinct from institution and source-anchor records", page.includes('kind: "VERIFIED_ROUTE"') && page.includes("SOURCE/ROUTE ENTRY VERIFIED; LEGAL STATUS NOT VERIFIED") && page.includes('value="VERIFIED_ROUTE"'));
check("provider records and source anchors are separate typed result kinds",
  page.includes('kind: "INSTITUTION"') && page.includes('kind: "OFFICIAL_SOURCE"') &&
  page.includes("Official sector source / registry") && page.includes("Discovery source only"));
check("verification states remain separate and explicit",
  ["Identity / legal status", "Accreditation / delivery scope", "Current service availability",
   "Candidate eligibility", "Open programme / intake", "Application / service route",
   "Technical integration", "Partnership"].every(label => page.includes(label)));
check("source URLs only render as HTTPS links and external links use safe rel attributes",
  page.includes('item.sourceUrl.startsWith("https://")') && page.includes('rel="noopener noreferrer"'));
check("directory has a private Kingsmen planning action for canonical institution/provider keys", page.includes("registryKey") && page.includes("Prepare with Kingsmen") && page.includes("directory_provider_key"));
check("candidate application UI sends a planning-only provider target action", (() => { const applicationPage = fs.readFileSync(path.join(root, "apps/web/src/app/candidate/applications/page.tsx"), "utf8"); const apiRoute = fs.readFileSync(path.join(root, "apps/web/src/app/api/candidate/applications/route.ts"), "utf8"); const edgePath = path.join(root, "supabase/functions/candidate-application-preparation/index.ts"); const edge = fs.readFileSync(edgePath, "utf8"); return applicationPage.includes("plan_directory_target") && applicationPage.includes("Save planning target") && apiRoute.includes("plan_directory_target") && edge.includes('if(p.action==="plan_directory_target")') && edge.includes("PROVIDER_NOT_IMPORTED") && edge.includes("provider_submission_sent:false") && edge.includes("source_confidence:\"UNVERIFIED\"") && edge.includes("planning_status:\"PLANNING\""); })());
check("provider planning requires verified candidate identity and server-derived candidate ownership", (() => { const edge = fs.readFileSync(path.join(root, "supabase/functions/candidate-application-preparation/index.ts"), "utf8"); return edge.includes("candidate_auth_identity_links") && edge.includes("link_status","VERIFIED") && edge.includes("const candidateId=link.candidate_id") && edge.includes("created_by_auth_user_id:authData.user.id"); })());
check("candidate workbench and verified opportunity feed remain linked",
  page.includes('href="/candidate/applications"') && page.includes('href="/candidate/opportunity-matches"'));
check("live records are loaded without changing database state or claiming a provider integration", page.includes("NOT_CONNECTED") && page.includes("does not verify every programme or intake") && api.includes("export async function GET") && !api.includes("POST("));
check("directory clearly disclaims submission, receipt and outcome claims",
  /does not submit to the institution/i.test(page) && /confirm a receipt/i.test(page) && /provider outcome/i.test(page));
check("new directory contract is wired into npm test",
  packageJson.scripts?.["institutions:cross-sector-directory:check"] === "node scripts/validators/validate-cross-sector-candidate-directory.mjs" &&
  packageJson.scripts?.test?.includes("institutions:cross-sector-directory:check"));

console.log("Cross-sector candidate directory contract: " + (failures.length ? "FAILED" : "PASS") + " (" + failures.length + " failures)");
if (failures.length) process.exit(1);
