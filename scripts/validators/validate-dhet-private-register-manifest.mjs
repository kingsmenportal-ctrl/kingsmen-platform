import fs from "node:fs";
const file=process.argv[2];if(!file)throw Error("manifest path required");
const m=JSON.parse(fs.readFileSync(file,"utf8"));
const failures=[];
if(m.schema!=="kingsmen.institutions.dhet-private-register-candidates.v1")failures.push("schema mismatch");
if(m.status!=="EXTRACTION_CANDIDATES_NOT_IMPORT_AUTHORIZED")failures.push("manifest must remain non-authorized");
if(!Array.isArray(m.records)||m.records.length<100)failures.push("too few extracted entries to plausibly cover both national registers");
const perKind={private_higher_education:0,private_colleges:0};
const sourceRefs=new Set(),ids=new Map();
for(const [i,r] of (m.records??[]).entries()){
 if(!Object.hasOwn(perKind,r.source_register))failures.push("unknown source register at "+i);else perKind[r.source_register]++;
 if(!r.canonical_name_candidate||!r.normalized_name_key)failures.push("missing normalized institution name at "+i);
 if(r.name_extraction_status!=="REVIEW_REQUIRED")failures.push("name candidate is not explicitly marked for manual review at "+i);
 if(/@[A-Z0-9.-]+|\bwww\.|CONTACT PERSON|CONTACT DETAILS|\b(?:TEL\.?|TELEPHONE|MOBILE|CELL|FAX|EMAIL|E-MAIL|REGISTRAR|MANAGER|PRINCIPAL|PO BOX|PRIVATE BAG|POSTNET)\b|\b(?:Bachelor|Higher Certificate|FET Certificate|Diploma|NQF Level|HEQSF)\b/i.test(r.canonical_name_candidate??""))failures.push("name candidate contains contact, address or qualification-column contamination at "+i);
 if(/\b(Bachelor|Higher Certificate|FET Certificate|General Education and Training|National Certificate|Diploma|NQF Level)\b/i.test(r.canonical_name_candidate??""))failures.push("programme/qualification text leaked into institution name at "+i+": "+String(r.canonical_name_candidate??"").slice(0,160));
 if(!r.source_url?.startsWith("https://www.dhet.gov.za/"))failures.push("missing official provenance at "+i);
 if(!r.source_snapshot_date||!r.source_record_ref)failures.push("missing snapshot key at "+i);
 if(!r.source_section||r.source_section==="UNSECTIONED")failures.push("entry has no recognized source status section at "+i);
 if((r.province_candidates??[]).length>1)failures.push("province candidates are not scoped to one registration-ID line at "+i);
 if(r.registration_identifier&&!new RegExp(r.source_register==="private_higher_education"?"^\\d{4}\\/HE\\d{2}\\/\\d{3}$":"^\\d{4}\\/(?:S?FE)\\d{2}\\/\\d{3}$","i").test(r.registration_identifier))failures.push("malformed registration identifier at "+i);
 if((r.canonical_name_candidate??"").length<4)failures.push("institution name candidate too short at "+i);
 if(r.import_eligible!==false||r.official_route_status!=="NOT_VERIFIED"||r.integration_status!=="NOT_CONNECTED"||r.automation_authorized!==false)failures.push("unsafe activation state at "+i);
 if(!Array.isArray(r.province_candidates)||!Array.isArray(r.alias_candidates)||!Array.isArray(r.registration_identifiers_observed)||!Array.isArray(r.campus_site_candidates)||!Array.isArray(r.conflict_flags))failures.push("candidate arrays missing at "+i);
 const ref=r.source_register+"|"+r.source_snapshot_date+"|"+r.source_record_ref;if(sourceRefs.has(ref))failures.push("duplicate source key "+ref);sourceRefs.add(ref);
 for(const id of r.registration_identifiers_observed??[]){const k=r.source_register+"|"+r.source_snapshot_date+"|"+id.toLowerCase();const group=ids.get(k)||[];group.push(r);ids.set(k,group);}
 for(const text of [r.source_excerpt,r.source_heading_candidate,...(r.campus_site_candidates??[])]) {
  if(/CONTACT PERSON|CONTACT DETAILS|\b(?:TEL\.?|TELEPHONE|MOBILE|CELL|FAX|EMAIL|E-MAIL)\s*:/i.test(text??""))failures.push("contact field leaked into retained evidence at "+i);
  if(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text??""))failures.push("email leaked into retained evidence at "+i);
  if(/(?:\+?\d[\d ()/-]{7,}\d)/.test(text??""))failures.push("phone-like number leaked into retained evidence at "+i);
 }
 if(failures.length>100)break;
}
let conflictGroups=0,duplicateGroups=0;
for(const [key,group] of ids){
 if(group.length<2)continue;
 const names=new Set(group.map(x=>x.normalized_name_key));
 const statuses=new Set(group.map(x=>x.registration_status));
 const differentNames=names.size>1,differentStatuses=statuses.size>1||group.some(x=>(x.conflict_flags??[]).includes("REGISTRATION_STATUS_CONFLICT"));
 if(differentNames||differentStatuses){
  conflictGroups++;
  for(const r of group){
   if(r.identity_conflict_status!=="CONFLICT_REVIEW_REQUIRED"||r.import_eligible!==false)failures.push("unflagged registration identity/status conflict "+key+" status="+r.identity_conflict_status+" flags="+(r.conflict_flags??[]).join(","));
   if(differentNames&&!r.conflict_flags.includes("REGISTRATION_IDENTIFIER_REUSED_WITH_DIFFERENT_NAME"))failures.push("name conflict flag missing "+key);
   if(differentStatuses&&!r.conflict_flags.includes("REGISTRATION_STATUS_CONFLICT"))failures.push("status conflict flag missing "+key);
  }
 }else{
  duplicateGroups++;
  for(const r of group)if(r.identity_conflict_status!=="DUPLICATE_SOURCE_ENTRY_REVIEW"||r.import_eligible!==false)failures.push("duplicate source entry not marked for review "+key);
 }
}
if(perKind.private_higher_education<50)failures.push("private higher-education extraction count unexpectedly low: "+perKind.private_higher_education);
if(perKind.private_colleges<30)failures.push("private-college extraction count unexpectedly low: "+perKind.private_colleges);
const observedSections=Object.fromEntries([...new Set((m.records??[]).map(r=>r.source_section))].sort().map(s=>[s,(m.records??[]).filter(r=>r.source_section===s).length]));
if(JSON.stringify(observedSections)!==JSON.stringify(m.counts?.section_counts))failures.push("section counts do not reconcile to source records");
for(const [register,counts] of Object.entries(m.counts?.status_counts_by_register??{})){
 const actual=Object.fromEntries(["REGISTERED","PROVISIONAL","CANCELLED","LAPSED","STATUS_UNRESOLVED","WITHDRAWN_OR_DEREGISTERED_REVIEW"].map(s=>[s,(m.records??[]).filter(r=>r.source_register===register&&r.registration_status===s).length]));
 if(JSON.stringify(actual)!==JSON.stringify(counts))failures.push("per-register status counts do not reconcile for "+register);
}
if(!m.counts?.section_counts||Object.keys(m.counts.section_counts).some(s=>s==="UNSECTIONED"))failures.push("status-section extraction is incomplete");
if(m.counts?.name_review_required!==(m.records??[]).length)failures.push("every name candidate must remain explicitly review-required until manually reconciled");
const provinceCount=(m.records??[]).filter(r=>(r.province_candidates??[]).length>0).length;
const campusCount=(m.records??[]).filter(r=>(r.campus_site_candidates??[]).length>0).length;
const idCount=(m.records??[]).filter(r=>(r.registration_identifiers_observed??[]).length===1).length;
const nameDuplicateCount=(m.records??[]).filter(r=>(r.conflict_flags??[]).includes("DUPLICATE_NORMALIZED_NAME_REVIEW")).length;
for(const [field,actual] of [["records_with_province_candidates",provinceCount],["records_with_campus_candidates",campusCount],["records_with_registration_identifier",idCount],["duplicate_normalized_name_records",nameDuplicateCount]])if(m.counts?.[field]!==actual)failures.push(field+" does not reconcile to extracted records");
if(provinceCount===0)failures.push("no province candidates were extracted from either complete register");
if(campusCount===0)failures.push("no campus/site candidates were extracted from either complete register");
const names=new Map();
for(const r of m.records??[]){if(!r.normalized_name_key)continue;const k=r.source_register+"|"+r.source_snapshot_date+"|"+r.normalized_name_key;const g=names.get(k)||[];g.push(r);names.set(k,g);}
for(const [key,group] of names){if(group.length<2)continue;for(const r of group)if(!["DUPLICATE_SOURCE_ENTRY_REVIEW","CONFLICT_REVIEW_REQUIRED"].includes(r.identity_conflict_status)||r.possible_duplicate_within_source!==true||!(r.conflict_flags??[]).includes("DUPLICATE_NORMALIZED_NAME_REVIEW"))failures.push("duplicate normalized institution identity not flagged for review: "+key);}
if(failures.length){console.error("DHET manifest validation failed:\n"+failures.slice(0,100).join("\n"));process.exit(1);}
console.log("PASS DHET full-register candidate validation",JSON.stringify({total:m.records.length,perKind,counts:m.counts,registrationIdentifierConflictGroups:conflictGroups,duplicateGroups,routeSafety:"all candidates remain disconnected"}));
