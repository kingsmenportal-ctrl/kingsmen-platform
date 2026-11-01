import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sectorSource = readFileSync("apps/api/src/public-website/sector-universe.ts", "utf8");
const typeSource = readFileSync("apps/api/src/public-website/public-website-types.ts", "utf8");
const readModelSource = readFileSync("apps/api/src/public-website/website-read-model.ts", "utf8");
const block = sectorSource.match(/export const PUBLIC_SECTOR_CARDS[\s\S]*?= \[([\s\S]*?)\n\];/);
assert.ok(block, "public sector catalogue must exist");
const rows = block[1].split("\n").filter((line) => /sectorKey:/.test(line));
const cards = rows.map((line) => {
  const key = line.match(/sectorKey: "([^"]+)"/)?.[1];
  const group = line.match(/sectorGroup: "([^"]+)"/)?.[1];
  assert.ok(key && group, "each category must have a key and group");
  for (const flag of ["previewAllowed: true", "exactTargetsSealed: true", "officialSourceRequired: true"]) {
    assert.ok(line.includes(flag), key + " must stay preview-only, sealed and source-verified");
  }
  assert.ok(typeSource.includes('| "' + group + '"'), "type missing group " + group);
  return { key, group };
});
const keys = cards.map((x) => x.key);
assert.equal(new Set(keys).size, keys.length, "sector keys must be unique");
const required = [
  "UNIVERSITY", "TVET", "CAO", "PRIVATE_COLLEGE", "SETA_QCTO", "LEARNERSHIP",
  "APPRENTICESHIP", "INTERNSHIP", "EMPLOYMENT", "EMPLOYER_INTERNSHIP",
  "BURSARY_SCHOLARSHIP", "GRANTS", "NSFAS", "ENTREPRENEURSHIP", "BUSINESS_SUPPORT",
  "CREATIVE_INDUSTRIES", "PROFESSIONAL_SERVICES", "ACCOMMODATION", "TRANSPORT",
  "HEALTHCARE", "CARE_SERVICES", "LEGAL_SERVICES", "SOCIAL_SERVICES", "PUBLIC_SERVICES",
  "COMMUNITY_SUPPORT"
];
for (const key of required) assert.ok(keys.includes(key), "missing category " + key);
for (const group of ["ENTERPRISE", "CREATIVE_PROFESSIONAL", "TRANSPORT", "HEALTHCARE", "LEGAL_SOCIAL", "PUBLIC_SERVICES"]) {
  assert.ok(cards.some((x) => x.group === group), "no category mapped to " + group);
}
assert.ok(readModelSource.includes("WhatsApp and SMS are disabled pending approval."));
assert.ok(readModelSource.includes("A sector preview is not proof of a connected provider, live opening, or currently available service."));
console.log("Public sector taxonomy checks passed: " + cards.length + " categories.");
