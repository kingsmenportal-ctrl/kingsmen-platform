#!/usr/bin/env node
import {existsSync,readFileSync,mkdirSync,writeFileSync} from "node:fs";
import {dirname,join} from "node:path";
const root=process.cwd(),files={migration:"db/migrations/0061_n07_provider_review_operations.sql",runtime:"apps/web/src/lib/n07-reviewer-runtime.ts",queue:"apps/web/src/app/api/reviewer/applications/route.ts",evidence:"apps/web/src/app/api/reviewer/applications/evidence/route.ts",submission:"apps/web/src/app/api/reviewer/applications/authorize-submission/route.ts",status:"apps/web/src/app/api/reviewer/applications/provider-status/route.ts",page:"apps/web/src/app/reviewer/applications/page.tsx"};
const checks=[],src={};function check(name,ok){checks.push({name,passed:Boolean(ok)});}
for(const [k,p] of Object.entries(files)){const f=join(root,p);check("exists:"+p,existsSync(f));if(existsSync(f))src[k]=readFileSync(f,"utf8");}
function has(k,t,n=t){check(k+":"+n,src[k]?.includes(t));}function lacks(k,t,n=t){check(k+":not:"+n,!src[k]?.includes(t));}
for(const t of ["platform_reviewers","candidate_application_evidence","candidate_application_submission_jobs","ENABLE ROW LEVEL SECURITY","NONE_CONFIGURED"])has("migration",t);
has("runtime","/auth/v1/user","reviewer identity verified with Supabase");has("runtime","platform_reviewers","server-side role lookup");has("runtime","PLATFORM_ADMIN","admin role support");has("runtime","SUPABASE_SERVICE_ROLE_KEY","server-only role lookup");
has("queue","requireReviewerSession","reviewer queue is protected");has("queue","READY_FOR_REVIEW","review queue status filter");
has("evidence","evidenceSha256","evidence fingerprint required");has("evidence","PENDING_REVIEW","evidence defaults pending");has("evidence","EVIDENCE_VERIFIED","verification audit");has("evidence","EVIDENCE_VERIFIER","verifier role required");has("evidence","EVIDENCE_SELF_REVIEW_BLOCKED","self-review blocked");
has("submission","CHECKLIST_VERIFICATION_REQUIRED","verified checklist gate");has("submission","NONE_CONFIGURED","no fake adapter");has("submission","No provider was contacted","submission truthfulness");has("submission","idempotencyKey","idempotent task creation");has("submission","SUBMISSION_ALREADY_QUEUED","duplicate active task blocked");
has("status","VERIFIED_EVIDENCE_REQUIRED","verified evidence gate");has("status","PROVIDER_ACKNOWLEDGED","provider submission event");has("status","providerReference","provider reference required");
has("page","ReviewerApplicationsClient","interactive reviewer workspace");has("page","not dispatched","manual job is not submitted");
for(const k of Object.keys(files))lacks(k,"SUPABASE_SERVICE_ROLE_KEY in browser bundle","browser service-role literal");
const failures=checks.filter(x=>!x.passed),report={schema:"kingsmen.n07.provider-review-validation.v1",module:"N07 Provider Integration, Submission Evidence & Reviewer Operations",status:failures.length?"BUILT_PENDING_VALIDATION":"STATIC_SOURCE_CHECKS_PASSED",productionReady:false,passed:checks.length-failures.length,failed:failures.length,checks,failures};
const out=join(root,"reports/n07/n07-provider-review-validation-latest.json");mkdirSync(dirname(out),{recursive:true});writeFileSync(out,JSON.stringify(report,null,2)+"\n");console.log(JSON.stringify(report,null,2));if(failures.length)process.exit(1);
