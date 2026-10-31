#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
const SOURCES={
 private_higher_education:{date:"2026-07-06",url:"https://www.dhet.gov.za/Registers_DocLib/Annexure%20A%20Register%20%20Private%20Higher%20Education%20Institutions%2006%20July%202026.pdf",pattern:/\b\d{4}\/HE\d{2}\/\d{3}\b/gi},
 private_colleges:{date:"2026-07-15",url:"https://www.dhet.gov.za/Registers_DocLib/Register%20of%20Private%20Colleges%20%2015%20July%202026.pdf",pattern:/\b\d{4}\/(?:S?FE)\d{2}\/\d{3}\b/gi}
};
const PROVINCES=["Eastern Cape","Free State","Gauteng","KwaZulu-Natal","Limpopo","Mpumalanga","North West","Northern Cape","Western Cape"];
export const normalizeName=s=>String(s??"").normalize("NFKC").replace(/[’‘]/g,"'").replace(/[–—]/g,"-").replace(/\s+/g," ").replace(/^[\d. )-]+/,"").trim().replace(/[.,;:]+$/,"");
export const canonicalSlug=s=>normalizeName(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/&/g," and ").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
function status(section,block,kind){
 const h=section.toLowerCase(),s=(section+"\n"+block).toLowerCase();
 const hasLapsed=/\blapsed\b|\blapsing\b/.test(s);
 const hasExplicitCancellation=/reasons for cancellation|date when cancellation comes into effect|registration has been cancelled|registration was cancelled|cancelled with effect/.test(s);
 const sectionCancelled=/\bcancelled\b|\bcanceled\b/.test(h);
 if(hasLapsed&&(hasExplicitCancellation||sectionCancelled))return "STATUS_UNRESOLVED";
 if(hasLapsed)return "LAPSED";
 if(kind==="private_colleges"&&/section\s+a/.test(h))return "CANCELLED";
 if(kind==="private_colleges"&&/section\s+b/.test(h)){
  return hasExplicitCancellation?"STATUS_UNRESOLVED":"REGISTERED";
 }
 if(hasExplicitCancellation||sectionCancelled)return "CANCELLED";
 if(/withdrawn|deregistered/.test(h))return "WITHDRAWN_OR_DEREGISTERED_REVIEW";
 if(/provisionally registered|provisional registration/.test(h))return "PROVISIONAL";
 if(/registered institutions/.test(h))return "REGISTERED";
 if(/withdrawn|deregistered/.test(s))return "WITHDRAWN_OR_DEREGISTERED_REVIEW";
 if(/provisionally registered|provisional registration/.test(s))return "PROVISIONAL";
 if(/registered institutions/.test(s))return "REGISTERED";
 return "STATUS_UNRESOLVED";
}
function redactSourceExcerpt(block){
 return block.split("\n").filter(line=>{
  const t=line.trim();
  if(!t)return false;
  if(/CONTACT PERSON|CONTACT DETAILS|CONTACT NUMBER|\bTEL\.?\b|\bTELEPHONE\b|\bMOBILE\b|\bCELL\b|\bFAX\b|\bEMAIL\b|\bE-MAIL\b|\bE MAIL\b/i.test(t))return false;
  if(/\b(?:MR|MRS|MS|MISS|DR|PROF|PROFESSOR|MX)\.?\s+[A-Z]/i.test(t))return false;
  if(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(t))return false;
  if(/(?:\+?\d[\d ()/-]{7,}\d)/.test(t))return false;
  return true;
 }).join("\n").slice(0,12000);
}
function splitEntries(text){
 const entries=[];let section="",current=null;
 const flush=()=>{if(current)entries.push(current);current=null;};
 for(const line of text.replace(/\r/g,"").split("\n")){
  const t=line.trim();
  const isStatusSection = t === t.toUpperCase() && /^(SECTION\s+[AB]\b.*|\d+\.\s+.*\b(?:REGISTERED INSTITUTIONS|PROVISIONALLY REGISTERED|CANCELLED|LAPSED|WITHDRAWN|DEREGISTERED)\b.*)$/i.test(t);
  if(isStatusSection){flush();section=t;continue;}
  const m=line.match(/^\s{0,8}(\d{1,3})\.\s+([A-ZÀ-ÖØ-Þ][^\n]{2,})\s*$/);
  const isEntry=m&&!/^(?:NQF|N\d|CONTACT PERSON|SECTION|REGISTER|PROGRAMME|QUALIFICATION|EXAM CENTRE)/i.test(m[2].trim());
  if(isEntry){flush();current={number:Number(m[1]),first:m[2].trim(),section,lines:[line.replace(/\r$/,"")]};}
  else if(current)current.lines.push(line.replace(/\r$/,""));
 }
 flush();return entries;
}
function cleanHeadingName(value,source){
 let candidate=String(value??"").replace(source.pattern," ");
 // Some DHET HEI rows concatenate programme cells into the numbered heading.
 candidate=candidate.replace(/\s+\d{1,2}\s*\)\s*(?=(?:higher certificate|bachelor|diploma|national certificate|postgraduate|honours|master|doctor|phd|occupational certificate|nqf level)\b).*$/i,"");
 // Preserve long legal names by ending at a legal-entity suffix before table spill.
 const legalSuffix=candidate.match(/\s+(?:\(Pty\)\s*Ltd|Proprietary Limited|Limited|Ltd\.?|Inc\.?|NPC|NPO)\b/i);
 if(legalSuffix)candidate=candidate.slice(0,legalSuffix.index+legalSuffix[0].length);
 else candidate=candidate.replace(/\s+(?=(?:higher certificate|bachelor(?: of)?|diploma(?: in| of)?|national certificate|postgraduate|honours|master(?: of)?|doctor(?: of)?|phd|occupational certificate|nqf level)\b).*$/i,"");
 for(const province of PROVINCES)candidate=candidate.replace(new RegExp(province,"gi")," ");
 candidate=candidate.replace(/\b(?:registration|reg)\s*(?:no\.?|number)?\s*[:#-]?\s*/gi," ");
 return normalizeName(candidate);
}
export function extractRecords(text,kind){
 const source=SOURCES[kind];if(!source)throw Error("Unknown DHET register kind");
 const seen=new Set();
 const nameWidth=kind==="private_colleges"?56:36;
 const siteWidth=kind==="private_colleges"?54:42;
 const records=splitEntries(text).filter(e=>(e.lines.join("\n").match(source.pattern)||[]).length>0).map(e=>{
  const block=e.lines.join("\n"),ids=[...new Set(block.match(source.pattern)||[])];
  // The first column on the numbered source line is the only automatic name
  // candidate. Wrapped suffixes remain reviewable instead of absorbing contact,
  // address or qualification columns into the legal name.
  const firstColumn=(e.first.split(/\s{2,}/)[0]??"").replace(/^\d{1,3}\.\s*/,"").trim();
  const name=normalizeName(firstColumn);
  const nameExtractionStatus="REVIEW_REQUIRED";
  const sectionKey=canonicalSlug(e.section||"unsectioned")||"unsectioned";
  const key=kind+":"+sectionKey+":"+String(e.number).padStart(3,"0")+":"+(ids.length===1?ids[0].toLowerCase():canonicalSlug(name));
  // Province must be attached to this entry's registration-ID line; scanning
  // the entire block can pull in provinces from other campuses or qualifications.
  const idLine=e.lines.find(line=>{source.pattern.lastIndex=0;return source.pattern.test(line);});
  source.pattern.lastIndex=0;
  const idLineText=(idLine??"").toLowerCase().replace(/kwazulu\s+natal/g,"kwazulu-natal").replace(/north\s*west/g,"north west").replace(/northwest/g,"north west");
  const provinceSet=PROVINCES.filter(p=>idLineText.includes(p.toLowerCase()));
  const aliases=[...block.matchAll(/(?:previous name\s*:?|previously known as|formerly known as|t\/a)\s+([^\n.;]+)/gi)].map(m=>normalizeName(m[1])).filter(Boolean);
  const regStatus=status(e.section,block,kind);
  const idKey=ids.length===1?ids[0].toLowerCase():canonicalSlug(name);
  const duplicate=seen.has(idKey);seen.add(idKey);
  const campusCandidates=[...new Set(e.lines.flatMap((line,index)=>{
    const cols=line.trim().split(/\s{2,}/).map(x=>x.trim()).filter(Boolean);
    return (index===0?cols.slice(1):cols).map(value=>{
      let candidate=value.replace(source.pattern," ");
      source.pattern.lastIndex=0;
      for(const province of PROVINCES)candidate=candidate.replace(new RegExp(province,"gi")," ");
      return redactSourceExcerpt(candidate.replace(/^\d{1,3}[.)]?\s*/,"").replace(/\s+/g," ").trim());
    });
  }).filter(x=>x&&/[A-Za-z]{3,}/.test(x)&&(/[0-9]/.test(x)||/\b(?:campus|street|road|avenue|drive|building|office park|pretoria|johannesburg|cape town|durban|bellville|centurion|randburg|polokwane|bloemfontein|gqeberha|east london|rustenburg|midrand|bryanston|waterkloof|zebediela|motatantanye|village|suburb)\b/i.test(x))
      && !/(CONTACT PERSON|CONTACT DETAILS|CONTACT NUMBER|TEL\.?|TELEPHONE|MOBILE|CELL|FAX|EMAIL|E-MAIL|WEBSITE|WEB SITE|QUALIFICATION|NQF LEVEL|BACHELOR|CERTIFICATE|DIPLOMA|DOCTOR|MASTER|EXAM CENTRE|PROGRAMME|PROGRAM|HEQSF|CONTACT MODE|DISTANCE MODE|BLENDED|REGISTRAR|MANAGER|PRINCIPAL|DIRECTOR|PO BOX|PRIVATE BAG|POSTNET|@|WWW\.)/i.test(x)))].slice(0,30);
  return {source_record_ref:key,source_register:kind,source_snapshot_date:source.date,source_url:source.url,source_section:e.section||"UNSECTIONED",register_entry_number:e.number,
   source_heading_candidate:redactSourceExcerpt(firstColumn),canonical_name_candidate:name||null,normalized_name_key:canonicalSlug(name),name_extraction_status:nameExtractionStatus,
   registration_identifier:ids.length===1?ids[0]:null,registration_identifiers_observed:ids,registration_status:regStatus,
   registration_status_review_required:["STATUS_UNRESOLVED","WITHDRAWN_OR_DEREGISTERED_REVIEW"].includes(regStatus),
   province_candidates:provinceSet,province_status:provinceSet.length===1?"SOURCE_LISTED_CANDIDATE":provinceSet.length?"MULTI_PROVINCE_REVIEW":"NOT_EXTRACTED",
   campus_sites:[],campus_site_candidates:campusCandidates,campus_extraction_status:campusCandidates.length?"REVIEW_REQUIRED":"NOT_EXTRACTED",
   alias_candidates:aliases,possible_duplicate_within_source:duplicate,
   source_excerpt:redactSourceExcerpt(e.lines.slice(0,1).join("\\n")),source_evidence_scope:"DHET register entry only; not a live application route or current opportunity",
   identity_review_status:"NEEDS_CANONICAL_IDENTITY_REVIEW",identity_conflict_status:"NO_CONFLICT_DETECTED_REVIEW_STILL_REQUIRED",conflict_flags:[],
   official_route_status:"NOT_VERIFIED",integration_status:"NOT_CONNECTED",automation_authorized:false,import_eligible:false};
 });
 for(const record of records){
  if(record.registration_identifiers_observed.length!==1){
   record.identity_conflict_status="CONFLICT_REVIEW_REQUIRED";
   record.identity_review_status="CONFLICT_REVIEW_REQUIRED";
   record.conflict_flags.push("MULTIPLE_REGISTRATION_IDENTIFIERS_IN_ENTRY");
  }
 }
 const byId=new Map();
 for(const record of records)for(const id of record.registration_identifiers_observed){
  const key=record.source_register+"|"+record.source_snapshot_date+"|"+id.toLowerCase();
  const group=byId.get(key)||[];group.push(record);byId.set(key,group);
 }
 for(const group of byId.values()){
  if(group.length<2)continue;
  const distinctNames=new Set(group.map(x=>x.normalized_name_key).filter(Boolean));
  const distinctStatuses=new Set(group.map(x=>x.registration_status));
  if(distinctNames.size>1||distinctStatuses.size>1){
   for(const record of group){
    record.identity_conflict_status="CONFLICT_REVIEW_REQUIRED";
    if(distinctNames.size>1)record.conflict_flags.push("REGISTRATION_IDENTIFIER_REUSED_WITH_DIFFERENT_NAME");
    if(distinctStatuses.size>1)record.conflict_flags.push("REGISTRATION_STATUS_CONFLICT");
    record.identity_review_status="CONFLICT_REVIEW_REQUIRED";
   }
  }else if(group.length>1){
   for(const record of group){record.possible_duplicate_within_source=true;record.identity_conflict_status="DUPLICATE_SOURCE_ENTRY_REVIEW";record.conflict_flags.push("DUPLICATE_REGISTRATION_ENTRY");}
  }
 }
 const byName=new Map();
 for(const record of records){
  if(!record.normalized_name_key)continue;
  const key=record.source_register+"|"+record.source_snapshot_date+"|"+record.normalized_name_key;
  const group=byName.get(key)||[];group.push(record);byName.set(key,group);
 }
 for(const group of byName.values()){
  if(group.length<2)continue;
  for(const record of group){
   record.possible_duplicate_within_source=true;
   record.identity_conflict_status="DUPLICATE_SOURCE_ENTRY_REVIEW";
   record.identity_review_status="CONFLICT_REVIEW_REQUIRED";
   if(!record.conflict_flags.includes("DUPLICATE_NORMALIZED_NAME_REVIEW"))record.conflict_flags.push("DUPLICATE_NORMALIZED_NAME_REVIEW");
  }
 }
 return records;
}
function selfTest(){
 const c=extractRecords("SECTION A:\n1.   Former College Example (Pty) Ltd                     Makotse Road, Zebediela\n"+ " ".repeat(56)+"CONTACT PERSON\n"+ " ".repeat(56)+"Mr A I Makungo\n"+ " ".repeat(56)+"Tel: 015 663 1921\n"+ " ".repeat(56)+"Email: contact@example.org\n"+ " ".repeat(56)+"Makotse Road, Zebediela\n"+ " ".repeat(56)+"2010/FE07/117 Limpopo\nSECTION B: REGISTERED PRIVATE COLLEGES\n1.   Example Business College (Pty) Ltd                  Main Road, Pretoria\n"+ " ".repeat(56)+"CONTACT PERSON\n"+ " ".repeat(56)+"Main Road, Pretoria\n"+ " ".repeat(56)+"2021/FE07/006 Gauteng","private_colleges");
 if(normalizeName("  2. Café—College  ")!=="Café-College"||canonicalSlug("Café College")!=="cafe-college")throw Error("normalization");
 if(c.length!==2||c[0].registration_status!=="CANCELLED"||c[1].registration_status!=="REGISTERED")throw Error("cancelled/registered separation");
 if(c[0].canonical_name_candidate!=="Former College Example (Pty) Ltd"||c[1].canonical_name_candidate!=="Example Business College (Pty) Ltd")throw Error("private-college canonical name extraction");
 const h=extractRecords("1. REGISTERED INSTITUTIONS\n1. Example Higher Institute\n"+ " ".repeat(36)+"2020/HE07/001 Gauteng\n"+ " ".repeat(36)+"1) Bachelor of Arts\n2. PROVISIONALLY REGISTERED INSTITUTIONS\n2. Provisional Higher Institute\n"+ " ".repeat(36)+"2024/HE08/002 Western Cape\n"+ " ".repeat(36)+"2) Bachelor of Business\n3. LAPSED PROVISIONAL REGISTRATIONS\n3. Lapsed Higher Institute\n"+ " ".repeat(36)+"2018/HE07/008 Gauteng","private_higher_education");
 if(h.find(x=>x.registration_status==="REGISTERED")?.canonical_name_candidate!=="Example Higher Institute")throw Error("higher-ed canonical name extraction");
 if(!h.some(x=>x.registration_status==="REGISTERED")||!h.some(x=>x.registration_status==="PROVISIONAL")||!h.some(x=>x.registration_status==="LAPSED"))throw Error("higher-ed status separation");
 if([...c,...h].some(x=>x.import_eligible||x.official_route_status!=="NOT_VERIFIED"||x.integration_status!=="NOT_CONNECTED"||x.automation_authorized))throw Error("fail-closed route defaults");
 if(/Makungo|015 663 1921|contact@example.org|CONTACT PERSON|Tel:/i.test(c[0].source_excerpt))throw Error("contact detail redaction failed");
 console.log("PASS DHET register extractor self-test");
}
if(process.argv.includes("--self-test"))selfTest();
else{
 const args=Object.fromEntries(process.argv.slice(2).map((x,i,a)=>x.startsWith("--")?[x.slice(2),a[i+1]]:null).filter(Boolean));
 for(const k of ["higher-education-text","private-colleges-text"])if(!args[k]||!fs.existsSync(args[k]))throw Error("Provide existing --"+k+" converted from official PDF using pdftotext -layout");
 let records=[...extractRecords(fs.readFileSync(args["higher-education-text"],"utf8"),"private_higher_education"),...extractRecords(fs.readFileSync(args["private-colleges-text"],"utf8"),"private_colleges")];
 const lookups=[];
 for(const rel of ["manifests/institutions/coverage-gap-register-2026-10-31.json","manifests/institutions/cross-sector-institution-source-extension.json","manifests/institutions/seed/public-universities-and-tvet-2026-10-31.json"]){
  try{
   const doc=JSON.parse(fs.readFileSync(rel,"utf8"));
   for(const x of [...(doc.provider_targets??[]),...(doc.sources??[]),...(doc.records??[])]){
    const key=x.provider_key??x.institution_ref??x.source_id;
    const name=x.canonical_name??x.provider_name??x.name??x.source_name;
    if(key&&name)lookups.push({provider_key:key,canonical_name:name,normalized_name_key:canonicalSlug(name),source_url:x.official_directory_url??x.directory_source_url??x.source_url??null});
   }
  }catch{}
 }
 for(const row of records){
  const names=[row.canonical_name_candidate,...row.alias_candidates].filter(Boolean).map(canonicalSlug);
  row.possible_existing_provider_matches=lookups.filter(x=>names.includes(x.normalized_name_key));
  row.alias_reconciliation_status=row.possible_existing_provider_matches.length?"POSSIBLE_CANONICAL_MATCH_REVIEW_REQUIRED":"NO_EXACT_MATCH_FOUND_STILL_REQUIRES_MANUAL_REVIEW";
 }
 const rejectedRecords=records.filter(x=>!x.canonical_name_candidate||!x.normalized_name_key);
 records=records.filter(x=>x.canonical_name_candidate&&x.normalized_name_key);
 const errors=records.flatMap((x,i)=>[!x.source_url.startsWith("https://www.dhet.gov.za/")?"record "+i+" missing official provenance":null].filter(Boolean));
 if(errors.length){console.error(errors.join("\n"));process.exit(1);}
 const out=args.out||"manifests/institutions/seed/dhet-private-register-candidates-2026-10-31.json";fs.mkdirSync(path.dirname(out),{recursive:true});
 fs.writeFileSync(out,JSON.stringify({schema:"kingsmen.institutions.dhet-private-register-candidates.v1",status:"EXTRACTION_CANDIDATES_NOT_IMPORT_AUTHORIZED",extracted_at:new Date().toISOString(),sources:Object.entries(SOURCES).map(([register,s])=>({register,snapshot_date:s.date,url:s.url})),counts:{total:records.length,heading_candidates:records.length+rejectedRecords.length,section_counts:Object.fromEntries([...new Set(records.map(r=>r.source_section))].sort().map(s=>[s,records.filter(r=>r.source_section===s).length])),status_counts_by_register:{private_higher_education:Object.fromEntries(["REGISTERED","PROVISIONAL","CANCELLED","LAPSED","STATUS_UNRESOLVED","WITHDRAWN_OR_DEREGISTERED_REVIEW"].map(s=>[s,records.filter(r=>r.source_register==="private_higher_education"&&r.registration_status===s).length])),private_colleges:Object.fromEntries(["REGISTERED","PROVISIONAL","CANCELLED","LAPSED","STATUS_UNRESOLVED","WITHDRAWN_OR_DEREGISTERED_REVIEW"].map(s=>[s,records.filter(r=>r.source_register==="private_colleges"&&r.registration_status===s).length]))},rejected_missing_name:rejectedRecords.length,rejected_missing_name_by_register:{private_higher_education:rejectedRecords.filter(x=>x.source_register==="private_higher_education").length,private_colleges:rejectedRecords.filter(x=>x.source_register==="private_colleges").length},private_higher_education:records.filter(x=>x.source_register==="private_higher_education").length,private_colleges:records.filter(x=>x.source_register==="private_colleges").length,registered:records.filter(x=>x.registration_status==="REGISTERED").length,provisional:records.filter(x=>x.registration_status==="PROVISIONAL").length,cancelled:records.filter(x=>x.registration_status==="CANCELLED").length,lapsed:records.filter(x=>x.registration_status==="LAPSED").length,unresolved:records.filter(x=>x.registration_status==="STATUS_UNRESOLVED"||x.registration_status==="WITHDRAWN_OR_DEREGISTERED_REVIEW").length,registration_identifier_conflict_records:records.filter(x=>x.identity_conflict_status==="CONFLICT_REVIEW_REQUIRED").length,duplicate_source_entry_records:records.filter(x=>x.identity_conflict_status==="DUPLICATE_SOURCE_ENTRY_REVIEW").length,records_with_campus_candidates:records.filter(x=>x.campus_site_candidates.length>0).length,name_review_required:records.filter(x=>x.name_extraction_status==="REVIEW_REQUIRED").length,province_review_required:records.filter(x=>x.province_status!=="SOURCE_LISTED_CANDIDATE").length,campus_review_required:records.filter(x=>x.campus_extraction_status==="REVIEW_REQUIRED"||x.campus_extraction_status==="NOT_EXTRACTED").length,records_with_province_candidates:records.filter(x=>x.province_candidates.length>0).length,records_with_registration_identifier:records.filter(x=>x.registration_identifiers_observed.length===1).length,records_with_status_review_required:records.filter(x=>x.registration_status_review_required).length,unique_registration_identifiers:new Set(records.flatMap(x=>x.registration_identifiers_observed.map(id=>x.source_register+"|"+id.toLowerCase()))).size,unique_normalized_names:new Set(records.map(x=>x.source_register+"|"+x.normalized_name_key).filter(Boolean)).size},extraction_diagnostics:{rejected_missing_name_samples:rejectedRecords.slice(0,20).map(x=>({source_register:x.source_register,register_entry_number:x.register_entry_number,source_heading_candidate:x.source_heading_candidate}))},import_rules:{import_eligible:false,required:["canonical identity and alias reconciliation","manual campus/site review","status review","provider-key collision preflight","independent review","approved idempotent SQL migration"],route_default:"NOT_VERIFIED",integration_default:"NOT_CONNECTED",no_current_opportunity_claim:true},records},null,2)+"\n");
 console.log("Wrote "+records.length+" named fail-closed review candidates; rejected "+rejectedRecords.length+" headings without a normalized institution name to "+out+"; no SQL applied.");
}