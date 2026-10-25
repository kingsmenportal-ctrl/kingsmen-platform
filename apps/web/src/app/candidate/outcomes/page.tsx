"use client";

import { useEffect, useState } from "react";

function readToken(): string | null {
  try {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!base) return null;
    const ref = new URL(base).hostname.split(".")[0];
    const raw = localStorage.getItem(`sb-${ref}-auth-token`);
    const parsed = raw ? JSON.parse(raw) : null;
    return typeof parsed?.access_token === "string" ? parsed.access_token : null;
  } catch { return null; }
}
type OutcomeApplication = {
  id:string; application_ref:string; pathway_type:string; status:string; readiness_status:string;
  provider_reference?:string|null; submitted_at?:string|null; last_status_reason?:string|null;
  provider_receipt_verified:boolean; provider_status_evidence_verified:boolean; outcome_verified:boolean;
  opportunity?:{title?:string;provider_name?:string;source_url?:string}|null;
  evidence:Array<{evidence_ref:string;evidence_type:string;source_label:string;captured_at?:string|null;verification_status:string;verified_at?:string|null;verification_note?:string|null}>;
  history:Array<{event_ref:string;event_type:string;from_status?:string|null;to_status?:string|null;reason_code?:string|null;evidence_ref?:string|null;created_at:string}>;
};
const pill=(ok:boolean)=>ok?"rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900":"rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-950";

