"use client";

import { useState, type CSSProperties, type FormEvent } from "react";

type RouteKey =
  | "higher_education"
  | "tvet_college"
  | "seta_learnership"
  | "internship_apprenticeship"
  | "employment"
  | "funding_support"
  | "unsure";

type ReadinessPreview = {
  heading: string;
  summary: string;
  context: string[];
  steps: string[];
  goal: string;
};

const pathways: Record<RouteKey, { title: string; summary: string; steps: string[] }> = {
  higher_education: {
    title: "Higher education",
    summary: "Start with official institution and programme information. Confirm the current admissions cycle and requirements before preparing an application.",
    steps: [
      "Identify official institution and programme pages and record the published application window.",
      "Check admission requirements, subject or qualification criteria, and any selection process.",
      "Prepare a private checklist of the supporting documents each institution requires."
    ]
  },
  tvet_college: {
    title: "TVET and college routes",
    summary: "Compare relevant campuses and programmes, then verify the current intake and requirements with the college itself.",
    steps: [
      "Identify the official college, campus, programme and current prospectus.",
      "Verify the intake period, entry requirements, fees and any funding options directly with the college.",
      "Prepare the required document checklist before starting an application."
    ]
  },
  seta_learnership: {
    title: "SETA programmes and learnerships",
    summary: "Focus on the real provider, eligibility rules and closing date. Do not rely on an unverified advert as proof that a programme is open.",
    steps: [
      "Identify the official SETA, employer or training provider behind the opportunity.",
      "Verify the application channel, eligibility rules, closing date and whether any cost is legitimate.",
      "Prepare a truthful CV and the supporting records specifically requested by the provider."
    ]
  },
  internship_apprenticeship: {
    title: "Internships and apprenticeships",
    summary: "Match your current qualifications and experience to a real employer or training-provider route.",
    steps: [
      "Identify the employer or training provider's official opportunity page.",
      "Check the required qualifications, work exposure, location and application deadline.",
      "Prepare a truthful CV and gather only the documents requested by the provider."
    ]
  },
  employment: {
    title: "Employment",
    summary: "Build a clear job-search route around verified vacancies, an accurate CV and a record of the source and deadline.",
    steps: [
      "Find the vacancy on the employer's own website or another verifiable source.",
      "Tailor your CV truthfully to the role and check the required application channel.",
      "Record the source, date checked and closing date so you can follow up accurately."
    ]
  },
  funding_support: {
    title: "Funding and support",
    summary: "Identify a suitable funder and confirm eligibility, covered costs and application dates directly with that funder.",
    steps: [
      "Identify the official funder and the study, training or work pathway it supports.",
      "Verify eligibility, covered costs, required supporting records and the closing date.",
      "Prepare a private checklist and keep a backup funding route where practical."
    ]
  },
  unsure: {
    title: "Route discovery",
    summary: "Compare realistic options before committing to one application path.",
    steps: [
      "Compare education, training, funding and employment routes against your qualifications and goals.",
      "Consider province, travel, affordability, entry requirements and the published application dates.",
      "Choose one first-choice route and at least one sensible alternative to investigate."
    ]
  }
};

const blockerGuidance: Record<string, string> = {
  unsure: "Compare two or three plausible routes against your qualifications, location, affordability and published deadlines.",
  documents: "Build a private document checklist using each institution or provider's current official requirements.",
  funding: "Check funding eligibility, covered costs and the closing date directly on the funder's official page.",
  cv: "Prepare a truthful, role-specific CV and check that all qualifications and experience are accurate.",
  deadlines: "Verify the latest deadline with the official provider; treat third-party lists as discovery aids, not final proof.",
  alternatives: "Choose at least one realistic alternative route and record its official requirements and dates."
};

const fieldStyle: CSSProperties = {
  width: "100%",
  minHeight: 46,
  padding: "11px 13px",
  borderRadius: 10,
  border: "1px solid #3b4960",
  background: "#0e1726",
  color: "#f4f1e8",
  font: "inherit"
};

const labelStyle: CSSProperties = {
  display: "grid",
  gap: 7,
  color: "#f4f1e8",
  fontSize: 13,
  fontWeight: 700
};

