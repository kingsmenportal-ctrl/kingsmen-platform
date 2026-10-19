"use client";

import { useEffect, useState } from "react";
import { candidateWorkspaceRequest } from "@/lib/candidate-workspace-client";

const pathways = [
  { code: "higher_education", title: "Higher Education", description: "Universities, colleges and formal post-school study.", next: "Confirm your preferred qualification and institution requirements." },
  { code: "tvet", title: "TVET", description: "Technical and vocational programmes and occupational training.", next: "Choose a campus and qualification; check entry and document requirements." },
  { code: "seta_learnership", title: "SETA / Learnership", description: "Workplace-linked learning and registered learnership opportunities.", next: "Check eligibility, location and the required school or qualification records." },
  { code: "internship", title: "Internships", description: "Entry-level workplace experience and graduate opportunities.", next: "Prepare a current CV and confirm each listing's closing date." },
  { code: "apprenticeship", title: "Apprenticeships", description: "Trade pathways combining structured learning and practical experience.", next: "Identify the trade and verify the employer's entry requirements." },
  { code: "employment", title: "Employment", description: "Jobs matched to your skills, experience and location.", next: "Prepare your CV and verify the employer and application channel." }
] as const;

const tasks = [
  { id: "profile", title: "Review your candidate profile", detail: "Check that your personal and education details are accurate." },
  { id: "documents", title: "Prepare your documents", detail: "Keep required certificates and supporting documents ready; upload only through an approved secure flow." },
  { id: "pathway", title: "Choose a priority pathway", detail: "Select one pathway to focus your next application steps." },
  { id: "evidence", title: "Keep application evidence", detail: "Save reference numbers and confirmations. Do not mark an application submitted without proof." }
] as const;

type Progress = { tasks: string[]; pathway: string };

const STORAGE_KEY = "kingsmen-candidate-dashboard-progress-v1";

