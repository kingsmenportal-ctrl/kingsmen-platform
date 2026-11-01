"use client";

import { useRef, useState, type FormEvent } from "react";

const routeOptions = [
  ["higher_education", "University / higher education"],
  ["tvet", "TVET college"],
  ["seta_learnership", "SETA programme / learnership"],
  ["internship", "Internship"],
  ["apprenticeship", "Apprenticeship"],
  ["employment", "Employment"],
  ["nsfas_bursary", "NSFAS / bursary / funding"],
  ["accommodation", "Accommodation"],
  ["cv_revamp", "CV support"],
  ["documents", "Document readiness"],
  ["source_check", "Provider / opportunity source check"],
  ["phoenix_fallback", "Alternative route / Phoenix fallback"],
  ["confused_full_map", "I need the full route map"]
] as const;

const provinces = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape"
];

const fieldStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "13px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(214, 178, 94, 0.28)",
  background: "#101522",
  color: "#f8f3e7",
  font: "inherit"
};

const labelStyle = {
  display: "grid",
  gap: "7px",
  color: "#fff7d6",
  fontWeight: 750,
  fontSize: "14px"
};

type IntakeIssue = {
  field?: string;
  code?: string;
  message?: string;
};

type IntakeResponse = {
  accepted?: boolean;
  reference?: string;
  backendReference?: string | null;
  backendStorageMode?: string | null;
  storageMode?: string;
  safeNotice?: string;
  nextAction?: string;
  issues?: IntakeIssue[];
};

