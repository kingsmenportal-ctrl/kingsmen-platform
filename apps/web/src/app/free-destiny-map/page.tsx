"use client";

import { useMemo, useState, type FormEvent, type CSSProperties } from "react";

type Intake = {
  stage: string;
  province: string;
  route: string;
  blocker: string;
  goal: string;
};

type Action = { title: string; detail: string; href: string };

const initialIntake: Intake = { stage: "", province: "", route: "", blocker: "", goal: "" };

const options = {
  stage: [
    "Grade 9 - 11",
    "Grade 12 / Matric",
    "Matric completed",
    "TVET / college student",
    "Unemployed and seeking opportunity",
    "Working and seeking upgrade"
  ],
  province: [
    "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo",
    "Mpumalanga", "Northern Cape", "North West", "Western Cape"
  ],
  route: [
    "University", "TVET college", "SETA / learnership", "Internship / apprenticeship",
    "Employment / CV path", "Bursary / funding support", "I am not sure yet"
  ],
  blocker: [
    "I do not know what to apply for", "I am missing documents", "I need funding guidance",
    "I need a better CV", "I am worried about deadlines", "I do not have internet or transport",
    "I have applied but received no response"
  ],
  goal: [
    "Make a plan for the next 7 days", "Find opportunities to apply for",
    "Get my documents ready", "Improve my CV and application",
    "Compare education and work routes"
  ]
} as const;

const routeAdvice: Record<string, Action[]> = {
  "University": [
    { title: "Confirm entry requirements", detail: "Check the official institution's admission requirements and application dates for your intended qualification.", href: "https://www.gov.za/" },
    { title: "Prepare your academic records", detail: "Gather your latest results, matric certificate or expected-results information, and identification documents.", href: "/personal-job-desk/document-pack-index" },
    { title: "Check funding early", detail: "Review eligibility and deadlines directly with the institution and the relevant official funding provider.", href: "https://www.nsfas.org.za/" }
  ],
  "TVET college": [
    { title: "Choose a qualification path", detail: "Compare campus, programme entry rules, intake dates and practical training options.", href: "https://www.dhet.gov.za/" },
    { title: "Prepare an admissions pack", detail: "Collect your results, identification and proof of residence if the institution requires it.", href: "/personal-job-desk/document-pack-index" },
    { title: "Ask about funding and placement", detail: "Contact the college admissions office about funding, work-integrated learning and current application windows.", href: "https://www.dhet.gov.za/" }
  ],
  "SETA / learnership": [
    { title: "Identify relevant sectors", detail: "Choose two or three sectors that fit your interests and current qualifications before searching provider notices.", href: "https://www.gov.za/" },
    { title: "Prepare a learnership-ready CV", detail: "Highlight education, practical skills, projects, volunteering and reliable contact details.", href: "/personal-job-desk/apply-now" },
    { title: "Verify each listing", detail: "Use the employer or SETA's official website to confirm eligibility, dates and how to apply. Never pay to secure a placement.", href: "/personal-job-desk/opportunity-scout" }
  ],
  "Internship / apprenticeship": [
    { title: "Match roles to your experience", detail: "List your qualification, practical skills, trade interests and any workplace experience.", href: "/personal-job-desk/opportunity-scout" },
    { title: "Prepare evidence of skills", detail: "Gather certificates, project examples, references and a role-specific CV.", href: "/personal-job-desk/document-pack-index" },
    { title: "Check the official employer notice", detail: "Confirm closing dates, requirements and submission method on the employer's official channel.", href: "/personal-job-desk/opportunity-scout" }
  ],
  "Employment / CV path": [
    { title: "Build a clear, targeted CV", detail: "Use a concise profile, measurable experience where available, skills relevant to the role and accurate contact details.", href: "/personal-job-desk/apply-now" },
    { title: "Set up a focused opportunity search", detail: "Search by role, location and entry level; prioritise listings with a verifiable employer and closing date.", href: "/personal-job-desk/opportunity-scout" },
    { title: "Track every application", detail: "Record the date, official application channel, job reference and any follow-up date.", href: "/personal-job-desk/application-tracker" }
  ],
  "Bursary / funding support": [
    { title: "Define the funding need", detail: "Note the qualification, institution, study year and costs you need covered before comparing options.", href: "https://www.nsfas.org.za/" },
    { title: "Prepare supporting documents", detail: "Check each funder's own checklist; requirements can differ and may include results and household information.", href: "/personal-job-desk/document-pack-index" },
    { title: "Verify the funder and deadline", detail: "Apply through the funder's official site only. Avoid anyone promising guaranteed funding for an upfront fee.", href: "https://www.nsfas.org.za/" }
  ],
  "I am not sure yet": [
    { title: "Compare realistic routes", detail: "Compare study, TVET, learnership, internship and employment routes against your current results, interests and time constraints.", href: "https://www.dhet.gov.za/" },
    { title: "Write down your constraints", detail: "List location, transport, data access, available time and documents you already have.", href: "/personal-job-desk/document-pack-index" },
    { title: "Start with a small next step", detail: "Choose one route to investigate this week, then verify requirements from the official provider.", href: "/personal-job-desk/opportunity-scout" }
  ]
};

