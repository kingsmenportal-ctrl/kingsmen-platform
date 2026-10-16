"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

const KEY = "kingsmen.candidate.onboarding.v1";
type Draft = { fullName: string; preferredName: string; province: string; goals: string[]; completed: string[] };
type ApiState = { kind: "loading" } | { kind: "available"; message: string } | { kind: "blocked"; message: string; code?: string } | { kind: "error" };
const empty: Draft = { fullName: "", preferredName: "", province: "", goals: [], completed: [] };

export default function CandidateProfilePage() {
  const [draft, setDraft] = useState<Draft>(empty);
  const [message, setMessage] = useState("");
  const [apiState, setApiState] = useState<ApiState>({ kind: "loading" });

  const checkProfileService = useCallback(async () => {
    setApiState({ kind: "loading" });
    try {
      const response = await fetch("/api/candidate/profile", {
        method: "GET", credentials: "same-origin", cache: "no-store",
        headers: { Accept: "application/json" }
      });
      const body = await response.json().catch(() => ({}));
      if (response.ok && body?.ok === true) {
        setApiState({ kind: "available", message: "The service responded, but this check did not return authoritative profile fields." });
        return;
      }
      const code = typeof body?.code === "string" ? body.code : undefined;
      const copy: Record<string, string> = {
        IDENTITY_PROVIDER_NOT_CONFIGURED: "Secure account verification is not configured in this environment.",
        CANDIDATE_AUTH_REQUIRED: "Sign in before accessing account profile services.",
        CANDIDATE_PROFILE_LINK_REQUIRED: "Your sign-in identity is not yet linked to an authoritative candidate record.",
        PROFILE_ACCESS_CHECK_FAILED: "The server could not safely verify profile access."
      };
      setApiState({ kind: "blocked", code, message: (code && copy[code]) || "The profile service is unavailable. No account profile was loaded." });
    } catch { setApiState({ kind: "error" }); }
  }, []);

  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || "null");
      if (v && typeof v === "object") setDraft({ ...empty, ...v });
    } catch { setMessage("Could not read the local draft."); }
    void checkProfileService();
  }, [checkProfileService]);

  function save(event: FormEvent) {
    event.preventDefault();
    try {
      localStorage.setItem(KEY, JSON.stringify(draft));
      setMessage("Profile draft saved in this browser only. No official profile or correction request was created.");
    } catch { setMessage("Unable to save in this browser. Copy your changes before leaving."); }
  }

  return <main style={{ maxWidth: 820, margin: "0 auto", padding: 24, color: "#f7f4ec", background: "#080b14", minHeight: "100vh", fontFamily: "Inter,system-ui,sans-serif" }}>
    <a href="/candidate/dashboard" style={{ color: "#f1d48b" }}>← Dashboard</a><h1>Candidate profile draft</h1>
    <p>These details are local planning data, not a verified identity or authoritative Kingsmen profile. Sensitive identity/contact changes cannot be submitted for review until authenticated profile and audit services are connected.</p>
    <section aria-labelledby="profile-service-heading" aria-live="polite" style={{ border: "1px solid #a67b35", borderRadius: 12, padding: 16, margin: "18px 0" }}>
      <h2 id="profile-service-heading">Secure profile service</h2>
      {apiState.kind === "loading" && <p role="status">Checking account profile access…</p>}
      {apiState.kind === "available" && <p role="status">{apiState.message}</p>}
      {apiState.kind === "blocked" && <><p><strong>Authoritative profile access is currently blocked.</strong></p><p>{apiState.message}</p>{apiState.code && <p style={{ fontSize: 13, opacity: .8 }}>Reference: {apiState.code}</p>}</>}
      {apiState.kind === "error" && <p role="status">Could not contact the profile service. The local draft remains separate.</p>}
      <button type="button" onClick={() => void checkProfileService()} style={buttonStyle}>Check profile connection</button>
    </section>
    <form onSubmit={save} style={{ border: "1px solid #45424a", borderRadius: 14, padding: 20 }}>
      <h2>Local planning draft</h2>
      <label>Full name<input required value={draft.fullName} onChange={e => setDraft({ ...draft, fullName: e.target.value })} autoComplete="name" style={inputStyle} /></label>
      <label style={{ display: "block", marginTop: 14 }}>Preferred name<input value={draft.preferredName} onChange={e => setDraft({ ...draft, preferredName: e.target.value })} style={inputStyle} /></label>
      <label style={{ display: "block", marginTop: 14 }}>Province<select value={draft.province} onChange={e => setDraft({ ...draft, province: e.target.value })} style={inputStyle}><option value="">Choose province</option>{["Eastern Cape","Free State","Gauteng","KwaZulu-Natal","Limpopo","Mpumalanga","Northern Cape","North West","Western Cape","Outside South Africa / not sure"].map(x => <option key={x}>{x}</option>)}</select></label>
      <p><strong>Pathway goals:</strong> {draft.goals.length ? draft.goals.join(", ") : "None selected"}</p>
      <button type="submit" style={buttonStyle}>Save local draft</button><p role="status" aria-live="polite">{message}</p>
    </form>
    <p style={{ fontSize: 13, opacity: .8 }}>Local storage is device/browser-specific and may be cleared. Do not enter identity numbers, bank details, passwords, or sensitive documents.</p>
  </main>;
}
const inputStyle = { display: "block", width: "100%", boxSizing: "border-box" as const, padding: 12, borderRadius: 8, marginTop: 6, background: "#171b26", color: "#fff", border: "1px solid #5c5c66" };
const buttonStyle = { padding: "11px 14px", borderRadius: 8, border: "1px solid #d8b66a", background: "#171b26", color: "#f7f4ec", fontWeight: 700, cursor: "pointer" };
