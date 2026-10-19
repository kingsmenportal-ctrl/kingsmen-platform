"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type ReviewRequest = {
  id: string;
  candidate_reference: string;
  claimant_name: string;
  claimant_message: string;
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
  } catch { /* API remains fail-closed without a session. */ }
  return "";
}

async function api<T>(method: "GET" | "POST", body?: unknown): Promise<T> {
  const token = accessToken();
  if (!token) throw new Error("Sign in to submit or check an identity review request.");
  const response = await fetch("/api/candidate/identity-review", {
    method, headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }), cache: "no-store"
  });
  const result = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(result.error || "Identity review request failed.");
  return result;
}

function statusText(status: string) {
  const descriptions: Record<string, string> = {
    PENDING: "Waiting for an authorised reviewer.",
    NEEDS_INFORMATION: "A reviewer needs more information. Follow the reviewer note below.",
    APPROVED: "An authorised reviewer approved this request. Sign in again if the candidate workspace does not yet recognise the verified link.",
    REJECTED: "This request was rejected. Read the reviewer note and contact official Kingsmen support if you believe this is incorrect.",
    WITHDRAWN: "This request was withdrawn."
  };
  return descriptions[status] || "Status is being reviewed.";
}

export default function CandidateIdentityReviewPage() {
  const [candidateReference, setCandidateReference] = useState("");
  const [claimantName, setClaimantName] = useState("");
  const [message, setMessage] = useState("");
  const [requests, setRequests] = useState<ReviewRequest[]>([]);
  const [status, setStatus] = useState("Load your identity review status after signing in.");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await api<{ requests: ReviewRequest[] }>("GET");
      setRequests(result.requests);
      setStatus(result.requests.length ? "Your identity review requests are loaded." : "No identity review request exists for this account yet.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Unable to load review status."); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("Submitting your request securely…");
    try {
      const result = await api<{ request: ReviewRequest; notice: string }>("POST", {
        candidateReference, claimantName, message
      });
      setCandidateReference("");
      setMessage("");
      setStatus(result.notice);
      await load();
    } catch (error) { setStatus(error instanceof Error ? error.message : "Request submission failed."); }
    finally { setBusy(false); }
  }

  return (
    <main style={{ maxWidth: 850, margin: "0 auto", padding: "clamp(1rem, 4vw, 2.5rem)", color: "#172033" }}>
      <header style={{ padding: "1.5rem", borderRadius: 18, background: "#10233f", color: "#fff" }}>
        <p style={{ margin: "0 0 .5rem", textTransform: "uppercase", letterSpacing: ".12em", fontSize: ".78rem" }}>Kingsmen · Account verification</p>
        <h1 style={{ margin: "0 0 .75rem", fontSize: "clamp(1.7rem, 5vw, 2.4rem)" }}>Request candidate identity review</h1>
        <p style={{ lineHeight: 1.6, margin: 0 }}>If your account is not yet linked to your existing Kingsmen candidate record, submit a review request. An authorised reviewer must verify the match before the workspace can be unlocked.</p>
      </header>
      <p role="status" aria-live="polite" style={{ padding: ".85rem 1rem", borderRadius: 10, background: "#edf5ff", lineHeight: 1.5 }}>{status}</p>
      <section style={{ marginTop: "1.2rem", padding: "1.25rem", border: "1px solid #d9e1ec", borderRadius: 14 }}>
        <h2 style={{ marginTop: 0 }}>Your request</h2>
        <form onSubmit={submit} style={{ display: "grid", gap: ".9rem" }}>
          <label style={{ display: "grid", gap: ".35rem" }}>
            <strong>Existing Kingsmen candidate reference</strong>
            <input value={candidateReference} onChange={(event) => setCandidateReference(event.target.value)} minLength={2} maxLength={120} required autoComplete="off" placeholder="Use the reference on your existing Kingsmen records" style={{ padding: ".75rem", border: "1px solid #b8c4d4", borderRadius: 8 }} />
          </label>
          <label style={{ display: "grid", gap: ".35rem" }}>
            <strong>Your full name as recorded</strong>
            <input value={claimantName} onChange={(event) => setClaimantName(event.target.value)} minLength={2} maxLength={160} required autoComplete="name" style={{ padding: ".75rem", border: "1px solid #b8c4d4", borderRadius: 8 }} />
          </label>
          <label style={{ display: "grid", gap: ".35rem" }}>
            <strong>Additional information (optional)</strong>
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={1200} rows={4} placeholder="Explain why you believe this existing record belongs to you. Do not include passwords, one-time codes, or full identity document numbers." style={{ padding: ".75rem", border: "1px solid #b8c4d4", borderRadius: 8, font: "inherit" }} />
          </label>
          <button type="submit" disabled={busy} style={{ justifySelf: "start", padding: ".75rem 1rem", border: 0, borderRadius: 9, background: "#23466d", color: "#fff", fontWeight: 700 }}>{busy ? "Submitting…" : "Submit for authorised review"}</button>
        </form>
        <p style={{ color: "#526176", fontSize: ".9rem", lineHeight: 1.6 }}>Submitting a request does not verify your identity, guarantee approval, or grant workspace access. Never submit passwords, OTPs, or payment details. A reviewer will compare the claim with the authoritative candidate record.</p>
      </section>
      <section style={{ marginTop: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: ".75rem", alignItems: "center", flexWrap: "wrap" }}>
          <h2>Your review history</h2>
          <button type="button" onClick={() => void load()} style={{ padding: ".6rem .85rem", border: "1px solid #23466d", borderRadius: 8, background: "#fff", color: "#23466d", fontWeight: 600 }}>Refresh status</button>
        </div>
        {requests.length === 0 ? <p>No requests to show yet.</p> : <div style={{ display: "grid", gap: ".8rem" }}>
          {requests.map((item) => <article key={item.id} style={{ padding: "1rem", border: "1px solid #d9e1ec", borderRadius: 12 }}>
            <p style={{ marginTop: 0 }}><strong>{item.request_status.replaceAll("_", " ")}</strong> · {new Date(item.created_at).toLocaleString("en-ZA")}</p>
            <p>{statusText(item.request_status)}</p>
            {item.reviewer_note && <p><strong>Reviewer note:</strong> {item.reviewer_note}</p>}
          </article>)}
        </div>}
      </section>
    </main>
  );
}
