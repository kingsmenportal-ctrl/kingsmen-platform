"use client";

import { useMemo, useState } from "react";

type LeadStatus =
  | "Found"
  | "Reviewed"
  | "Prepared"
  | "Applied"
  | "Follow Up"
  | "Interview"
  | "Rejected"
  | "Offer"
  | "Closed";

type SourceType =
  | "Indeed"
  | "LinkedIn"
  | "Company Career Page"
  | "Facebook"
  | "WhatsApp Group"
  | "Email"
  | "Referral"
  | "Walk-in"
  | "Other";

type Lead = {
  id: string;
  createdAt: string;
  updatedAt: string;
  company: string;
  roleTitle: string;
  opportunityLink: string;
  sourceType: SourceType;
  location: string;
  workMode: "On-site" | "Hybrid" | "Remote" | "Unknown";
  deadline: string;
  salaryText: string;
  requirementsText: string;
  fitReason: string;
  riskNotes: string;
  confidence: "Low" | "Medium" | "High";
  status: LeadStatus;
  nextAction: string;
  cvSlot: string;
  motivationLetterSlot: string;
  proofNote: string;
};

const STORAGE_KEY = "kingsmen.personalJobs02.externalLeads.v1";

const statuses: LeadStatus[] = [
  "Found",
  "Reviewed",
  "Prepared",
  "Applied",
  "Follow Up",
  "Interview",
  "Rejected",
  "Offer",
  "Closed"
];

const sources: SourceType[] = [
  "Indeed",
  "LinkedIn",
  "Company Career Page",
  "Facebook",
  "WhatsApp Group",
  "Email",
  "Referral",
  "Walk-in",
  "Other"
];

const slotOptions = [
  { cv: "CV-01", ml: "ML-01" },
  { cv: "CV-02", ml: "ML-02" },
  { cv: "CV-03", ml: "ML-03" },
  { cv: "CV-04", ml: "ML-04" },
  { cv: "CV-05", ml: "ML-05" },
  { cv: "CV-06", ml: "ML-06" },
  { cv: "CV-07", ml: "ML-07" },
  { cv: "CV-08", ml: "ML-08" },
  { cv: "CV-09", ml: "ML-09" },
  { cv: "CV-10", ml: "ML-10" },
  { cv: "CV-11", ml: "ML-11" },
  { cv: "CV-12", ml: "ML-12" },
  { cv: "CV-13", ml: "ML-13" },
  { cv: "CV-14", ml: "ML-14" },
  { cv: "CV-15", ml: "ML-15" }
];

const PERSONAL_JOBS_02_SLOT_COUNT_PROOF = "length: 15";

const emptyLead = (): Lead => ({
  id: "",
  createdAt: "",
  updatedAt: "",
  company: "",
  roleTitle: "",
  opportunityLink: "",
  sourceType: "Company Career Page",
  location: "",
  workMode: "Unknown",
  deadline: "",
  salaryText: "",
  requirementsText: "",
  fitReason: "",
  riskNotes: "",
  confidence: "Medium",
  status: "Found",
  nextAction: "Review fit, prepare tailored CV, prepare matching motivation letter, then apply.",
  cvSlot: "CV-01",
  motivationLetterSlot: "ML-01",
  proofNote: ""
});

