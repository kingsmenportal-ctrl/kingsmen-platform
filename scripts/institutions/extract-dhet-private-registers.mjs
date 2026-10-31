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
 const h=section.toLowerCase(),s=(section+"\n"+block.slice(0,500)).toLowerCase();
 if(kind==="private_colleges"&&/section\s+a/.test(h))return "CANCELLED";
 if(kind==="private_colleges"&&/section\s+b/.test(h))return "REGISTERED";
 if(/lapsed|lapsing/.test(h))return "LAPSED";
 if(/cancelled|canceled|withdrawn|deregistered/.test(h))return "CANCELLED";
 if(/provisionally registered|provisional registration/.test(h))return "PROVISIONAL";
 if(/registered institutions/.test(h))return "REGISTERED";
 if(/lapsed|lapsing of provisional registration/.test(s))return "LAPSED";
 if(/cancelled|canceled|registration cancelled/.test(s))return "CANCELLED";
 if(/withdrawn|deregistered/.test(s))return "WITHDRAWN_OR_DEREGISTERED_REVIEW";
 if(/provisionally registered|provisional registration/.test(s))return "PROVISIONAL";
 return "STATUS_UNRESOLVED";
}
function splitEntries(text){
 const entries=[];let section="",current=null;
 const flush=()=>{if(current)entries.push(current);current=null;};
 for(const line of text.replace(/\r/g,"").split("\n")){
  const t=line.trim();
  if(/^(SECTION\s+[AB]:?|\d+\.\s+(?:REGISTERED INSTITUTIONS|PROVISIONALLY REGISTERED INSTITUTIONS|CANCELLED|LAPSED|WITHDRAWN|DEREGISTERED))/i.test(t)){flush();section=t;continue;}
  const m=line.match(/^\s{0,8}(\d{1,3})\.\s+([A-ZÀ-ÖØ-Þ][^\n]{2,})\s*$/);
  const isEntry=m&&!/^(?:NQF|N\d|CONTACT PERSON|SECTION|REGISTER|PROGRAMME|QUALIFICATION|EXAM CENTRE)/i.test(m[2].trim());
  if(isEntry){flush();current={number:Number(m[1]),first:m[2].trim(),section,lines:[t]};}
  else if(current)current.lines.push(t);
 }
 flush();return entries;
}
export function extractRecords(text,kind){
 const source=SOURCES[kind];if(!source)throw Error("Unknown DHET register kind");
 const seen=new Set();
 return splitEntries(text).map(e=>{
  const block=e.lines.join("\n"),ids=[...new Set(block.match(source.pattern)||[])];
  const nameLines=[];
  for(const line of e.lines){
   if(/^(CONTACT PERSON|CONTACT DETAILS|TEL\.?|TELEPHONE|EMAIL|E-MAIL|FAX|WEBSITE|WEB SITE|PHYSICAL ADDRESS|POSTAL ADDRESS|SITE OF DELIVERY)/i.test(line)||line.match(source.pattern))break;
   if(line&&!/^[-–—]?\s*\d+\s*[-–—]?$/.test(line))nameLines.push(line);
  }
  const name=normalizeName(nameLines.slice(0,4).join(" "));
  const key=ids.length===1?kind+":"+ids[0].toLowerCase():kind+":name:"+canonicalSlug(name);
  const provinces=PROVINCES.filter(p=>block.toLowerCase().includes(p.toLowerCase()));
  const aliases=[...block.matchAll(/(?:previously known as|previously|formerly known as)\s+([^\n.;]+)/gi)].map(m=>normalizeName(m[1])).filter(Boolean);
  const regStatus=status(e.section,block,kind),duplicate=seen.has(key);seen.add(key);
  return {source_record_ref:key,source_register:kind,source_snapshot_date:source.date,source_url:source.url,register_entry_number:e.number,
   canonical_name_candidate:name||null,normalized_name_key:canonicalSlug(name),registration_identifier:ids.length===1?ids[0]:null,
   registration_identifiers_observed:ids,registration_status:regStatus,registration_status_review_required:["STATUS_UNRESOLVED","WITHDRAWN_OR_DEREGISTERED_REVIEW"].includes(regStatus),
   province_candidates:provinces,province_status:provinces.length===1?"SOURCE_LISTED_CANDIDATE":provinces.length?"MULTI_PROVINCE_REVIEW":"NOT_EXTRACTED",
   campus_sites:[],campus_extraction_status:"MANUAL_REVIEW_REQUIRED",alias_candidates:aliases,possible_duplicate_within_source:duplicate,
   source_excerpt:block.slice(0,12000),source_evidence_scope:"DHET register entry only; not a live application route or current opportunity",
   identity_review_status:"NEEDS_CANONICAL_IDENTITY_REVIEW",official_route_status:"NOT_VERIFIED",integration_status:"NOT_CONNECTED",automation_authorized:false,import_eligible:false};
 });
}
function selfTest(){
 const c=extractRecords("SECTION A:\n1. Former College Example (Pty) Ltd\nCONTACT PERSON\nMakotse Road, Zebediela\n2010/FE07/117 Limpopo\nSECTION B: REGISTERED PRIVATE COLLEGES\n1. Example Business College (Pty) Ltd\nCONTACT PERSON\nMain Road, Pretoria\n2021/FE07/006 Gauteng","private_colleges");
 if(normalizeName("  2. Café—College  ")!=="Café-College"||canonicalSlug("Café College")!=="cafe-college")throw Error("normalization");
 if(c.length!==2||c[0].registration_status!=="CANCELLED"||c[1].registration_status!=="REGISTERED")throw Error("cancelled/registered separation");
 const h=extractRecords("1. REGISTERED INSTITUTIONS\n1. Example Higher Institute\n2020/HE07/001 Gauteng\n2. PROVISIONALLY REGISTERED INSTITUTIONS\n2. Provisional Higher Institute\n2024/HE08/002 Western Cape\n3. LAPSED PROVISIONAL REGISTRATIONS\n3. Lapsed Higher Institute\n2018/HE07/008 Gauteng","private_higher_education");
 if(!h.some(x=>x.registration_status==="REGISTERED")||!h.some(x=>x.registration_status==="PROVISIONAL")||!h.some(x=>x.registration_status==="LAPSED"))throw Error("higher-ed status separation");
 if([...c,...h].some(x=>x.import_eligible||x.official_route_status!=="NOT_VERIFIED"||x.integration_status!=="NOT_CONNECTED"||x.automation_authorized))throw Error("fail-closed route defaults");
 console.log("PASS DHET register extractor self-test");
}
if(process.argv.includes("--self-test"))selfTest();
else{
 const args=Object.fromEntries(process.argv.slice(2).map((x,i,a)=>x.startsWith("--")?[x.slice(2),a[i+1]]:null).filter(Boolean));
 for(const k of ["higher-education-text","private-colleges-text"])if(!args[k]||!fs.existsSync(args[k]))throw Error("Provide existing --"+k+" converted from official PDF using pdftotext -layout");
 const records=[...extractRecords(fs.readFileSync(args["higher-education-text"],"utf8"),"private_higher_education"),...extractRecords(fs.readFileSync(args["private-colleges-text"],"utf8"),"private_colleges")];
 const errors=records.flatMap((x,i)=>[!x.canonical_name_candidate?"record "+i+" missing name":null,!x.normalized_name_key?"record "+i+" missing normalized key":null,!x.source_url.startsWith("https://www.dhet.gov.za/")?"record "+i+" missing official provenance":null].filter(Boolean));
 if(errors.length){console.error(errors.join("\n"));process.exit(1);}
 const out=args.out||"manifests/institutions/seed/dhet-private-register-candidates-2026-10-31.json";fs.mkdirSync(path.dirname(out),{recursive:true});
 fs.writeFileSync(out,JSON.stringify({schema:"kingsmen.institutions.dhet-private-register-candidates.v1",status:"EXTRACTION_CANDIDATES_NOT_IMPORT_AUTHORIZED",extracted_at:new Date().toISOString(),sources:Object.entries(SOURCES).map(([register,s])=>({register,snapshot_date:s.date,url:s.url})),counts:{total:records.length,private_higher_education:records.filter(x=>x.source_register==="private_higher_education").length,private_colleges:records.filter(x=>x.source_register==="private_colleges").length,registered:records.filter(x=>x.registration_status==="REGISTERED").length,provisional:records.filter(x=>x.registration_status==="PROVISIONAL").length,cancelled:records.filter(x=>x.registration_status==="CANCELLED").length,lapsed:records.filter(x=>x.registration_status==="LAPSED").length,unresolved:records.filter(x=>x.registration_status==="STATUS_UNRESOLVED"||x.registration_status==="WITHDRAWN_OR_DEREGISTERED_REVIEW").length},import_rules:{import_eligible:false,required:["canonical identity and alias reconciliation","manual campus/site review","status review","provider-key collision preflight","independent review","approved idempotent SQL migration"],route_default:"NOT_VERIFIED",integration_default:"NOT_CONNECTED",no_current_opportunity_claim:true},records},null,2)+"\n");
 console.log("Wrote "+records.length+" fail-closed review candidates to "+out+"; no SQL applied.");
}