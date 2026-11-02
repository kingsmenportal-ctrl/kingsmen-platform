"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { getCandidateAccessToken } from "../../../lib/candidate-session";

type Evidence = { id: string; request_id: string; original_filename: string; mime_type: string; size_bytes: number; review_status: string; reviewer_note: string | null; uploaded_at: string; reviewed_at: string | null };
type ReviewRequest = {
  id: string; candidate_reference: string; request_status: string; claimant_message: string;
  candidate_response: string; reviewer_note: string | null; created_at: string; updated_at: string; reviewed_at: string | null;
  evidence: Evidence[];
};
function statusLabel(value: string) { return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, x=>x.toUpperCase()); }
function explain(body: Record<string, unknown>) { return typeof body.code==="string"&&typeof body.error==="string" ? `${body.code}: ${body.error}` : typeof body.error==="string" ? body.error : "The identity-review request failed."; }
export default function CandidateIdentityReviewPage() {
  const [requests,setRequests] = useState<ReviewRequest[]>([]);
  const [candidateReference,setCandidateReference] = useState("");
  const [claimantName,setClaimantName] = useState("");
  const [claimantMessage,setClaimantMessage] = useState("");
  const [followups,setFollowups] = useState<Record<string,string>>({});
  const [evidenceFiles,setEvidenceFiles] = useState<Record<string,File|null>>({});
  const [evidenceConsent,setEvidenceConsent] = useState<Record<string,boolean>>({});
  const [loading,setLoading] = useState(true);
  const [submitting,setSubmitting] = useState(false);
  const [busy,setBusy] = useState("");
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const token=getCandidateAccessToken();
    if(!token){setError("Sign in to load your identity-review status.");setRequests([]);setLoading(false);return;}
    try{
      const response=await fetch("/api/candidate/identity-review",{headers:{Authorization:`Bearer ${token}`},cache:"no-store"});
      const body=await response.json();
      if(!response.ok||!Array.isArray(body.requests)) throw new Error(explain(body));
      setRequests(body.requests as ReviewRequest[]);
    }catch(e){setError(e instanceof Error?e.message:"Identity-review status could not be loaded.");}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{void load();},[load]);

  async function submitRequest(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setSubmitting(true);setError("");setNotice("");
    const token=getCandidateAccessToken();
    if(!token){setError("Sign in before submitting an identity-review request.");setSubmitting(false);return;}
    try{
      const response=await fetch("/api/candidate/identity-review",{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},
        body:JSON.stringify({candidate_reference:candidateReference,claimant_name:claimantName,claimant_message:claimantMessage}),cache:"no-store"});
      const body=await response.json();
      if(!response.ok)throw new Error(explain(body));
      setNotice(typeof body.message==="string"?body.message:"Identity-review request received for manual review.");
      setCandidateReference("");setClaimantMessage("");
      await load();
    }catch(e){setError(e instanceof Error?e.message:"The request could not be submitted.");}
    finally{setSubmitting(false);}
  }
  async function submitFollowup(item:ReviewRequest){
    setBusy(`followup:${item.id}`);setError("");setNotice("");
    const token=getCandidateAccessToken(), text=followups[item.id]??"";
    if(!token){setError("Sign in before responding to the reviewer.");setBusy("");return;}
    try{
      const response=await fetch("/api/candidate/identity-review/followup",{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},
        body:JSON.stringify({request_id:item.id,response:text}),cache:"no-store"});
      const body=await response.json();
      if(!response.ok)throw new Error(explain(body));
      setFollowups(old=>({...old,[item.id]:""}));
      setNotice(typeof body.message==="string"?body.message:"Follow-up saved.");
      await load();
    }catch(e){setError(e instanceof Error?e.message:"Follow-up could not be saved.");}
    finally{setBusy("");}
  }
  async function uploadEvidence(item:ReviewRequest){
    const file=evidenceFiles[item.id];
    if(!file){setError("Choose an evidence file first.");return;}
    if(!evidenceConsent[item.id]){setError("Confirm consent to process this file as identity-review evidence.");return;}
    if(!["application/pdf","image/jpeg","image/png"].includes(file.type)||file.size<1||file.size>8*1024*1024){setError("Evidence must be a PDF, JPEG or PNG file no larger than 8 MiB.");return;}
    const token=getCandidateAccessToken();
    if(!token){setError("Sign in before uploading evidence.");return;}
    setBusy(`evidence:${item.id}`);setError("");setNotice("");
    try{
      const form=new FormData();form.set("request_id",item.id);form.set("file",file,file.name);
      const response=await fetch("/api/candidate/identity-review/evidence",{method:"POST",headers:{Authorization:`Bearer ${token}`},body:form,cache:"no-store"});
      const body=await response.json();
      if(!response.ok)throw new Error(explain(body));
      setEvidenceFiles(old=>({...old,[item.id]:null}));setEvidenceConsent(old=>({...old,[item.id]:false}));
      setNotice(typeof body.message==="string"?body.message:"Evidence saved privately; human review is still required.");
      await load();
    }catch(e){setError(e instanceof Error?e.message:"Evidence could not be uploaded.");}
    finally{setBusy("");}
  }

  return <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Kingsmen Candidate Portal</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">Identity review &amp; evidence</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">Identity is linked only by an authorised human review. Submitting a request or evidence does not verify identity. Requests, correction prompts, reviewer notes and evidence states are read from the backend and remain tied to your authenticated account.</p>
        <nav aria-label="Candidate navigation" className="mt-5 flex flex-wrap gap-3 text-sm">
          <a href="/candidate/dashboard" className="rounded-xl border border-slate-700 px-4 py-2">Dashboard</a>
          <a href="/candidate/profile" className="rounded-xl border border-slate-700 px-4 py-2">My profile</a>
          <a href="/candidate/documents" className="rounded-xl border border-slate-700 px-4 py-2">Document Vault</a>
          <a href="/candidate/applications" className="rounded-xl border border-slate-700 px-4 py-2">Application timeline</a>
        </nav>
      </header>
      {error&&<section role="alert" className="rounded-2xl border border-red-800 bg-red-950/50 p-4 text-sm leading-6 text-red-100">{error}{error.includes("AUTHENTICATION_REQUIRED")&&<p className="mt-2"><a href="/candidate/login" className="underline">Sign in / create account</a></p>}</section>}
      {notice&&<section role="status" className="rounded-2xl border border-emerald-800 bg-emerald-950/40 p-4 text-sm leading-6 text-emerald-100">{notice}</section>}

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
        <h2 className="text-xl font-bold">Request a candidate identity review</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">Enter the existing Kingsmen candidate reference that the reviewer can check. Do not include a national identity number or attach unrelated sensitive information. Kingsmen will not link accounts by email equality.</p>
        <form onSubmit={submitRequest} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold">Existing candidate reference
            <input required minLength={2} maxLength={120} value={candidateReference} onChange={e=>setCandidateReference(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 font-normal"/>
          </label>
          <label className="block text-sm font-semibold">Your name
            <input required minLength={2} maxLength={160} autoComplete="name" value={claimantName} onChange={e=>setClaimantName(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 font-normal"/>
          </label>
          <label className="block text-sm font-semibold sm:col-span-2">Message for the authorised reviewer
            <textarea required minLength={3} maxLength={1200} rows={4} value={claimantMessage} onChange={e=>setClaimantMessage(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 font-normal" placeholder="Explain how the existing Kingsmen candidate record relates to your account."/>
          </label>
          <button type="submit" disabled={submitting} className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-50 sm:col-span-2">{submitting?"Submitting…":"Submit for manual review"}</button>
        </form>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Your review requests</h2><p className="mt-1 text-sm text-slate-400">Refresh loads request and evidence states from Supabase.</p></div>
          <button type="button" disabled={loading} onClick={()=>void load()} className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold disabled:opacity-50">{loading?"Refreshing…":"Refresh status"}</button>
        </div>
        {loading?<p className="mt-4 text-sm text-slate-400">Loading identity-review records…</p>
        :requests.length===0?<p className="mt-4 rounded-xl border border-slate-700 p-4 text-sm text-slate-300">No identity-review requests are recorded for this account yet.</p>
        :<div className="mt-5 space-y-4">{requests.map(item=><article key={item.id} className="rounded-2xl border border-slate-700 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-bold">Reference: {item.candidate_reference}</h3><p className="mt-1 text-sm text-slate-400">Created {new Date(item.created_at).toLocaleString()}</p></div><span className="rounded-full border border-slate-600 px-3 py-1 text-xs">{statusLabel(item.request_status)}</span></div>
          <p className="mt-3 text-sm leading-6 text-slate-300">{item.claimant_message}</p>
          {item.reviewer_note&&<div className="mt-4 rounded-xl border border-amber-900 bg-amber-950/30 p-4 text-sm leading-6"><strong>Reviewer note:</strong> {item.reviewer_note}</div>}
          {item.candidate_response&&<p className="mt-3 text-sm leading-6 text-slate-300"><strong>Your latest response:</strong> {item.candidate_response}</p>}
          <p className="mt-3 text-xs text-slate-500">Last updated {new Date(item.updated_at).toLocaleString()}{item.reviewed_at?` · Reviewed ${new Date(item.reviewed_at).toLocaleString()}`:""}</p>
          {item.evidence?.length>0&&<div className="mt-4"><h4 className="font-semibold">Evidence &amp; review state</h4><div className="mt-2 space-y-2">{item.evidence.map(ev=><div key={ev.id} className="rounded-xl bg-slate-950 p-3 text-sm">
            <div className="flex flex-wrap justify-between gap-2"><strong className="break-all">{ev.original_filename}</strong><span>{statusLabel(ev.review_status)}</span></div>
            <p className="mt-1 text-xs text-slate-400">{ev.mime_type} · {(ev.size_bytes/1024).toFixed(0)} KB · Uploaded {new Date(ev.uploaded_at).toLocaleString()}</p>
            {ev.reviewer_note&&<p className="mt-2 text-sm text-amber-200">Reviewer note: {ev.reviewer_note}</p>}
            {ev.reviewed_at&&<p className="mt-1 text-xs text-slate-500">Reviewed {new Date(ev.reviewed_at).toLocaleString()}</p>}
          </div>)}</div></div>}
          {item.request_status==="NEEDS_INFORMATION"&&<form onSubmit={event=>{event.preventDefault();void submitFollowup(item);}} className="mt-5 rounded-xl border border-amber-900 p-4">
            <h4 className="font-semibold">Respond to the correction / information request</h4>
            <label className="mt-3 block text-sm">Your response
              <textarea required minLength={3} maxLength={1200} rows={3} value={followups[item.id]??""} onChange={e=>setFollowups(old=>({...old,[item.id]:e.target.value}))} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3"/>
            </label>
            <button type="submit" disabled={busy===`followup:${item.id}`} className="mt-3 rounded-xl bg-amber-300 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-50">{busy===`followup:${item.id}`?"Sending…":"Send reviewer response"}</button>
          </form>}
          {["PENDING","NEEDS_INFORMATION"].includes(item.request_status)&&<div className="mt-5 rounded-xl border border-slate-700 p-4">
            <h4 className="font-semibold">Upload supporting evidence</h4>
            <p className="mt-1 text-sm leading-6 text-slate-400">PDF, JPEG or PNG only; max 8 MiB. Upload stores the file privately, checks file signature and SHA-256, and queues it for human review. Do not upload unrelated documents.</p>
            <label className="mt-3 block text-sm">Evidence file
              <input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={e=>setEvidenceFiles(old=>({...old,[item.id]:e.target.files?.[0]??null}))} className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm"/>
            </label>
            {evidenceFiles[item.id]&&<p className="mt-2 text-xs text-slate-400">{evidenceFiles[item.id]?.name} · {((evidenceFiles[item.id]?.size??0)/1024).toFixed(0)} KB</p>}
            <label className="mt-3 flex items-start gap-3 text-sm leading-6"><input type="checkbox" checked={evidenceConsent[item.id]===true} onChange={e=>setEvidenceConsent(old=>({...old,[item.id]:e.target.checked}))} className="mt-1 h-4 w-4 accent-cyan-300"/><span>I consent to processing this file solely as identity-review evidence. I understand upload is not identity verification.</span></label>
            <button type="button" onClick={()=>void uploadEvidence(item)} disabled={busy===`evidence:${item.id}`||!evidenceFiles[item.id]||!evidenceConsent[item.id]} className="mt-3 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold disabled:opacity-50">{busy===`evidence:${item.id}`?"Uploading privately…":"Upload evidence privately"}</button>
          </div>}
        </article>)}</div>}
      </section>
    </div>
  </main>;
}
