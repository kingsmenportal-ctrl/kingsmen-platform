"use client";

import { useCallback, useEffect, useState } from "react";

type ReviewRequest = {
  id: string;
  candidate_reference: string;
  claimant_name: string;
  claimant_message: string;
  candidate_response?: string;
  request_status: string;
  reviewer_note: string | null;
  created_at: string;
  updated_at: string;
};

function accessToken(): string {
  try {
    for (const store of [window.localStorage, window.sessionStorage]) {
      for (let i = 0; i < store.length; i++) {
        const key = store.key(i);
        if (!key || !/^sb-.+-auth-token$/.test(key)) continue;
        const raw = store.getItem(key);
        if (!raw) continue;
        let value: unknown = raw;
        if (raw.startsWith("base64-")) { try { value = atob(raw.slice(7)); } catch { continue; } }
        if (typeof value === "string") { try { value = JSON.parse(value); } catch { continue; } }
        if (value && typeof value === "object" && "access_token" in value) {
          const token = (value as { access_token?: unknown }).access_token;
          if (typeof token === "string" && token.split(".").length === 3) return token;
        }
      }
    }
  } catch { /* Authenticated API denies access when browser storage is unavailable. */ }
  return "";
}

async function api<T>(method: "GET" | "PATCH", body?: unknown): Promise<T> {
  const token = accessToken();
  if (!token) throw new Error("Sign in with an authorised platform reviewer account.");
  const response = await fetch("/api/reviewer/identity-review", {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    cache: "no-store"
  });
  const result = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(result.error || "Reviewer request failed.");
  return result;
}

export default function CandidateIdentityReviewPage() {
  const [requests, setRequests] = useState<ReviewRequest[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [references, setReferences] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string>("");
  const [message, setMessage] = useState("Loading the authorised identity review queue…");

  const load = useCallback(async () => {
    try {
      const result = await api<{ requests: ReviewRequest[] }>("GET");
      setRequests(result.requests);
      setMessage(`${result.requests.length} request(s) returned. Approval requires the exact candidate reference and a recorded review note.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load identity review queue.");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function decide(item: ReviewRequest, decision: "APPROVED" | "REJECTED" | "NEEDS_INFORMATION") {
    const note = (notes[item.id] || "").trim();
    if (note.length < 3) { setMessage("Enter a meaningful review note (at least 3 characters) before recording a decision."); return; }
    const candidateReference = (references[item.id] || item.candidate_reference).trim();
    if (decision === "APPROVED" && !candidateReference) { setMessage("Enter the exact Kingsmen candidate public reference before approving."); return; }
    setBusy(item.id);
    setMessage("Recording the decision atomically and writing the audit record…");
    try {
      const result = await api<{ notice: string }>("PATCH", {
        requestId: item.id, decision, candidateReference, note
      });
      setMessage(result.notice);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Decision failed. Refresh the queue before retrying.");
    } finally { setBusy(""); }
  }

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "clamp(1rem, 4vw, 2.5rem)", color: "#172033" }}>
      <header style={{ padding: "1.5rem", borderRadius: 18, background: "#10233f", color: "#fff" }}>
        <p style={{ margin: "0 0 .5rem", textTransform: "uppercase", letterSpacing: ".12em", fontSize: ".78rem" }}>Kingsmen · Restricted operations</p>
        <h1 style={{ margin: "0 0 .75rem", fontSize: "clamp(1.7rem, 5vw, 2.4rem)" }}>Candidate identity review</h1>
        <p style={{ lineHeight: 1.6, margin: 0 }}>Review requests against the authoritative candidate record. Only active platform administrators can access this queue. Approval creates a verified link only after the server validates the exact candidate reference and checks for existing identity conflicts.</p>
      </header>
      <p role="status" aria-live="polite" style={{ padding: ".85rem 1rem", borderRadius: 10, background: "#edf5ff", lineHeight: 1.5 }}>{message}</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: ".75rem", flexWrap: "wrap" }}>
        <h2>Open requests ({requests.length})</h2>
        <button type="button" onClick={() => void load()} disabled={!!busy} style={{ padding: ".65rem .9rem", borderRadius: 9, border: "1px solid #23466d", background: "#fff", color: "#23466d", fontWeight: 600 }}>Refresh queue</button>
      </div>
      {requests.length === 0 ? <section style={{ padding: "1.2rem", border: "1px solid #d9e1ec", borderRadius: 14 }}>No open requests are visible to this account. If you expected requests, confirm your platform administrator access.</section> : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {requests.map((item) => (
            <article key={item.id} style={{ padding: "1.2rem", border: "1px solid #d9e1ec", borderRadius: 14, background: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: ".8rem", flexWrap: "wrap" }}>
                <h3 style={{ margin: 0 }}>{item.claimant_name}</h3>
                <span style={{ alignSelf: "start", padding: ".25rem .6rem", borderRadius: 99, background: "#fff4d6", fontSize: ".85rem" }}>{item.request_status}</span>
              </div>
              <p><strong>Claimed candidate reference:</strong> {item.candidate_reference}</p>
              <p><strong>Submitted:</strong> {new Date(item.created_at).toLocaleString("en-ZA")}</p>
              <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}><strong>Claimant message:</strong><br />{item.claimant_message || "No additional message supplied."}</p>
              {item.candidate_response && <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, padding: ".8rem", background: "#edf5ff", borderRadius: 8 }}><strong>Candidate follow-up response:</strong><br />{item.candidate_response}</p>}
              <label style={{ display: "grid", gap: ".35rem", marginTop: ".9rem" }}>
                <strong>Exact candidate public reference (required to approve)</strong>
                <input value={references[item.id] ?? item.candidate_reference} onChange={(event) => setReferences((current) => ({ ...current, [item.id]: event.target.value }))} maxLength={120} autoComplete="off" style={{ width: "100%", boxSizing: "border-box", padding: ".7rem", border: "1px solid #b8c4d4", borderRadius: 8 }} />
              </label>
              <label style={{ display: "grid", gap: ".35rem", marginTop: ".9rem" }}>
                <strong>Review note / decision rationale (required)</strong>
                <textarea value={notes[item.id] || ""} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} maxLength={1200} rows={3} placeholder="Record the checks performed and why this decision is appropriate." style={{ width: "100%", boxSizing: "border-box", padding: ".7rem", border: "1px solid #b8c4d4", borderRadius: 8, font: "inherit" }} />
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: ".65rem", marginTop: "1rem" }}>
                <button type="button" disabled={!!busy} onClick={() => void decide(item, "APPROVED")} style={{ padding: ".7rem .9rem", border: 0, borderRadius: 8, background: "#176b4d", color: "#fff", fontWeight: 700, cursor: "pointer" }}>{busy === item.id ? "Recording…" : "Approve & verify identity"}</button>
                <button type="button" disabled={!!busy} onClick={() => void decide(item, "NEEDS_INFORMATION")} style={{ padding: ".7rem .9rem", border: "1px solid #9a6700", borderRadius: 8, background: "#fff8e8", color: "#704900", fontWeight: 600 }}>Request more information</button>
                <button type="button" disabled={!!busy} onClick={() => void decide(item, "REJECTED")} style={{ padding: ".7rem .9rem", border: "1px solid #a33b3b", borderRadius: 8, background: "#fff", color: "#a33b3b", fontWeight: 600 }}>Reject request</button>
              </div>
              <p style={{ fontSize: ".88rem", color: "#526176", lineHeight: 1.5 }}>Approval is atomic with its audit entry. The system refuses an already-linked account/candidate conflict, a missing candidate, an inactive candidate, or a previously closed request. Do not approve based on email similarity alone.</p>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