export default function CandidateDashboardPage() {
  const [progress, setProgress] = useState<Progress>({ tasks: [], pathway: "" });
  const [loaded, setLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState("Checking your Kingsmen account session…");

  useEffect(() => {
    let cancelled = false;
    async function loadWorkspace() {
      try {
        const result = await candidateWorkspaceRequest<{ readiness: { tasks: string[]; pathway: string }; source: string }>("GET");
        if (cancelled) return;
        setProgress({
          tasks: Array.isArray(result.readiness?.tasks) ? result.readiness.tasks.filter((id) => tasks.some((task) => task.id === id)) : [],
          pathway: typeof result.readiness?.pathway === "string" && pathways.some((pathway) => pathway.code === result.readiness.pathway) ? result.readiness.pathway : ""
        });
        setSyncStatus("Synced with your authenticated Kingsmen account and Truth Vault.");
      } catch (error) {
        if (cancelled) return;
        try {
          const saved = window.localStorage.getItem(STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved) as Partial<Progress>;
            setProgress({
              tasks: Array.isArray(parsed.tasks) ? parsed.tasks.filter((id): id is string => typeof id === "string" && tasks.some((task) => task.id === id)) : [],
              pathway: typeof parsed.pathway === "string" && pathways.some((pathway) => pathway.code === parsed.pathway) ? parsed.pathway : ""
            });
          }
        } catch { /* Local fallback is optional; never blocks the workspace. */ }
        setSyncStatus(error instanceof Error ? error.message : "Account sync is unavailable. Changes remain local until you sign in.");
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }
    void loadWorkspace();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch { /* Optional offline fallback. */ }
    if (syncStatus.startsWith("Synced") || syncStatus.startsWith("Saving")) {
      setSyncStatus("Saving to your Kingsmen account…");
      const timer = window.setTimeout(() => {
        void candidateWorkspaceRequest<{ ok: boolean }>("PATCH", progress)
          .then(() => setSyncStatus("Synced with your authenticated Kingsmen account and Truth Vault."))
          .catch((error) => setSyncStatus(error instanceof Error ? error.message : "Account sync failed; your last local copy remains on this device."));
      }, 250);
      return () => window.clearTimeout(timer);
    }
  }, [loaded, progress]);


  function toggleTask(id: string) {
    setProgress((current) => ({
      ...current,
      tasks: current.tasks.includes(id) ? current.tasks.filter((taskId) => taskId !== id) : [...current.tasks, id]
    }));
  }

  const completedCount = tasks.filter((task) => progress.tasks.includes(task.id)).length;
  const selectedPathway = pathways.find((pathway) => pathway.code === progress.pathway);

  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "clamp(1rem, 4vw, 2.5rem)", color: "#172033" }}>
      <header style={{ padding: "1.5rem", borderRadius: 18, background: "#10233f", color: "#fff" }}>
        <p style={{ margin: "0 0 .5rem", textTransform: "uppercase", letterSpacing: ".12em", fontSize: ".78rem" }}>Kingsmen · Candidate workspace</p>
        <h1 style={{ fontSize: "clamp(1.8rem, 5vw, 2.6rem)", margin: "0 0 .75rem" }}>Your next step starts here</h1>
        <p style={{ maxWidth: 700, lineHeight: 1.6, margin: 0 }}>Organise your readiness across all six pathways, choose a priority and keep track of the preparation you have completed.</p>
      </header>

      <section aria-labelledby="readiness-title" style={{ marginTop: "1.5rem", padding: "1.25rem", border: "1px solid #d9e1ec", borderRadius: 16 }}>
        <h2 id="readiness-title" style={{ marginTop: 0 }}>Readiness checklist</h2>
        <p aria-live="polite">{completedCount} of {tasks.length} preparation steps checked ({Math.round(completedCount / tasks.length * 100)}%). This is your personal checklist, not an official verification result.</p>
        <div style={{ height: 8, background: "#e8edf4", borderRadius: 99, overflow: "hidden" }} role="progressbar" aria-label="Personal preparation checklist" aria-valuemin={0} aria-valuemax={tasks.length} aria-valuenow={completedCount}>
          <div style={{ width: `${completedCount / tasks.length * 100}%`, height: "100%", background: "#287c62", transition: "width 150ms ease" }} />
        </div>
        <div style={{ display: "grid", gap: ".75rem", marginTop: "1rem" }}>
          {tasks.map((task) => (
            <label key={task.id} style={{ display: "flex", alignItems: "flex-start", gap: ".75rem", padding: ".9rem", border: "1px solid #e1e7ef", borderRadius: 12, cursor: "pointer" }}>
              <input type="checkbox" checked={progress.tasks.includes(task.id)} onChange={() => toggleTask(task.id)} style={{ marginTop: ".3rem", width: 18, height: 18, flexShrink: 0 }} />
              <span><strong>{task.title}</strong><br /><span style={{ color: "#526176", lineHeight: 1.5 }}>{task.detail}</span></span>
            </label>
          ))}
        </div>
        <p role="status" aria-live="polite" style={{ fontSize: ".9rem", color: "#526176", marginBottom: 0 }}>{syncStatus}</p>
      </section>

      <section aria-labelledby="pathways-title" style={{ marginTop: "1.75rem" }}>
        <h2 id="pathways-title">Explore your six pathways</h2>
        <p style={{ color: "#526176" }}>Choose a priority pathway. Selection is a planning preference, not an application or eligibility decision.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 270px), 1fr))", gap: "1rem" }}>
          {pathways.map((pathway) => {
            const selected = progress.pathway === pathway.code;
            return (
              <article key={pathway.code} data-gate={pathway.code} style={{ padding: "1.1rem", border: selected ? "2px solid #287c62" : "1px solid #d9e1ec", borderRadius: 14, background: selected ? "#f1faf6" : "#fff" }}>
                <h3 style={{ marginTop: 0 }}>{pathway.title}</h3>
                <p style={{ color: "#526176", lineHeight: 1.55 }}>{pathway.description}</p>
                <p><strong>Suggested next step:</strong> {pathway.next}</p>
                <button type="button" aria-pressed={selected} onClick={() => setProgress((current) => ({ ...current, pathway: selected ? "" : pathway.code }))} style={{ padding: ".65rem .85rem", borderRadius: 9, border: "1px solid #23466d", background: selected ? "#23466d" : "#fff", color: selected ? "#fff" : "#23466d", fontWeight: 600, cursor: "pointer" }}>
                  {selected ? "Priority selected ✓" : "Make this my priority"}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      {selectedPathway && (
        <section aria-live="polite" style={{ marginTop: "1.25rem", padding: "1.1rem", borderRadius: 12, background: "#edf5ff", border: "1px solid #cbdcf4" }}>
          <h2 style={{ marginTop: 0 }}>Your current priority: {selectedPathway.title}</h2>
          <p>{selectedPathway.next}</p>
          <p>Before applying, verify the opportunity directly with the institution or employer and keep the confirmation as evidence.</p>
        </section>
      )}

      <section aria-labelledby="safety-title" style={{ marginTop: "1.75rem", padding: "1rem 1.1rem", borderLeft: "4px solid #b7791f", background: "#fff8e8" }}>
        <h2 id="safety-title" style={{ marginTop: 0 }}>Important status and safety rules</h2>
        <ul style={{ lineHeight: 1.7, paddingLeft: "1.25rem", marginBottom: 0 }}>
          <li>This dashboard does not claim that your identity, documents, eligibility or applications have been verified.</li>
          <li>An order or payment return page alone does not activate a paid service.</li>
          <li>Never share passwords, one-time codes or payment details in support messages.</li>
          <li>If an institution requires a manual portal step, retain the evidence and complete that step through its official channel.</li>
        </ul>
      </section>
    </main>
  );
}
