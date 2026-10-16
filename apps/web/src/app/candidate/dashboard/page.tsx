"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type CandidateProfile = {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  highestEducation?: string;
  skills?: string;
};
type CandidateDocument = { documentId?: string; type?: string; name?: string; status?: string; createdAt?: string };
type Opportunity = { opportunityId?: string; title?: string; organisation?: string; status?: string; category?: string; updatedAt?: string };
type Task = { taskId?: string; title?: string; dueDate?: string; priority?: string; status?: string };
type Workspace = {
  status?: string;
  error?: string;
  profile?: CandidateProfile;
  documents?: CandidateDocument[];
  opportunities?: Opportunity[];
  applicationPacks?: unknown[];
  proofLog?: unknown[];
  tasks?: Task[];
  financeLedger?: Array<{ status?: string; type?: string; amountCents?: number }>;
  readiness?: number;
  updatedAt?: string;
};

const gates = [
  { label: "Higher Education", description: "University, college and study applications", href: "/candidate/routes" },
  { label: "TVET", description: "Technical and vocational training routes", href: "/candidate/routes" },
  { label: "SETA / Learnership", description: "Workplace learning and learnership opportunities", href: "/candidate/routes" },
  { label: "Internship", description: "Graduate and workplace experience routes", href: "/candidate/routes" },
  { label: "Apprenticeship", description: "Trade and artisan development routes", href: "/candidate/routes" },
  { label: "Employment", description: "Jobs and managed application preparation", href: "/personal-job-desk/opportunity-scout" },
];

const links = [
  { title: "Readiness & next actions", description: "See profile, document, application and follow-up gaps in one checklist.", href: "/candidate/readiness", mark: "00" },
  { title: "Vacancy requirements review", description: "Record vacancy-specific document and eligibility requirements before preparing a pack.", href: "/candidate/requirements", mark: "00A" },
  { title: "My profile", description: "Review the details used in application packs.", href: "/candidate/profile", mark: "01" },
  { title: "Document vault", description: "Keep your CV, ID and certificates organised.", href: "/candidate/documents", mark: "02" },
  { title: "Application workbench", description: "Review routes, opportunities and next steps.", href: "/candidate/workbench", mark: "03" },
  { title: "Finance", description: "View service package and recorded finance status.", href: "/candidate/finance", mark: "04" },
  { title: "Messages", description: "View tracked communication and updates.", href: "/candidate/messages", mark: "05" },
  { title: "Support centre", description: "Find help for blockers or time-sensitive issues.", href: "/candidate/support", mark: "06" },
];

function countLabel(value: number, singular: string, plural = singular + "s") {
  return `${value} ${value === 1 ? singular : plural}`;
}

function formatDate(value?: string) {
  if (!value) return "No deadline set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium" }).format(date);
}

