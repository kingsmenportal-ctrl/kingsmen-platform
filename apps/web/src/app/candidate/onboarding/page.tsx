"use client";

import { useEffect, useState, type FormEvent } from "react";

const KEY = "kingsmen.candidate.onboarding.v1";
const steps = [
  { id: "profile", title: "Basic profile", detail: "Add a name to help label this local draft." },
  { id: "location", title: "Location", detail: "Choose your province to tailor planning guidance." },
  { id: "goals", title: "Pathway goals", detail: "Select the areas you want to explore." },
  { id: "review", title: "Review and next steps", detail: "Check your draft and mark this step complete when ready." },
];
type Draft = { fullName: string; preferredName: string; province: string; goals: string[]; completed: string[] };
const empty: Draft = { fullName: "", preferredName: "", province: "", goals: [], completed: [] };
const options = ["Higher education", "TVET / skills training", "Learnership / apprenticeship", "Employment", "Funding readiness", "Document preparation"];

function load(): Draft {
  try { const v = JSON.parse(localStorage.getItem(KEY) || "null"); if (v && typeof v === "object" && Array.isArray(v.goals) && Array.isArray(v.completed)) return { ...empty, ...v }; } catch {}
  return { ...empty };
}
export default function CandidateOnboardingPage() {
  const [draft, setDraft] = useState<Draft>(empty);
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => { setDraft(load()); setReady(true); }, []);
  function save(next: Draft) {
    setDraft(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); setMessage("Draft saved in this browser only."); }
    catch { setMessage("This browser could not save the draft. Keep a private copy before leaving this page."); }
  }
  function toggleGoal(goal: string) { save({ ...draft, goals: draft.goals.includes(goal) ? draft.goals.filter(x => x !== goal) : [...draft.goals, goal] }); }
  function markStep(event: FormEvent) {
    event.preventDefault();
    if (step === 0 && !draft.fullName.trim()) { setMessage("Enter your name to continue."); return; }
    if (step === 1 && !draft.province) { setMessage("Choose a province to continue."); return; }
    if (step === 2 && draft.goals.length === 0) { setMessage("Choose at least one pathway goal."); return; }
    const id = steps[step].id;
    const next = { ...draft, completed: draft.completed.includes(id) ? draft.completed : [...draft.completed, id] };
    save(next);
    if (step < steps.length - 1) setStep(step + 1);
    else setMessage("Review complete for this local draft. Nothing has been submitted to Kingsmen or any external organisation.");
  }
  if (!ready) return <main><h1>Candidate onboarding</h1><p>Loading local draft…</p></main>;
  return <main style={{ maxWidth: 820, margin: "0 auto", padding: 24, color: "#f7f4ec", background: "#080b14", minHeight: "100vh", fontFamily: "Inter,system-ui,sans-serif" }}>
    <a href="/candidate/dashboard" style={{ color: "#f1d48b" }}>← Dashboard</a>
    <p style={{ color: "#d8b66a", letterSpacing: ".14em", fontWeight: 800 }}>CANDIDATE ONBOARDING</p><h1>Build your starting profile</h1>
    <p>Four guided steps help you organise your planning information. This is not registration, identity verification, an application, or an eligibility assessment.</p>
    <ol aria-label="Onboarding steps" style={{ paddingLeft: 24 }}>{steps.map((s, i) => <li key={s.id} aria-current={i === step ? "step" : undefined} style={{ margin: "12px 0", fontWeight: i === step ? 800 : 400 }}>{s.title} — {draft.completed.includes(s.id) ? "Complete in this draft" : i === step ? "In progress" : "Not started"}</li>)}</ol>
    <progress value={draft.completed.length} max={4} aria-label="Completed onboarding steps" style={{ width: "100%" }} />
    <form onSubmit={markStep} style={{ marginTop: 24, border: "1px solid #45424a", borderRadius: 14, padding: 20 }}>
      <h2>{steps[step].title}</h2><p>{steps[step].detail}</p>
      {step === 0 && <div style={{ display: "grid", gap: 14 }}><label>Full name (required for this local draft)<input required value={draft.fullName} onChange={e => save({ ...draft, fullName: e.target.value })} autoComplete="name" style={inputStyle} /></label><label>Preferred name (optional)<input value={draft.preferredName} onChange={e => save({ ...draft, preferredName: e.target.value })} style={inputStyle} /></label></div>}
      {step === 1 && <label>Province<select required value={draft.province} onChange={e => save({ ...draft, province: e.target.value })} style={inputStyle}><option value="">Choose province</option>{["Eastern Cape","Free State","Gauteng","KwaZulu-Natal","Limpopo","Mpumalanga","Northern Cape","North West","Western Cape","Outside South Africa / not sure"].map(x => <option key={x}>{x}</option>)}</select></label>}
      {step === 2 && <fieldset><legend>What would you like to explore? (choose at least one)</legend>{options.map(x => <label key={x} style={{ display: "block", margin: "10px 0" }}><input type="checkbox" checked={draft.goals.includes(x)} onChange={() => toggleGoal(x)} /> {x}</label>)}</fieldset>}
      {step === 3 && <div><h3>Review your local draft</h3><p><strong>Name:</strong> {draft.fullName || "Not provided"}</p><p><strong>Preferred name:</strong> {draft.preferredName || "Not provided"}</p><p><strong>Province:</strong> {draft.province || "Not selected"}</p><p><strong>Goals:</strong> {draft.goals.join(", ") || "None selected"}</p><p>Marking review complete only records progress in this browser. It does not submit your details.</p></div>}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 22 }}><button type="submit" style={buttonStyle}>{step === 3 ? "Finish local review" : "Validate & continue"}</button>{step > 0 && <button type="button" onClick={() => { setStep(step - 1); setMessage(""); }} style={buttonStyle}>Previous step</button>}<button type="button" onClick={() => { setDraft({ ...empty }); setStep(0); try { localStorage.removeItem(KEY); setMessage("Local draft cleared from this browser."); } catch { setMessage("Draft reset on screen; browser storage could not be cleared."); } }} style={buttonStyle}>Clear draft</button></div>
      <p role="status" aria-live="polite">{message}</p>
    </form>
    <aside style={{ borderLeft: "3px solid #d8b66a", padding: "8px 16px", marginTop: 24 }}><strong>Privacy and save limits</strong><p>Progress is saved in local browser storage on this device only. It is not synced to an account or server and may be lost if site data is cleared. Do not enter identity numbers, bank details, passwords, or upload sensitive documents here.</p></aside>
  </main>;
}
const inputStyle = { display: "block", width: "100%", boxSizing: "border-box" as const, padding: 12, borderRadius: 8, marginTop: 6, background: "#171b26", color: "#fff", border: "1px solid #5c5c66" };
const buttonStyle = { padding: "11px 14px", borderRadius: 8, border: "1px solid #d8b66a", background: "#171b26", color: "#f7f4ec", fontWeight: 700, cursor: "pointer" };
