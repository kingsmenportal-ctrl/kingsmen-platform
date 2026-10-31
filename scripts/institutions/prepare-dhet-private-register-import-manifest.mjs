#!/usr/bin/env node
import fs from "node:fs";
import { validateManifest } from "./build-dhet-private-register-evidence-migration.mjs";

const input=process.argv[2],output=process.argv[3];
if(!input||!output)throw Error("Usage: node scripts/institutions/prepare-dhet-private-register-import-manifest.mjs validated-candidates.json import-candidates.json");
const source=JSON.parse(fs.readFileSync(input,"utf8"));
if(source.schema!=="kingsmen.institutions.dhet-private-register-candidates.v1"||
   source.status!=="EXTRACTION_CANDIDATES_NOT_IMPORT_AUTHORIZED"||
   !Array.isArray(source.records))throw Error("source manifest must be the validated, non-authorized DHET candidate manifest");
const eligible=[],excluded=[];
for(const r of source.records){
 const reasons=[];
 if(!Array.isArray(r.registration_identifiers_observed)||r.registration_identifiers_observed.length!==1)reasons.push("REGISTRATION_IDENTIFIER_NOT_UNIQUE");
 if(r.registration_identifier!==r.registration_identifiers_observed?.[0])reasons.push("REGISTRATION_IDENTIFIER_FIELD_MISMATCH");
 if(r.registration_status_review_required===true)reasons.push("REGISTRATION_STATUS_REVIEW_REQUIRED");
 if(["CONFLICT_REVIEW_REQUIRED","DUPLICATE_SOURCE_ENTRY_REVIEW"].includes(r.identity_conflict_status))reasons.push(r.identity_conflict_status);
 if((r.conflict_flags??[]).length)reasons.push("IDENTITY_CONFLICT_FLAGS_PRESENT");
 if(!r.canonical_name_candidate||!r.normalized_name_key)reasons.push("NORMALIZED_INSTITUTION_NAME_MISSING");
 if(!r.source_section||r.source_section==="UNSECTIONED")reasons.push("SOURCE_STATUS_SECTION_MISSING");
 if(!r.source_excerpt||!r.source_url?.startsWith("https://www.dhet.gov.za/"))reasons.push("OFFICIAL_SOURCE_EVIDENCE_MISSING");
 if(r.import_eligible!==true)reasons.push("IMPORT_NOT_EXPLICITLY_AUTHORIZED");
 if(r.identity_review_status!=="VERIFIED_CANONICAL_IDENTITY")reasons.push("CANONICAL_IDENTITY_NOT_VERIFIED");
 if(r.alias_reconciliation_status!=="RECONCILED")reasons.push("ALIAS_PROVIDER_KEY_NOT_RECONCILED");
 if(r.campus_extraction_status!=="REVIEWED")reasons.push("CAMPUS_SITE_NOT_REVIEWED");
 if(r.official_route_status!=="NOT_VERIFIED"||r.integration_status!=="NOT_CONNECTED"||r.automation_authorized!==false)reasons.push("UNSAFE_ROUTE_OR_IMPORT_STATE");
 if(reasons.length)excluded.push({source_record_ref:r.source_record_ref,source_register:r.source_register,registration_status:r.registration_status,reasons});
 else eligible.push(r);
}
const candidate={...source,status:"IMPORT_CANDIDATE_SUBSET_NOT_AUTHORIZED",counts:{...(source.counts??{}),full_candidate_records:source.records.length,import_candidate_records:eligible.length,excluded_records:excluded.length},records:eligible,excluded_record_refs:excluded};
if(eligible.length){
 const errors=validateManifest(candidate);
 if(errors.length)throw Error("filtered import candidate subset failed migration-generator validation:\\n"+errors.slice(0,50).join("\\n"));
}else{
 candidate.status="NO_REVIEWED_IMPORT_RECORDS_BLOCKED";
}
fs.writeFileSync(output,JSON.stringify(candidate,null,2)+"\\n");
console.log(JSON.stringify({status:candidate.status,full_candidate_records:source.records.length,import_candidate_records:eligible.length,excluded_records:excluded.length,exclusion_reasons:Object.fromEntries([...new Set(excluded.flatMap(x=>x.reasons))].map(k=>[k,excluded.filter(x=>x.reasons.includes(k)).length])),import_authorized:false,staging_changed:false,sql_generation:eligible.length?"eligible subset only":"intentionally skipped: no reviewed rows"},null,2));