export default function CandidateDashboardPage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadWorkspace = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/personal-jobs/apply-now", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Please sign in to view your private candidate workspace.");
        }
        throw new Error(typeof payload.error === "string" ? payload.error : "Your workspace could not be loaded. Please try again.");
      }
      if (!payload || typeof payload !== "object" || !Array.isArray(payload.documents) || !Array.isArray(payload.opportunities)) {
        throw new Error("The workspace returned an unexpected response. Your saved information has not been changed.");
      }
      setWorkspace(payload as Workspace);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Your workspace could not be loaded.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void loadWorkspace(); }, [loadWorkspace]);

  const profile = workspace?.profile ?? {};
  const documents = workspace?.documents ?? [];
  const opportunities = workspace?.opportunities ?? [];
  const tasks = workspace?.tasks ?? [];
  const openTasks = useMemo(() => tasks.filter((task) => String(task.status).toUpperCase() !== "DONE")
    .sort((a, b) => {
      const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      return aDate - bDate;
    }).slice(0, 4), [tasks]);
  const readiness = Math.max(0, Math.min(100, Number(workspace?.readiness ?? 0)));
  const hasCv = documents.some((document) => String(document.type).toUpperCase() === "CV");
  const hasId = documents.some((document) => String(document.type).toUpperCase() === "ID");
  const profileComplete = Boolean(profile.fullName && profile.phone && profile.email);
  const checklist = [
    { label: "Complete contact profile", done: profileComplete, href: "/candidate/profile" },
    { label: "Add a CV", done: hasCv, href: "/candidate/documents" },
    { label: "Add identity document", done: hasId, href: "/candidate/documents" },
    { label: "Save an opportunity", done: opportunities.length > 0, href: "/personal-job-desk/opportunity-scout" },
    { label: "Prepare an application pack", done: (workspace?.applicationPacks?.length ?? 0) > 0, href: "/candidate/workbench" },
    { label: "Record application evidence", done: (workspace?.proofLog?.length ?? 0) > 0, href: "/candidate/workbench" },
  ];
  const doneCount = checklist.filter((item) => item.done).length;

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 20px 64px", color: "#172033" }}>
      <section style={{ borderRadius: 24, padding: "clamp(24px, 5vw, 48px)", background: "linear-gradient(125deg, #111827, #243b53)", color: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
          <div style={{ maxWidth: 690 }}>
            <p style={{ letterSpacing: 2, fontSize: 12, fontWeight: 800, margin: "0 0 12px", color: "#b8d8e8" }}>KINGSMEN · CANDIDATE PORTAL</p>
            <h1 style={{ fontSize: "clamp(30px, 5vw, 46px)", lineHeight: 1.08, margin: "0 0 14px" }}>
              {profile.fullName ? `Welcome back, ${profile.fullName.split(/\s+/)[0]}.` : "Your next step starts here."}
            </h1>
            <p style={{ maxWidth: 640, lineHeight: 1.7, margin: 0, color: "#e1e9f0" }}>
              One place to manage your profile, documents, opportunities, application preparation, finance visibility and support.
            </p>
          </div>
          <button type="button" onClick={() => void loadWorkspace(true)} disabled={loading || refreshing} style={{ border: "1px solid #ffffff70", background: "#ffffff12", color: "#fff", borderRadius: 12, padding: "11px 16px", fontWeight: 700, cursor: "pointer" }}>
            {refreshing ? "Refreshing…" : "Refresh workspace"}
          </button>
        </div>
        {error && <div role="alert" style={{ marginTop: 24, background: "#fff1f0", color: "#8a1c13", borderRadius: 12, padding: 16 }}>
          <strong>Workspace unavailable.</strong> <span>{error}</span>
          <div><button type="button" onClick={() => void loadWorkspace(true)} style={{ marginTop: 10, border: 0, borderRadius: 8, padding: "8px 12px", fontWeight: 700, cursor: "pointer" }}>Try again</button></div>
        </div>}
        {loading && <p role="status" style={{ margin: "24px 0 0", color: "#e1e9f0" }}>Loading your private workspace…</p>}
        {!loading && !error && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginTop: 28 }}>
          {[
            [String(readiness) + "%", "Workspace readiness"],
            [String(opportunities.length), "Opportunities saved"],
            [String(documents.length), "Documents"],
            [String(openTasks.length), "Open next actions"],
          ].map(([value, label]) => <div key={label} style={{ border: "1px solid #ffffff28", background: "#ffffff0d", borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 29, fontWeight: 800 }}>{value}</div><div style={{ color: "#d5e0e9", fontSize: 13, marginTop: 4 }}>{label}</div>
          </div>)}
        </div>}
      </section>

      <section aria-label="Candidate workspace modules" style={{ marginTop: 30 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "end", flexWrap: "wrap", marginBottom: 14 }}>
          <div><p style={{ color: "#53657a", letterSpacing: 1.5, fontSize: 11, fontWeight: 800, margin: "0 0 6px" }}>YOUR PORTAL</p><h2 style={{ fontSize: 25, margin: 0 }}>Workspace modules</h2></div>
          <span style={{ fontSize: 13, color: "#53657a" }}>Choose a module to continue</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(235px, 1fr))", gap: 14 }}>
          {links.map((item) => <a key={item.href} href={item.href} style={{ textDecoration: "none", color: "inherit", border: "1px solid #dbe3ec", borderRadius: 16, padding: 20, background: "#fff", display: "block" }}>
            <div style={{ color: "#58718a", fontSize: 12, fontWeight: 800, letterSpacing: 1.2 }}>{item.mark}</div>
            <h3 style={{ margin: "12px 0 7px", fontSize: 18 }}>{item.title}</h3>
            <p style={{ margin: 0, lineHeight: 1.6, fontSize: 14, color: "#53657a" }}>{item.description}</p>
            <div style={{ marginTop: 16, fontWeight: 800, fontSize: 13, color: "#1d5675" }}>Open module →</div>
          </a>)}
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 18, marginTop: 30 }}>
        <section aria-label="Readiness checklist" style={{ border: "1px solid #dbe3ec", borderRadius: 18, padding: 22, background: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <h2 style={{ fontSize: 20, margin: 0 }}>Readiness checklist</h2><strong>{doneCount}/{checklist.length}</strong>
          </div>
          <div style={{ height: 7, borderRadius: 99, background: "#e7edf3", margin: "15px 0 18px", overflow: "hidden" }}><div style={{ height: "100%", width: `${(doneCount / checklist.length) * 100}%`, background: "#28785f", transition: "width .2s" }} /></div>
          <div style={{ display: "grid", gap: 13 }}>
            {checklist.map((item) => <a key={item.label} href={item.href} style={{ display: "flex", gap: 10, alignItems: "center", color: "inherit", textDecoration: "none" }}>
              <span aria-label={item.done ? "Complete" : "Needs attention"} style={{ width: 22, height: 22, borderRadius: "50%", flex: "0 0 22px", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 800, background: item.done ? "#d8f2e6" : "#edf1f5", color: item.done ? "#176345" : "#617286" }}>{item.done ? "✓" : "·"}</span>
              <span style={{ flex: 1, fontSize: 14 }}>{item.label}</span><span style={{ fontSize: 12, color: "#53657a" }}>{item.done ? "Done" : "Complete →"}</span>
            </a>)}
          </div>
        </section>

        <section aria-label="Next actions" style={{ border: "1px solid #dbe3ec", borderRadius: 18, padding: 22, background: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <h2 style={{ fontSize: 20, margin: 0 }}>Next actions</h2><a href="/candidate/workbench" style={{ fontSize: 13, fontWeight: 800, color: "#1d5675" }}>Workbench →</a>
          </div>
          {loading ? <p>Loading actions…</p> : openTasks.length ? <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {openTasks.map((task, index) => <article key={task.taskId ?? `${task.title}-${index}`} style={{ borderLeft: "3px solid #7b9bb4", padding: "3px 0 3px 12px" }}>
              <h3 style={{ fontSize: 15, margin: "0 0 5px" }}>{task.title || "Follow-up task"}</h3>
              <p style={{ margin: 0, color: "#53657a", fontSize: 13 }}>{formatDate(task.dueDate)} · {task.priority || "Normal"} priority</p>
            </article>)}
          </div> : <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: "#f5f8fb" }}>
            <strong>No open tasks recorded.</strong><p style={{ margin: "7px 0 12px", fontSize: 14, lineHeight: 1.5, color: "#53657a" }}>Start by completing your profile and adding your current documents.</p><a href="/candidate/profile" style={{ fontWeight: 800, color: "#1d5675" }}>Complete profile →</a>
          </div>}
        </section>
      </div>

      <section aria-label="Six pathway gates" style={{ marginTop: 30 }}>
        <p style={{ color: "#53657a", letterSpacing: 1.5, fontSize: 11, fontWeight: 800, margin: "0 0 6px" }}>PATHWAYS</p>
        <h2 style={{ fontSize: 25, margin: "0 0 14px" }}>Six opportunity gates</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
          {gates.map((gate, index) => <a key={gate.label} href={gate.href} style={{ border: "1px solid #dbe3ec", borderRadius: 14, padding: 17, color: "inherit", textDecoration: "none", background: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}><h3 style={{ margin: 0, fontSize: 16 }}>{gate.label}</h3><span style={{ color: "#64788b", fontSize: 12, fontWeight: 800 }}>0{index + 1}</span></div>
            <p style={{ fontSize: 13, lineHeight: 1.5, color: "#53657a", margin: "10px 0 0" }}>{gate.description}</p>
          </a>)}
        </div>
      </section>

      <p style={{ marginTop: 28, padding: 16, borderRadius: 12, background: "#f1f5f9", color: "#53657a", fontSize: 13, lineHeight: 1.6 }}>
        <strong>Important:</strong> This dashboard displays the signed-in candidate's workspace only. Readiness is a checklist indicator, not a verified outcome. Kingsmen does not guarantee admission, funding, placement, employment or acceptance; source verification and submission confirmation require authorised review.
      </p>
    </main>
  );
}
