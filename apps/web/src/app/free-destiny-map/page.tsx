"use client";

import Link from "next/link";
import { useState } from "react";

type IntakeValues = {
  currentStage: string;
  province: string;
  routeInterest: string;
  biggestBlocker: string;
  readinessGoal: string;
  confirmed: boolean;
};

const initialValues: IntakeValues = {
  currentStage: "",
  province: "",
  routeInterest: "",
  biggestBlocker: "",
  readinessGoal: "",
  confirmed: false,
};

export default function FreeDestinyMapPage() {
  const [values, setValues] = useState<IntakeValues>(initialValues);
  const [preview, setPreview] = useState("");
  function update<K extends keyof IntakeValues>(key: K, value: IntakeValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setPreview("");
  }
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values.confirmed) {
      setPreview("Please confirm that you understand this is a local preview only.");
      return;
    }
    const route = values.routeInterest === "I am not sure yet" ? "a guided pathway review" : values.routeInterest;
    setPreview(
      "Local route preview: start by checking source-backed options for " + route + " in " + values.province +
      ". Your current stage is " + values.currentStage + " and your main blocker is " + values.biggestBlocker +
      ". Your answers have not been sent or saved. This is not an application and does not guarantee an outcome."
    );
  }

  return (
    <main className="public-site destiny-map-page">
      <div className="public-notice"><span aria-hidden="true" /> FREE DESTINY MAP · LOCAL PREVIEW ONLY</div>
      <header className="public-header"><div className="public-container public-header-inner">
        <Link className="public-brand" href="/" aria-label="Kingsmen Portal home"><span className="public-crest" aria-hidden="true">K</span><span className="public-wordmark"><strong>KINGSMEN</strong><small>PORTAL</small></span></Link>
        <nav className="public-nav" aria-label="Main navigation"><Link href="/">Home</Link><Link href="/packages/">Packages</Link><Link href="/candidate/dashboard/">Candidate portal</Link></nav>
      </div></header>
      <div className="public-container destiny-map-layout">
        <section className="destiny-map-intro" data-kingsmen-free-destiny-map-identity="true">
          <div className="public-eyebrow"><span /> YOUR NEXT MOVE STARTS HERE</div>
          <h1>Build your <em>Destiny Map.</em></h1>
          <p>Describe where you are, the route you are considering and what is getting in your way. This local preview gives you a starting direction before any provider application.</p>
          <div className="destiny-map-benefits"><span>✓ Six core pathways</span><span>✓ South African context</span><span>✓ Clear next-step guidance</span></div>
          <div className="destiny-map-boundary"><strong>Privacy boundary</strong><p>Do not enter identity numbers, banking details, contact details or other sensitive personal information. Your answers stay in this page session and are not sent to a backend.</p></div>
          <Link className="destiny-map-back-link" href="/">← Back to Kingsmen Portal</Link>
        </section>
        <form className="destiny-map-form" data-kingsmen-free-destiny-map-intake="true" onSubmit={handleSubmit}>
          <div className="destiny-map-form-heading"><span>STEP 01 <i>OF 03</i></span><h2>Tell us about your next move</h2><p>Free starting point · Nothing is submitted or saved</p></div>
          <div className="destiny-map-field"><label htmlFor="current-stage">Current stage</label><select id="current-stage" name="current-stage" data-kingsmen-intake-field="current-stage" value={values.currentStage} onChange={(e) => update("currentStage", e.target.value)} required><option value="">Choose your current stage</option><option>Grade 9–11</option><option>Grade 12 / Matric</option><option>Matric completed</option><option>TVET / college student</option><option>Unemployed and seeking opportunity</option><option>Working and seeking upgrade</option></select></div>
          <div className="destiny-map-field"><label htmlFor="province">Province</label><select id="province" name="province" data-kingsmen-intake-field="province" value={values.province} onChange={(e) => update("province", e.target.value)} required><option value="">Choose province</option><option>Eastern Cape</option><option>Free State</option><option>Gauteng</option><option>KwaZulu-Natal</option><option>Limpopo</option><option>Mpumalanga</option><option>Northern Cape</option><option>North West</option><option>Western Cape</option></select></div>
          <div className="destiny-map-field"><label htmlFor="route-interest">Route interest</label><select id="route-interest" name="route-interest" data-kingsmen-intake-field="route-interest" value={values.routeInterest} onChange={(e) => update("routeInterest", e.target.value)} required><option value="">Choose a route</option><option>Higher Education</option><option>TVET College</option><option>SETA / learnership</option><option>Internship</option><option>Apprenticeship</option><option>Employment / CV support</option><option>Bursary / funding support</option><option>I am not sure yet</option></select></div>
          <div className="destiny-map-field"><label htmlFor="biggest-blocker">Biggest blocker</label><select id="biggest-blocker" name="biggest-blocker" data-kingsmen-intake-field="biggest-blocker" value={values.biggestBlocker} onChange={(e) => update("biggestBlocker", e.target.value)} required><option value="">Choose the biggest blocker</option><option>I do not know what to apply for</option><option>I am missing documents</option><option>I need funding guidance</option><option>I need a better CV</option><option>I am worried about deadlines</option><option>I need backup options</option></select></div>
          <div className="destiny-map-field"><label htmlFor="readiness-goal">Readiness goal <span>(optional)</span></label><textarea id="readiness-goal" name="readiness-goal" data-kingsmen-intake-field="readiness-goal" value={values.readinessGoal} onChange={(e) => update("readinessGoal", e.target.value)} placeholder="In general terms, what would you like to clarify next?" rows={3} /></div>
          <label className="destiny-map-consent"><input id="intake-boundary-confirmation" data-kingsmen-intake-field="boundary-confirmation" type="checkbox" checked={values.confirmed} onChange={(e) => update("confirmed", e.target.checked)} /><span>I understand this is a local preview only. It does not submit my information, create an application or guarantee acceptance, funding, placement or employment.</span></label>
          <button className="public-button public-button-gold destiny-map-submit" data-kingsmen-intake-button="preview-path" type="submit">Preview my readiness path <span aria-hidden="true">→</span></button>
          {preview && <div className="destiny-map-result" role="status" aria-live="polite">{preview}</div>}
          <p className="destiny-map-form-footnote">No data is sent, no account is created and no application is submitted by this form.</p>
        </form>
      </div>
      <footer className="public-footer public-container"><Link className="public-brand public-brand-footer" href="/"><span className="public-crest" aria-hidden="true">K</span><span className="public-wordmark"><strong>KINGSMEN</strong><small>PORTAL</small></span></Link><span>Free Destiny Map · Preview only</span><span>Verify source, deadline and eligibility before applying.</span></footer>
    </main>
  );
}
