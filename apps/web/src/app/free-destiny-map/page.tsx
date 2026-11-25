"use client";

import { useRef, useState } from "react";


type ReadinessPreview = { title: string; summary: string; stage: string; province: string; goal: string; steps: string[] };

function buildReadinessPreview(route: string, blocker: string, stage: string, province: string, goal: string): ReadinessPreview {
  const choice = route.toLowerCase();
  let title = "Route discovery";
  let summary = "Compare realistic study, training, funding and employment options before committing to one route.";
  let steps = [
    "Compare education, training, funding and employment routes against your qualifications and goal.",
    "Check location, affordability, entry requirements and current dates with the official provider.",
    "Choose one preferred route and one practical alternative to investigate."
  ];
  if (choice.includes("university")) {
    title = "Higher education";
    summary = "Start with official institution and programme information; confirm the current admissions cycle before preparing an application.";
    steps = ["Find the official institution and programme page and verify its current application window.", "Check admission criteria, required subjects or qualifications, and selection rules.", "Prepare a private checklist of documents the institution currently requires."];
  } else if (choice.includes("tvet")) {
    title = "TVET and college routes";
    summary = "Identify a relevant programme and verify the current intake directly with the college.";
    steps = ["Identify the official college, campus, programme and latest prospectus.", "Verify the intake period, entry criteria, fees and funding options with the college.", "Prepare the required supporting-document checklist before applying."];
  } else if (choice.includes("seta") || choice.includes("learnership")) {
    title = "SETA programmes and learnerships";
    summary = "Verify the real training provider, eligibility conditions and closing date before relying on an advert.";
    steps = ["Identify the official SETA, employer or training provider behind the opportunity.", "Check eligibility, the application channel, the deadline and whether any fee is legitimate.", "Prepare a truthful CV and only the records requested by the provider."];
  } else if (choice.includes("internship") || choice.includes("apprenticeship")) {
    title = "Internships and apprenticeships";
    summary = "Match your qualifications and experience to a verifiable employer or training-provider route.";
    steps = ["Find the opportunity on the employer's or training provider's official website.", "Check qualification requirements, work exposure, location and closing date.", "Prepare a truthful CV and gather only the requested supporting records."];
  } else if (choice.includes("employment") || choice.includes("cv")) {
    title = "Employment and CV";
    summary = "Build a job-search route around verifiable vacancies, an accurate CV and a record of the source and deadline.";
    steps = ["Find vacancies on employer websites or another source that can be independently verified.", "Tailor your CV truthfully to the role and confirm the application channel.", "Record the source and date checked so you can follow up accurately."];
  } else if (choice.includes("bursary") || choice.includes("funding")) {
    title = "Funding and support";
    summary = "Confirm eligibility, supported costs and dates directly with the official funder.";
    steps = ["Identify the funder and the study, training or work pathway it supports.", "Verify eligibility, covered costs, required records and the closing date.", "Prepare a private checklist and identify a backup funding route where practical."];
  } else if (choice.includes("not sure")) {
    title = "Route discovery";
  }

  const obstacle = blocker.toLowerCase();
  let priority: string | null = null;
  if (obstacle.includes("documents")) priority = "Start with a private document checklist based on each provider's current official requirements.";
  else if (obstacle.includes("funding") || obstacle.includes("nsfas") || obstacle.includes("bursary")) priority = "Verify funding eligibility, covered costs and application dates directly with the official funder.";
  else if (obstacle.includes("cv")) priority = "Prepare a truthful, role-specific CV and check that qualifications and experience are accurate.";
  else if (obstacle.includes("deadline")) priority = "Verify the latest deadline with the official provider; third-party lists are discovery aids, not final proof.";
  else if (obstacle.includes("backup")) priority = "Identify at least one realistic alternative and compare its official requirements and dates.";
  else if (obstacle.includes("do not know")) priority = "Compare two or three plausible routes against your qualifications, location, affordability and goals.";
  if (priority) steps = [priority, ...steps].filter((step, index, list) => list.indexOf(step) === index).slice(0, 4);
  return { title, summary, stage: stage || "Not selected", province: province || "Not selected", goal: goal.trim(), steps };
}

