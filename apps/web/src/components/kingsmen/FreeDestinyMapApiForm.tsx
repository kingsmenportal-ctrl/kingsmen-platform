"use client";

import { useState } from "react";
import {
  buildFreeDestinyMapClientPayload,
  submitFreeDestinyMapClientPayload
} from "../../lib/kingsmen/free-destiny-map-client";
import {
  FREE_DESTINY_MAP_API_WIRING_NOTICE,
  type FreeDestinyMapClientResponse
} from "../../../../../packages/contracts/src/free-destiny-map-api-wiring";

const routeOptions = [
  ["higher_education", "University"],
  ["tvet", "TVET"],
  ["seta_learnership", "SETA / learnership"],
  ["internship", "Internship"],
  ["apprenticeship", "Apprenticeship"],
  ["employment", "Employment"],
  ["nsfas_bursary", "NSFAS / bursary"],
  ["accommodation", "Accommodation"],
  ["cv_revamp", "CV Revamp"],
  ["documents", "Documents"],
  ["source_check", "Source check"],
  ["phoenix_fallback", "Phoenix fallback"],
  ["confused_full_map", "I need the full map"]
];

export function FreeDestinyMapApiForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<FreeDestinyMapClientResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const payload = buildFreeDestinyMapClientPayload(new FormData(event.currentTarget));
      const response = await submitFreeDestinyMapClientPayload(payload);
      setResult(response);
    } catch {
      setError("The local intake shell could not be reached. This is still a runtime wiring stage, not production.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const fieldStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(212,175,55,0.35)",
    background: "#020617",
    color: "#f8fafc"
  };

  const labelStyle = {
    display: "block",
    marginBottom: 6,
    color: "#f8fafc",
    fontSize: 13
  };

  return (
    <section style={{ border: "1px solid rgba(212,175,55,0.35)", borderRadius: 22, padding: 22, background: "rgba(2,6,23,0.92)", color: "#f8fafc" }}>
      <p style={{ margin: 0, color: "#d4af37", letterSpacing: "0.12em", textTransform: "uppercase", fontSize: 12 }}>Free first map</p>
      <h2 style={{ marginTop: 8 }}>Start your Free Destiny Map</h2>
      <p style={{ color: "#cbd5e1", lineHeight: 1.7 }}>
        This form is wired toward the local intake API shell. Production storage, email, payment, documents and official submissions are still blocked.
      </p>
      <p style={{ color: "#fde68a", lineHeight: 1.7 }}>{FREE_DESTINY_MAP_API_WIRING_NOTICE}</p>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
        <label>
          <span style={labelStyle}>Your name</span>
          <input name="fullName" style={fieldStyle} placeholder="Full name" />
        </label>

        <label>
          <span style={labelStyle}>Province / area</span>
          <input name="province" style={fieldStyle} placeholder="Example: KwaZulu-Natal, Gauteng, Eastern Cape" />
        </label>

        <label>
          <span style={labelStyle}>Known route</span>
          <input name="knownRoute" style={fieldStyle} placeholder="Example: UJ, TVET, NSFAS, CV, accommodation, learnership..." />
        </label>

        <label>
          <span style={labelStyle}>Current situation</span>
          <textarea name="currentSituation" style={{ ...fieldStyle, minHeight: 96 }} placeholder="Tell Kingsmen what you are trying to do." />
        </label>

        <fieldset style={{ border: "1px solid rgba(212,175,55,0.25)", borderRadius: 14, padding: 14 }}>
          <legend style={{ color: "#d4af37" }}>Route interests</legend>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
            {routeOptions.map(([value, label]) => (
              <label key={value} style={{ display: "flex", gap: 8, alignItems: "center", color: "#e2e8f0" }}>
                <input name="routeInterests" value={value} type="checkbox" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input name="needsAccommodation" type="checkbox" />
          I may need accommodation near study, work, training, learnership, internship or apprenticeship.
        </label>

        <label>
          <span style={labelStyle}>Accommodation area, campus, workplace or training location</span>
          <input name="accommodationArea" style={fieldStyle} placeholder="Example: Durban, Johannesburg, Cape Town, campus/workplace area..." />
        </label>

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input name="needsFundingHelp" type="checkbox" />
          I may need NSFAS, bursary or funding readiness support.
        </label>

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input name="needsCvHelp" type="checkbox" />
          I may need CV help.
        </label>

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input name="hasDocumentsReady" type="checkbox" />
          I already have some documents ready.
        </label>

        <label>
          <span style={labelStyle}>Random opportunity, college, bursary, job, landlord, learnership or training provider to check</span>
          <input name="randomSourceName" style={fieldStyle} placeholder="Name or link to check later" />
        </label>

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input name="consentToBeContacted" type="checkbox" />
          I agree Kingsmen may contact me about this Free Destiny Map.
        </label>

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input name="consentToProcessBasicInfo" type="checkbox" />
          I agree Kingsmen may process this basic route-mapping information.
        </label>

        <button type="submit" disabled={isSubmitting} style={{ border: 0, borderRadius: 999, padding: "13px 18px", background: "#d4af37", color: "#020617", fontWeight: 800 }}>
          {isSubmitting ? "Sending to local shell..." : "Send to local intake shell"}
        </button>
      </form>

      {error ? (
        <div style={{ marginTop: 16, padding: 14, borderRadius: 14, background: "rgba(239,68,68,0.12)", color: "#fecaca" }}>
          {error}
        </div>
      ) : null}

      {result ? (
        <div style={{ marginTop: 16, padding: 14, borderRadius: 14, background: "rgba(34,197,94,0.12)", color: "#bbf7d0" }}>
          <p><strong>Reference:</strong> {result.reference}</p>
          <p><strong>Accepted:</strong> {String(result.accepted)}</p>
          <p><strong>Production ready:</strong> {String(result.productionReady)}</p>
          <p><strong>Next:</strong> {result.nextAction}</p>
          {result.issues.length > 0 ? (
            <ul>
              {result.issues.map((issue) => (
                <li key={`${issue.field}-${issue.code}`}>{issue.message}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