const blockerAdvice: Record<string, string> = {
  "I do not know what to apply for": "Start with two routes that match your current stage, then compare eligibility and deadlines before applying.",
  "I am missing documents": "Make a checklist first. Do not upload identity or financial documents to unverified websites or send them to unknown contacts.",
  "I need funding guidance": "Check official funder criteria and closing dates early. Funding is not guaranteed and eligibility varies.",
  "I need a better CV": "Start with a clean, truthful CV and tailor its skills and profile to each role; never invent qualifications or experience.",
  "I am worried about deadlines": "Keep a simple deadline list with the official source, closing date and submission confirmation.",
  "I do not have internet or transport": "Prioritise nearby public resources such as a library, school, TVET campus or community centre where available.",
  "I have applied but received no response": "Record the application date and reference, check the official follow-up window and avoid repeated messages or unofficial payment requests."
};

const page: CSSProperties = {
  minHeight: "100vh", padding: "clamp(18px, 4vw, 44px)",
  background: "radial-gradient(circle at 8% 0%, rgba(214,178,94,.18), transparent 32%), #080a12",
  color: "#f8f3e7", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
};
const field: CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "12px 13px", borderRadius: "12px",
  border: "1px solid rgba(214,178,94,.25)", background: "#101522", color: "#f8f3e7", font: "inherit"
};
const label: CSSProperties = { display: "grid", gap: "8px", color: "#fff7d6", fontSize: "14px", fontWeight: 750 };
const panel: CSSProperties = {
  padding: "clamp(18px, 3vw, 28px)", borderRadius: "22px",
  border: "1px solid rgba(214,178,94,.24)", background: "rgba(255,255,255,.045)"
};

function getActions(intake: Intake): Action[] {
  const base = routeAdvice[intake.route] ?? routeAdvice["I am not sure yet"];
  const actions = [...base];
  if (intake.blocker === "I need a better CV" || intake.blocker === "I am missing documents") {
    actions.unshift({
      title: intake.blocker === "I need a better CV" ? "Refresh your CV first" : "Create your document checklist",
      detail: intake.blocker === "I need a better CV"
        ? "Use the apply desk to prepare a clear CV before spending time on applications."
        : "List what you have and what is missing; share sensitive documents only with verified institutions or employers.",
      href: intake.blocker === "I need a better CV" ? "/personal-job-desk/apply-now" : "/personal-job-desk/document-pack-index"
    });
  }
  return actions.slice(0, 4);
}

