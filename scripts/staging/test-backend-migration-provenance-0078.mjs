import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const legacyPath = path.join(
  root,
  "release-evidence/recovered-applied-migrations/20261019112452_candidate_application_preparation_readiness_0078.sql"
);
const correctedPath = path.join(
  root,
  "release-evidence/recovered-applied-migrations/20261019112511_candidate_application_preparation_readiness_0078_corrected.sql"
);
const readmePath = path.join(root, "release-evidence/recovered-applied-migrations/README.md");

const legacy = fs.readFileSync(legacyPath, "utf8");
const corrected = fs.readFileSync(correctedPath, "utf8");
const readme = fs.readFileSync(readmePath, "utf8");

// The first historical body predates the composite owner key required by the
// private Document Vault. The later body adds that exact postcondition.
assert.equal(legacy.trimEnd().split(/\r?\n/).length, 98, "pre-fix 0078 source remains the 98-line historical body");
assert.ok(
  legacy.includes("candidate_application_tracker_id_candidate_uidx"),
  "pre-fix body contains the tracker composite owner key"
);
assert.ok(
  !legacy.includes("candidate_application_preparation_items_id_candidate_uidx"),
  "pre-fix body must not be mislabeled as containing the later preparation-item owner key"
);
assert.equal(corrected.trimEnd().split(/\r?\n/).length, 104, "corrected 0078 source remains the 104-line historical body");
assert.ok(
  corrected.trimEnd().startsWith(legacy.trimEnd()),
  "corrected body preserves the pre-fix body and appends the reviewed composite preparation-item key"
);
assert.ok(
  corrected.includes("CREATE UNIQUE INDEX IF NOT EXISTS candidate_application_preparation_items_id_candidate_uidx"),
  "corrected body adds the composite owner key required by the private document vault"
);
assert.ok(
  corrected.includes("ON public.candidate_application_preparation_items(id, candidate_id)"),
  "corrected composite key binds the preparation item ID to candidate ownership"
);

// Both archive copies must remain outside the live migration runner directories.
assert.ok(!legacyPath.includes(path.join("db", "migrations")), "archive body must not be a runnable migration");
assert.ok(!correctedPath.includes(path.join("db", "migrations")), "corrected archive must not be a runnable migration");
assert.ok(
  readme.includes("`20261019112452`") &&
  readme.includes("`6f3512d330b99206bad7859318dcaf9fdb461c59`"),
  "README maps the first ledger version to its historical source blob"
);
assert.ok(
  readme.includes("`20261019112511`") &&
  readme.includes("`9fdabdde36c981ae305e57df589c168471b7d974`"),
  "README maps the second ledger version to its corrected historical source blob"
);
assert.ok(
  readme.includes("f723fbe7ac9eb3e3afe15e640d61da433bf1bdb4"),
  "README records the exact corrective source commit"
);
assert.ok(
  readme.includes("raw execution checksum unavailable"),
  "documentation preserves the distinction between historical source recovery and a checksum captured at execution"
);

console.log("PASS: duplicate 0078 source provenance is mapped to two distinct historical bodies; execution-byte checksum is not falsely claimed.");
