import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync("apps/web/src/app/free-destiny-map/page.tsx", "utf8");
const match = page.match(/const pathways = \[([\s\S]*?)\];/);

assert.ok(match, "Free Destiny Map must declare its pathway choices");
const pathways = Array.from(match[1].matchAll(/\["([^"]+)",\s*"([^"]+)"\]/g), ([, key, label]) => ({ key, label }));
const expectedKeys = [
  "higher-education",
  "tvet",
  "seta",
  "internship",
  "apprenticeship",
  "employment",
  "unsure"
];

assert.deepEqual(
  pathways.map(({ key }) => key),
  expectedKeys,
  "Free Destiny Map must preserve Kingsmen's six canonical pathways plus the explore option"
);
assert.equal(pathways.find(({ key }) => key === "internship")?.label, "Internships");
assert.equal(pathways.find(({ key }) => key === "apprenticeship")?.label, "Apprenticeships");
assert.equal(pathways.find(({ key }) => key === "employment")?.label, "Employment");
assert.match(page, /Need funding or a stipend/, "Funding must remain a support need, not a separate pathway");
assert.match(page, /Need accommodation support/, "Accommodation must remain available as a support need");

process.stdout.write("Free Destiny Map canonical six-pathway contract: PASS (6 pathways + explore option)\\n");
