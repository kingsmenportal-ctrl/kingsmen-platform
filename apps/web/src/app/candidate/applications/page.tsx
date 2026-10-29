"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type SavedOpportunity = {
  id: string;
  title: string;
  organisation: string;
  official_url: string;
  pathway: string;
  closing_date: string | null;
};
type Tracker = {
  id: string;
  candidate_id: string;
  saved_opportunity_id: string;
  status: "SAVED" | "PREPARING" | "READY_TO_APPLY" | "SUBMITTED_CANDIDATE_REPORTED";
  candidate_note: string;
  evidence_reference: string;
  created_at: string;
  updated_at: string;
  candidate_workspace_saved_opportunities?: SavedOpportunity | SavedOpportunity[] | null;
};
type PreparationItem = {
  id: string;
  tracker_id: string;
  item_type: "TASK" | "DOCUMENT";
  title: string;
  candidate_note: string;
  official_source_url: string;
  evidence_reference: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "READY_CANDIDATE_REPORTED";
  required_by_candidate: boolean;
  due_date: string | null;
};
type Draft = { status: Tracker["status"]; note: string; evidence: string };
type ItemDraft = { status: PreparationItem["status"]; note: string; evidence: string };

function tokenFromSession(): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base || typeof window === "undefined") return null;
  try {
    const ref = new URL(base).hostname.split(".")[0];
    const raw = window.localStorage.getItem(`sb-${ref}-auth-token`);
    const session = raw ? JSON.parse(raw) as Record<string, unknown> : null;
    return session && typeof session.access_token === "string" ? session.access_token : null;
  } catch { return null; }
}
function explain(payload: unknown): string {
  if (payload && typeof payload === "object") {
    const p = payload as Record<string, unknown>;
    if (typeof p.code === "string" && typeof p.error === "string") return `${p.code}: ${p.error}`;
    if (typeof p.error === "string") return p.error;
    if (typeof p.message === "string") return p.message;
  }
  return "The application tracker request failed.";
}
function opportunityFor(tracker: Tracker): SavedOpportunity | null {
  const value = tracker.candidate_workspace_saved_opportunities;
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}
function humanStatus(status: string): string {
  return ({
    SAVED: "Saved",
    PREPARING: "Preparing",
    READY_TO_APPLY: "Ready to apply (candidate-reported)",
    SUBMITTED_CANDIDATE_REPORTED: "Submitted (candidate-reported; provider receipt not confirmed)",
    NOT_STARTED: "Not started",
    IN_PROGRESS: "In progress",
    READY_CANDIDATE_REPORTED: "Ready (candidate-reported)"
  } as Record<string,string>)[status] ?? status;
}

