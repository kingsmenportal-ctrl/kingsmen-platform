"use client";

import { useEffect, useState } from "react";

const gates = [
  ["higher_education", "Higher Education"],
  ["tvet", "TVET"],
  ["seta_learnership", "SETA / Learnership"],
  ["internship", "Internship"],
  ["apprenticeship", "Apprenticeship"],
  ["employment", "Employment"],
] as const;

type OnboardingDraft = { fullName: string; preferredName: string; province: string; goals: string[]; completed: string[] };
const STORAGE_KEY = "kingsmen.candidate.onboarding.v1";

function readDraft(): OnboardingDraft | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.goals) || !Array.isArray(parsed.completed)) return null;
    return parsed as OnboardingDraft;
  } catch { return null; }
}

export default function CandidateDashboardPage() {
  const [draft, setDraft] = useState<OnboardingDraft | null>(null);
  useEffect(() => { setDraft(readDraft()); }, []);
  const done = draft?.completed.length ?? 0;

  return <main style={{ maxWidth: 980, margin: "0 auto", padding: 24, color: "#f7f4ec", background: "#080b14", minHeight: "100vh", fontFamily: "Inter,system-ui,sans-serif" }}>
    <header>
      <p style={{ color: "#d8b66a", letterSpacing: ".16em", fontWeight: 800 }}>KINGSMEN CANDIDATE SPACE</p>
      <h1>Candidate Dashboard</h1>
      <p>Your workspace for planning next steps. This page currently reads only a draft saved in this browser; it is not connected to an authenticated candidate record.</p>
    </header>
    <section aria-labelledby="progress-heading" style={{ border: "1px solid #45424a", borderRadius: 14, padding: 20, margin: "24px 0" }}>
      <h2 id="progress-heading">Your onboarding progress</h2>
      {draft ? <><p><strong>{done} of 4 steps marked complete</strong></p><progress value={done} max={4} aria-label="Onboarding completion" style={{ width: "100%" }} /><p>{draft.fullName ? `Draft profile: ${draft.fullName}` : "Profile details still need to be added."}</p><a href="/candidate/onboarding" style={{ color: "#f1d48b" }}>Resume onboarding →</a></> : <><p>Not started — no local onboarding draft was found in this browser.</p><a href="/candidate/onboarding" style={{ color: "#f1d48b" }}>Start onboarding →</a></>}
      <p style={{ fontSize: 13, opacity: .8 }}>Local-only save: drafts remain in this browser on this device. Clearing site data or switching devices may remove them. Do not enter identity numbers, banking details, or other sensitive documents here.</p>
    </section>
    <section aria-labelledby="gates-heading">
      <h2 id="gates-heading">Your pathway areas</h2>
      <p>These are planning categories, not eligibility decisions or official application results.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
        {gates.map(([code, label]) => <article key={code} data-gate={code} style={{ border: "1px solid #45424a", borderRadius: 12, padding: 16 }}>
          <h3>{label}</h3><p>Status: <strong>Not assessed</strong></p><p style={{ fontSize: 13 }}>No authoritative status record is connected to this view.</p>
        </article>)}
      </div>
    </section>
    <nav aria-label="Candidate tools" style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 24 }}>
      <a href="/candidate/profile" style={{ color: "#f1d48b" }}>Candidate profile</a><a href="/candidate/documents" style={{ color: "#f1d48b" }}>Documents information</a><a href="/free-destiny-map" style={{ color: "#f1d48b" }}>Free Destiny Map</a>
    </nav>
    <p data-boundary="browser-safe" style={{ borderTop: "1px solid #45424a", marginTop: 28, paddingTop: 16, fontSize: 13 }}>No service-role authority, payment confirmation, submitted application, verified outcome, or external decision is represented here. Demo/local draft data is not an authoritative candidate record.</p>
  </main>;
}