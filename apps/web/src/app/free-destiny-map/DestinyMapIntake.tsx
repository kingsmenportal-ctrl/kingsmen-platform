"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type Intake = { stage: string; province: string; route: string; blocker: string; goal: string };
type Plan = { title: string; summary: string; steps: string[]; caution: string };

const fieldStyle: React.CSSProperties = {
  width: "100%", padding: "13px 14px", borderRadius: 4, border: "1px solid #485264",
  background: "#101722", color: "#f4f0e7", font: "inherit", minHeight: 48
};
const labelStyle: React.CSSProperties = {
  display: "grid", gap: 8, color: "#e9dfc9", fontSize: 12, letterSpacing: ".04em", fontWeight: 700
};

function buildPlan(data: Intake): Plan {
  const route = data.route;
  let title = "Route discovery";
  let summary = "Compare suitable routes before committing to an application.";
  let steps = ["Confirm your current qualification and subjects or experience.", "Compare official entry requirements and application windows.", "Build a document checklist and identify a backup route."];
  let caution = "A directory or suggested route is not proof that an opportunity is open. Confirm availability, requirements and dates with the official provider.";

  if (route === "University") {
    title = "Higher-education route";
    summary = "Prepare for university or university-of-technology applications, including CAO where applicable.";
    steps = ["List intended qualifications and subject/APS requirements.", "Check official university and UoT prospectuses; confirm whether CAO applies.", "Prepare certified results and identity documents only for the provider's secure submission channel.", "Track each application reference and keep submission proof."];
  } else if (route === "TVET college") {
    title = "TVET and college route";
    summary = "Compare NC(V), NATED/Report 191 and other programmes against your current results.";
    steps = ["Choose a field and compare NC(V) versus NATED/Report 191 requirements.", "Verify the campus, programme accreditation/status and intake dates with the institution.", "Prepare results, identity and any programme-specific evidence.", "Record the provider's confirmation and next action."];
  } else if (route === "SETA / learnership") {
    title = "Learnership and skills route";
    summary = "Check SETA-linked opportunities and relevant QCTO occupational pathways.";
    steps = ["Identify the occupation and relevant SETA or QCTO pathway.", "Verify the training provider, workplace component, eligibility and closing date.", "Prepare CV, results and required supporting evidence.", "Keep the advert and proof of submission; do not treat an advert as placement confirmation."];
  } else if (route === "Internship / apprenticeship") {
    title = "Work-based learning route";
    summary = "Compare internships, apprenticeships and work-integrated learning (WIL).";
    steps = ["Separate internship, apprenticeship and WIL requirements.", "Check experience, qualification, location and licence requirements.", "Tailor a CV and prepare evidence requested by the provider.", "Record submission proof and follow-up date."];
  } else if (route === "Employment / CV path") {
    title = "Employment route";
    summary = "Prepare a targeted job-search path built around your experience and constraints.";
    steps = ["Define role, location, shift and travel constraints.", "Prepare a truthful, role-matched CV and supporting documents.", "Verify each vacancy on the employer's official channel.", "Track application date, reference, follow-up and confirmed outcome separately."];
  } else if (route === "Bursary / funding support") {
    title = "Funding and support route";
    summary = "Check bursaries, NSFAS where applicable, sponsors and practical support requirements.";
    steps = ["Check the funding body's official eligibility and open/closed status.", "Prepare academic and household/financial evidence only through the official secure channel.", "Record deadlines and any dependency on admission or registration.", "Track acknowledgement separately from an award decision."];
  }

  if (data.blocker === "I am missing documents") {
    steps.unshift("Make a missing-document inventory and identify which items can be obtained first.");
  } else if (data.blocker === "I need funding guidance") {
    steps.unshift("Check funding eligibility and application windows alongside the main route.");
  } else if (data.blocker === "I need a better CV") {
    steps.unshift("Prepare a factual CV tailored to the chosen route; do not invent experience or results.");
  } else if (data.blocker === "I am worried about deadlines") {
    steps.unshift("Verify current dates directly with each official provider before prioritising.");
  } else if (data.blocker === "I need backup options") {
    steps.unshift("Choose at least one realistic alternative route with different entry conditions.");
  } else if (data.stage === "Grade 9 - 11") {
    steps.unshift("Prioritise subject choices, results and early exploration; check age and grade eligibility before applying.");
  }
  if (data.stage === "Unemployed and seeking opportunity" && route !== "Employment / CV path") {
    steps.push("Consider an employment route in parallel if it fits your circumstances.");
  }
  return { title, summary, steps, caution };
}

