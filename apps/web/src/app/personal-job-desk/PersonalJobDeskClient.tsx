"use client";

import { useEffect, useMemo, useState } from "react";

export type PersonalCandidateProfile = {
  schema: string;
  privacy: string;
  candidate: {
    displayName: string;
    headline: string;
    location: string;
    contact: {
      phone: string;
      email: string;
      license: string;
      mobility: string;
    };
    targetRoles: string[];
    sectors: string[];
    strengths: string[];
    experienceHighlights: string[];
    education: string[];
    proofPoints: Array<{ label: string; value: string }>;
    cvCampaignRules: string[];
    applicationRules: string[];
  };
};

type OpportunityStatus =
  | "Lead Captured"
  | "Source Check"
  | "CV Tailoring"
  | "Ready To Apply"
  | "Applied"
  | "Follow-Up"
  | "Interview"
  | "Closed";

type Opportunity = {
  id: string;
  company: string;
  role: string;
  location: string;
  source: string;
  status: OpportunityStatus;
  priority: "High" | "Medium" | "Low";
  nextAction: string;
  notes: string;
  createdAt: string;
};

const statusOrder: OpportunityStatus[] = [
  "Lead Captured",
  "Source Check",
  "CV Tailoring",
  "Ready To Apply",
  "Applied",
  "Follow-Up",
  "Interview",
  "Closed"
];

const storageKey = "kingsmen.personal-jobs-01.opportunities.v1";

