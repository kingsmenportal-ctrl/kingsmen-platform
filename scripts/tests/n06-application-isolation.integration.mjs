#!/usr/bin/env node
const base=(process.env.N06_BASE_URL||"").trim().replace(/\/+$/,""),aToken=(process.env.N06_CANDIDATE_A_TOKEN||"").trim(),bToken=(process.env.N06_CANDIDATE_B_TOKEN||"").trim();
if(!base||!aToken||!bToken){console.error("BLOCKED: set N06_BASE_URL, N06_CANDIDATE_A_TOKEN and N06_CANDIDATE_B_TOKEN for dedicated synthetic staging candidates.");process.exit(2);}
async function call(token,path){const r=await fetch(base+path,{headers:{authorization:"Bearer "+token},cache:"no-store"});return {status:r.status,body:await r.json().catch(()=>null)};}
const checks=[];function check(name,passed,detail=""){checks.push({name,passed:Boolean(passed),detail});}
const [a,b,as,bs,unauth]=await Promise.all([
 call(aToken,"/api/candidate/applications"),call(bToken,"/api/candidate/applications"),
 call(aToken,"/api/candidate/opportunities?saved=true"),call(bToken,"/api/candidate/opportunities?saved=true"),
 fetch(base+"/api/candidate/applications",{cache:"no-store"}).then(async r=>({status:r.status,body:await r.json().catch(()=>null)}))
]);
check("unauthenticated application request denied",unauth.status===401,"status="+unauth.status);
check("candidate A applications scoped",a.status===200&&a.body?.ok===true,"status="+a.status);
check("candidate B applications scoped",b.status===200&&b.body?.ok===true,"status="+b.status);
check("candidate A saved list scoped",as.status===200&&as.body?.ok===true,"status="+as.status);
check("candidate B saved list scoped",bs.status===200&&bs.body?.ok===true,"status="+bs.status);
const ids=(v:any,key:string)=>new Set(Array.isArray(v.body?.[key])?v.body[key].map((x:any)=>x.id):[]);
const overlap=[...ids(a,"applications")].filter(id=>ids(b,"applications").has(id));
const savedOverlap=[...ids(as,"opportunities")].filter(id=>ids(bs,"opportunities").has(id));
check("candidate application lists do not overlap",overlap.length===0,"overlap="+overlap.length);
check("saved opportunity records do not overlap",savedOverlap.length===0,"overlap="+savedOverlap.length);
const failures=checks.filter(x=>!x.passed),report={schema:"kingsmen.n06.application-isolation.v1",status:failures.length?"FAIL":"PASS",productionReady:false,checks,failures};console.log(JSON.stringify(report,null,2));if(failures.length)process.exit(1);
