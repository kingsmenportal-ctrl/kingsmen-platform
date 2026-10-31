import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sectorPath = "apps/api/src/public-website/sector-universe.ts";
const typePath = "apps/api/src/public-website/public-website-types.ts";
const readModelPath = "apps/api/src/public-website/website-read-model.ts";
const sectorSource = readFileSync(sectorPath, "utf8");
const typeSource = readFileSync(typePath, "utf8");
const readModelSource = readFileSync(readModelPath, "utf8");

const block = sectorSource.match(/export const PUBLIC_SECTOR_CARDS[\\s\\S]*?= \\[([\\s\\S]*?)\\n\\];/);
assert.ok(block, "public sector catalogue must exist");
const rows = block[1].split("\\n").filter((line) => /sectorKey:/.test(line));
const cards = rows.map((line) => {
  const key = line.match(/sectorKey: "([^"]+)"/)?.[1];
  const group = line.match(/sectorGroup: "([^"]+)"/)?.[1];
  assert.ok(key, "each sector must have a key");
  assert.ok(group, `${key} must have a group`);
  assert.match(line, /previewAllowed: true/, `${key} must be previewable as a category`);
  assert.match(line, /exactTargetsSealed: true/, `${key} must keep exact targets sealed`);
  assert.match(line, /officialSourceRequired: true/, `${key} must require source verification`);
  return { key, group };
});

const keys = cards.map((card) => card.key);
assert.equal(new Set(keys).size, keys.length, "sector keys must be unique");
const requiredKeys = [
  "UNIVERSITY", "TVET", "SETA_QCTO", "LEARNERSHIP", "APPRENTICESHIP",
  "INTERNSHIP", "EMPLOYMENT", "BURSARY_SCHOLARSHIP", "GRANTS", "NSFAS",
  "CAO", "PRIVATE_COLLEGE", "ENTREPRENEURSHIP", "BUSINESS_SUPPORT",
  "CREATIVE_INDUSTRIES", "PROFESSIONAL_SERVICES", "ACCOMMODATION",
  "TRANSPORT", "HEALTHCARE", "CARE_SERVICES", "LEGAL_SERVICES",
  "SOCIAL_SERVICES", "PUBLIC_SERVICES", "COMMUNITY_SUPPORT"
];
for (const key of requiredKeys) assert.ok(keys.includes(key), `missing public service category: ${key}`);
assert.ok(cards.length >= requiredKeys.length, "the catalogue must not silently omit required pathways");
for (const group of ["ENTERPRISE", "CREATIVE_PROFESSIONAL", "TRANSPORT", "HEALTHCARE", "LEGAL_SOCIAL", "PUBLIC_SERVICES"]) {
  assert.ok(typeSource.includes(`| "${group}"`), `PublicSectorCard must permit group ${group}`);
  assert.ok(cards.some((card) => card.group === group), `at least one sector must map to ${group}`);
}
assert.match(readModelSource, /Email is the only enabled candidate communication channel; WhatsApp and SMS are disabled pending approval\./);
assert.match(readModelSource, /A sector preview is not proof of a connected provider, live opening, or currently available service\./);
console.log(`Public service taxonomy regression checks passed: ${cards.length} categories; ${requiredKeys.length} required categories.`);