export default function FreeDestinyMapIntake() {
  const [stage, setStage] = useState("");
  const [province, setProvince] = useState("");
  const [route, setRoute] = useState<RouteKey | "">("");
  const [blocker, setBlocker] = useState("");
  const [goal, setGoal] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<ReadinessPreview | null>(null);

  function clearPreview() {
    setPreview(null);
    setError("");
  }

  function handlePreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPreview(null);

    if (!route) {
      setError("Choose the route you want to explore, or select “I am not sure yet”.");
      return;
    }

    if (!acknowledged) {
      setError("Confirm the browser-only preview notice before continuing.");
      return;
    }

    const pathway = pathways[route];
    const steps = [...pathway.steps];
    const extraGuidance = blockerGuidance[blocker];
    if (extraGuidance) steps.unshift(extraGuidance);

    setPreview({
      heading: pathway.title + " readiness plan",
      summary: pathway.summary,
      context: [
        "Current stage: " + (stage || "Not selected"),
        "Province: " + (province || "Not selected")
      ],
      steps: Array.from(new Set(steps)).slice(0, 4),
      goal: goal.trim()
    });
  }

  return (
    <form
      data-kingsmen-free-destiny-map-intake="true"
      data-kingsmen-browser-only="true"
      onSubmit={handlePreview}
      noValidate
      style={{
        display: "grid",
        gap: 16,
        padding: 22,
        borderRadius: 22,
        border: "1px solid #344158",
        background: "linear-gradient(150deg, #151f30, #0c1320)",
        boxShadow: "0 22px 70px rgba(0,0,0,0.28)"
      }}
    >
      <div style={{ display: "grid", gap: 5 }}>
        <h2 style={{ margin: 0, color: "#f4d58b", fontSize: 21 }}>Build your first readiness path</h2>
        <p style={{ margin: 0, color: "#aebbd0", fontSize: 13, lineHeight: 1.7 }}>
          Select a few broad details to receive an immediate planning checklist. You do not need to enter your name, contact details or identity number.
        </p>
      </div>

      <label htmlFor="current-stage" style={labelStyle}>
        Current stage
        <select id="current-stage" value={stage} onChange={(event) => { setStage(event.target.value); clearPreview(); }} style={fieldStyle}>
          <option value="">Choose your current stage</option>
          <option value="Grade 9–11">Grade 9–11</option>
          <option value="Grade 12 / Matric">Grade 12 / Matric</option>
          <option value="Matric completed">Matric completed</option>
          <option value="TVET / college student">TVET / college student</option>
          <option value="Unemployed and seeking opportunity">Unemployed and seeking opportunity</option>
          <option value="Working and seeking upgrade">Working and seeking upgrade</option>
        </select>
      </label>

      <label htmlFor="province" style={labelStyle}>
        Province
        <select id="province" value={province} onChange={(event) => { setProvince(event.target.value); clearPreview(); }} style={fieldStyle}>
          <option value="">Choose province</option>
          <option>Eastern Cape</option>
          <option>Free State</option>
          <option>Gauteng</option>
          <option>KwaZulu-Natal</option>
          <option>Limpopo</option>
          <option>Mpumalanga</option>
          <option>Northern Cape</option>
          <option>North West</option>
          <option>Western Cape</option>
        </select>
      </label>

      <label htmlFor="route-interest" style={labelStyle}>
        Route interest
        <select id="route-interest" value={route} onChange={(event) => { setRoute(event.target.value as RouteKey | ""); clearPreview(); }} style={fieldStyle}>
          <option value="">Choose route</option>
          <option value="higher_education">University / higher education</option>
          <option value="tvet_college">TVET college</option>
          <option value="seta_learnership">SETA / learnership</option>
          <option value="internship_apprenticeship">Internship / apprenticeship</option>
          <option value="employment">Employment / CV path</option>
          <option value="funding_support">Bursary / funding support</option>
          <option value="unsure">I am not sure yet</option>
        </select>
      </label>

      <label htmlFor="biggest-blocker" style={labelStyle}>
        Biggest blocker
        <select id="biggest-blocker" value={blocker} onChange={(event) => { setBlocker(event.target.value); clearPreview(); }} style={fieldStyle}>
          <option value="">Choose the main blocker (optional)</option>
          <option value="unsure">I do not know what to apply for</option>
          <option value="documents">I am missing documents</option>
          <option value="funding">I need funding guidance</option>
          <option value="cv">I need a better CV</option>
          <option value="deadlines">I am worried about deadlines</option>
          <option value="alternatives">I need backup options</option>
        </select>
      </label>

      <label htmlFor="readiness-goal" style={labelStyle}>
        Readiness goal (optional)
        <textarea
          id="readiness-goal"
          value={goal}
          onChange={(event) => { setGoal(event.target.value); clearPreview(); }}
          placeholder="What would you most like to clarify first?"
          rows={3}
          maxLength={600}
          style={{ ...fieldStyle, minHeight: 92, resize: "vertical" }}
        />
      </label>

      <label style={{ display: "flex", gap: 10, alignItems: "flex-start", color: "#c5cedc", fontSize: 12, lineHeight: 1.65 }}>
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(event) => { setAcknowledged(event.target.checked); clearPreview(); }}
          style={{ marginTop: 4, accentColor: "#e2bd6d" }}
        />
        <span>
          I understand this is a browser-only preview. These selections are not sent to Kingsmen or saved by this page, and this does not create an application, payment or provider submission.
        </span>
      </label>

      {error ? (
        <p role="alert" style={{ margin: 0, color: "#ffb5a9", fontSize: 13 }}>{error}</p>
      ) : null}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          type="submit"
          data-kingsmen-intake-button="preview-path"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 46,
            padding: "12px 18px",
            borderRadius: 10,
            border: "1px solid #f2d48a",
            background: "linear-gradient(135deg, #f2d48a, #c49a4a)",
            color: "#111827",
            fontWeight: 900,
            cursor: "pointer"
          }}
        >
          Preview my readiness path
        </button>
        <button
          type="button"
          onClick={() => {
            setStage("");
            setProvince("");
            setRoute("");
            setBlocker("");
            setGoal("");
            setAcknowledged(false);
            setError("");
            setPreview(null);
          }}
          style={{
            minHeight: 46,
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid #536078",
            background: "#101827",
            color: "#e6eaf1",
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          Clear preview
        </button>
      </div>

      {preview ? (
        <section
          data-kingsmen-preview-status="ready"
          aria-live="polite"
          aria-labelledby="readiness-preview-heading"
          style={{
            display: "grid",
            gap: 12,
            padding: 18,
            border: "1px solid #58706f",
            borderRadius: 16,
            background: "#0d1d25",
            color: "#f4f1e8"
          }}
        >
          <div>
            <p style={{ margin: "0 0 6px", color: "#8fe1c2", fontSize: 10, fontWeight: 900, letterSpacing: 1.8, textTransform: "uppercase" }}>
              Local preview · not a live match
            </p>
            <h3 id="readiness-preview-heading" style={{ margin: 0, fontSize: 20 }}>{preview.heading}</h3>
            <p style={{ margin: "8px 0 0", color: "#b8c7d4", fontSize: 13, lineHeight: 1.7 }}>{preview.summary}</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {preview.context.map((item) => (
              <span key={item} style={{ border: "1px solid #344a5c", borderRadius: 999, padding: "6px 9px", color: "#c8d4e1", fontSize: 11 }}>{item}</span>
            ))}
          </div>
          <ol data-kingsmen-preview-steps="true" style={{ margin: 0, paddingLeft: 22, display: "grid", gap: 9, color: "#e6eaf1", fontSize: 13, lineHeight: 1.65 }}>
            {preview.steps.map((step, index) => <li key={step}>{step}</li>)}
          </ol>
          {preview.goal ? (
            <p style={{ margin: 0, paddingTop: 10, borderTop: "1px solid #344a5c", color: "#c8d4e1", fontSize: 12, lineHeight: 1.65 }}>
              Your stated goal: {preview.goal}
            </p>
          ) : null}
          <p style={{ margin: 0, color: "#8fa5b6", fontSize: 11, lineHeight: 1.6 }}>
            Planning guidance only. Kingsmen has not verified a current opening, deadline, eligibility decision or application outcome. Check each item with its official provider before acting.
          </p>
        </section>
      ) : null}

      <p style={{ margin: 0, color: "#8fa0b7", fontSize: 11, lineHeight: 1.6 }}>
        Privacy boundary: this preview runs in your current browser session only. This component does not call an API, use browser storage or submit the form.
      </p>
    </form>
  );
}
