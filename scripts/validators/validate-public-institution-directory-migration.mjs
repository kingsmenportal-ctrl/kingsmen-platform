import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const seedPath=path.join(root,"manifests/institutions/seed/public-universities-and-tvet-2026-10-31.json");
const migrationPath=path.join(root,"db/migrations/0099_seed_dhet_public_institution_directory.sql");
const seed=JSON.parse(fs.readFileSync(seedPath,"utf8"));
const sql=fs.readFileSync(migrationPath,"utf8");
const failed=[];
const check=(name,value)=>{const ok=Boolean(value);console.log((ok?"PASS ":"FAIL ")+name);if(!ok)failed.push(name)};
const q=s=>String(s).replace(/'/g,"''");
check("seed has 76 entries",seed.records.length===76);
const uncommentedSql=sql.split(/\r?\n/).filter(line=>!line.trim().startsWith("--")).join("\n").trim();
check("migration has transaction boundaries",/^BEGIN;/i.test(uncommentedSql)&&/COMMIT;\s*$/i.test(uncommentedSql));
check("source anchor insert is idempotent",/INSERT INTO public\.source_authorities/i.test(sql)&&/ON CONFLICT \(source_key\) DO NOTHING/i.test(sql));
check("TVET source anchor is not stamped freshly verified",/last_verified_at[\s\S]{0,80}NULL/i.test(sql));
check("route provider import uses existing provider table",/INSERT INTO public\.route_providers/i.test(sql));
check("route provider import is idempotent",/ON CONFLICT \(provider_key\) DO UPDATE SET/i.test(sql));
check("no programme records are invented",!/INSERT INTO public\.route_programmes/i.test(sql));
check("no deadlines, requirements or fees are invented",!/INSERT INTO public\.(route_deadlines|route_requirements|route_fees)/i.test(sql));
check("default confidence remains review-grade",/'C',[\s\r\n]*'NEEDS_REVIEW',[\s\r\n]*false,[\s\r\n]*false/i.test(sql));
const routeProviderInsert=sql.match(/INSERT INTO public\.route_providers\s*\([\s\S]*?\)\s*SELECT([\s\S]*?)FROM source_rows d/i);
check("new provider records are not public-safe",/sa\.id,\s*'C',\s*'NEEDS_REVIEW',\s*false,\s*false,/i.test(routeProviderInsert?.[1] ?? ""));
check("seed metadata maintains unverified route",/application_route_status[\s\S]{0,100}NOT_VERIFIED/i.test(sql));
check("seed metadata maintains unknown intake",/intake_status[\s\S]{0,80}UNKNOWN/i.test(sql));
check("seed metadata denies partner claim",/partnership_status[\s\S]{0,80}NOT_A_PARTNER/i.test(sql));
check("seed metadata does not authorize automation",/automation_authorized[\s\S]{0,80}false/i.test(sql));
check("post-import assertions verify 26 universities",/v_universities <> 26/i.test(sql));
check("post-import assertions verify 50 TVET colleges",/v_tvet <> 50/i.test(sql));
for(const record of seed.records){
 const key=record.provider_type==="PUBLIC_UNIVERSITY"
  ? record.institution_ref.replace(/^university-/,"dhet_university_")
  : record.institution_ref.replace(/^tvet-/,"dhet_tvet_");
 check("provider key present: "+key,sql.includes("'"+q(key)+"'"));
}
console.log("DHET provider migration source-contract: "+(failed.length?"FAILED":"PASS")+" ("+failed.length+" failures)");
if(failed.length)process.exit(1);