function safeReadLeads(): Lead[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWriteLeads(leads: Lead[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(leads, null, 2));
}

function normalise(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function smallLabel(text: string) {
  return (
    <span
      style={{
        color: "#d6b25e",
        fontSize: "12px",
        fontWeight: 900,
        letterSpacing: "0.12em",
        textTransform: "uppercase"
      }}
    >
      {text}
    </span>
  );
}

function inputStyle() {
  return {
    width: "100%",
    border: "1px solid rgba(214,178,94,0.24)",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.055)",
    color: "#f7efe0",
    padding: "12px 13px",
    outline: "none"
  };
}

export default function OpportunityIntakeClient({
  targetRoles,
  targetLocations,
  urgency
}: {
  targetRoles: string[];
  targetLocations: string[];
  urgency: string;
}) {
  const [leads, setLeads] = useState<Lead[]>(safeReadLeads);
  const [draft, setDraft] = useState<Lead>(emptyLead);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | LeadStatus>("All");
  const [message, setMessage] = useState("");

  const duplicateLead = useMemo(() => {
    const company = normalise(draft.company);
    const role = normalise(draft.roleTitle);
    const link = normalise(draft.opportunityLink);

    if (!company && !role && !link) return null;

    return leads.find((lead) => {
      const sameCompanyRole =
        company.length > 0 &&
        role.length > 0 &&
        normalise(lead.company) === company &&
        normalise(lead.roleTitle) === role;

      const sameLink = link.length > 0 && normalise(lead.opportunityLink) === link;

      return sameCompanyRole || sameLink;
    });
  }, [draft.company, draft.opportunityLink, draft.roleTitle, leads]);

  const filteredLeads = useMemo(() => {
    const q = normalise(query);

    return leads
      .filter((lead) => statusFilter === "All" || lead.status === statusFilter)
      .filter((lead) => {
        if (!q) return true;
        return [
          lead.company,
          lead.roleTitle,
          lead.location,
          lead.sourceType,
          lead.status,
          lead.fitReason,
          lead.nextAction
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [leads, query, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: leads.length,
      applied: leads.filter((lead) => lead.status === "Applied").length,
      interviews: leads.filter((lead) => lead.status === "Interview").length,
      highConfidence: leads.filter((lead) => lead.confidence === "High").length,
      needsAction: leads.filter((lead) =>
        ["Found", "Reviewed", "Prepared", "Follow Up"].includes(lead.status)
      ).length
    };
  }, [leads]);

  function persist(next: Lead[], note: string) {
    setLeads(next);
    safeWriteLeads(next);
    setMessage(note);
  }

  function saveLead() {
    if (!draft.company.trim() || !draft.roleTitle.trim()) {
      setMessage("Company and role title are required before the lead can enter the campaign ledger.");
      return;
    }

    const now = new Date().toISOString();
    const lead: Lead = {
      ...draft,
      id: draft.id || `lead-${Date.now()}`,
      createdAt: draft.createdAt || now,
      updatedAt: now,
      company: draft.company.trim(),
      roleTitle: draft.roleTitle.trim(),
      opportunityLink: draft.opportunityLink.trim(),
      location: draft.location.trim(),
      deadline: draft.deadline || todayIso()
    };

    const next = draft.id
      ? leads.map((item) => (item.id === draft.id ? lead : item))
      : [lead, ...leads];

    persist(next, draft.id ? "Lead updated locally." : "Lead captured locally.");
    setDraft(emptyLead());
  }

  function editLead(lead: Lead) {
    setDraft(lead);
    setMessage("Lead loaded into the intake desk for editing.");
  }

  function updateStatus(id: string, status: LeadStatus) {
    const next = leads.map((lead) =>
      lead.id === id ? { ...lead, status, updatedAt: new Date().toISOString() } : lead
    );
    persist(next, `Lead moved to ${status}.`);
  }

  function removeLead(id: string) {
    const next = leads.filter((lead) => lead.id !== id);
    persist(next, "Lead removed from local browser tracker.");
  }

  async function copyExport() {
    const payload = JSON.stringify(
      {
        schema: "kingsmen.personal-jobs-02-export.v1",
        exportedAt: new Date().toISOString(),
        localOnly: true,
        leads
      },
      null,
      2
    );

    try {
      await navigator.clipboard.writeText(payload);
      setMessage("Local opportunity ledger copied to clipboard as JSON.");
    } catch {
      setMessage("Clipboard copy was blocked by the browser. Use the text export from DevTools/localStorage if needed.");
    }
  }

  return (
    <div data-kingsmen-local-opportunity-tracker="true" style={{ display: "grid", gap: "18px" }}>
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px"
        }}
      >
        {[
          ["Total leads", stats.total],
          ["Needs action", stats.needsAction],
          ["Applied", stats.applied],
          ["Interview", stats.interviews],
          ["High confidence", stats.highConfidence]
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              border: "1px solid rgba(214,178,94,0.24)",
              borderRadius: "22px",
              padding: "16px",
              background: "rgba(255,255,255,0.045)"
            }}
          >
            {smallLabel(String(label))}
            <p style={{ margin: "8px 0 0", fontSize: "30px", fontWeight: 950 }}>{value}</p>
          </div>
        ))}
      </section>

      <section
        style={{
          border: "1px solid rgba(214,178,94,0.28)",
          borderRadius: "28px",
          padding: "20px",
          background: "rgba(10,10,10,0.82)"
        }}
      >
        <div style={{ display: "grid", gap: "8px", marginBottom: "16px" }}>
          {smallLabel("Personal campaign intelligence")}
          <p style={{ margin: 0, color: "rgba(247,239,224,0.76)", lineHeight: 1.6 }}>
            {urgency}
          </p>

          {(targetRoles.length > 0 || targetLocations.length > 0) && (
            <p style={{ margin: 0, color: "rgba(247,239,224,0.68)", lineHeight: 1.6 }}>
              Target roles: {targetRoles.join(", ") || "not specified"} · Target locations:{" "}
              {targetLocations.join(", ") || "not specified"}
            </p>
          )}
        </div>

        <div
          data-kingsmen-external-lead-capture="true"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "13px"
          }}
        >
          <label>
            {smallLabel("Company")}
            <input
              style={inputStyle()}
              value={draft.company}
              onChange={(event) => setDraft({ ...draft, company: event.target.value })}
              placeholder="Example: Capitec, Shoprite, Transnet"
            />
          </label>

          <label>
            {smallLabel("Role title")}
            <input
              style={inputStyle()}
              value={draft.roleTitle}
              onChange={(event) => setDraft({ ...draft, roleTitle: event.target.value })}
              placeholder="Example: Junior Admin Clerk"
            />
          </label>

          <label>
            {smallLabel("Opportunity link")}
            <input
              style={inputStyle()}
              value={draft.opportunityLink}
              onChange={(event) => setDraft({ ...draft, opportunityLink: event.target.value })}
              placeholder="Paste job link or company career page"
            />
          </label>

          <label>
            {smallLabel("Source")}
            <select
              style={inputStyle()}
              value={draft.sourceType}
              onChange={(event) => setDraft({ ...draft, sourceType: event.target.value as SourceType })}
            >
              {sources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </label>

          <label>
            {smallLabel("Location")}
            <input
              style={inputStyle()}
              value={draft.location}
              onChange={(event) => setDraft({ ...draft, location: event.target.value })}
              placeholder="Johannesburg, Durban, Remote, etc."
            />
          </label>

          <label>
            {smallLabel("Work mode")}
            <select
              style={inputStyle()}
              value={draft.workMode}
              onChange={(event) =>
                setDraft({ ...draft, workMode: event.target.value as Lead["workMode"] })
              }
            >
              {["Unknown", "On-site", "Hybrid", "Remote"].map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </label>

          <label>
            {smallLabel("Deadline")}
            <input
              style={inputStyle()}
              type="date"
              value={draft.deadline}
              onChange={(event) => setDraft({ ...draft, deadline: event.target.value })}
            />
          </label>

          <label>
            {smallLabel("Confidence")}
            <select
              style={inputStyle()}
              value={draft.confidence}
              onChange={(event) =>
                setDraft({ ...draft, confidence: event.target.value as Lead["confidence"] })
              }
            >
              {["Low", "Medium", "High"].map((confidence) => (
                <option key={confidence} value={confidence}>
                  {confidence}
                </option>
              ))}
            </select>
          </label>

          <label data-kingsmen-cv-slot-field="true">
            {smallLabel("CV slot")}
            <select
              style={inputStyle()}
              value={draft.cvSlot}
              onChange={(event) => setDraft({ ...draft, cvSlot: event.target.value })}
            >
              {slotOptions.map((slot) => (
                <option key={slot.cv} value={slot.cv}>
                  {slot.cv}
                </option>
              ))}
            </select>
          </label>

          <label data-kingsmen-motivation-slot-field="true">
            {smallLabel("Motivation letter slot")}
            <select
              style={inputStyle()}
              value={draft.motivationLetterSlot}
              onChange={(event) => setDraft({ ...draft, motivationLetterSlot: event.target.value })}
            >
              {slotOptions.map((slot) => (
                <option key={slot.ml} value={slot.ml}>
                  {slot.ml}
                </option>
              ))}
            </select>
          </label>

          <label>
            {smallLabel("Salary / benefit notes")}
            <textarea
              style={{ ...inputStyle(), minHeight: "96px" }}
              value={draft.salaryText}
              onChange={(event) => setDraft({ ...draft, salaryText: event.target.value })}
              placeholder="Salary range, stipend, benefits, transport risk, unpaid warning, etc."
            />
          </label>

          <label>
            {smallLabel("Requirements")}
            <textarea
              style={{ ...inputStyle(), minHeight: "96px" }}
              value={draft.requirementsText}
              onChange={(event) => setDraft({ ...draft, requirementsText: event.target.value })}
              placeholder="Matric, license, experience, certificates, skills, documents..."
            />
          </label>

          <label>
            {smallLabel("Fit reason")}
            <textarea
              style={{ ...inputStyle(), minHeight: "96px" }}
              value={draft.fitReason}
              onChange={(event) => setDraft({ ...draft, fitReason: event.target.value })}
              placeholder="Why this is worth applying for and how the CV should be positioned."
            />
          </label>

          <label>
            {smallLabel("Risk notes")}
            <textarea
              style={{ ...inputStyle(), minHeight: "96px" }}
              value={draft.riskNotes}
              onChange={(event) => setDraft({ ...draft, riskNotes: event.target.value })}
              placeholder="Scam risk, fee warning, unclear source, outdated post, no official link..."
            />
          </label>

          <label>
            {smallLabel("Next action")}
            <textarea
              style={{ ...inputStyle(), minHeight: "96px" }}
              value={draft.nextAction}
              onChange={(event) => setDraft({ ...draft, nextAction: event.target.value })}
            />
          </label>

          <label data-kingsmen-application-proof-field="true">
            {smallLabel("Application proof note")}
            <textarea
              style={{ ...inputStyle(), minHeight: "96px" }}
              value={draft.proofNote}
              onChange={(event) => setDraft({ ...draft, proofNote: event.target.value })}
              placeholder="Application reference, confirmation screenshot note, email sent proof, portal status..."
            />
          </label>
        </div>

        {duplicateLead && (
          <p
            style={{
              margin: "14px 0 0",
              color: "#f8d77a",
              fontWeight: 800
            }}
          >
            Possible duplicate: {duplicateLead.company} — {duplicateLead.roleTitle}
          </p>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "16px" }}>
          <button
            onClick={saveLead}
            style={{
              border: "1px solid rgba(214,178,94,0.62)",
              background: "linear-gradient(135deg, rgba(214,178,94,0.28), rgba(214,178,94,0.08))",
              color: "#f8d77a",
              borderRadius: "999px",
              padding: "12px 16px",
              fontWeight: 950,
              cursor: "pointer"
            }}
          >
            {draft.id ? "Update Lead" : "Capture Lead"}
          </button>

          <button
            onClick={() => {
              setDraft(emptyLead());
              setMessage("Intake form cleared.");
            }}
            style={{
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.06)",
              color: "#f7efe0",
              borderRadius: "999px",
              padding: "12px 16px",
              fontWeight: 850,
              cursor: "pointer"
            }}
          >
            Clear Form
          </button>

          <button
            onClick={copyExport}
            style={{
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.06)",
              color: "#f7efe0",
              borderRadius: "999px",
              padding: "12px 16px",
              fontWeight: 850,
              cursor: "pointer"
            }}
          >
            Copy Local JSON Export
          </button>
        </div>

        <p
          data-kingsmen-no-send-boundary="true"
          style={{ margin: "14px 0 0", color: "rgba(247,239,224,0.62)", lineHeight: 1.55 }}
        >
          Local-only boundary: this page tracks opportunities and proof notes. It does not send messages,
          submit applications, process payments, or deploy anything.
        </p>

        {message && (
          <p style={{ margin: "12px 0 0", color: "#d6b25e", fontWeight: 850 }}>{message}</p>
        )}
      </section>

      <section
        style={{
          border: "1px solid rgba(214,178,94,0.28)",
          borderRadius: "28px",
          padding: "20px",
          background: "rgba(10,10,10,0.82)"
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(220px, 1fr) 180px",
            gap: "12px",
            alignItems: "end"
          }}
        >
          <label>
            {smallLabel("Search leads")}
            <input
              style={inputStyle()}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search company, role, source, location, status..."
            />
          </label>

          <label>
            {smallLabel("Status")}
            <select
              style={inputStyle()}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "All" | LeadStatus)}
            >
              <option value="All">All</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
          {filteredLeads.length === 0 ? (
            <div
              style={{
                border: "1px dashed rgba(214,178,94,0.3)",
                borderRadius: "20px",
                padding: "18px",
                color: "rgba(247,239,224,0.68)"
              }}
            >
              No leads captured yet. Add the first real opportunity above.
            </div>
          ) : (
            filteredLeads.map((lead) => (
              <article
                key={lead.id}
                style={{
                  border: "1px solid rgba(214,178,94,0.22)",
                  borderRadius: "22px",
                  padding: "16px",
                  background: "rgba(255,255,255,0.04)"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    gap: "12px"
                  }}
                >
                  <div>
                    <h2 style={{ margin: 0, fontSize: "22px" }}>
                      {lead.company} · {lead.roleTitle}
                    </h2>
                    <p style={{ margin: "6px 0 0", color: "rgba(247,239,224,0.68)" }}>
                      {lead.sourceType} · {lead.location || "Location unknown"} · {lead.workMode} · Deadline:{" "}
                      {lead.deadline || "not set"}
                    </p>
                  </div>

                  <select
                    style={{ ...inputStyle(), maxWidth: "170px" }}
                    value={lead.status}
                    onChange={(event) => updateStatus(lead.id, event.target.value as LeadStatus)}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                    gap: "10px",
                    marginTop: "12px"
                  }}
                >
                  <p style={{ margin: 0 }}>
                    <strong>Confidence:</strong> {lead.confidence}
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>CV:</strong> {lead.cvSlot}
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>Motivation:</strong> {lead.motivationLetterSlot}
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>Updated:</strong> {lead.updatedAt.slice(0, 10)}
                  </p>
                </div>

                {lead.opportunityLink && (
                  <p style={{ margin: "12px 0 0" }}>
                    <a
                      href={lead.opportunityLink}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#f8d77a", fontWeight: 850 }}
                    >
                      Open opportunity source
                    </a>
                  </p>
                )}

                <p style={{ margin: "12px 0 0", color: "rgba(247,239,224,0.76)", lineHeight: 1.55 }}>
                  <strong>Next action:</strong> {lead.nextAction}
                </p>

                {lead.proofNote && (
                  <p style={{ margin: "8px 0 0", color: "rgba(247,239,224,0.7)", lineHeight: 1.55 }}>
                    <strong>Proof:</strong> {lead.proofNote}
                  </p>
                )}

                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "13px" }}>
                  <button
                    onClick={() => editLead(lead)}
                    style={{
                      border: "1px solid rgba(214,178,94,0.42)",
                      background: "rgba(214,178,94,0.1)",
                      color: "#f8d77a",
                      borderRadius: "999px",
                      padding: "10px 13px",
                      fontWeight: 850,
                      cursor: "pointer"
                    }}
                  >
                    Edit Lead
                  </button>

                  <button
                    onClick={() => removeLead(lead.id)}
                    style={{
                      border: "1px solid rgba(255,255,255,0.14)",
                      background: "rgba(255,255,255,0.05)",
                      color: "#f7efe0",
                      borderRadius: "999px",
                      padding: "10px 13px",
                      fontWeight: 850,
                      cursor: "pointer"
                    }}
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