export default function DestinyMapIntake() {
  const [intake, setIntake] = useState<Intake>({ stage: "", province: "", route: "", blocker: "", goal: "" });
  const [acceptedBoundary, setAcceptedBoundary] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!intake.stage || !intake.province || !intake.route || !intake.blocker) {
      setError("Complete the four required selections to build your route preview.");
      setPlan(null);
      return;
    }
    if (!acceptedBoundary) {
      setError("Confirm the preview boundary before continuing.");
      setPlan(null);
      return;
    }
    setError("");
    setPlan(buildPlan(intake));
  }

  function update(key: keyof Intake, value: string) {
    setIntake((current) => ({ ...current, [key]: value }));
  }

  return (
    <main style={{ minHeight: "100vh", background: "#0a1018", color: "#f4f0e7", fontFamily: "Arial, Helvetica, sans-serif" }}>
      <style>{`
        *{box-sizing:border-box}a{color:inherit}.dm-shell{max-width:1180px;margin:0 auto;padding:24px 24px 70px}
        .dm-nav{display:flex;align-items:center;justify-content:space-between;gap:18px;border-bottom:1px solid #354050;padding:8px 0 22px}
        .dm-brand{font-weight:900;letter-spacing:.2em;font-size:13px}.dm-brand span{display:block;color:#c6a665;font-size:9px;letter-spacing:.22em;margin-top:6px}
        .dm-links{display:flex;gap:20px;font-size:12px;color:#b8c0ca}.dm-links a{text-decoration:none}
        .dm-kicker{color:#d6b76d;font-size:10px;font-weight:800;letter-spacing:.22em;text-transform:uppercase}
        .dm-hero{display:grid;grid-template-columns:1.1fr .9fr;gap:44px;align-items:end;padding:58px 0 36px}
        .dm-hero h1{font-size:clamp(42px,7vw,78px);line-height:.97;letter-spacing:-.055em;font-weight:500;margin:18px 0 22px;max-width:760px}
        .dm-hero p{max-width:620px;color:#b8c0ca;line-height:1.8;font-size:14px}
        .dm-stamp{border-left:1px solid #c6a665;padding:8px 0 8px 20px;color:#aab3bf;font-size:12px;line-height:1.8}
        .dm-stamp strong{display:block;color:#f2e7d0;font-size:13px;margin-bottom:8px}
        .dm-body{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:22px;align-items:start}
        .dm-form{border:1px solid #394454;background:#101722;padding:24px}
        .dm-form-head{display:flex;justify-content:space-between;gap:16px;align-items:start;border-bottom:1px solid #303b4b;padding-bottom:18px;margin-bottom:22px}
        .dm-form h2{font-size:20px;font-weight:500;margin:0 0 8px}.dm-form-head p{font-size:12px;line-height:1.7;color:#9faab8;margin:0}
        .dm-index{font-size:10px;color:#d6b76d;letter-spacing:.15em;white-space:nowrap}
        .dm-fields{display:grid;grid-template-columns:1fr 1fr;gap:18px}
        .dm-full{grid-column:1/-1}.dm-submit{background:#d6b76d;color:#121820;border:0;padding:15px 18px;font-weight:900;letter-spacing:.04em;cursor:pointer;text-align:left}
        .dm-submit:hover{background:#e6cb8b}.dm-error{color:#ffb5a9;font-size:12px;line-height:1.6}
        .dm-side{border-top:2px solid #c6a665;padding-top:16px}.dm-side h3{font-size:13px;margin:0 0 14px;color:#f1e7d4}.dm-side ol{padding-left:18px;color:#9faab8;font-size:12px;line-height:1.8}.dm-side li{padding:0 0 10px}
        .dm-plan{margin-top:22px;border:1px solid #b69b5e;background:#141b24;padding:24px}.dm-plan h2{font-size:25px;font-weight:500;margin:12px 0}.dm-plan p,.dm-plan li{font-size:13px;line-height:1.8;color:#c0c8d1}.dm-plan ol{padding-left:22px}.dm-warning{border-top:1px solid #4a4535;margin-top:20px;padding-top:16px;color:#e2ca8c;font-size:12px;line-height:1.8}
        .dm-foot{border-top:1px solid #354050;margin-top:42px;padding-top:18px;color:#8995a4;font-size:11px;line-height:1.8}
        @media(max-width:760px){.dm-shell{padding:16px 16px 46px}.dm-nav{align-items:flex-start}.dm-links{gap:12px;flex-wrap:wrap;justify-content:flex-end}.dm-hero{grid-template-columns:1fr;gap:18px;padding-top:40px}.dm-body{grid-template-columns:1fr}.dm-fields{grid-template-columns:1fr}.dm-full{grid-column:auto}.dm-form{padding:17px}.dm-stamp{max-width:420px}}
      `}</style>
      <div className="dm-shell">
        <header className="dm-nav">
          <div className="dm-brand">KINGSMEN<span>THE ROUTE HOUSE · SOUTH AFRICA</span></div>
          <nav className="dm-links" aria-label="Main navigation">
            <Link href="/">Home</Link><Link href="/pathways">Pathways</Link><Link href="/how-it-works">Method</Link>
          </nav>
        </header>
        <section className="dm-hero">
          <div><div className="dm-kicker">Free Destiny Map / Route 00</div><h1>Find the next<br/>credible move.</h1><p>A guided route preview across study, skills, work-based learning, employment and funding. Start with where you are; leave with a practical checklist—not a promise of admission or placement.</p></div>
          <div className="dm-stamp"><strong>BEFORE YOU BEGIN</strong>This preview runs in your browser. It does not send or save your answers, create an account, submit an application or accept documents. Do not enter personal identifiers or sensitive information.</div>
        </section>
        <div className="dm-body">
          <form className="dm-form" data-kingsmen-free-destiny-map-intake="true" onSubmit={submit}>
            <div className="dm-form-head"><div><h2>Build your starting route</h2><p>Four selections create a tailored checklist. Your province helps frame the search; it does not establish eligibility.</p></div><span className="dm-index">01 — 04</span></div>
            <div className="dm-fields">
              <label style={labelStyle}>CURRENT STAGE
                <select id="current-stage" data-kingsmen-intake-field="current-stage" required value={intake.stage} onChange={e=>update("stage",e.target.value)} style={fieldStyle}>
                  <option value="">Choose current stage</option><option>Grade 9 - 11</option><option>Grade 12 / Matric</option><option>Matric completed</option><option>TVET / college student</option><option>Unemployed and seeking opportunity</option><option>Working and seeking upgrade</option>
                </select>
              </label>
              <label style={labelStyle}>PROVINCE
                <select id="province" data-kingsmen-intake-field="province" required value={intake.province} onChange={e=>update("province",e.target.value)} style={fieldStyle}>
                  <option value="">Choose province</option><option>Eastern Cape</option><option>Free State</option><option>Gauteng</option><option>KwaZulu-Natal</option><option>Limpopo</option><option>Mpumalanga</option><option>Northern Cape</option><option>North West</option><option>Western Cape</option>
                </select>
              </label>
              <label style={labelStyle}>ROUTE OF INTEREST
                <select id="route-interest" data-kingsmen-intake-field="route-interest" required value={intake.route} onChange={e=>update("route",e.target.value)} style={fieldStyle}>
                  <option value="">Choose route</option><option>University</option><option>TVET college</option><option>SETA / learnership</option><option>Internship / apprenticeship</option><option>Employment / CV path</option><option>Bursary / funding support</option><option>I am not sure yet</option>
                </select>
              </label>
              <label style={labelStyle}>BIGGEST BLOCKER
                <select id="biggest-blocker" data-kingsmen-intake-field="biggest-blocker" required value={intake.blocker} onChange={e=>update("blocker",e.target.value)} style={fieldStyle}>
                  <option value="">Choose blocker</option><option>I do not know what to apply for</option><option>I am missing documents</option><option>I need funding guidance</option><option>I need a better CV</option><option>I am worried about deadlines</option><option>I need backup options</option>
                </select>
              </label>
              <label className="dm-full" style={labelStyle}>YOUR GOAL (OPTIONAL; KEEP IT NON-SENSITIVE)
                <textarea id="readiness-goal" data-kingsmen-intake-field="readiness-goal" value={intake.goal} onChange={e=>update("goal",e.target.value)} rows={3} maxLength={500} placeholder="Example: compare entry routes for business studies." style={{...fieldStyle,resize:"vertical",minHeight:100}}/>
              </label>
              <label className="dm-full" style={{display:"flex",gap:10,alignItems:"flex-start",fontSize:12,lineHeight:1.7,color:"#aeb8c5"}}>
                <input id="intake-boundary-confirmation" data-kingsmen-intake-field="boundary-confirmation" type="checkbox" checked={acceptedBoundary} onChange={e=>setAcceptedBoundary(e.target.checked)} style={{marginTop:3}}/>
                I understand this is a local preview only. My answers are not submitted or saved, and this does not guarantee an open opportunity, acceptance, funding, placement or employment.
              </label>
              <div className="dm-full" style={{display:"grid",gap:10}}>
                <button className="dm-submit" data-kingsmen-intake-button="preview-path" type="submit">GENERATE MY READINESS CHECKLIST ↗</button>
                {error && <p role="alert" className="dm-error">{error}</p>}
              </div>
            </div>
          </form>
          <aside className="dm-side"><h3>THE ROUTE PRINCIPLES</h3><ol><li>Start with your real current stage—not an assumed profile.</li><li>Verify requirements and dates with the official provider.</li><li>Prepare evidence before submitting anything.</li><li>Keep a receipt or reference where the provider supplies one.</li><li>Track acknowledgement separately from an outcome.</li></ol><p style={{fontSize:11,lineHeight:1.8,color:"#8793a2"}}>The six Kingsmen pathways include higher education, TVET, learnerships, internships/apprenticeships, employment, and funding/support.</p></aside>
        </div>
        {plan && <section className="dm-plan" aria-live="polite" data-kingsmen-readiness-preview="true"><div className="dm-kicker">Your route preview · {intake.province}</div><h2>{plan.title}</h2><p>{plan.summary}</p><div className="dm-kicker" style={{marginTop:24}}>Recommended next actions</div><ol>{plan.steps.map((step,i)=><li key={step}>{step}</li>)}</ol>{intake.goal.trim() && <p><strong>Your stated goal:</strong> {intake.goal.trim()}</p>}<div className="dm-warning">{plan.caution}</div><p style={{fontSize:11,color:"#98a4b3"}}>This checklist was generated in this browser session from your selections. It has not been stored as a candidate record.</p><p><Link href="/pathways">Explore the six pathways →</Link>　<Link href="/how-it-works">How Kingsmen works →</Link></p></section>}
        <footer className="dm-foot">KINGSMEN · FREE DESTINY MAP · PUBLIC PREVIEW ONLY<br/>Do not submit identity numbers, passwords, bank details or document files on this page. A real application requires a separately verified, authenticated and secure workflow.</footer>
      </div>
    </main>
  );
}
