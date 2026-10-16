"use client";

import { useEffect, useState, type FormEvent } from "react";

const KEY = "kingsmen.candidate.onboarding.v1";
type Draft = { fullName: string; preferredName: string; province: string; goals: string[]; completed: string[] };
const empty: Draft = { fullName: "", preferredName: "", province: "", goals: [], completed: [] };
export default function CandidateProfilePage() {
  const [draft, setDraft] = useState<Draft>(empty);
  const [message, setMessage] = useState("");
  useEffect(() => { try { const v = JSON.parse(localStorage.getItem(KEY) || "null"); if (v && typeof v === "object") setDraft({ ...empty, ...v }); } catch { setMessage("Could not read the local draft."); } }, []);
  function save(event: FormEvent) {
    event.preventDefault();
    try { localStorage.setItem(KEY, JSON.stringify(draft)); setMessage("Profile draft saved in this browser only. No official profile or correction request was created."); }
    catch { setMessage("Unable to save in this browser. Copy your changes before leaving."); }
  }
  return <main style={{ maxWidth: 820, margin: "0 auto", padding: 24, color: "#f7f4ec", background: "#080b14", minHeight: "100vh", fontFamily: "Inter,system-ui,sans-serif" }}>
    <a href="/candidate/dashboard" style={{ color: "#f1d48b" }}>← Dashboard</a><h1>Candidate profile draft</h1>
    <p>These details are local planning data, not a verified identity or authoritative Kingsmen profile. Sensitive identity/contact changes cannot be submitted for review until authenticated profile and audit services are connected.</p>
    <form onSubmit={save} style={{ border: "1px solid #45424a", borderRadius: 14, padding: 20 }}>
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
