import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const routePath = path.join(root, "manifests/institutions/institution-application-route-capabilities.json");
const sourcePath = path.join(root, "manifests/institutions/national-institution-network-source-register.json");
const routeRegistry = JSON.parse(fs.readFileSync(routePath, "utf8"));
const sourceRegistry = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const failed = [];
const check = (name, condition, detail = "") => {
  const ok = Boolean(condition);
  console.log((ok ? "PASS " : "FAIL ") + name + (detail ? " — " + detail : ""));
  if (!ok) failed.push(name);
};
const pathways = ["HIGHER_EDUCATION", "TVET", "SETA_LEARNERSHIPS", "INTERNSHIPS", "APPRENTICESHIPS", "EMPLOYMENT"];
const sourceIds = new Set(sourceRegistry.sources.map(source => source.source_id));
check("route registry schema is versioned", routeRegistry.schema === "kingsmen.institutions.application-route-registry.v1");
check("all six pathways represented", pathways.every(pathway => routeRegistry.routes.some(route => route.pathways.includes(pathway))));
check("route identifiers unique", new Set(routeRegistry.routes.map(route => route.route_id)).size === routeRegistry.routes.length);
check("all seven route classes represented", ["cao", "tvet_direct", "university_admissions", "private_institution_admissions", "seta_training_provider", "public_service_vacancies", "employer_careers"].every(id => routeRegistry.routes.some(route => route.route_id === id)));
for (const route of routeRegistry.routes) {
  check("pathways valid: " + route.route_id, route.pathways.length > 0 && route.pathways.every(p => pathways.includes(p)));
  check("integration is not overclaimed: " + route.route_id, route.integration_status !== "CONNECTED" && route.automation_authorized === false && route.test_environment_verified === false);
  check("no invented approval: " + route.route_id, route.provider_approval_evidence_ref === null);
  check("provider receipt required: " + route.route_id, route.receipt_confirmation_required === true);
  check("candidate confirmation required: " + route.route_id, route.candidate_confirmation_required === true);
  check("safe fallback exists: " + route.route_id, typeof route.fallback === "string" && route.fallback.length > 25);
  check("destination constraints described: " + route.route_id, route.destination_scope.length > 35 && route.important_constraints.length > 0);
  if (route.official_submission_url) {
    let parsed = null;
    try { parsed = new URL(route.official_submission_url); } catch {}
    check("known route URL is HTTPS: " + route.route_id, parsed !== null && parsed.protocol === "https:");
  }
  if (route.source_register_id) check("source reference resolves: " + route.route_id, sourceIds.has(route.source_register_id));
}
check("one shared Kingsmen profile", routeRegistry.policy.shared_kingsmen_profile === true);
check("separate application child per destination", routeRegistry.policy.distinct_destination_application_child === true);
check("automated submission disabled by default", routeRegistry.policy.default_automated_submission === false);
check("provider-specific authorization required", routeRegistry.policy.automation_requires_provider_specific_authorization === true);
check("CAPTCHA/MFA bypass disabled", routeRegistry.policy.captcha_or_mfa_bypass_allowed === false);
check("legal attestations/signatures require candidate", routeRegistry.policy.legal_attestation_or_signature_without_candidate === false);
check("ambiguous submission cannot retry before reconciliation", routeRegistry.policy.retry_ambiguous_submission_without_reconciliation === false);
check("unknown route hands off to candidate", routeRegistry.policy.unknown_route_fallback === "USER_ACTION_REQUIRED");
console.log("Institution application-route validation: " + (failed.length ? "FAILED" : "PASS") + " (" + failed.length + " failing checks)");
if (failed.length) process.exit(1);