export default function CandidateOutcomesPage(){
 const [token,setToken]=useState<string|null>(null);const [apps,setApps]=useState<OutcomeApplication[]>([]);const [loading,setLoading]=useState(false);const [error,setError]=useState("");const [message,setMessage]=useState("");
 useEffect(()=>{setToken(readToken());},[]);
 async function load(){if(!token)return;setLoading(true);setError("");try{const response=await fetch("/api/candidate/outcomes",{headers:{Authorization:`Bearer ${token}`},cache:"no-store"});const body=await response.json();if(!response.ok||body.ready!==true)throw new Error(body.error||"Could not load verified application outcomes.");setApps(Array.isArray(body.applications)?body.applications:[]);setMessage("Application history loaded. Only provider outcomes backed by verified provider-outcome evidence are labelled verified.");}catch(e){setError(e instanceof Error?e.message:"Could not load outcomes.");}finally{setLoading(false);}}
 useEffect(()=>{if(token)void load();},[token]);
 return <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6"><div className="mx-auto max-w-5xl space-y-5">
 <header className="rounded-3xl bg-slate-950 p-6 text-white sm:p-8"><p className="text-xs font-black uppercase tracking-[.2em] text-amber-300">Kingsmen · N06 Outcome Evidence</p><h1 className="mt-3 text-3xl font-black">Application status and outcomes</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200">Your application history comes from persisted application records and audit events. Candidate-reported actions, provider-confirmed receipts, provider status notices and provider-issued outcomes are kept distinct. An offer, rejection or acceptance is labelled verified only when a reviewer-verified provider outcome notice is attached.</p><div className="mt-5 flex flex-wrap gap-3"><a href="/candidate/master-application" className="rounded-xl border border-white/30 px-4 py-2.5 text-sm font-bold">Master application</a><a href="/candidate/applications/preparation" className="rounded-xl border border-white/30 px-4 py-2.5 text-sm font-bold">Preparation and tracking</a><a href="/candidate/documents" className="rounded-xl border border-white/30 px-4 py-2.5 text-sm font-bold">Private documents</a><button type="button" disabled={!token||loading} onClick={()=>void load()} className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-black text-slate-950 disabled:opacity-50">{loading?"Refreshing…":"Refresh outcomes"}</button></div></header>
 {!token&&<section className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm">Sign in to view your private application history. <a className="font-bold underline" href="/candidate/login?next=%2Fcandidate%2Foutcomes">Sign in</a></section>}
 {error&&<p role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">{error}</p>}
 {message&&<p role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">{message}</p>}
 {!apps.length&&!loading&&token&&<section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-bold">No application records yet</h2><p className="mt-2 text-sm leading-6 text-slate-600">Create an application from an authorised, current opportunity match in your master application. A target plan by itself is not a submitted application.</p></section>}
 <div className="space-y-4">{apps.map(app=><article key={app.id} className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7">
 <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{app.application_ref}</p><h2 className="mt-1 text-xl font-black">{app.opportunity?.title||"Application record"}</h2><p className="mt-1 text-sm text-slate-600">{app.opportunity?.provider_name||"Provider not available"} · {app.pathway_type.replaceAll("_"," ")}</p></div><span className={pill(app.outcome_verified)}>{app.outcome_verified?"Provider outcome verified":app.status.replaceAll("_"," ")}</span></div>
 <div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Preparation</p><p className="mt-1 text-sm font-bold">{app.readiness_status.replaceAll("_"," ")}</p></div><div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Provider receipt</p><p className="mt-1 text-sm font-bold">{app.provider_receipt_verified?"Verified receipt evidence":"Not independently verified"}</p></div><div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Provider status notice</p><p className="mt-1 text-sm font-bold">{app.provider_status_evidence_verified?"Verified status evidence":"No verified status notice"}</p></div></div>
 {app.last_status_reason&&<p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">{app.last_status_reason}</p>}
 {app.provider_reference&&<p className="mt-3 text-sm"><strong>Provider reference:</strong> {app.provider_reference}</p>}
 {app.submitted_at&&<p className="mt-1 text-sm"><strong>Recorded submission time:</strong> {new Date(app.submitted_at).toLocaleString()}</p>}
 <section className="mt-5"><h3 className="font-bold">Evidence and review</h3>{!app.evidence.length?<p className="mt-2 text-sm text-slate-600">No provider receipt, status notice or outcome evidence is linked yet. Upload a receipt in the private document vault and link it to this application.</p>:<div className="mt-2 space-y-2">{app.evidence.map(ev=><div key={ev.evidence_ref} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3"><div><p className="text-sm font-semibold">{ev.source_label||ev.evidence_type.replaceAll("_"," ")}</p><p className="mt-1 text-xs text-slate-500">{ev.evidence_type.replaceAll("_"," ")} · {ev.captured_at?new Date(ev.captured_at).toLocaleString():"Capture time not recorded"}</p></div><span className={pill(ev.verification_status==="VERIFIED"&&Boolean(ev.verified_at))}>{ev.verification_status.replaceAll("_"," ")}</span>{ev.verification_note&&<p className="w-full text-xs text-slate-600">{ev.verification_note}</p>}</div>)}</div>}</section>
 <section className="mt-5"><h3 className="font-bold">Audit history</h3>{!app.history.length?<p className="mt-2 text-sm text-slate-600">No status events recorded yet.</p>:<ol className="mt-2 space-y-2">{app.history.slice(0,10).map(event=><li key={event.event_ref} className="rounded-xl bg-slate-50 p-3"><p className="text-sm font-semibold">{event.event_type.replaceAll("_"," ")}</p><p className="mt-1 text-xs text-slate-600">{event.from_status?event.from_status.replaceAll("_"," ")+" → ":""}{event.to_status?.replaceAll("_"," ")||"Event recorded"} · {new Date(event.created_at).toLocaleString()}</p>{event.reason_code&&<p className="mt-1 text-xs text-slate-500">Reason: {event.reason_code.replaceAll("_"," ")}</p>}</li>)}</ol>}</section>
 <div className="mt-5 flex flex-wrap gap-3"><a href="/candidate/documents" className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold">Upload or view private evidence</a>{app.opportunity?.source_url&&<a href={app.opportunity.source_url} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white">Official provider page ↗</a>}</div>
 </article>)}</div>
 <footer className="text-xs leading-5 text-slate-500">Kingsmen does not guarantee admission, funding, employment or placement. Candidate-reported submission does not mean provider receipt. A verified outcome requires an authorised review and provider-issued evidence. Private storage paths, signed URLs and file hashes are not exposed in this read model.</footer>
 </div></main>;
}
