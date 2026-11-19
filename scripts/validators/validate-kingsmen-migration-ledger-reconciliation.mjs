#!/usr/bin/env node
/**
 * Validate the committed Kingsmen migration-ledger reconciliation manifest.
 *
 * This is a static evidence-manifest check only. It does not connect to Supabase,
 * execute SQL, or prove that any recovery SQL is byte-identical to the applied
 * database migration. Runtime ledger comparison must be performed separately.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const manifestPath = resolve(
  process.argv[2] ??
    "docs/rebuild/KINGSMEN_MIGRATION_LEDGER_RECONCILIATION_2026-11-17.csv",
);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"' && field.length === 0) {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (quoted) throw new Error("CSV contains an unterminated quoted field.");
  if (field.length > 0 || row.length > 0) {
    row.push(field.replace(/\r$/, ""));
    if (row.some((value) => value.trim() !== "")) rows.push(row);
  }

  if (rows.length === 0) throw new Error("CSV is empty.");
  const headers = rows.shift().map((value, index) =>
    index === 0 ? value.replace(/^\uFEFF/, "").trim() : value.trim()
  );
  return rows.map((values, rowIndex) => {
    if (values.length !== headers.length) {
      throw new Error(
        `Row ${rowIndex + 2} has ${values.length} fields; expected ${headers.length}.`,
      );
    }
    return Object.fromEntries(
      headers.map((header, index) => [header, values[index].trim()]),
    );
  });
}

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

let records;
try {
  records = parseCsv(readFileSync(manifestPath, "utf8"));
} catch (error) {
  console.error(`FAIL: cannot read reconciliation manifest: ${error.message}`);
  process.exit(1);
}

const requiredHeaders = [
  "version",
  "ledger_name",
  "source_class",
  "source_path",
  "all_candidate_paths",
];
const actualHeaders = Object.keys(records[0] ?? {});
for (const header of requiredHeaders) {
  if (!actualHeaders.includes(header)) fail(`missing required column: ${header}`);
}

const allowedClasses = new Set([
  "EXACT_TIMESTAMP_RECOVERY_FILE",
  "FILENAME_MATCH_REQUIRES_CONTENT_REVIEW",
  "NO_MATCHING_SQL_SOURCE_FOUND",
]);
const expectedClasses = {
  EXACT_TIMESTAMP_RECOVERY_FILE: 62,
  FILENAME_MATCH_REQUIRES_CONTENT_REVIEW: 36,
  NO_MATCHING_SQL_SOURCE_FOUND: 32,
};
const errors = [];
const seenVersions = new Set();
const versionsByName = new Map();
const counts = Object.fromEntries([...allowedClasses].map((name) => [name, 0]));

for (const [index, row] of records.entries()) {
  const rowNumber = index + 2;
  if (!/^\d{14}$/.test(row.version)) {
    errors.push(`row ${rowNumber}: invalid migration version ${JSON.stringify(row.version)}`);
  }
  if (!row.ledger_name) errors.push(`row ${rowNumber}: ledger_name is blank`);
  if (!allowedClasses.has(row.source_class)) {
    errors.push(`row ${rowNumber}: unsupported source_class ${JSON.stringify(row.source_class)}`);
  } else {
    counts[row.source_class] += 1;
  }
  if (seenVersions.has(row.version)) {
    errors.push(`row ${rowNumber}: duplicate migration version ${row.version}`);
  }
  seenVersions.add(row.version);

  if (!versionsByName.has(row.ledger_name)) versionsByName.set(row.ledger_name, []);
  versionsByName.get(row.ledger_name).push(row.version);

  if (
    row.source_class === "EXACT_TIMESTAMP_RECOVERY_FILE" &&
    (!row.source_path.startsWith("release-evidence/recovered-applied-migrations/") ||
      !row.source_path.split("/").at(-1).startsWith(`${row.version}_`))
  ) {
    errors.push(
      `row ${rowNumber}: exact-timestamp class must reference a recovery file prefixed with ${row.version}_`,
    );
  }
  if (
    row.source_class !== "NO_MATCHING_SQL_SOURCE_FOUND" &&
    !row.source_path
  ) {
    errors.push(`row ${rowNumber}: source_path is required for ${row.source_class}`);
  }
}

if (records.length !== 130) errors.push(`expected 130 manifest rows; found ${records.length}`);
if (seenVersions.size !== records.length) errors.push("migration versions are not unique");

for (const [sourceClass, expected] of Object.entries(expectedClasses)) {
  if (counts[sourceClass] !== expected) {
    errors.push(`${sourceClass}: expected ${expected}, found ${counts[sourceClass]}`);
  }
}

const duplicateNames = [...versionsByName.entries()]
  .filter(([, versions]) => versions.length > 1)
  .map(([name, versions]) => ({ name, versions: [...versions].sort() }))
  .sort((a, b) => a.name.localeCompare(b.name));

const expectedDuplicateNames = [
  {
    name: "candidate_application_preparation_readiness_0078",
    versions: ["20261019112452", "20261019112511"],
  },
  {
    name: "seed_verified_labour_vacancy_deadlines_0093",
    versions: ["20261029180632", "20261029180642"],
  },
].sort((a, b) => a.name.localeCompare(b.name));

if (JSON.stringify(duplicateNames) !== JSON.stringify(expectedDuplicateNames)) {
  errors.push(
    `duplicate-name inventory differs from the audited ledger: ${JSON.stringify(duplicateNames)}`,
  );
}

if (errors.length > 0) {
  for (const error of errors) fail(error);
  process.exit(1);
}

console.log(`PASS: ${records.length} migration ledger entries are represented once.`);
console.log(`PASS: recovery-source classifications = ${JSON.stringify(counts)}`);
console.log(`PASS: duplicate ledger names are recorded explicitly = ${duplicateNames.length}`);
console.log("LIMIT: static manifest validation only; this is not a live Supabase comparison or SQL byte-parity proof.");