function makeId() {
  return `pj-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function PersonalJobDeskClient({ profile }: { profile: PersonalCandidateProfile }) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selectedRole, setSelectedRole] = useState(profile.candidate.targetRoles[0] ?? "Retail Operations");
  const [form, setForm] = useState({
    company: "",
    role: "",
    location: "",
    source: "",
    priority: "High" as "High" | "Medium" | "Low",
    nextAction: "Verify source, tailor CV, prepare motivation letter, then apply.",
    notes: ""
  });

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) setOpportunities(JSON.parse(saved));
    } catch {
      setOpportunities([]);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(opportunities));
    } catch {
      // local-only desk; ignore storage failure
    }
  }, [opportunities]);

  const cvSlots = useMemo(() => {
    const roles = profile.candidate.targetRoles.length > 0 ? profile.candidate.targetRoles : [selectedRole];
    return Array.from({ length: 15 }, (_, index) => {
      const role = roles[index % roles.length];
      return {
        slot: index + 1,
        role,
        purpose:
          index < 5
            ? "Immediate applications"
            : index < 10
              ? "Second wave and sector expansion"
              : "Specialised opportunity matching"
      };
    });
  }, [profile.candidate.targetRoles, selectedRole]);

  const campaignBrief = useMemo(() => {
    const proof = profile.candidate.proofPoints.map((item) => `${item.label}: ${item.value}`).join("; ");
    return [
      `Candidate: ${profile.candidate.displayName}`,
      `Positioning: ${profile.candidate.headline}`,
      `Location: ${profile.candidate.location}`,
      `Target role: ${selectedRole}`,
      `Primary sectors: ${profile.candidate.sectors.join(", ")}`,
      `Proof to emphasise: ${proof}`,
      "CV instruction: truthful, ATS-ready, South African, tailored to the exact vacancy.",
      "Motivation letter instruction: speak directly to the company, the role, the candidate proof, and readiness to perform."
    ].join("\n");
  }, [profile, selectedRole]);

  function addOpportunity() {
    if (!form.company.trim() || !form.role.trim()) return;

    const next: Opportunity = {
      id: makeId(),
      company: form.company.trim(),
      role: form.role.trim(),
      location: form.location.trim() || "To verify",
      source: form.source.trim() || "Candidate heard/found externally",
      status: "Lead Captured",
      priority: form.priority,
      nextAction: form.nextAction.trim() || "Verify source and tailor application pack.",
      notes: form.notes.trim(),
      createdAt: today()
    };

    setOpportunities((items) => [next, ...items]);
    setForm({
      company: "",
      role: "",
      location: "",
      source: "",
      priority: "High",
      nextAction: "Verify source, tailor CV, prepare motivation letter, then apply.",
      notes: ""
    });
  }

  function advanceOpportunity(id: string) {
    setOpportunities((items) =>
      items.map((item) => {
        if (item.id !== id) return item;
        const currentIndex = statusOrder.indexOf(item.status);
        const nextStatus = statusOrder[Math.min(currentIndex + 1, statusOrder.length - 1)];
        return { ...item, status: nextStatus };
      })
    );
  }

  function removeOpportunity(id: string) {
    setOpportunities((items) => items.filter((item) => item.id !== id));
  }

  return (
    <main data-kingsmen-personal-jobs-desk="true" className="pj-shell">
      <section className="pj-hero">
        <div>
          <p className="pj-kicker">KINGSMEN PERSONAL-JOBS-01</p>
          <h1>Personal Job Desk</h1>
          <p className="pj-subtitle">
            A local-first campaign room for turning your current retail operations profile into targeted,
            trackable job applications without mixing this work into unfinished Kingsmen batches.
          </p>
          <div className="pj-badges">
            <span data-kingsmen-local-only="true">Local only</span>
            <span>No Docker</span>
            <span>No Oracle claim</span>
            <span>No payment flow</span>
            <span>No email sending</span>
          </div>
        </div>

        <aside className="pj-card pj-candidate-card">
          <p className="pj-kicker">Candidate profile</p>
          <h2>{profile.candidate.displayName}</h2>
          <p>{profile.candidate.headline}</p>
          <p>{profile.candidate.location}</p>
          <p>{profile.candidate.contact.license}</p>
          <p>{profile.candidate.contact.mobility}</p>
          <div className="pj-contact">
            <span>{profile.candidate.contact.phone}</span>
            <span>{profile.candidate.contact.email}</span>
          </div>
        </aside>
      </section>

      <section className="pj-grid">
        <article className="pj-card">
          <p className="pj-kicker">Campaign direction</p>
          <h2>Choose today&apos;s target role</h2>
          <select value={selectedRole} onChange={(event) => setSelectedRole(event.target.value)}>
            {profile.candidate.targetRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <pre className="pj-brief">{campaignBrief}</pre>
        </article>

        <article className="pj-card">
          <p className="pj-kicker">Proof bank</p>
          <h2>Numbers to carry into applications</h2>
          <div className="pj-proof-grid">
            {profile.candidate.proofPoints.map((item) => (
              <div key={item.label} className="pj-proof">
                <strong>{item.label}</strong>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="pj-card">
        <p className="pj-kicker">Opportunity capture</p>
        <h2>Add a job you heard about outside Kingsmen</h2>
        <div className="pj-form" data-kingsmen-add-opportunity="true">
          <input
            value={form.company}
            onChange={(event) => setForm({ ...form, company: event.target.value })}
            placeholder="Company or employer name"
          />
          <input
            value={form.role}
            onChange={(event) => setForm({ ...form, role: event.target.value })}
            placeholder="Role or opportunity title"
          />
          <input
            value={form.location}
            onChange={(event) => setForm({ ...form, location: event.target.value })}
            placeholder="Location"
          />
          <input
            value={form.source}
            onChange={(event) => setForm({ ...form, source: event.target.value })}
            placeholder="Where you found/heard it"
          />
          <select
            value={form.priority}
            onChange={(event) => setForm({ ...form, priority: event.target.value as "High" | "Medium" | "Low" })}
          >
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
          <textarea
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
            placeholder="Requirements, closing date, contact person, salary signal, documents needed, or anything you know"
          />
          <button type="button" onClick={addOpportunity}>
            Add opportunity to campaign
          </button>
        </div>
      </section>

      <section className="pj-card">
        <p className="pj-kicker">Application board</p>
        <h2>Tracked opportunities</h2>
        {opportunities.length === 0 ? (
          <p className="pj-empty">
            No applications have been added yet. Start by capturing one real vacancy, company lead, WhatsApp post,
            referral, career portal role, Indeed result, LinkedIn post, Shoprite vacancy, hospitality role, or retail
            management opportunity.
          </p>
        ) : (
          <div className="pj-board">
            {opportunities.map((item) => (
              <article key={item.id} className="pj-opportunity">
                <div>
                  <p className="pj-kicker">{item.status}</p>
                  <h3>{item.role}</h3>
                  <p>{item.company}</p>
                  <p>{item.location}</p>
                  <p>Source: {item.source}</p>
                  <p>Priority: {item.priority}</p>
                  {item.notes ? <p>Notes: {item.notes}</p> : null}
                </div>
                <div className="pj-actions">
                  <button type="button" onClick={() => advanceOpportunity(item.id)}>
                    Move next
                  </button>
                  <button type="button" onClick={() => removeOpportunity(item.id)}>
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="pj-card">
        <p className="pj-kicker">CV & Motivation Atelier</p>
        <h2>15 tailored CV versions and matching motivation letters</h2>
        <div className="pj-slots">
          {cvSlots.map((slot) => (
            <div key={slot.slot} className="pj-slot">
              <strong>CV {String(slot.slot).padStart(2, "0")}</strong>
              <span>{slot.role}</span>
              <small>{slot.purpose}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="pj-grid">
        <article className="pj-card">
          <p className="pj-kicker">Strengths</p>
          <h2>Profile positioning</h2>
          <ul>
            {profile.candidate.strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="pj-card">
          <p className="pj-kicker">Rules</p>
          <h2>Safe application discipline</h2>
          <ul>
            {profile.candidate.applicationRules.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <style>{`
        .pj-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(214,178,94,0.18), transparent 34rem),
            linear-gradient(135deg, #050505, #11100d 48%, #050505);
          color: #f7ead0;
          padding: 34px;
          font-family: Georgia, "Times New Roman", serif;
        }

        .pj-hero {
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.6fr);
          gap: 22px;
          align-items: stretch;
          margin-bottom: 22px;
        }

        .pj-kicker {
          color: #d6b25e;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          margin: 0 0 10px;
        }

        h1 {
          font-size: clamp(42px, 8vw, 86px);
          line-height: 0.92;
          margin: 0 0 18px;
          letter-spacing: -0.06em;
        }

        h2 {
          margin: 0 0 14px;
          font-size: 26px;
          letter-spacing: -0.02em;
        }

        h3 {
          margin: 0 0 8px;
          font-size: 20px;
        }

        p, li, span, small, input, textarea, select, button {
          font-family: Inter, Arial, sans-serif;
        }

        .pj-subtitle {
          max-width: 820px;
          font-size: 18px;
          line-height: 1.7;
          color: rgba(247,234,208,0.82);
        }

        .pj-badges,
        .pj-contact {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 18px;
        }

        .pj-badges span,
        .pj-contact span {
          border: 1px solid rgba(214,178,94,0.36);
          background: rgba(214,178,94,0.09);
          color: #f8d77a;
          border-radius: 999px;
          padding: 9px 12px;
          font-weight: 800;
          font-size: 12px;
        }

        .pj-card {
          border: 1px solid rgba(214,178,94,0.28);
          background: rgba(12, 12, 10, 0.84);
          box-shadow: 0 24px 80px rgba(0,0,0,0.35);
          border-radius: 26px;
          padding: 24px;
          margin-bottom: 22px;
        }

        .pj-candidate-card p {
          color: rgba(247,234,208,0.8);
          line-height: 1.5;
        }

        .pj-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 22px;
        }

        select, input, textarea {
          width: 100%;
          border: 1px solid rgba(214,178,94,0.25);
          border-radius: 16px;
          background: rgba(255,255,255,0.06);
          color: #f7ead0;
          padding: 13px 14px;
          outline: none;
        }

        textarea {
          min-height: 96px;
          resize: vertical;
        }

        button {
          border: 0;
          border-radius: 999px;
          padding: 13px 18px;
          background: linear-gradient(135deg, #d6b25e, #f5d37d);
          color: #17120a;
          font-weight: 950;
          cursor: pointer;
        }

        .pj-brief {
          white-space: pre-wrap;
          margin-top: 14px;
          border: 1px solid rgba(214,178,94,0.18);
          border-radius: 18px;
          padding: 16px;
          background: rgba(0,0,0,0.28);
          color: rgba(247,234,208,0.86);
          line-height: 1.55;
          overflow-x: auto;
        }

        .pj-proof-grid,
        .pj-slots,
        .pj-board {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px;
        }

        .pj-proof,
        .pj-slot,
        .pj-opportunity {
          border: 1px solid rgba(214,178,94,0.18);
          border-radius: 20px;
          background: rgba(255,255,255,0.045);
          padding: 16px;
        }

        .pj-proof strong,
        .pj-slot strong {
          display: block;
          color: #f8d77a;
          margin-bottom: 8px;
        }

        .pj-proof span,
        .pj-slot span,
        .pj-slot small,
        .pj-opportunity p,
        .pj-empty,
        li {
          color: rgba(247,234,208,0.78);
          line-height: 1.55;
        }

        .pj-form {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .pj-form textarea,
        .pj-form button {
          grid-column: 1 / -1;
        }

        .pj-actions {
          display: flex;
          gap: 10px;
          margin-top: 14px;
        }

        .pj-actions button:last-child {
          background: rgba(255,255,255,0.08);
          color: #f7ead0;
          border: 1px solid rgba(214,178,94,0.25);
        }

        @media (max-width: 820px) {
          .pj-shell {
            padding: 18px;
          }

          .pj-hero,
          .pj-grid,
          .pj-form {
            grid-template-columns: 1fr;
          }

          h1 {
            font-size: 46px;
          }
        }
      `}</style>
    </main>
  );
}
