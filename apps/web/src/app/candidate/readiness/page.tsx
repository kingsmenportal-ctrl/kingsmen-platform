"use client";

import { useCallback, useEffect, useState } from "react";

type Profile = { fullName?: string; email?: string; phone?: string; location?: string; highestEducation?: string; skills?: string; workExperience?: string };
type DocumentRecord = { documentId?: string; type?: string; fileName?: string; status?: string };
type Opportunity = { opportunityId?: string; title?: string; organisation?: string; status?: string; sourceUrl?: string };
type Task = { taskId?: string; title?: string; dueDate?: string; status?: string; priority?: string };
type Workspace = {
  profile?: Profile;
  documents?: DocumentRecord[];
  opportunities?: Opportunity[];
  applicationPacks?: unknown[];
  proofLog?: unknown[];
  tasks?: Task[];
  supportRequests?: Array<{ status?: string; priority?: string }>;
  financeLedger?: Array<{ status?: string; type?: string; amountCents?: number }>;
  updatedAt?: string;
};
type Check = { title: string; detail: string; state: "READY" | "ACTION" | "REVIEW"; href: string; action: string };

function checklist(data: Workspace): Check[] {
  const profile = data.profile || {};
  const documents = Array.isArray(data.documents) ? data.documents : [];
  const opportunities = Array.isArray(data.opportunities) ? data.opportunities : [];
  const packs = Array.isArray(data.applicationPacks) ? data.applicationPacks : [];
  const proofs = Array.isArray(data.proofLog) ? data.proofLog : [];
  const tasks = Array.isArray(data.tasks) ? data.tasks : [];
  const openTasks = tasks.filter((task) => task.status !== "DONE");
  const openSupport = (data.supportRequests || []).filter((request) => !["RESOLVED", "CLOSED"].includes(String(request.status)));
  const profileReady = Boolean(profile.fullName?.trim() && profile.email?.trim() && profile.phone?.trim());
  const hasCv = documents.some((document) => String(document.type || "").toUpperCase() === "CV");
  const sourcedOpportunities = opportunities.filter((item) => typeof item.sourceUrl === "string" && /^https?:\/\//i.test(item.sourceUrl));
  const submittedStage = opportunities.filter((item) => ["APPLIED", "SUBMITTED", "APPLICATION_SUBMITTED"].includes(String(item.status || "").toUpperCase()));
  return [
    { title: "Core candidate profile", detail: profileReady ? "Name, email and phone are present." : "Add your name, valid email and phone number before preparing packs.", state: profileReady ? "READY" : "ACTION", href: "/candidate/profile", action: profileReady ? "Review profile" : "Complete profile" },
    { title: "CV in document vault", detail: hasCv ? "A document is labelled CV. File content and truthfulness are not independently verified." : "Upload your current CV in PDF, DOCX or TXT format.", state: hasCv ? "READY" : "ACTION", href: "/candidate/documents", action: hasCv ? "Review documents" : "Add CV" },
    { title: "Source-backed opportunities", detail: sourcedOpportunities.length ? `${sourcedOpportunities.length} saved opportunity(ies) include an HTTP(S) source link.` : "Save opportunities with an official source link and check closing dates yourself.", state: sourcedOpportunities.length ? "READY" : "ACTION", href: "/personal-job-desk/opportunity-scout", action: "Find opportunities" },
    { title: "Application preparation packs", detail: packs.length ? `${packs.length} pack(s) are available to review and download.` : "Generate a pack for an opportunity; review every detail before using it.", state: packs.length ? "READY" : "ACTION", href: "/candidate/workbench", action: "Prepare a pack" },
    { title: "Submission evidence", detail: proofs.length ? `${proofs.length} candidate-recorded proof record(s) exist; they are not independently verified.` : "After you actually submit through the official channel, record truthful evidence.", state: proofs.length ? "REVIEW" : "ACTION", href: "/candidate/workbench", action: proofs.length ? "Review evidence" : "Open workbench" },
    { title: "Follow-up discipline", detail: openTasks.length ? `${openTasks.length} follow-up task(s) remain open.` : "No open follow-up tasks are recorded.", state: openTasks.length ? "ACTION" : "READY", href: "/candidate/workbench", action: openTasks.length ? "Work open tasks" : "Manage follow-ups" },
    { title: "Support blockers", detail: openSupport.length ? `${openSupport.length} support request(s) are still open; check their current status.` : "No unresolved support requests are recorded.", state: openSupport.length ? "REVIEW" : "READY", href: "/candidate/support", action: openSupport.length ? "Review support" : "Open support centre" },
    { title: "Finance records", detail: (data.financeLedger || []).length ? "Finance entries exist. Check recorded statuses and evidence; this is not payment confirmation." : "No finance entries are recorded. Do not treat this as a balance or payment confirmation.", state: "REVIEW", href: "/candidate/finance", action: "Review finance" },
    { title: "Application-stage accuracy", detail: submittedStage.length ? `${submittedStage.length} opportunity(ies) are marked submitted/applied. Confirm you have real submission proof.` : "Do not mark an application submitted until you have actually submitted it.", state: submittedStage.length ? "REVIEW" : "READY", href: "/candidate/workbench", action: "Check application stages" },
  ];
}

export default function CandidateReadinessPage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/personal-jobs/apply-now", { credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "Sign in to review your private candidate readiness." : (typeof data.error === "string" ? data.error : "Readiness information could not be loaded."));
      if (!data || !Array.isArray(data.documents) || !Array.isArray(data.opportunities)) throw new Error("The workspace response was incomplete. No data was changed.");
      setWorkspace(data as Workspace);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Readiness information could not be loaded.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const checks = workspace ? checklist(workspace) : [];
  const ready = checks.filter((check) => check.state === "READY").length;
  const actions = checks.filter((check) => check.state === "ACTION").length;
  const review = checks.filter((check) => check.state === "REVIEW").length;
  const panel = { border: "1px solid #dbe3ec", borderRadius: 16, padding: 18, background: "#fff" };
  const button = { display: "inline-block", border: "1px solid #cbd5e1", borderRadius: 9, padding: "9px 12px", color: "#1d5675", background: "#fff", fontWeight: 800, textDecoration: "none", fontSize: 13 };

  return <main style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 20px 64px", color: "#172033" }}>
    <a href="/candidate/dashboard" style={{ color: "#1d5675", fontWeight: 800, textDecoration: "none", fontSize: 14 }}>← Candidate dashboard</a>
    <header style={{ margin: "22px 0 26px" }}>
      <p style={{ color: "#53657a", fontSize: 12, fontWeight: 800, letterSpacing: 1.8, margin: "0 0 8px" }}>CANDIDATE COMMAND CENTRE</p>
      <h1 style={{ fontSize: "clamp(30px, 5vw, 42px)", margin: "0 0 10px" }}>Readiness & Next Actions</h1>
      <p style={{ color: "#53657a", lineHeight: 1.7, maxWidth: 780, margin: 0 }}>One actionable view across your profile, documents, opportunities, packs, submission evidence, follow-ups, support and finance. This is a checklist from your saved workspace—not a qualification, eligibility, payment, document-verification or outcome guarantee.</p>
    </header>
    {error && <div role="alert" style={{ ...panel, marginBottom: 16, borderColor: "#fecaca", color: "#8a1c13", background: "#fff1f0" }}>{error}<button type="button" onClick={() => void load(true)} style={{ marginLeft: 12, border: 0, background: "transparent", color: "inherit", textDecoration: "underline", cursor: "pointer" }}>Retry</button></div>}
    {loading ? <p role="status">Loading your private readiness checklist…</p> : workspace ? <>
      <section aria-label="Readiness summary" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[[ready, "Ready / recorded"], [actions, "Actions to take"], [review, "Needs human review"]].map(([value, label]) => <div key={String(label)} style={panel}><div style={{ fontSize: 30, fontWeight: 850 }}>{value}</div><div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>{label}</div></div>)}
      </section>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>Checks are calculated from your saved records. Last workspace update: {workspace.updatedAt ? new Date(workspace.updatedAt).toLocaleString("en-ZA") : "not provided"}.</p>
        <button type="button" disabled={refreshing} onClick={() => void load(true)} style={{ ...button, cursor: refreshing ? "wait" : "pointer" }}>{refreshing ? "Refreshing…" : "Refresh checklist"}</button>
      </div>
      <section aria-label="Readiness checklist" style={{ display: "grid", gap: 12 }}>
        {checks.map((check, index) => <article key={check.title} style={{ ...panel, display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 16, alignItems: "center" }}>
          <div><div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 7 }}><span style={{ color: "#64748b", fontSize: 11, fontWeight: 850 }}>CHECK {String(index + 1).padStart(2, "0")}</span><span style={{ borderRadius: 99, padding: "4px 8px", fontSize: 10, fontWeight: 850, letterSpacing: .5, background: check.state === "READY" ? "#eaf8f0" : check.state === "ACTION" ? "#fff7e6" : "#eef2ff", color: check.state === "READY" ? "#176345" : check.state === "ACTION" ? "#854d0e" : "#3730a3" }}>{check.state === "READY" ? "READY / RECORDED" : check.state === "ACTION" ? "ACTION NEEDED" : "HUMAN REVIEW"}</span></div><h2 style={{ fontSize: 18, margin: "0 0 6px" }}>{check.title}</h2><p style={{ color: "#53657a", lineHeight: 1.6, fontSize: 14, margin: 0 }}>{check.detail}</p></div>
          <a href={check.href} style={button}>{check.action} →</a>
        </article>)}
      </section>
      <section style={{ ...panel, marginTop: 20, background: "#f8fafc" }}><h2 style={{ margin: "0 0 8px", fontSize: 18 }}>Safe-use rules</h2><ul style={{ color: "#53657a", lineHeight: 1.7, fontSize: 13, margin: 0, paddingLeft: 20 }}><li>A file labelled CV or ID is not thereby verified or authentic.</li><li>Only mark an application submitted after using the official channel; keep truthful evidence.</li><li>Finance entries are records, not proof that a payment settled or a refund was received.</li><li>Use official source links, independently check deadlines and eligibility, and never share passwords or one-time codes.</li></ul></section>
    </> : null}
  </main>;
}
