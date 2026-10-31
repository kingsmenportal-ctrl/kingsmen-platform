import fs from "node:fs";
const file=process.argv[2];if(!file)throw Error("manifest path required");
const m=JSON.parse(fs.readFileSync(file,"utf8"));
const failures=[];
if(m.schema!=="kingsmen.institutions.dhet-private-register-candidates.v1")failures.push("schema mismatch");
if(m.status!=="EXTRACTION_CANDIDATES_NOT_IMPORT_AUTHORIZED")failures.push("manifest must remain non-authorized");
if(!Array.isArray(m.records)||m.records.length<100)failures.push("too few extracted entries to plausibly cover both national registers");
const perKind={private_higher_education:0,private_colleges:0};
const ids=new Map(),sourceRefs=new Set();
for(const [i,r] of (m.records??[]).entries()){
 if(!Object.hasOwn(perKind,r.source_register))failures.push("unknown source register at "+i);else perKind[r.source_register]++;
 if(!r.canonical_name_candidate||!r.normalized_name_key)failures.push("missing normalized institution name at "+i);
 if(!r.source_url?.startsWith("https://www.dhet.gov.za/"))failures.push("missing official provenance at "+i);
 if(!r.source_snapshot_date||!r.source_record_ref)failures.push("missing snapshot key at "+i);
 if(r.import_eligible!==false||r.official_route_status!=="NOT_VERIFIED"||r.integration_status!=="NOT_CONNECTED"||r.automation_authorized!==false)failures.push("unsafe activation state at "+i);
 if(!Array.isArray(r.province_candidates)||!Array.isArray(r.alias_candidates)||!Array.isArray(r.registration_identifiers_observed))failures.push("candidate arrays missing at "+i);
 const ref=r.source_register+"|"+r.source_snapshot_date+"|"+r.source_record_ref;if(sourceRefs.has(ref))failures.push("duplicate source key "+ref);sourceRefs.add(ref);
 for(const id of r.registration_identifiers_observed??[]){const k=r.source_register+"|"+r.source_snapshot_date+"|"+id;const prior=ids.get(k);if(prior&&prior!==r.normalized_name_key)failures.push("registration identifier collision "+k);ids.set(k,r.normalized_name_key);}
 if(/CONTACT PERSON|\b(?:TEL\.?|TELEPHONE|MOBILE|FAX|EMAIL|E-MAIL)\s*:/i.test(r.source_excerpt??""))failures.push("contact field leaked into source excerpt at "+i);
 if(failures.length>100)break;
}
if(perKind.private_higher_education<50)failures.push("private higher-education extraction count unexpectedly low: "+perKind.private_higher_education);
if(perKind.private_colleges<30)failures.push("private-college extraction count unexpectedly low: "+perKind.private_colleges);
if(failures.length){console.error("DHET manifest validation failed:\n"+failures.slice(0,100).join("\n"));process.exit(1);}
console.log("PASS DHET full-register candidate validation",JSON.stringify({total:m.records.length,perKind,counts:m.counts,routeSafety:"all candidates remain disconnected"}));
