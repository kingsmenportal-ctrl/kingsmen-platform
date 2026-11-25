import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const snapshot=JSON.parse(readFileSync("manifests/rebuild/kingsmen-staging-security-advisor-2026-11-25.json","utf8"));
const report=JSON.parse(readFileSync("reports/rebuild/kingsmen-staging-security-advisor-latest.json","utf8"));
const doc=readFileSync("docs/rebuild/KINGSMEN_STAGING_SECURITY_ADVISOR_AUDIT_2026-11-25.md","utf8");
const f=snapshot.findings;

assert.equal(snapshot.schema,"kingsmen.staging-security-advisor-snapshot.v1");
assert.equal(report.schema,"kingsmen.staging-security-advisor-audit.v1");
assert.equal(snapshot.capturedOn,"2026-11-25");
assert.equal(snapshot.database.projectRef,"euhubhhnumtibbyufghm");
assert.equal(snapshot.safety.readOnly,true);
for(const key of ["schemaChanged","dataChanged","policiesChanged","functionsChanged","authSettingsChanged","releaseGateOpened"]) assert.equal(snapshot.safety[key],false);
assert.equal(snapshot.tableInventory.publicTables,230);
assert.equal(snapshot.tableInventory.publicTablesWithRlsEnabled,230);
assert.equal(f.rlsEnabledNoPolicy.count,f.rlsEnabledNoPolicy.tables.length);
assert.equal(f.rlsEnabledNoPolicy.count,17);
assert.equal(f.authenticatedSecurityDefinerFunctionExecutable.count,f.authenticatedSecurityDefinerFunctionExecutable.functions.length);
assert.equal(f.authenticatedSecurityDefinerFunctionExecutable.count,6);
assert.equal(f.multiplePermissivePolicies.count,f.multiplePermissivePolicies.policies.length);
assert.equal(f.multiplePermissivePolicies.count,16);
assert.equal(f.leakedPasswordProtection.count,1);
assert.equal(f.unusedIndexes.count,f.unusedIndexes.indexes.length);
assert.equal(f.unusedIndexes.count,282);
assert.equal(report.summary.publicTables,snapshot.tableInventory.publicTables);
assert.equal(report.summary.rlsEnabledNoPolicy,f.rlsEnabledNoPolicy.count);
assert.equal(report.summary.authenticatedCallableSecurityDefinerFunctions,f.authenticatedSecurityDefinerFunctionExecutable.count);
assert.equal(report.summary.multiplePermissivePolicies,f.multiplePermissivePolicies.count);
assert.equal(report.summary.unusedIndexes,f.unusedIndexes.count);
assert.equal(report.safety.policiesChanged,false);
assert.match(doc,/DO NOT CHANGE LIVE POLICIES BLINDLY/);
assert.match(doc,/get_candidate_cao_choices/);
assert.match(doc,/candidate_identity_review_audit/);
assert.match(doc,/leaked-password protection/);
assert.match(doc,/Do not batch-drop these indexes/);

assert.equal(snapshot.liveDatabaseVerification.findings.securityDefinerBodiesExactlyMatchCandidateHistoricalSource,6);
assert.equal(snapshot.liveDatabaseVerification.findings.flaggedFunctionsWithAnonExecute,0);
assert.equal(snapshot.liveDatabaseVerification.findings.flaggedFunctionsWithPublicExecute,0);
assert.equal(snapshot.liveDatabaseVerification.findings.flaggedFunctionsCallableByAuthenticated,6);
assert.equal(snapshot.liveDatabaseVerification.findings.noPolicyTablesWithAnonOrAuthenticatedTableGrant,0);
assert.equal(snapshot.liveDatabaseVerification.findings.noPolicyTablesChecked,17);
assert.equal(snapshot.liveDatabaseVerification.functionBodyAndPrivilegeChecks.length,6);
for(const fn of snapshot.liveDatabaseVerification.functionBodyAndPrivilegeChecks){
  assert.equal(fn.normalizedBodyMatches,true,"Live function body differs from candidate source: "+fn.name);
  assert.equal(fn.anonCanExecute,false,"Anon must not execute function: "+fn.name);
  assert.equal(fn.publicCanExecute,false,"PUBLIC must not execute function: "+fn.name);
  assert.equal(fn.authenticatedCanExecute,true,"Authenticated execute is intentionally enabled but still needs role tests: "+fn.name);
}
assert.equal(snapshot.liveDatabaseVerification.noPolicyTablePrivilegeChecks.length,17);
for(const table of snapshot.liveDatabaseVerification.noPolicyTablePrivilegeChecks){
  assert.equal(table.policyCount,0,"Expected no policies in this snapshot: "+table.table);
  for(const privilege of ["select","insert","update","delete"]){
    assert.equal(table.anon[privilege],false,"Unexpected anon privilege: "+table.table+" "+privilege);
    assert.equal(table.authenticated[privilege],false,"Unexpected authenticated privilege: "+table.table+" "+privilege);
  }
}
assert.match(doc,/live check completed/i);
assert.match(doc,/all six deployed bodies match/i);
assert.match(doc,/deny all eight direct client-role privileges/i);

console.log("Kingsmen staging security-advisor snapshot contract passed: 17 RLS tables, 6 SECURITY DEFINER RPCs, 16 policy overlaps and 282 index candidates captured; no live changes made.");
