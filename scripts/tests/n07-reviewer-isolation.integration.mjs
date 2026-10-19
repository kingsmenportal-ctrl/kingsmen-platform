#!/usr/bin/env node
const base=process.env.N07_BASE_URL,reviewerToken=process.env.N07_REVIEWER_TOKEN,candidateToken=process.env.N07_CANDIDATE_TOKEN;
if(!base||!reviewerToken||!candidateToken){console.error(JSON.stringify({schema:"kingsmen.n07.integration.v1",status:"BLOCKED",reason:"Set N07_BASE_URL, N07_REVIEWER_TOKEN and N07_CANDIDATE_TOKEN to dedicated staging test identities.",passed:0,failed:0,productionReady:false},null,2));process.exit(2);}
const root=base.replace(/\/+$/,"");let passed=0,failed=0;const checks=[];
async function call(name,path,token,expected){try{const r=await fetch(root+path,{headers:{authorization:"Bearer "+token},cache:"no-store"});const body=await r.json().catch(()=>null);const ok=expected(r.status,body);checks.push({name,status:r.status,passed:ok,code:body?.code||null});if(ok)passed++;else failed++;}catch(e){checks.push({name,passed:false,error:String(e)});failed++;}}
await call("candidate cannot access reviewer queue","/api/reviewer/applications",candidateToken,(s,b)=>s===403&&b?.code==="REVIEWER_ROLE_REQUIRED");
await call("reviewer queue accepts authorised reviewer","/api/reviewer/applications",reviewerToken,(s,b)=>s===200&&b?.ok===true&&Array.isArray(b.queue));
const report={schema:"kingsmen.n07.integration.v1",status:failed?"FAILED":"PASSED",passed,failed,checks,productionReady:false,note:"This probe checks role separation only; evidence lifecycle, candidate isolation, and provider outcomes require separate seeded staging cases."};console.log(JSON.stringify(report,null,2));if(failed)process.exit(1);