export default function FreeDestinyMapPage() {
  const [intake, setIntake] = useState<Intake>(initialIntake);
  const [showPlan, setShowPlan] = useState(false);
  const [error, setError] = useState("");
  const actions = useMemo(() => getActions(intake), [intake]);

  function update<K extends keyof Intake>(key: K, value: Intake[K]) {
    setIntake(current => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (Object.values(intake).some(value => !value.trim())) {
      setError("Complete each field so we can shape a useful starting plan.");
      setShowPlan(false);
      return;
    }
    setError("");
    setShowPlan(true);
  }

  return (
    <main style={page}>
      <div style={{ maxWidth: "1080px", margin: "0 auto", display: "grid", gap: "22px" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          <a href="/kingsmen" style={{ color: "#f8d77a", textDecoration: "none", fontWeight: 850, letterSpacing: ".08em" }}>KINGSMEN PORTAL</a>
          <a href="/personal-job-desk" style={{ color: "#d5d9e2", textDecoration: "none", fontSize: "14px" }}>Open application desk →</a>
        </header>

        <section data-kingsmen-free-destiny-map-identity="true" style={{ display: "grid", gap: "14px", maxWidth: "790px" }}>
          <p style={{ margin: 0, color: "#d6b25e", fontSize: "12px", letterSpacing: ".18em", fontWeight: 900 }}>YOUR FREE STARTING POINT</p>
          <h1 style={{ margin: 0, fontSize: "clamp(34px, 6vw, 58px)", lineHeight: 1.04, letterSpacing: "-.035em", color: "#fff7d6" }}>Turn “where do I start?” into a clear next step.</h1>
          <p style={{ margin: 0, maxWidth: "740px", color: "#c9cfdb", lineHeight: 1.75, fontSize: "16px" }}>
            Answer five quick questions and get a practical starter plan for study, TVET, learnerships, internships, work or funding. This is guidance to help you take the next step—not a guarantee of admission, funding or employment.
          </p>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", color: "#c9cfdb", fontSize: "12px" }}>
            <span style={chip}>✓ Free to use</span><span style={chip}>✓ No account needed</span><span style={chip}>✓ Answers stay in this page</span>
          </div>
        </section>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: "20px", alignItems: "start" }}>
          <form data-kingsmen-free-destiny-map-intake="true" onSubmit={submit} style={{ ...panel, display: "grid", gap: "18px" }}>
            <div>
              <h2 style={{ margin: "0 0 6px", fontSize: "21px" }}>Tell us where you are now</h2>
              <p style={{ margin: 0, color: "#aeb7c5", fontSize: "13px", lineHeight: 1.6 }}>No ID number, CV upload, phone number or personal documents needed here.</p>
            </div>
            <label style={label}>Current stage
              <select id="current-stage" data-kingsmen-intake-field="current-stage" required value={intake.stage} onChange={e => update("stage", e.target.value)} style={field}>
                <option value="">Choose your current stage</option>{options.stage.map(x => <option key={x}>{x}</option>)}
              </select>
            </label>
            <label style={label}>Province
              <select id="province" data-kingsmen-intake-field="province" required value={intake.province} onChange={e => update("province", e.target.value)} style={field}>
                <option value="">Choose province</option>{options.province.map(x => <option key={x}>{x}</option>)}
              </select>
            </label>
            <label style={label}>Route you're interested in
              <select id="route-interest" data-kingsmen-intake-field="route-interest" required value={intake.route} onChange={e => update("route", e.target.value)} style={field}>
                <option value="">Choose a route</option>{options.route.map(x => <option key={x}>{x}</option>)}
              </select>
            </label>
            <label style={label}>Your biggest blocker
              <select id="biggest-blocker" data-kingsmen-intake-field="biggest-blocker" required value={intake.blocker} onChange={e => update("blocker", e.target.value)} style={field}>
                <option value="">Choose the main blocker</option>{options.blocker.map(x => <option key={x}>{x}</option>)}
              </select>
            </label>
            <label style={label}>What would help most right now?
              <select id="next-goal" data-kingsmen-intake-field="next-goal" required value={intake.goal} onChange={e => update("goal", e.target.value)} style={field}>
                <option value="">Choose your goal</option>{options.goal.map(x => <option key={x}>{x}</option>)}
              </select>
            </label>
            {error && <p role="alert" style={{ margin: 0, color: "#ffb4a9", fontSize: "13px" }}>{error}</p>}
            <button type="submit" style={button}>Build my starter plan <span aria-hidden="true">→</span></button>
            <p style={{ margin: 0, color: "#8993a4", fontSize: "11px", lineHeight: 1.5 }}>This version creates the plan in your browser only. It does not submit or save your answers to a server.</p>
          </form>

          <section aria-live="polite" aria-label="Your starter plan" style={{ ...panel, minHeight: "320px", display: "grid", alignContent: "start", gap: "16px" }}>
            {!showPlan ? <>
              <span style={{ color: "#d6b25e", fontSize: "12px", fontWeight: 900, letterSpacing: ".16em" }}>YOUR STARTER PLAN</span>
              <h2 style={{ margin: 0, fontSize: "27px", lineHeight: 1.15 }}>Small steps. Real progress.</h2>
              <p style={{ color: "#c9cfdb", lineHeight: 1.7, margin: 0 }}>Your recommendations will appear here after you answer the questions. Start with one manageable action, then verify requirements with the official provider.</p>
              <div style={{ display: "grid", gap: "10px", marginTop: "8px" }}>
                {["Clarify your route", "Identify your next action", "Prepare what you need", "Keep track of progress"].map((x, i) => <div key={x} style={placeholderRow}><span style={stepNumber}>{i + 1}</span><span>{x}</span></div>)}
              </div>
            </> : <>
              <span style={{ color: "#d6b25e", fontSize: "12px", fontWeight: 900, letterSpacing: ".16em" }}>YOUR STARTER PLAN · {intake.province.toUpperCase()}</span>
              <h2 style={{ margin: 0, fontSize: "27px", lineHeight: 1.15 }}>Your next steps are ready.</h2>
              <p style={{ color: "#c9cfdb", lineHeight: 1.65, margin: 0 }}>Based on <strong style={{ color: "#fff7d6" }}>{intake.stage}</strong>, your interest in <strong style={{ color: "#fff7d6" }}>{intake.route}</strong>, and your goal to <strong style={{ color: "#fff7d6" }}>{intake.goal.toLowerCase()}</strong>:</p>
              <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(214,178,94,.09)", border: "1px solid rgba(214,178,94,.2)" }}>
                <strong style={{ color: "#fff0b4", fontSize: "13px" }}>Focus on this blocker</strong>
                <p style={{ color: "#d5d9e2", lineHeight: 1.6, fontSize: "13px", margin: "6px 0 0" }}>{blockerAdvice[intake.blocker]}</p>
              </div>
              <div style={{ display: "grid", gap: "12px" }}>
                {actions.map((action, i) => <article key={action.title} style={{ display: "grid", gridTemplateColumns: "30px 1fr", gap: "10px", paddingBottom: "13px", borderBottom: i < actions.length - 1 ? "1px solid rgba(255,255,255,.09)" : "none" }}>
                  <span style={stepNumber}>{i + 1}</span>
                  <div>
                    <h3 style={{ margin: "2px 0 5px", fontSize: "15px" }}>{action.title}</h3>
                    <p style={{ margin: "0 0 8px", color: "#aeb7c5", fontSize: "13px", lineHeight: 1.6 }}>{action.detail}</p>
                    <a href={action.href} target={action.href.startsWith("https://") ? "_blank" : undefined} rel={action.href.startsWith("https://") ? "noreferrer" : undefined} style={{ color: "#f3ce70", fontSize: "12px", fontWeight: 800, textDecoration: "none" }}>
                      {action.href.startsWith("https://") ? "Open official resource ↗" : "Open Kingsmen tool →"}
                    </a>
                  </div>
                </article>)}
              </div>
              <button type="button" onClick={() => { setIntake(initialIntake); setShowPlan(false); setError(""); }} style={secondaryButton}>Start again</button>
            </>}
          </section>
        </div>
        <footer style={{ color: "#8993a4", fontSize: "12px", lineHeight: 1.7, maxWidth: "800px" }}>
          Safety note: confirm opportunities, eligibility and deadlines directly with the institution, employer or funder. Kingsmen does not guarantee placement or funding. Never pay an unofficial person to secure a job, bursary or learnership.
        </footer>
      </div>
    </main>
  );
}

const chip: CSSProperties = { border: "1px solid rgba(214,178,94,.24)", background: "rgba(214,178,94,.06)", borderRadius: "999px", padding: "7px 10px" };
const button: CSSProperties = { border: 0, borderRadius: "12px", padding: "14px 16px", background: "linear-gradient(135deg,#f2d17c,#c69a3d)", color: "#15110a", fontWeight: 900, fontSize: "14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" };
const secondaryButton: CSSProperties = { ...button, justifyContent: "center", background: "transparent", color: "#f3ce70", border: "1px solid rgba(214,178,94,.35)" };
const placeholderRow: CSSProperties = { display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderRadius: "12px", background: "rgba(255,255,255,.025)", color: "#d5d9e2", fontSize: "13px" };
const stepNumber: CSSProperties = { width: "28px", height: "28px", borderRadius: "9px", display: "grid", placeItems: "center", background: "rgba(214,178,94,.12)", border: "1px solid rgba(214,178,94,.26)", color: "#f3ce70", fontWeight: 900, fontSize: "12px" };
