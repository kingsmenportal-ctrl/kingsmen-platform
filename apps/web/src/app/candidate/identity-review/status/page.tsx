"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

const PROJECT_REF = "euhubhhnumtibbyufghm";
const API = `https://${PROJECT_REF}.supabase.co/functions/v1`;
type Evidence = { id: string; original_filename: string; mime_type: string; size_bytes: number; review_status: string; reviewer_note?: string | null; uploaded_at: string; reviewed_at?: string | null };
type RequestItem = { id: string; candidate_reference: string; request_status: string; claimant_message: string; candidate_response: string; reviewer_note?: string | null; created_at: string; updated_at: string; reviewed_at?: string | null; evidence: Evidence[] };
function token(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`sb-${PROJECT_REF}-auth-token`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { access_token?: string };
    return typeof parsed.access_token === "string" ? parsed.access_token : null;
  } catch { return null; }
}
function date(value?: string | null) { return value ? new Date(value).toLocaleString() : "Not recorded"; }

export default function CandidateIdentityReviewStatusPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const accessToken = token();
    if (!accessToken) { setError("Please sign in first."); return; }
    const res = await fetch(`${API}/candidate-identity-review-status`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error ?? "Could not load your request status.");
    setRequests(body.requests ?? []);
    setError("");
  }, []);
  useEffect(() => { load().catch((e) => setError(e instanceof Error ? e.message : "Could not load status.")); }, [load]);

  async function respond(event: FormEvent<HTMLFormElement>, item: RequestItem) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const accessToken = token();
    if (!accessToken) { setError("Your session expired. Sign in again."); setBusy(false); return; }
    try {
      const res = await fetch(`${API}/candidate-identity-review-followup`, { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ request_id: item.id, response: responses[item.id] ?? "" }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Your response could not be saved.");
      setMessage("Your response was saved. The request is back in the reviewer queue.");
      setResponses((old) => ({ ...old, [item.id]: "" }));
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Your response could not be saved."); }
    finally { setBusy(false); }
  }
  async function upload(item: RequestItem) {
    const file = files[item.id]; const accessToken = token();
    if (!file) { setError("Choose a PDF, JPEG, or PNG evidence file first."); return; }
    if (!accessToken) { setError("Your session expired. Sign in again."); return; }
    setBusy(true); setError(""); setMessage("");
    try {
      const form = new FormData(); form.set("request_id", item.id); form.set("file", file);
      const res = await fetch(`${API}/candidate-identity-review-evidence-upload`, { method: "POST", headers: { Authorization: `Bearer ${accessToken}` }, body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Evidence upload was not confirmed.");
      setMessage("Additional evidence was uploaded privately and is awaiting reviewer inspection.");
      setFiles((old) => ({ ...old, [item.id]: null }));
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Evidence upload was not confirmed."); }
    finally { setBusy(false); }
  }

  return <main className="min-h-screen bg-slate-950 px-4 py-8 text-white"><div className="mx-auto max-w-4xl">
    <header className="rounded-2xl border border-slate-800 bg-slate-900 p-6"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">Kingsmen · Candidate account support</p><h1 className="mt-3 text-3xl font-bold">My identity-review status</h1><p className="mt-3 leading-7 text-slate-300">This page shows only requests associated with your signed-in account. Reviewer notes and evidence decisions are shown when recorded. Evidence descriptions or uploads are not proof of identity until reviewed.</p><div className="mt-4 flex gap-4 text-sm"><a className="underline text-emerald-300" href="/candidate/identity-review">Submit a request</a><button className="underline text-emerald-300" onClick={() => load().catch((e) => setError(e.message))}>Refresh status</button></div></header>
    {message && <p role="status" className="mt-5 rounded-xl border border-emerald-800 bg-emerald-950/40 p-4 text-emerald-200">{message}</p>}
    {error && <p role="alert" className="mt-5 rounded-xl border border-rose-800 bg-rose-950/40 p-4 text-rose-200">{error}</p>}
    <section className="mt-6 space-y-5">{requests.length === 0 ? <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">No identity-review requests are recorded for this signed-in account.</div> : requests.map((item) => <article key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold">Request {item.id}</h2><p className="mt-1 text-sm text-slate-400">Candidate reference: {item.candidate_reference}</p></div><span className="rounded-full border border-slate-700 px-3 py-1 text-sm">{item.request_status.replaceAll("_", " ")}</span></div>
      <p className="mt-3 text-sm text-slate-400">Submitted {date(item.created_at)} · Last updated {date(item.updated_at)} · Decision {date(item.reviewed_at)}</p>
      <div className="mt-4 rounded-xl bg-slate-950 p-4"><h3 className="font-semibold">Reviewer response</h3><p className="mt-2 whitespace-pre-wrap text-slate-300">{item.reviewer_note || "No reviewer response is currently recorded."}</p></div>
      <div className="mt-4 rounded-xl bg-slate-950 p-4"><h3 className="font-semibold">Your previous responses</h3><p className="mt-2 whitespace-pre-wrap text-slate-300">{item.candidate_response || "No follow-up response recorded."}</p></div>
      <div className="mt-4"><h3 className="font-semibold">Supporting evidence</h3>{item.evidence.length ? <ul className="mt-2 space-y-2">{item.evidence.map((ev) => <li key={ev.id} className="rounded-lg border border-slate-800 p-3 text-sm"><p>{ev.original_filename} · {Math.ceil(ev.size_bytes / 1024)} KB · {ev.review_status}</p><p className="mt-1 text-slate-400">{ev.reviewer_note || "No evidence-specific reviewer note."} · Uploaded {date(ev.uploaded_at)}</p></li>)}</ul> : <p className="mt-2 text-slate-400">No evidence file has been uploaded.</p>}</div>
      {["PENDING", "NEEDS_INFORMATION"].includes(item.request_status) && <div className="mt-5 space-y-4 border-t border-slate-800 pt-5"><div><label className="mb-2 block font-semibold" htmlFor={`evidence-${item.id}`}>Attach additional evidence to this request</label><input id={`evidence-${item.id}`} type="file" accept="application/pdf,image/jpeg,image/png" onChange={(e) => setFiles((old) => ({ ...old, [item.id]: e.target.files?.[0] ?? null }))} className="block w-full text-sm text-slate-300" /><button disabled={busy} onClick={() => upload(item)} className="mt-3 rounded-xl border border-slate-700 px-4 py-2 disabled:opacity-60">Upload evidence privately</button></div>
      {item.request_status === "NEEDS_INFORMATION" && <form onSubmit={(e) => respond(e, item)} className="space-y-3"><label className="block font-semibold" htmlFor={`response-${item.id}`}>Respond to the reviewer</label><textarea id={`response-${item.id}`} required minLength={3} maxLength={1200} rows={4} value={responses[item.id] ?? ""} onChange={(e) => setResponses((old) => ({ ...old, [item.id]: e.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3" placeholder="Answer the reviewer's request for more information." /><button disabled={busy} className="rounded-xl bg-emerald-400 px-4 py-3 font-bold text-slate-950 disabled:opacity-60">{busy ? "Saving…" : "Send response to reviewer"}</button></form>}</div>}
    </article>)}</section>
  </div></main>;
}
