#!/usr/bin/env node
// Authenticated staging isolation test. Use dedicated synthetic candidate accounts only.
// Tokens are read from environment and are never printed or written to reports.
const base=(process.env.N06_BASE_URL||"").trim().replace(/\/+$/,""),aToken=(process.env.N06_CANDIDATE_A_TOKEN||"").trim(),bToken=(process.env.N06_CANDIDATE_B_TOKEN||"").trim();
if(!base||!aToken||!bToken){console.error("BLOCKED: set N06_BASE_URL, N06_CANDIDATE_A_TOKEN and N06_CANDIDATE_B_TOKEN for dedicated synthetic staging candidates.");process.exit(2);}
if(aToken===bToken){console.error("BLOCKED: candidate A and B must use distinct access tokens.");process.exit(2);}
async function call(token,path,method="GET",body){const init={method,headers:{authorization:"Bearer "+token},cache:"no-store"};if(body!==undefined){init.headers["content-type"]="application/json";init.body=JSON.stringify(body);}const r=await fetch(base+path,init);return {status:r.status,body:await r.json().catch(()=>null)};}
const checks=[];function check(name,passed,detail=""){checks.push({name,passed:Boolean(passed),detail});}
const [a,b,savedA,savedB,unauth]=await Promise.all([
 call(aToken,"/api/candidate/applications"),call(bToken,"/api/candidate/applications"),
 call(aToken,"/api/candidate/opportunities?saved=true"),call(bToken,"/api/candidate/opportunities?saved=true"),
 fetch(base+"/api/candidate/applications",{cache:"no-store"}).then(async r=>({status:r.status,body:await r.json().catch(()=>null)}))
]);
check("unauthenticated application request denied",unauth.status===401,"status="+unauth.status);
check("candidate A applications scoped",a.status===200&&a.body?.ok===true,"status="+a.status);
check("candidate B applications scoped",b.status===200&&b.body?.ok===true,"status="+b.status);
check("candidate A saved list scoped",savedA.status===200&&savedA.body?.ok===true,"status="+savedA.status);
check("candidate B saved list scoped",savedB.status===200&&savedB.body?.ok===true,"status="+savedB.status);
const ids=(v,key)=>new Set(Array.isArray(v.body?.[key])?v.body[key].map(x=>x.id).filter(x=>typeof x==="string"):[]);
const aApps=ids(a,"applications"),bApps=ids(b,"applications");
const overlap=[...aApps].filter(id=>bApps.has(id));
check("candidate application lists do not overlap",overlap.length===0,"overlap="+overlap.length);
const savedIds=(v)=>ids(v,"opportunities");
const savedOverlap=[...savedIds(savedA)].filter(id=>savedIds(savedB).has(id));
check("candidate saved-opportunity lists do not overlap",savedOverlap.length===0,"overlap="+savedOverlap.length);
if(aApps.size===0||bApps.size===0){
 check("synthetic application fixtures exist for both candidates",false,"A="+aApps.size+", B="+bApps.size+"; provision dedicated synthetic staging applications before running this test.");
}else{
 check("synthetic application fixtures exist for both candidates",true,"A="+aApps.size+", B="+bApps.size);
}
const probeRoutes=[
 ["readiness","/api/candidate/applications/readiness","POST",id=>({applicationId:id})],
 ["status transition","/api/candidate/applications/status","POST",id=>({applicationId:id,toStatus:"WITHDRAWN",reasonCode:"ISOLATION_TEST"})],
 ["manual package","/api/candidate/applications/manual-package","POST",id=>({applicationId:id})]
];
for(const [label,path,method,payload] of probeRoutes){
 if(aApps.size>0){
  const cross=await call(bToken,path,method,payload([...aApps][0]));
  check("candidate B cannot access candidate A application via "+label,cross.status===404&&cross.body?.code==="APPLICATION_NOT_FOUND","status="+cross.status+", code="+(cross.body?.code||"none"));
 }
 if(bApps.size>0){
  const cross=await call(aToken,path,method,payload([...bApps][0]));
  check("candidate A cannot access candidate B application via "+label,cross.status===404&&cross.body?.code==="APPLICATION_NOT_FOUND","status="+cross.status+", code="+(cross.body?.code||"none"));
 }
}
const failures=checks.filter(x=>!x.passed),report={schema:"kingsmen.n06.application-isolation.v2",status:failures.length?"FAIL":"PASS",productionReady:false,checks,failures};console.log(JSON.stringify(report,null,2));if(failures.length)process.exit(1);