export default function CandidateApplicationsPage() {
  const [trackers,setTrackers] = useState<Tracker[]>([]);
  const [items,setItems] = useState<PreparationItem[]>([]);
  const [drafts,setDrafts] = useState<Record<string,Draft>>({});
  const [itemDrafts,setItemDrafts] = useState<Record<string,ItemDraft>>({});
  const [newItems,setNewItems] = useState<Record<string,{title:string;type:"TASK"|"DOCUMENT";note:string;source:string}>>({});
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState("");
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");

  const request = useCallback(async (method:"GET"|"POST", payload?:Record<string,unknown>) => {
    const token = tokenFromSession();
    if (!token) throw new Error("AUTHENTICATION_REQUIRED: Sign in to access your application tracker.");
    const response = await fetch("/api/candidate/applications", {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(method === "POST" ? {"Content-Type":"application/json"} : {}) },
      ...(method === "POST" ? {body:JSON.stringify(payload ?? {})} : {}),
      cache: "no-store"
    });
    const body = await response.json();
    if (!response.ok || body.ready !== true) throw new Error(explain(body));
    return body;
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const body = await request("GET");
      const loadedTrackers = Array.isArray(body.trackers) ? body.trackers as Tracker[] : [];
      const loadedItems = Array.isArray(body.items) ? body.items as PreparationItem[] : [];
      setTrackers(loadedTrackers); setItems(loadedItems);
      setDrafts(Object.fromEntries(loadedTrackers.map(t=>[t.id,{status:t.status,note:t.candidate_note ?? "",evidence:t.evidence_reference ?? ""}])));
      setItemDrafts(Object.fromEntries(loadedItems.map(i=>[i.id,{status:i.status,note:i.candidate_note ?? "",evidence:i.evidence_reference ?? ""}])));
      setNotice("");
    } catch(e) { setError(e instanceof Error?e.message:"Could not load application tracker."); }
    finally {setLoading(false);}
  },[request]);

  useEffect(()=>{void load();},[load]);

  async function saveTracker(event:FormEvent<HTMLFormElement>, tracker:Tracker) {
    event.preventDefault(); const d=drafts[tracker.id]; if(!d)return;
    setBusy(tracker.id);setError("");setNotice("");
    try {
      const body=await request("POST",{action:"update_tracker",tracker_id:tracker.id,status:d.status,candidate_note:d.note,evidence_reference:d.evidence});
      setNotice(typeof body.message==="string"?body.message:"Tracker updated.");
      await load();
    } catch(e){setError(e instanceof Error?e.message:"Could not update tracker.");}
    finally{setBusy("");}
  }

  async function addItem(event:FormEvent<HTMLFormElement>, trackerId:string) {
    event.preventDefault(); const d=newItems[trackerId]; if(!d?.title.trim())return;
    setBusy(`add:${trackerId}`);setError("");setNotice("");
    try{
      await request("POST",{action:"add_item",tracker_id:trackerId,title:d.title,item_type:d.type,candidate_note:d.note,official_source_url:d.source});
      setNewItems(old=>({...old,[trackerId]:{title:"",type:"TASK",note:"",source:""}}));
      setNotice("Checklist item added to the saved tracker.");
      await load();
    }catch(e){setError(e instanceof Error?e.message:"Could not add checklist item.");}
    finally{setBusy("");}
  }

  async function saveItem(event:FormEvent<HTMLFormElement>, item:PreparationItem) {
    event.preventDefault(); const d=itemDrafts[item.id]; if(!d)return;
    setBusy(item.id);setError("");setNotice("");
    try{
      const body=await request("POST",{action:"update_item",item_id:item.id,status:d.status,candidate_note:d.note,evidence_reference:d.evidence});
      setNotice(typeof body.message==="string"?body.message:"Checklist updated. This is candidate-reported progress.");
      await load();
    }catch(e){setError(e instanceof Error?e.message:"Could not update checklist item.");}
    finally{setBusy("");}
  }

  return <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Kingsmen Candidate Portal · N06</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">My application tracker</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">Track preparation steps and your own reported activity. The tracker never converts a candidate-reported submission into a provider-confirmed receipt, decision or outcome.</p>
        <nav className="mt-5 flex flex-wrap gap-3 text-sm">
          <a href="/candidate/dashboard" className="rounded-xl border border-slate-700 px-4 py-2">Dashboard</a>
          <a href="/candidate/workbench" className="rounded-xl border border-slate-700 px-4 py-2">Workbench</a>
          <a href="/candidate/documents" className="rounded-xl border border-slate-700 px-4 py-2">Document Vault</a>
          <a href="/candidate/opportunity-matches" className="rounded-xl border border-slate-700 px-4 py-2">Verified opportunities</a>
          <button type="button" disabled={loading} onClick={()=>void load()} className="rounded-xl bg-cyan-300 px-4 py-2 font-bold text-slate-950 disabled:opacity-50">{loading?"Refreshing…":"Refresh tracker"}</button>
        </nav>
      </header>

      {error && <section role="alert" className="rounded-2xl border border-amber-700 bg-amber-950/50 p-4 text-sm leading-6 text-amber-100">{error}{error.includes("AUTHENTICATION_REQUIRED")&&<p className="mt-2"><a className="underline text-cyan-300" href="/candidate/login">Sign in / create account</a></p>}</section>}
      {notice && <section role="status" className="rounded-2xl border border-emerald-800 bg-emerald-950/40 p-4 text-sm leading-6 text-emerald-100">{notice}</section>}

      {loading ? <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-300">Loading records from your verified candidate workspace…</section>
      : trackers.length===0 ? <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-xl font-bold">No tracked applications yet</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">This list reflects persisted backend records; it will not invent opportunities or display sample applications as real. Open the verified opportunity catalogue and save a supported route when that action is available for your authorised identity.</p>
        <a href="/candidate/opportunity-matches" className="mt-4 inline-flex rounded-xl bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950">Open verified opportunities</a>
      </section>
      : <section className="space-y-5">{trackers.map(tracker=>{
        const opportunity=opportunityFor(tracker);
        const draft=drafts[tracker.id]??{status:tracker.status,note:tracker.candidate_note,evidence:tracker.evidence_reference};
        const trackerItems=items.filter(item=>item.tracker_id===tracker.id);
        const newItem=newItems[tracker.id]??{title:"",type:"TASK" as const,note:"",source:""};
        return <article key={tracker.id} className="rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-cyan-300">Saved opportunity</p>
              <h2 className="mt-2 break-words text-xl font-bold">{opportunity?.title??"Tracked application"}</h2>
              <p className="mt-1 text-sm text-slate-400">{opportunity?.organisation??"Provider not available"}{opportunity?.pathway? ` · ${opportunity.pathway}`:""}</p>
              {opportunity?.closing_date&&<p className="mt-2 text-xs text-slate-400">Recorded closing date: {opportunity.closing_date}</p>}
              {opportunity?.official_url&&<a href={opportunity.official_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block break-all text-sm text-cyan-300 underline">Open provider source</a>}
            </div>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs">{humanStatus(tracker.status)}</span>
          </div>
          <form onSubmit={event=>void saveTracker(event,tracker)} className="mt-6 grid gap-4 rounded-2xl border border-slate-800 p-4 md:grid-cols-2">
            <label className="block text-sm font-semibold">Your tracker status
              <select value={draft.status} onChange={e=>setDrafts(old=>({...old,[tracker.id]:{...draft,status:e.target.value as Draft["status"]}}))} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3">
                <option value="SAVED">Saved</option><option value="PREPARING">Preparing</option><option value="READY_TO_APPLY">Ready to apply (reported)</option><option value="SUBMITTED_CANDIDATE_REPORTED">Submitted (candidate-reported only)</option>
              </select>
            </label>
            <label className="block text-sm font-semibold">Candidate note
              <textarea maxLength={1200} value={draft.note} onChange={e=>setDrafts(old=>({...old,[tracker.id]:{...draft,note:e.target.value}}))} className="mt-2 min-h-24 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 font-normal" />
            </label>
            <label className="block text-sm font-semibold md:col-span-2">Submission evidence reference (required for candidate-reported submission)
              <input maxLength={500} value={draft.evidence} onChange={e=>setDrafts(old=>({...old,[tracker.id]:{...draft,evidence:e.target.value}}))} placeholder="Receipt reference or official confirmation URL" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 font-normal" />
            </label>
            <button type="submit" disabled={busy===tracker.id||!draft.evidence.trim()&&draft.status==="SUBMITTED_CANDIDATE_REPORTED"} className="rounded-xl bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950 disabled:opacity-50">{busy===tracker.id?"Saving…":"Save tracker update"}</button>
          </form>

          <section className="mt-6">
            <h3 className="text-lg font-bold">Preparation checklist <span className="text-sm font-normal text-slate-400">({trackerItems.length} items)</span></h3>
            {trackerItems.map(item=>{
              const idraft=itemDrafts[item.id]??{status:item.status,note:item.candidate_note,evidence:item.evidence_reference};
              return <form key={item.id} onSubmit={event=>void saveItem(event,item)} className="mt-3 grid gap-3 rounded-2xl border border-slate-800 p-4 md:grid-cols-[1.2fr_0.7fr_1fr_auto]">
                <div><p className="text-xs uppercase text-slate-500">{item.item_type==="DOCUMENT"?"Document":"Task"}</p><p className="mt-1 text-sm font-semibold">{item.title}</p>{item.official_source_url&&<a href={item.official_source_url} target="_blank" rel="noopener noreferrer" className="mt-1 block break-all text-xs text-cyan-300 underline">Official source</a>}</div>
                <label className="text-xs font-semibold text-slate-300">Progress<select value={idraft.status} onChange={e=>setItemDrafts(old=>({...old,[item.id]:{...idraft,status:e.target.value as ItemDraft["status"]}}))} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs"><option value="NOT_STARTED">Not started</option><option value="IN_PROGRESS">In progress</option><option value="READY_CANDIDATE_REPORTED">Ready (reported)</option></select></label>
                <label className="text-xs font-semibold text-slate-300">Evidence reference<input maxLength={1000} value={idraft.evidence} onChange={e=>setItemDrafts(old=>({...old,[item.id]:{...idraft,evidence:e.target.value}}))} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs" /></label>
                <button type="submit" disabled={busy===item.id||idraft.status==="READY_CANDIDATE_REPORTED"&&!idraft.evidence.trim()} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold disabled:opacity-40">{busy===item.id?"Saving…":"Save"}</button>
                <label className="text-xs font-semibold text-slate-300 md:col-span-4">Note<textarea maxLength={1200} value={idraft.note} onChange={e=>setItemDrafts(old=>({...old,[item.id]:{...idraft,note:e.target.value}}))} className="mt-2 min-h-16 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs font-normal" /></label>
              </form>
            })}

            <form onSubmit={event=>void addItem(event,tracker.id)} className="mt-4 grid gap-3 rounded-2xl border border-dashed border-slate-700 p-4 md:grid-cols-[0.5fr_1fr_1.1fr_auto]">
              <select aria-label="New checklist item type" value={newItem.type} onChange={e=>setNewItems(old=>({...old,[tracker.id]:{...newItem,type:e.target.value as "TASK"|"DOCUMENT"}}))} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"><option value="TASK">Task</option><option value="DOCUMENT">Document</option></select>
              <input required minLength={2} maxLength={160} aria-label="New checklist item title" placeholder="Checklist item title" value={newItem.title} onChange={e=>setNewItems(old=>({...old,[tracker.id]:{...newItem,title:e.target.value}}))} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
              <input maxLength={1000} aria-label="Official source URL for checklist item" placeholder="Optional official HTTPS source URL" value={newItem.source} onChange={e=>setNewItems(old=>({...old,[tracker.id]:{...newItem,source:e.target.value}}))} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
              <button type="submit" disabled={busy===`add:${tracker.id}`} className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold disabled:opacity-50">{busy===`add:${tracker.id}`?"Adding…":"Add checklist item"}</button>
              <label className="text-xs text-slate-400 md:col-span-4">Note<textarea maxLength={1200} value={newItem.note} onChange={e=>setNewItems(old=>({...old,[tracker.id]:{...newItem,note:e.target.value}}))} className="mt-2 min-h-16 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs" /></label>
            </form>
          </section>
        </article>;
      })}</section>}

      <footer className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-xs leading-5 text-slate-500">A candidate-reported submission is not provider-confirmed receipt. A provider decision or outcome may be recorded only by the authorised evidence/reviewer workflow. Kingsmen does not guarantee admission, funding, accommodation or employment.</footer>
    </div>
  </main>;
}