export default function FreeDestinyMapIntakeForm() {
  const requestId = useRef<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [issues, setIssues] = useState<IntakeIssue[]>([]);
  const [receipt, setReceipt] = useState<IntakeResponse | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const selectedRoutes = data.getAll("routeInterests").map(String);
    const needsAccommodation = data.get("needsAccommodation") === "on";
    const accommodationArea = String(data.get("accommodationArea") ?? "").trim();

    if (needsAccommodation && !accommodationArea) {
      setFailure("Add the preferred campus, training or work area for accommodation support.");
      setIssues([{ field: "accommodationArea", code: "ACCOMMODATION_AREA_REQUIRED" }]);
      return;
    }

    setBusy(true);
    setFailure("");
    setIssues([]);
    setReceipt(null);

    if (!requestId.current) {
      requestId.current = window.crypto.randomUUID();
    }

    const payload = {
      clientRequestId: requestId.current,
      fullName: String(data.get("fullName") ?? "").trim(),
      email: String(data.get("email") ?? "").trim().toLowerCase(),
      province: String(data.get("province") ?? "").trim(),
      currentSituation: String(data.get("currentSituation") ?? "").trim(),
      knownRoute: String(data.get("knownRoute") ?? "").trim(),
      routeInterests: selectedRoutes,
      urgency: String(data.get("urgency") ?? "normal"),
      needsAccommodation,
      accommodationArea,
      needsFundingHelp: data.get("needsFundingHelp") === "on",
      needsCvHelp: data.get("needsCvHelp") === "on",
      hasDocumentsReady: data.get("hasDocumentsReady") === "on",
      consentToBeContacted: data.get("consentToBeContacted") === "on",
      consentToProcessBasicInfo: data.get("consentToProcessBasicInfo") === "on"
    };

    try {
      const response = await fetch("/api/public/free-destiny-map/intake/local", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = (await response.json()) as IntakeResponse;
      if (!response.ok || result.accepted !== true) {
        setIssues(Array.isArray(result.issues) ? result.issues : []);
        setFailure(
          result.safeNotice ??
            "Kingsmen could not confirm receipt. Your details have not been confirmed as accepted."
        );
        return;
      }

      setReceipt(result);
      form.reset();
      requestId.current = null;
    } catch {
      setFailure(
        "The Kingsmen intake service could not be reached. No successful receipt was confirmed. You can retry this form."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={{ display: "grid", gap: "18px" }}>
      <form
        onSubmit={submit}
        style={{
          display: "grid",
          gap: "18px",
          padding: "22px",
          borderRadius: "24px",
          border: "1px solid rgba(214, 178, 94, 0.28)",
          background: "rgba(255, 255, 255, 0.045)",
          boxShadow: "0 22px 70px rgba(0,0,0,0.28)"
        }}
      >
        <div style={{ display: "grid", gap: "7px" }}>
          <h2 style={{ margin: 0, color: "#fff7d6", fontSize: "22px" }}>Your route starting point</h2>
          <p style={{ margin: 0, color: "#aeb7c5", lineHeight: 1.6, fontSize: "13px" }}>
            Share only the information needed to understand your route. Do not enter an ID number,
            passport number, password, banking detail or document contents here.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
          <label style={labelStyle}>
            Full name
            <input name="fullName" autoComplete="name" required maxLength={120} style={fieldStyle} />
          </label>
          <label style={labelStyle}>
            Email address
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              style={fieldStyle}
            />
          </label>
          <label style={labelStyle}>
            Province
            <select name="province" required defaultValue="" style={fieldStyle}>
              <option value="" disabled>Select province</option>
              {provinces.map((province) => <option key={province} value={province}>{province}</option>)}
            </select>
          </label>
          <label style={labelStyle}>
            Current situation
            <select name="currentSituation" required defaultValue="" style={fieldStyle}>
              <option value="" disabled>Select your current stage</option>
              <option value="Grade 9–11 learner">Grade 9–11 learner</option>
              <option value="Grade 12 / Matric learner">Grade 12 / Matric learner</option>
              <option value="Matric completed">Matric completed</option>
              <option value="TVET / college student">TVET / college student</option>
              <option value="University student">University student</option>
              <option value="Graduate seeking opportunity">Graduate seeking opportunity</option>
              <option value="Unemployed and seeking work">Unemployed and seeking work</option>
              <option value="Employed and seeking progression">Employed and seeking progression</option>
              <option value="Career change / returning to work">Career change / returning to work</option>
            </select>
          </label>
        </div>

        <label style={labelStyle}>
          Known route or qualification (optional)
          <input
            name="knownRoute"
            maxLength={280}
            placeholder="For example: diploma in IT, electrician apprenticeship, entry-level work"
            style={fieldStyle}
          />
        </label>

        <fieldset style={{ border: "1px solid rgba(214, 178, 94, 0.22)", borderRadius: "16px", padding: "15px", display: "grid", gap: "12px" }}>
          <legend style={{ color: "#fff7d6", padding: "0 6px", fontWeight: 750 }}>Which routes should Kingsmen assess?</legend>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "11px" }}>
            {routeOptions.map(([value, label]) => (
              <label key={value} style={{ display: "flex", gap: "9px", alignItems: "flex-start", color: "#d5d9e2", fontSize: "14px", lineHeight: 1.5 }}>
                <input type="checkbox" name="routeInterests" value={value} style={{ marginTop: "3px", accentColor: "#d6b25e" }} />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
          <label style={labelStyle}>
            Timing
            <select name="urgency" defaultValue="normal" style={fieldStyle}>
              <option value="normal">No urgent deadline known</option>
              <option value="soon">I need to plan soon</option>
              <option value="urgent_deadline_risk">I may be at risk of missing a deadline</option>
            </select>
          </label>
          <label style={labelStyle}>
            Accommodation area (only if needed)
            <input name="accommodationArea" maxLength={180} placeholder="Campus, town or work area" style={fieldStyle} />
          </label>
        </div>

        <fieldset style={{ border: "1px solid rgba(214, 178, 94, 0.22)", borderRadius: "16px", padding: "15px", display: "grid", gap: "12px" }}>
          <legend style={{ color: "#fff7d6", padding: "0 6px", fontWeight: 750 }}>Support needs</legend>
          {[
            ["needsAccommodation", "I may need accommodation support"],
            ["needsFundingHelp", "I need funding / bursary guidance"],
            ["needsCvHelp", "I need CV or employment-readiness support"],
            ["hasDocumentsReady", "I already have some supporting documents"]
          ].map(([name, label]) => (
            <label key={name} style={{ display: "flex", gap: "9px", alignItems: "center", color: "#d5d9e2", fontSize: "14px" }}>
              <input type="checkbox" name={name} style={{ accentColor: "#d6b25e" }} />
              {label}
            </label>
          ))}
        </fieldset>

        <div style={{ display: "grid", gap: "12px", padding: "15px", borderRadius: "16px", background: "rgba(214,178,94,0.07)" }}>
          <label style={{ display: "flex", gap: "10px", alignItems: "flex-start", color: "#d5d9e2", fontSize: "13px", lineHeight: 1.6 }}>
            <input type="checkbox" name="consentToProcessBasicInfo" required style={{ marginTop: "4px", accentColor: "#d6b25e" }} />
            I consent to Kingsmen processing the basic information I entered to assess my requested education, training, funding, accommodation or employment routes.
          </label>
          <label style={{ display: "flex", gap: "10px", alignItems: "flex-start", color: "#d5d9e2", fontSize: "13px", lineHeight: 1.6 }}>
            <input type="checkbox" name="consentToBeContacted" required style={{ marginTop: "4px", accentColor: "#d6b25e" }} />
            I consent to Kingsmen contacting me by email about this intake and its next steps. No WhatsApp or SMS contact is requested by this form.
          </label>
        </div>

        <button
          type="submit"
          disabled={busy}
          style={{
            justifySelf: "start",
            border: "1px solid rgba(214, 178, 94, 0.72)",
            borderRadius: "999px",
            padding: "14px 22px",
            background: busy ? "#35302a" : "linear-gradient(135deg, rgba(214,178,94,0.28), rgba(214,178,94,0.1))",
            color: "#f8d77a",
            fontWeight: 850,
            cursor: busy ? "wait" : "pointer",
            opacity: busy ? 0.7 : 1
          }}
        >
          {busy ? "Sending intake…" : "Send my Free Destiny Map intake"}
        </button>
      </form>

      {failure ? (
        <div role="alert" style={{ border: "1px solid rgba(255,120,120,0.42)", borderRadius: "14px", padding: "14px", color: "#ffd4d4", background: "rgba(150,35,35,0.12)" }}>
          <strong>Receipt not confirmed.</strong>
          <p style={{ margin: "6px 0 0", lineHeight: 1.5 }}>{failure}</p>
          {issues.length > 0 && (
            <ul style={{ marginBottom: 0, paddingLeft: "20px" }}>
              {issues.map((issue, index) => <li key={issue.code ?? index}>{issue.message ?? issue.code ?? issue.field}</li>)}
            </ul>
          )}
        </div>
      ) : null}

      {receipt ? (
        <div role="status" aria-live="polite" style={{ border: "1px solid rgba(117,190,145,0.45)", borderRadius: "14px", padding: "16px", color: "#d8f3df", background: "rgba(38,110,65,0.14)" }}>
          <strong>Kingsmen backend accepted the intake command.</strong>
          <p style={{ margin: "7px 0", lineHeight: 1.55 }}>
            Receipt reference: <strong>{receipt.backendReference ?? receipt.reference ?? "Received"}</strong>
          </p>
          <p style={{ margin: "0 0 7px", lineHeight: 1.55 }}>
            {receipt.nextAction ?? "Your intake reached the Kingsmen command boundary."}
          </p>
          <p style={{ margin: 0, color: "#b5c9bb", fontSize: "12px", lineHeight: 1.5 }}>
            This confirms command-boundary acceptance only. It does not confirm durable database storage,
            account creation, an official application, source verification, payment, placement or employment.
            Backend storage mode: {receipt.backendStorageMode ?? receipt.storageMode ?? "not reported"}.
          </p>
        </div>
      ) : null}
    </section>
  );
}
