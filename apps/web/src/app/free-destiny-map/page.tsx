"use client";

import { useState, type FormEvent } from "react";

type RoutePreview = {
  currentStage: string;
  province: string;
  routeInterest: string;
  biggestBlocker: string;
  readinessGoal: string;
};

const routeGuidance: Record<string, { heading: string; steps: string[] }> = {
  "University": {
    heading: "Higher education route",
    steps: [
      "Shortlist institutions and programmes using each institution's official website.",
      "Check the current application window, admission requirements and closing date directly with the institution.",
      "Make a checklist of the academic records and supporting documents the institution requests."
    ]
  },
  "TVET college": {
    heading: "TVET and college route",
    steps: [
      "Compare relevant TVET campuses and programmes using official college information.",
      "Confirm the current intake dates, entry requirements and whether the chosen campus is accepting applications.",
      "List the certificates and academic records required before beginning an application."
    ]
  },
  "SETA / learnership": {
    heading: "Skills and learnership route",
    steps: [
      "Find the opportunity on an official SETA, employer or training-provider source.",
      "Check provider legitimacy, eligibility, location, closing date and whether recruitment is currently open.",
      "Prepare a targeted CV and only the supporting documents requested by the verified provider."
    ]
  },
  "Internship / apprenticeship": {
    heading: "Work experience and apprenticeship route",
    steps: [
      "Identify employers or recognised training providers that offer the relevant workplace pathway.",
      "Verify the opportunity, required qualifications, location and closing date at the source.",
      "Prepare a CV and a short record of relevant study, skills or practical experience."
    ]
  },
  "Employment / CV path": {
    heading: "Employment route",
    steps: [
      "Choose the role types and locations that match your current skills and constraints.",
      "Check vacancies on the employer's official careers page before sharing personal information.",
      "Prepare a role-specific CV and keep a record of roles applied for and any provider replies."
    ]
  },
  "Bursary / funding support": {
    heading: "Funding and support route",
    steps: [
      "Identify funding sources that match your study or training route and circumstances.",
      "Verify eligibility, covered costs, official closing date and required supporting evidence on the funder's own site.",
      "Create a document checklist; do not pay an intermediary to guarantee funding or selection."
    ]
  },
  "I am not sure yet": {
    heading: "Explore and compare routes",
    steps: [
      "Start with your current qualification, interests, preferred location and need for income or funding.",
      "Compare study, vocational training, learnership, work-experience and employment options side by side.",
      "Verify any programme or vacancy on its official source before acting on a deadline or eligibility claim."
    ]
  }
};

const blockerGuidance: Record<string, string> = {
  "I do not know what to apply for": "First action: compare two or three realistic pathways against your qualifications, interests and location.",
  "I am missing documents": "First action: build a checklist from the official provider requirements; do not upload sensitive documents to this preview.",
  "I need funding guidance": "First action: identify the official funder and confirm eligibility, covered costs and the closing date.",
  "I need a better CV": "First action: prepare a clear education, skills and experience summary, then tailor it to one real opportunity.",
  "I am worried about deadlines": "First action: check the provider's official page and record the published closing date and time zone.",
  "I need backup options": "First action: choose at least one alternative route and verify it independently rather than relying on a single application."
};

export default function FreeDestinyMapPage() {
  const [preview, setPreview] = useState<RoutePreview | null>(null);
  const routeGuide = preview ? routeGuidance[preview.routeInterest] ?? routeGuidance["I am not sure yet"] : null;

  function handlePreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const value = (key: string) => String(formData.get(key) ?? "").trim();

    setPreview({
      currentStage: value("currentStage"),
      province: value("province"),
      routeInterest: value("routeInterest"),
      biggestBlocker: value("biggestBlocker"),
      readinessGoal: value("readinessGoal")
    });
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
          onSubmit={handlePreview}
          onChange={() => setPreview(null)}
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
              name="currentStage"
              required
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
              required
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
              name="routeInterest"
              required
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
              name="biggestBlocker"
              required
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
              name="readinessGoal"
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
              name="localPreviewAcknowledged"
              required
              data-kingsmen-intake-field="boundary-confirmation"
              type="checkbox"
              style={{ marginTop: "4px" }}
            />
            I understand this is a local route preview only. My choices will not be sent or saved,
            and this is not an official application or an eligibility decision.
          </label>

          <button
            data-kingsmen-intake-button="preview-path"
            type="submit"
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
            Build my route preview
          </button>
        </form>

        {preview && routeGuide && (
          <section
            data-kingsmen-route-preview="true"
            aria-live="polite"
            role="status"
            aria-labelledby="route-preview-heading"
            style={{
              display: "grid",
              gap: "14px",
              marginTop: "18px",
              padding: "22px",
              borderRadius: "22px",
              border: "1px solid rgba(214, 178, 94, 0.42)",
              background: "rgba(214, 178, 94, 0.08)"
            }}
          >
            <p style={{ margin: 0, color: "#d6b25e", fontSize: "12px", fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase" }}>
              Your local preview
            </p>
            <h2 id="route-preview-heading" style={{ margin: 0, color: "#fff7d6", fontSize: "28px", lineHeight: 1.2 }}>
              {routeGuide.heading}
            </h2>
            <p style={{ margin: 0, color: "#d5d9e2", lineHeight: 1.7 }}>
              Based on your selections: {preview.currentStage} · {preview.province} · {preview.routeInterest}.
            </p>
            <div>
              <h3 style={{ margin: "0 0 10px", color: "#fff7d6", fontSize: "16px" }}>Recommended next steps</h3>
              <ol style={{ margin: 0, paddingLeft: "22px", color: "#d5d9e2", lineHeight: 1.8 }}>
                {routeGuide.steps.map((step) => <li key={step} style={{ paddingLeft: "4px", marginBottom: "6px" }}>{step}</li>)}
              </ol>
            </div>
            <p style={{ margin: 0, color: "#f3d58e", lineHeight: 1.7 }}>{blockerGuidance[preview.biggestBlocker] ?? "First action: verify requirements and deadlines directly with the official provider."}</p>
            {preview.readinessGoal && (
              <p style={{ margin: 0, color: "#d5d9e2", lineHeight: 1.7 }}><strong>Your goal:</strong> {preview.readinessGoal}</p>
            )}
            <p style={{ margin: 0, color: "#aeb7c5", fontSize: "12px", lineHeight: 1.7 }}>
              This preview uses only the choices currently in this page. Kingsmen has not received or saved them. Verify every opportunity, eligibility rule and deadline with the official provider.
            </p>
          </section>
        )}

        <p style={{ color: "#aeb7c5", fontSize: "13px", lineHeight: 1.6 }}>
          Boundary: this page is a public intake surface only. It does not collect personal contact channels,
          official personal identifiers, documents, payments, outbound messages, urgent channel messages, production
          credentials, or Oracle deployment proof.
        </p>
      </section>
    </main>
  );
}

