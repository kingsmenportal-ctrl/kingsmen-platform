"use client";
import { useCallback, useEffect, useState } from "react";
type DocumentRow = { id: string; candidate_id: string; original_filename: string; mime_type: string; size_bytes: number; status: string; uploaded_at: string | null; created_at: string };
type ReviewResult = { ok?: boolean; documents?: DocumentRow[]; error?: string; readUrl?: string; expiresInSeconds?: number };
function token(): string {
  try {
    for (const store of [window.localStorage, window.sessionStorage]) for (let i = 0; i < store.length; i++) {
      const key = store.key(i); if (!key || !/^sb-.+-auth-token$/.test(key)) continue;
      const raw = store.getItem(key); if (!raw) continue;
      let value: unknown = raw;
      if (raw.startsWith("base64-")) { try { value = atob(raw.slice(7)); } catch { continue; } }
      if (typeof value === "string") { try { value = JSON.parse(value); } catch { continue; } }
      if (value && typeof value === "object" && "access_token" in value) {
        const access = (value as { access_token?: unknown }).access_token;
        if (typeof access === "string" && access.split(".").length === 3) return access;
      }
    }
  } catch { /* server auth fails closed */ }
  return "";
}
async function call<T>(url: string, method = "GET", body?: unknown): Promise<T> {
  const access = token(); if (!access) throw new Error("Sign in with an authorised platform reviewer account.");
  const response = await fetch(url, { method, headers: { Authorization: `Bearer ${access}`, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }), cache: "no-store" });
  const data = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || "Reviewer operation failed.");
  return data;
}
export default function ReviewerDocumentsPage() {
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [notes, setNotes] = useState<Record<string,string>>({});
  const [evidence, setEvidence] = useState<Record<string,string>>({});
  const [reads, setReads] = useState<Record<string,string>>({});
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("Loading the restricted document-review queue…");
  const load = useCallback(async () => {
    try { const data = await call<ReviewResult>("/api/reviewer/documents"); setDocuments(data.documents || []); setMessage(`${(data.documents || []).length} document(s) awaiting authorised review.`); }
    catch (e) { setMessage(e instanceof Error ? e.message : "Review queue could not be loaded."); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  async function openDocument(doc: DocumentRow) {
    setBusy(doc.id); setMessage("Issuing a short-lived reviewer read link and recording the access event…");
    try { const data = await call<ReviewResult>("/api/reviewer/documents/read-url", "POST", { documentId: doc.id });
      if (!data.readUrl) throw new Error("No signed read link was returned."); setReads(v => ({...v, [doc.id]: data.readUrl!}));
      setMessage("Private read link issued. It expires in 10 minutes; access is audit-recorded.");
    } catch(e) { setMessage(e instanceof Error ? e.message : "Could not open document."); } finally { setBusy(""); }
  }
  async function decide(doc: DocumentRow, decision: "VERIFIED" | "REJECTED") {
    const note = (notes[doc.id] || "").trim(), evidenceReference = (evidence[doc.id] || "").trim();
    if (note.length < 3 || evidenceReference.length < 3) { setMessage("A meaningful reviewer note and evidence reference are required before deciding."); return; }
    setBusy(doc.id); setMessage("Recording the evidence-backed decision atomically…");
    try { await call("/api/reviewer/documents", "PATCH", { documentId: doc.id, decision, note, evidenceReference });
      setMessage(`Document marked ${decision}. Reviewer decision, evidence reference, and audit event were recorded.`); await load();
    } catch(e) { setMessage(e instanceof Error ? e.message : "Decision failed. Refresh before retrying."); } finally { setBusy(""); }
  }
  return <main style={{maxWidth:1100,margin:"0 auto",padding:"clamp(1rem,4vw,2.5rem)",color:"#172033"}}>
    <header style={{padding:"1.5rem",borderRadius:18,background:"#10233f",color:"#fff"}}>
      <p style={{margin:"0 0 .5rem",textTransform:"uppercase",letterSpacing:".12em",fontSize:".78rem"}}>Kingsmen · Restricted operations</p>
      <h1 style={{margin:"0 0 .75rem",fontSize:"clamp(1.7rem,5vw,2.4rem)"}}>Private document review</h1>
      <p style={{lineHeight:1.6,margin:0}}>Only active platform administrators can access this queue. Inspect each private file using a short-lived signed link, then record a decision with a reviewer note and evidence reference. Upload confirmation alone is not verification.</p>
    </header>
    <p role="status" aria-live="polite" style={{padding:".85rem 1rem",borderRadius:10,background:"#edf5ff",lineHeight:1.5}}>{message}</p>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:".75rem",flexWrap:"wrap"}}><h2>Awaiting review ({documents.length})</h2><button onClick={() => void load()}>Refresh queue</button></div>
    {documents.length === 0 ? <p>No documents are currently awaiting review, or the queue is unavailable to this account.</p> : documents.map(doc => <article key={doc.id} style={{border:"1px solid #d8e0eb",borderRadius:14,padding:"1rem",margin:"1rem 0"}}>
      <h3>{doc.original_filename}</h3><p>Type: {doc.mime_type} · Size: {Math.ceil(doc.size_bytes / 1024)} KiB · Status: <strong>{doc.status}</strong></p>
      <p>Document ID: <code>{doc.id}</code></p><p>Candidate reference (internal): <code>{doc.candidate_id}</code></p>
      <button disabled={busy === doc.id} onClick={() => void openDocument(doc)}>{busy === doc.id ? "Working…" : "Issue secure read link"}</button>
      {reads[doc.id] && <p><a href={reads[doc.id]} target="_blank" rel="noreferrer">Open private document (link expires in 10 minutes)</a></p>}
      <label style={{display:"block",marginTop:".8rem"}}>Reviewer note<textarea value={notes[doc.id] || ""} onChange={e=>setNotes(v=>({...v,[doc.id]:e.target.value}))} maxLength={1200} rows={3} style={{display:"block",width:"100%",marginTop:".3rem"}} /></label>
      <label style={{display:"block",marginTop:".8rem"}}>Evidence reference<input value={evidence[doc.id] || ""} onChange={e=>setEvidence(v=>({...v,[doc.id]:e.target.value}))} maxLength={500} style={{display:"block",width:"100%",marginTop:".3rem"}} placeholder="Reference to the source checked or review evidence" /></label>
      <div style={{display:"flex",gap:".75rem",flexWrap:"wrap",marginTop:"1rem"}}><button disabled={busy===doc.id} onClick={()=>void decide(doc,"VERIFIED")}>Verify document</button><button disabled={busy===doc.id} onClick={()=>void decide(doc,"REJECTED")}>Reject document</button></div>
    </article>)}
  </main>;
}
