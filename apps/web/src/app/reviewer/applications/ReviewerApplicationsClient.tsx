"use client";
import {useCallback,useEffect,useState} from "react";
type App={id:string;application_ref:string;candidate_id:string;opportunity_id:string;pathway_type:string;status:string;readiness_status:string;updated_at:string;provider_reference?:string|null};
type Evidence={id:string;evidence_ref:string;evidence_type:string;evidence_locator:string;evidence_sha256:string;source_label:string;verification_status:string;verification_note?:string|null};
function getToken(){try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!k?.startsWith("sb-")||!k.endsWith("-auth-token"))continue;const raw=localStorage.getItem(k);if(!raw)continue;const v=JSON.parse(raw.startsWith("base64-")?atob(raw.slice(7)):raw);if(typeof v.access_token==="string")return v.access_token;}}catch{}return null;}
const evidenceTypes=["PRE_SUBMISSION_CHECKLIST","PROVIDER_SUBMISSION_RECEIPT","PROVIDER_REFERENCE","PROVIDER_STATUS_NOTICE","PROVIDER_OUTCOME_NOTICE","REVIEW_NOTE"];
const providerStatuses=["SUBMITTED_CONFIRMED","PROVIDER_REVIEW","SHORTLISTED","INTERVIEW","OFFERED","ACCEPTED","REJECTED","WITHDRAWN"];
export default function ReviewerApplicationsClient(){
 const [token,setToken]=useState<string|null>(null),[queue,setQueue]=useState<App[]>([]),[evidence,setEvidence]=useState<Record<string,Evidence[]>>({}),[busy,setBusy]=useState(""),[message,setMessage]=useState(""),[forms,setForms]=useState<Record<string,Record<string,string>>>({});
 const api=useCallback(async(path:string,init:RequestInit={})=>{const t=token||getToken();if(!t)throw new Error("Sign in with an authorised reviewer account.");const r=await fetch(path,{...init,headers:{authorization:"Bearer "+t,...(init.body?{"content-type":"application/json"}:{}),...(init.headers||{})},cache:"no-store"});const d=await r.json().catch(()=>null);if(!r.ok||!d?.ok)throw new Error(d?.error||d?.message||"Request failed.");return d;},[token]);
 const load=useCallback(async()=>{try{const d=await api("/api/reviewer/applications");setQueue(d.queue||[]);setMessage("");}catch(e){setMessage(e instanceof Error?e.message:"Reviewer queue unavailable.");}},[api]);
 useEffect(()=>{setToken(getToken());},[]);useEffect(()=>{if(token)void load();},[token,load]);
 function field(id:string,name:string,value:string){setForms(old=>({...old,[id]:{...(old[id]||{}),[name]:value}}));}
 async function act(key:string,fn:()=>Promise<any>){setBusy(key);try{const d=await fn();setMessage(d.message||"Operation recorded.");await load();}catch(e){setMessage(e instanceof Error?e.message:"Operation failed.");}finally{setBusy("");}}
 async function loadEvidence(app:App){await act("evidence:"+app.id,async()=>{const d=await api("/api/reviewer/applications/evidence?applicationId="+encodeURIComponent(app.id));setEvidence(old=>({...old,[app.id]:d.evidence||[]}));return {message:"Evidence records loaded."};});}
 async function register(app:App){const f=forms[app.id]||{};await act("register:"+app.id,async()=>{const d=await api("/api/reviewer/applications/evidence",{method:"POST",body:JSON.stringify({action:"REGISTER",applicationId:app.id,evidenceType:f.evidenceType||"PRE_SUBMISSION_CHECKLIST",evidenceLocator:f.evidenceLocator,evidenceSha256:f.evidenceSha256,sourceLabel:f.sourceLabel,capturedAt:f.capturedAt||undefined})});const e=await api("/api/reviewer/applications/evidence?applicationId="+encodeURIComponent(app.id));setEvidence(old=>({...old,[app.id]:e.evidence||[]}));return d;});}
 async function review(app:App,ev:Evidence,action:"VERIFY"|"REJECT"){const f=forms[app.id]||{};await act(action+ev.id,async()=>{const d=await api("/api/reviewer/applications/evidence",{method:"POST",body:JSON.stringify({action,evidenceId:ev.id,verificationNote:f["note:"+ev.id]})});const e=await api("/api/reviewer/applications/evidence?applicationId="+encodeURIComponent(app.id));setEvidence(old=>({...old,[app.id]:e.evidence||[]}));return d;});}
 async function authorize(app:App){await act("submit:"+app.id,()=>api("/api/reviewer/applications/authorize-submission",{method:"POST",body:JSON.stringify({applicationId:app.id,idempotencyKey:"n07-"+app.id+"-"+crypto.randomUUID()})}));}
 async function providerStatus(app:App){const f=forms[app.id]||{};await act("provider:"+app.id,()=>api("/api/reviewer/applications/provider-status",{method:"POST",body:JSON.stringify({applicationId:app.id,providerStatus:f.providerStatus,evidenceId:f.evidenceId,providerReference:f.providerReference,reasonCode:"REVIEWER_RECORDED_WITH_EVIDENCE"})}));}
 return <section style={{maxWidth:1100,margin:"0 auto",padding:24}}>
  {message&&<p role="status" style={{border:"1px solid #888",padding:12,borderRadius:8}}>{message}</p>}
  <div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}><h2>Review queue</h2><button onClick={()=>void load()} disabled={!!busy}>Refresh queue</button><span>{queue.length} records</span></div>
  <p>Evidence registration is not evidence verification. Verify only after checking the original artefact with its source. A manual-required task is not a provider submission.</p>
  {queue.length===0&&!message&&<p>No applications currently match the review queue filters.</p>}
  {queue.map(app=>{const f=forms[app.id]||{},items=evidence[app.id]||[];return <article key={app.id} style={{border:"1px solid #888",borderRadius:12,padding:16,margin:"16px 0"}}>
   <h3>{app.application_ref} · {app.pathway_type}</h3><p>Status: <strong>{app.status}</strong> · Readiness: {app.readiness_status}</p><p>Application ID: <code>{app.id}</code></p><p>Candidate record: <code>{app.candidate_id}</code></p>
   <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}><button disabled={!!busy} onClick={()=>void loadEvidence(app)}>Load evidence</button><button disabled={!!busy} onClick={()=>void authorize(app)}>Authorise controlled submission task</button></div>
   <h4>Register evidence</h4>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:8}}>
    <label>Evidence type<select value={f.evidenceType||"PRE_SUBMISSION_CHECKLIST"} onChange={e=>field(app.id,"evidenceType",e.target.value)} style={{display:"block",width:"100%"}}>{evidenceTypes.map(t=><option key={t}>{t}</option>)}</select></label>
    <label>Evidence locator<input value={f.evidenceLocator||""} onChange={e=>field(app.id,"evidenceLocator",e.target.value)} placeholder="Controlled reference/path" style={{display:"block",width:"100%"}}/></label>
    <label>SHA-256 fingerprint<input value={f.evidenceSha256||""} onChange={e=>field(app.id,"evidenceSha256",e.target.value)} placeholder="64 hex characters" style={{display:"block",width:"100%"}}/></label>
    <label>Source label<input value={f.sourceLabel||""} onChange={e=>field(app.id,"sourceLabel",e.target.value)} placeholder="Provider / source" style={{display:"block",width:"100%"}}/></label>
   </div>
   <button disabled={!!busy} onClick={()=>void register(app)}>Register evidence (pending review)</button>
   {items.length>0&&<><h4>Evidence register</h4>{items.map(ev=><div key={ev.id} style={{borderTop:"1px solid #aaa",padding:"10px 0"}}>
    <p><strong>{ev.evidence_type}</strong> · {ev.verification_status} · {ev.evidence_ref}</p><p>{ev.source_label} · SHA-256 <code>{ev.evidence_sha256}</code></p>
    {ev.verification_status==="PENDING_REVIEW"&&<><label>Independent review note<textarea value={f["note:"+ev.id]||""} onChange={e=>field(app.id,"note:"+ev.id,e.target.value)} placeholder="Describe what you independently checked in the source artefact." style={{display:"block",width:"100%"}}/></label><button disabled={!!busy} onClick={()=>void review(app,ev,"VERIFY")}>Verify evidence</button> <button disabled={!!busy} onClick={()=>void review(app,ev,"REJECT")}>Reject evidence</button></>}
   </div>)}</>}
   <h4>Record provider status</h4>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:8}}>
    <label>Provider status<select value={f.providerStatus||"SUBMITTED_CONFIRMED"} onChange={e=>field(app.id,"providerStatus",e.target.value)} style={{display:"block",width:"100%"}}>{providerStatuses.map(s=><option key={s}>{s}</option>)}</select></label>
    <label>Verified evidence ID<select value={f.evidenceId||""} onChange={e=>field(app.id,"evidenceId",e.target.value)} style={{display:"block",width:"100%"}}><option value="">Choose verified evidence</option>{items.filter(e=>e.verification_status==="VERIFIED").map(e=><option key={e.id} value={e.id}>{e.evidence_type} · {e.evidence_ref}</option>)}</select></label>
    <label>Provider reference<input value={f.providerReference||""} onChange={e=>field(app.id,"providerReference",e.target.value)} placeholder="Required for submitted confirmation" style={{display:"block",width:"100%"}}/></label>
   </div>
   <button disabled={!!busy} onClick={()=>void providerStatus(app)}>Record evidence-backed provider status</button>
  </article>;})}
 </section>;
}