export default function FreeDestinyMapPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<ReadinessPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  function previewReadinessPath() {
    const form = formRef.current;
    if (!form) {
      setPreviewError("The readiness form is not available in this page.");
      setPreview(null);
      return;
    }
    const values = new FormData(form);
    const route = String(values.get("route-interest") ?? "").trim();
    if (!route) {
      setPreviewError("Choose a route, or select “I am not sure yet”, to build your preview.");
      setPreview(null);
      return;
    }
    if (values.get("boundary-confirmation") !== "on") {
      setPreviewError("Confirm the browser-only preview notice before continuing.");
      setPreview(null);
      return;
    }
    setPreviewError(null);
    setPreview(buildReadinessPreview(
      route,
      String(values.get("biggest-blocker") ?? ""),
      String(values.get("current-stage") ?? ""),
      String(values.get("province") ?? ""),
      String(values.get("readiness-goal") ?? "")
    ));
  }
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px",
        background:
          "radial-gradient(circle at top left, rgba(214,178,94,0.2), transparent 34%), #080a12",
        color: "#f8f3e7",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
      }}
    >
      <section
        data-kingsmen-free-destiny-map-identity="true"
        style={{ maxWidth: "980px", margin: "0 auto", display: "grid", gap: "18px" }}
      >
        <p
          style={{
            margin: 0,
            color: "#d6b25e",
            fontSize: "13px",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            fontWeight: 900
          }}
        >
          Free Destiny Map
        </p>

        <h1 style={{ margin: 0, fontSize: "44px", lineHeight: 1.05, color: "#fff7d6" }}>
          Start your Kingsmen route discovery.
        </h1>

        <p style={{ maxWidth: "760px", color: "#d5d9e2", fontSize: "16px", lineHeight: 1.7 }}>
          This safe public intake surface helps you describe your current stage, province, route
          interest, biggest blocker, and readiness goal before any managed package. No payment is
          required for this Free Destiny Map starting point.
        </p>

        <form
          ref={formRef}
          data-kingsmen-free-destiny-map-intake="true"
          style={{
            display: "grid",
            gap: "14px",
            padding: "22px",
            borderRadius: "28px",
            border: "1px solid rgba(214, 178, 94, 0.28)",
            background: "rgba(255, 255, 255, 0.045)",
            boxShadow: "0 22px 70px rgba(0,0,0,0.28)"
          }}
        >
          <div style={{ display: "grid", gap: "7px" }}>
            <label htmlFor="current-stage" style={{ color: "#fff7d6", fontWeight: 800 }}>
              Current stage
            </label>
            <select
              id="current-stage"
              name="current-stage"
              data-kingsmen-intake-field="current-stage"
              defaultValue=""
              style={{
                padding: "12px",
                borderRadius: "14px",
                border: "1px solid rgba(214, 178, 94, 0.22)",
                background: "#101522",
                color: "#f8f3e7"
              }}
            >
              <option value="" disabled>
                Choose your current stage
              </option>
              <option>Grade 9 - 11</option>
              <option>Grade 12 / Matric</option>
              <option>Matric completed</option>
              <option>TVET / college student</option>
              <option>Unemployed and seeking opportunity</option>
              <option>Working and seeking upgrade</option>
            </select>
          </div>

          <div style={{ display: "grid", gap: "7px" }}>
            <label htmlFor="province" style={{ color: "#fff7d6", fontWeight: 800 }}>
              Province
            </label>
            <select
              id="province"
              name="province"
              data-kingsmen-intake-field="province"
              defaultValue=""
              style={{
                padding: "12px",
                borderRadius: "14px",
                border: "1px solid rgba(214, 178, 94, 0.22)",
                background: "#101522",
                color: "#f8f3e7"
              }}
            >
              <option value="" disabled>
                Choose province
              </option>
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
          </div>

          <div style={{ display: "grid", gap: "7px" }}>
            <label htmlFor="route-interest" style={{ color: "#fff7d6", fontWeight: 800 }}>
              Route interest
            </label>
            <select
              id="route-interest"
              name="route-interest"
              data-kingsmen-intake-field="route-interest"
              defaultValue=""
              style={{
                padding: "12px",
                borderRadius: "14px",
                border: "1px solid rgba(214, 178, 94, 0.22)",
                background: "#101522",
                color: "#f8f3e7"
              }}
            >
              <option value="" disabled>
                Choose route
              </option>
              <option>University</option>
              <option>TVET college</option>
              <option>SETA / learnership</option>
              <option>Internship / apprenticeship</option>
              <option>Employment / CV path</option>
              <option>Bursary / funding support</option>
              <option>I am not sure yet</option>
            </select>
          </div>

          <div style={{ display: "grid", gap: "7px" }}>
            <label htmlFor="biggest-blocker" style={{ color: "#fff7d6", fontWeight: 800 }}>
              Biggest blocker
            </label>
            <select
              id="biggest-blocker"
              name="biggest-blocker"
              data-kingsmen-intake-field="biggest-blocker"
              defaultValue=""
              style={{
                padding: "12px",
                borderRadius: "14px",
                border: "1px solid rgba(214, 178, 94, 0.22)",
                background: "#101522",
                color: "#f8f3e7"
              }}
            >
              <option value="" disabled>
                Choose blocker
              </option>
              <option>I do not know what to apply for</option>
              <option>I am missing documents</option>
              <option>I need funding guidance</option>
              <option>I need a better CV</option>
              <option>I am worried about deadlines</option>
              <option>I need backup options</option>
            </select>
          </div>

          <div style={{ display: "grid", gap: "7px" }}>
            <label htmlFor="readiness-goal" style={{ color: "#fff7d6", fontWeight: 800 }}>
              Readiness goal
            </label>
            <textarea
              id="readiness-goal"
              name="readiness-goal"
              data-kingsmen-intake-field="readiness-goal"
              placeholder="Example: I want to know the safest route and what documents I need."
              rows={4}
              style={{
                padding: "12px",
                borderRadius: "14px",
                border: "1px solid rgba(214, 178, 94, 0.22)",
                background: "#101522",
                color: "#f8f3e7",
                resize: "vertical"
              }}
            />
          </div>

          <label
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "flex-start",
              color: "#d5d9e2",
              fontSize: "13px",
              lineHeight: 1.6
            }}
          >
            <input
              id="intake-boundary-confirmation"
              name="boundary-confirmation"
              data-kingsmen-intake-field="boundary-confirmation"
              type="checkbox"
              style={{ marginTop: "4px" }}
            />
            I understand this is a safe Free Destiny Map starting surface only. It does not submit
            my information yet, does not create an application, and does not guarantee acceptance,
            funding, placement, or employment.
          </label>

          <button onClick={previewReadinessPath}
            data-kingsmen-intake-button="preview-path"
            type="button"
            style={{
              display: "inline-flex",
              width: "fit-content",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "8px",
              padding: "13px 18px",
              borderRadius: "999px",
              border: "1px solid rgba(214, 178, 94, 0.62)",
              background: "linear-gradient(135deg, rgba(214,178,94,0.22), rgba(214,178,94,0.08))",
              color: "#f8d77a",
              fontWeight: 900,
              textDecoration: "none",
              boxShadow: "0 16px 48px rgba(0,0,0,0.24)"
            }}
          >
            Preview my readiness path
          </button>

          {previewError ? (
            <p role="alert" style={{ margin: 0, color: "#ffb5a9", fontSize: "13px", lineHeight: 1.65 }}>{previewError}</p>
          ) : null}
          {preview ? (
            <section data-kingsmen-preview-status="ready" aria-live="polite" aria-labelledby="readiness-preview-heading" style={{ display: "grid", gap: "12px", padding: "18px", border: "1px solid #58706f", borderRadius: "16px", background: "#0d1d25", color: "#f4f1e8" }}>
              <div>
                <p style={{ margin: "0 0 6px", color: "#8fe1c2", fontSize: "10px", fontWeight: 900, letterSpacing: "1.8px", textTransform: "uppercase" }}>Browser-only preview · not a live match</p>
                <h2 id="readiness-preview-heading" style={{ margin: 0, fontSize: "21px" }}>{preview.title} readiness path</h2>
                <p style={{ margin: "8px 0 0", color: "#b8c7d4", fontSize: "13px", lineHeight: 1.7 }}>{preview.summary}</p>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {[["Current stage", preview.stage], ["Province", preview.province]].map(([label, value]) => (
                  <span key={label} style={{ border: "1px solid #344a5c", borderRadius: "999px", padding: "6px 9px", color: "#c8d4e1", fontSize: "11px" }}>{label}: {value}</span>
                ))}
              </div>
              <ol data-kingsmen-preview-steps="true" style={{ margin: 0, paddingLeft: "22px", display: "grid", gap: "9px", color: "#e6eaf1", fontSize: "13px", lineHeight: 1.65 }}>
                {preview.steps.map((step) => <li key={step}>{step}</li>)}
              </ol>
              {preview.goal ? <p style={{ margin: 0, paddingTop: "10px", borderTop: "1px solid #344a5c", color: "#c8d4e1", fontSize: "12px", lineHeight: 1.65 }}>Your stated goal: {preview.goal}</p> : null}
              <p style={{ margin: 0, color: "#8fa5b6", fontSize: "11px", lineHeight: 1.6 }}>Planning guidance only. No current opening, eligibility decision, deadline or application outcome has been verified. Check details with the official provider before acting.</p>
            </section>
          ) : null}
          <p style={{ margin: 0, color: "#8fa0b7", fontSize: "11px", lineHeight: 1.6 }}>This preview is computed in your current browser tab only. The selected details are not saved or sent by this page.</p>
        </form>

        <p style={{ color: "#aeb7c5", fontSize: "13px", lineHeight: 1.6 }}>
          Boundary: this page is a public intake surface only. It does not collect personal contact channels,
          official personal identifiers, documents, payments, outbound messages, urgent channel messages, production
          credentials, or Oracle deployment proof.
        </p>
      </section>
    </main>
  );
}

