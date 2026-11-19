import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pagePath = "apps/web/src/app/page.tsx";
const source = readFileSync(pagePath, "utf8");
const match = source.match(/const pathways\s*=\s*\[([\s\S]*?)\n\];/);

assert.ok(match, `Could not find the canonical pathways array in ${pagePath}`);

const titles = [...match[1].matchAll(/title:\s*"([^"]+)"/g)].map((entry) => entry[1]);
const expected = [
  "Higher Education",
  "TVET",
  "SETA Programmes & Learnerships",
  "Internships",
  "Apprenticeships",
  "Employment"
];

assert.deepEqual(
  titles,
  expected,
  "Kingsmen must expose the canonical six distinct pathways in the agreed order."
);

console.log("Kingsmen canonical six-pathway contract passed.");
