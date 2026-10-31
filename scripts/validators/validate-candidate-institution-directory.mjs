import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const seedPath = path.join(root, "manifests/institutions/seed/public-universities-and-tvet-2026-10-31.json");
const pagePath = path.join(root, "apps/web/src/app/candidate/institutions/page.tsx");
const landingPath = path.join(root, "apps/web/src/app/candidate/page.tsx");
const dashboardPath = path.join(root, "apps/web/src/app/candidate/dashboard/page.tsx");
const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));
const page = fs.readFileSync(pagePath, "utf8");
const landing = fs.readFileSync(landingPath, "utf8");
const dashboard = fs.readFileSync(dashboardPath, "utf8");
const failures = [];
const check = (name, condition) => {
  const ok = Boolean(condition);
  console.log((ok ? "PASS " : "FAIL ") + name);
  if (!ok) failures.push(name);
};
const records = seed.records ?? [];
const universities = records.filter(row => row.provider_type === "PUBLIC_UNIVERSITY");
const tvet = records.filter(row => row.provider_type === "TVET_COLLEGE");

check("directory seed has 26 public universities and 50 TVET colleges", universities.length === 26 && tvet.length === 50 && records.length === 76);
check("record references are unique and stable", new Set(records.map(row => row.institution_ref)).size === records.length);
check("every row is directory evidence only", records.every(row => row.identity_verification_status === "DIRECTORY_EVIDENCE_ONLY" && row.directory_record_status === "LISTED_BY_DHET_OFFICIAL_DIRECTORY"));
check("no institution row invents intake, deadline, eligibility or route", records.every(row => row.intake_status === "UNKNOWN" && row.deadline_status === "UNKNOWN" && row.eligibility_status === "UNKNOWN" && row.application_route_status === "NOT_VERIFIED"));
check("no row implies partnership or live integration", records.every(row => row.partnership_status === "NOT_A_PARTNER" && row.integration_status === "NOT_CONNECTED" && row.automation_authorized === false && row.provider_receipt_supported === false));
check("all directory source links are HTTPS DHET URLs", records.every(row => typeof row.directory_source_url === "string" && row.directory_source_url.startsWith("https://www.dhet.gov.za/")));
check("unresolved institution websites remain unset", records.filter(row => !row.official_website_url).every(row => row.official_website_status === "MISSING_OR_CONFLICTING_URL_REQUIRES_REVIEW"));
check("directory page imports canonical seed rather than duplicated data", page.includes("manifests/institutions/seed/public-universities-and-tvet-2026-10-31.json"));
check("search supports institution name", /type="search"/.test(page) && /setQuery/.test(page) && /canonical_name/.test(page));
check("cross-sector filters support sector and institution location", /setSector/.test(page) && /setLocation/.test(page) && /item.sectorKeys.includes\(sector\)/.test(page) && /item.province === location/.test(page));
check("page separates directory discovery from open-intake verification", /Discovery is not verification/i.test(page) && /Open programme \/ intake/.test(page) && /UNKNOWN/.test(page));
check("external website links open safely", /target="_blank"/.test(page) && /rel="noopener noreferrer"/.test(page));
check("unresolved institution website URLs remain unset and are never guessed", /Institution website URL unresolved/i.test(page) && /will not guess the URL/i.test(page) && /providerWebsiteStatus/.test(page));
check("opportunity and application workbench links are present", /candidate\/opportunity-matches/.test(page) && /candidate\/applications/.test(page));
check("remaining private and CET registers remain explicitly outstanding", /Private higher education/i.test(page) && /private colleges/i.test(page) && /CET colleges/i.test(page));
check("candidate landing page links to institution directory", /href: "\/candidate\/institutions"/.test(landing));
check("candidate dashboard links to institution directory", /href: "\/candidate\/institutions"/.test(dashboard));

console.log("Candidate institution-directory UI contract: " + (failures.length ? "FAILED" : "PASS") + " (" + failures.length + " failures)");
if (failures.length) process.exit(1);
