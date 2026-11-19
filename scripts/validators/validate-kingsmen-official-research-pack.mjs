import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pack = JSON.parse(readFileSync("release-evidence/catalogue-research/20261119_del_vacancies_review_pack.json", "utf8"));
assert.equal(pack.schema, "kingsmen.opportunity-source-review-pack.v1");
assert.equal(pack.publicationState, "NOT_PUBLISHED");
assert.equal(pack.directDatabaseImportAllowed, false);
assert.equal(pack.liveSourceRefetchRequired, true);
assert.equal(pack.reviewerApprovalRecorded, false);
assert.equal(pack.records.length, 6);
assert.equal(pack.reviewerGateSnapshot.eligibleSourceReviewers, 0);
assert.equal(pack.reviewerGateSnapshot.activeIdentityReviewers, 1);
assert.ok(pack.requiredReviewerRoles.includes("APPLICATION_REVIEWER"));

const uniqueIds = new Set();
for (const r of pack.records) {
  assert.ok(r.id && !uniqueIds.has(r.id), "Each review-pack record must have a unique ID.");
  uniqueIds.add(r.id);
  assert.ok(r.title && r.ref || r.refs, "Each record must preserve its advert title and reference(s).");
  assert.match(r.url, /^https:\/\/www\.labour\.gov\.za\//);
  assert.equal(r.pathway, undefined, "Record defaults define the canonical pathway once for this all-employment pack.");
  assert.ok(Array.isArray(r.eligibility) && r.eligibility.length > 0);
  assert.ok(Array.isArray(r.evidence) && r.evidence.length >= 2);
  assert.ok(r.submission && r.submission.length > 10);
  if (r.relatedPriorRecord) assert.match(r.relatedPriorRecord.instruction, /Do not merge/i);
}
assert.equal(pack.perRecordDefaults.pathway, "EMPLOYMENT");
assert.equal(pack.perRecordDefaults.sectorForN15, "EMPLOYER");
assert.equal(pack.perRecordDefaults.publicationReadiness, "NEEDS_REVIEW");
assert.equal(pack.perRecordDefaults.openingStatusForDatabase, "MANUAL_CHECK_REQUIRED");
assert.equal(pack.perRecordDefaults.candidateFacingSafe, false);
assert.equal(pack.deadlinePolicy.storeChannelsSeparately, true);
assert.equal(pack.deadlinePolicy.channels.find(x => x.type === "WALK_IN").closesAt, "16:00");
assert.equal(pack.deadlinePolicy.channels.find(x => x.type === "ONLINE").closesAt, "23:59");
assert.ok(pack.guardrails.some(x => /Do not mark a programme OPEN/i.test(x)));
assert.ok(pack.guardrails.some(x => /Do not promote source confidence to OFFICIAL_VERIFIED/i.test(x)));
console.log("Kingsmen official opportunity review-pack contract passed (6 records, none published).");
