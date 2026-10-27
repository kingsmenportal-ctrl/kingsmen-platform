"use client";

import { useMemo, useState } from "react";

type Answers = {
  stage: string;
  province: string;
  pathway: string;
  interests: string[];
  strengths: string[];
  goal: string;
  constraints: string[];
};

const initialAnswers: Answers = {
  stage: "",
  province: "",
  pathway: "",
  interests: [],
  strengths: [],
  goal: "",
  constraints: [],
};

const pathways = [
  ["higher-education", "Higher education"],
  ["tvet", "TVET / college"],
  ["seta", "SETA / learnership"],
  ["internship", "Internship / apprenticeship"],
  ["employment", "Employment / CV"],
  ["funding", "Bursary / funding support"],
  ["unsure", "Help me explore my options"],
];

const interests = ["Business & management", "Technology & digital", "Health & community", "Engineering & trades", "Finance & administration", "Creative & communication", "Public service", "Practical / hands-on work"];
const strengths = ["Organising and planning", "Helping people", "Solving problems", "Working with numbers", "Leading a team", "Making or fixing things", "Writing and communicating", "Learning new technology"];
const constraints = ["Need funding or a stipend", "Need accommodation support", "Limited data / connectivity", "Need to work while studying", "Need an accessible route", "Need help with documents"];


export default function FreeDestinyMapPage() {
  const [step, setStep] = useState(1);
  const [showGuide, setShowGuide] = useState(false);
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [error, setError] = useState("");

  const update = <K extends keyof Answers,>(key: K, value: Answers[K]) => {
    setAnswers((current) => ({ ...current, [key]: value }));
    setError("");
  };

  const toggle = (key: "interests" | "strengths" | "constraints", value: string) => {
    setAnswers((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }));
    setError("");
  };

  const result = useMemo(() => {
    const route = pathways.find(([key]) => key === answers.pathway)?.[1] ?? "Explore multiple pathways";
    const strengthsText = answers.strengths.length
      ? answers.strengths.slice(0, 3).join(", ")
      : "Your strengths are still being explored";
    const interestText = answers.interests.length
      ? answers.interests.slice(0, 3).join(", ")
      : "Broad exploration across pathways";
    return { route, strengthsText, interestText };
  }, [answers]);

  const next = () => {
    if (step === 1 && (!answers.stage || !answers.province || !answers.pathway)) {
      setError("Complete all three fields to continue.");
      return;
    }
    if (step === 2 && (!answers.interests.length || !answers.strengths.length)) {
      setError("Choose at least one interest and one strength.");
      return;
    }
    if (step === 3 && !answers.goal.trim()) {
      setError("Tell us the most important outcome you want to work toward.");
      return;
    }
    setError("");
    setStep((current) => Math.min(4, current + 1));
  };

  const back = () => {
    setError("");
    setStep((current) => Math.max(1, current - 1));
  };

  const reset = () => {
    setAnswers(initialAnswers);
    setStep(1);
    setError("");
  };

  const nav = [
    ["▣", "My applications", "/candidate/dashboard"],
    ["⌕", "Find opportunities", "/opportunities"],
    ["▤", "My documents", "/candidate/documents"],
    ["?", "Help & support", "/candidate/support"],
    ["✦", "My next steps", "/free-destiny-map"],
  ];

  return (
    <main className="destiny-page">
      <style jsx global>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #f3f1ec; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        a { color: inherit; }
        button, input, select { font: inherit; }
        button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible { outline: 3px solid #d4af37; outline-offset: 3px; }
        .destiny-page { min-height: 100vh; color: #14213a; padding-bottom: 94px; background: #f3f1ec; }
        .destiny-top { background: #0b1a2a; color: #fff; }
        .destiny-shell { width: min(1120px, calc(100% - 36px)); margin: 0 auto; }
        .destiny-header { display:flex; align-items:center; justify-content:space-between; gap:16px; min-height:76px; border-bottom:1px solid #ffffff20; }
        .destiny-brand { display:flex; align-items:center; gap:11px; color:#fff; text-decoration:none; font-weight:800; letter-spacing:.01em; }
        .destiny-crest { width:39px; height:43px; display:grid; place-items:center; color:#0b1a2a; background:linear-gradient(145deg,#f2d985,#bd9335); clip-path:polygon(50% 0,94% 15%,87% 70%,50% 100%,13% 70%,6% 15%); font-weight:950; font-size:21px; }
        .destiny-back, .destiny-profile { border:1px solid #ffffff45; border-radius:999px; width:42px; height:42px; color:#f6e4a8; background:transparent; cursor:pointer; font-size:21px; }
        .destiny-topcontent { padding:29px 0 35px; }
        .destiny-eyebrow { margin:0 0 9px; color:#e1c477; font-size:11px; font-weight:900; letter-spacing:.15em; text-transform:uppercase; }
        .destiny-topcontent h1 { margin:0; font-size:clamp(30px,5vw,43px); letter-spacing:-.04em; line-height:1.05; color:#f7e6b0; }
        .destiny-subtitle { margin:10px 0 22px; color:#d6dbe5; line-height:1.6; }
        .destiny-stepmeta { display:flex; justify-content:space-between; gap:12px; align-items:center; color:#e8edf5; font-size:13px; }
        .destiny-dots { display:flex; gap:10px; }
        .destiny-dot { width:12px; height:12px; border:1px solid #aeb7c5; border-radius:50%; padding:0; background:transparent; cursor:pointer; }
        .destiny-dot.active, .destiny-dot.done { background:#d4af37; border-color:#d4af37; box-shadow:0 0 0 4px #d4af3722; }
        .destiny-content { width:min(760px,calc(100% - 28px)); margin:-17px auto 0; position:relative; }
        .destiny-card { background:#fffdf8; border:1px solid #dfd4b6; border-radius:23px; padding:clamp(22px,4vw,34px); box-shadow:0 18px 55px #0b1a2a12; }
        .destiny-cardhead { display:flex; gap:15px; align-items:flex-start; margin-bottom:23px; }
        .destiny-compass { flex:0 0 48px; width:48px; height:48px; border:1px solid #d8c68f; border-radius:50%; display:grid; place-items:center; color:#a47d24; font-size:26px; }
        .destiny-card h2 { margin:0; color:#101d38; font-size:24px; letter-spacing:-.025em; }
        .destiny-cardhead p { margin:7px 0 0; color:#586273; font-size:14px; line-height:1.65; }
        .destiny-fields { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:17px; }
        .destiny-field { display:grid; gap:8px; }
        .destiny-field.full { grid-column:1 / -1; }
        .destiny-field label, .destiny-label { color:#1a2942; font-size:13px; font-weight:800; }
        .destiny-field select, .destiny-field input, .destiny-field textarea { width:100%; padding:13px 14px; border:1px solid #d5d9e0; border-radius:10px; background:#fff; color:#15223a; }
        .destiny-field textarea { min-height:100px; resize:vertical; }
        .destiny-options { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; margin-top:10px; }
        .destiny-option { display:flex; align-items:flex-start; gap:10px; border:1px solid #dfe3e8; border-radius:11px; background:#fff; padding:12px; color:#27344a; font-size:13px; line-height:1.4; cursor:pointer; }
        .destiny-option:has(input:checked) { border-color:#bd9335; background:#fbf5e5; box-shadow:inset 0 0 0 1px #bd9335; }
        .destiny-option input { accent-color:#a47d24; margin-top:2px; }
        .destiny-benefits { display:grid; gap:10px; margin:22px 0 0; padding:0; list-style:none; color:#313c4d; font-size:14px; }
        .destiny-benefits li { display:flex; align-items:center; gap:10px; }
        .destiny-check { width:20px; height:20px; display:inline-grid; place-items:center; flex:0 0 20px; border-radius:50%; background:#f2e7c5; color:#8d6a1d; font-size:12px; font-weight:900; }
        .destiny-actions { display:flex; gap:12px; margin-top:26px; }
        .destiny-btn { display:inline-flex; justify-content:center; align-items:center; gap:8px; min-height:46px; border-radius:10px; padding:12px 18px; font-weight:900; font-size:13px; cursor:pointer; text-decoration:none; transition:transform .16s ease, box-shadow .16s ease; }
        .destiny-btn:hover { transform:translateY(-1px); box-shadow:0 7px 18px #0b1a2a1b; }
        .destiny-btn.primary { flex:1; background:linear-gradient(135deg,#e5c66d,#c39a3f); color:#172035; border:1px solid #c39a3f; }
        .destiny-btn.secondary { background:transparent; border:1px solid #c7b47c; color:#15223a; }
        .destiny-error { margin-top:15px; padding:11px 13px; border-radius:9px; color:#8f2525; background:#fff0ee; border:1px solid #f0c2bc; font-size:13px; }
        .destiny-info { margin-top:16px; color:#697487; font-size:11px; line-height:1.6; }
        .destiny-summary { display:grid; gap:12px; margin-top:18px; }
        .destiny-summary article { border:1px solid #e3d8b8; background:#fff; border-radius:13px; padding:15px; }
        .destiny-summary h3 { margin:0 0 6px; font-size:13px; color:#7c5b15; }
        .destiny-summary p { margin:0; color:#27344a; line-height:1.55; font-size:14px; }
        .destiny-bottom { position:fixed; z-index:10; bottom:0; left:0; right:0; background:#0b1a2a; border-top:1px solid #d4af3755; padding:9px max(12px,env(safe-area-inset-right)) calc(9px + env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left)); }
        .destiny-nav { width:min(820px,100%); margin:auto; display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:5px; }
        .destiny-nav a { text-align:center; text-decoration:none; border-radius:9px; padding:7px 3px 6px; color:#c1c9d5; font-size:10px; line-height:1.3; }
        .destiny-nav a span { display:block; font-size:19px; margin-bottom:4px; }
        .destiny-nav a.active { background:#d4af37; color:#0b1a2a; font-weight:900; }
        @media(max-width:600px) {
          .destiny-shell { width:calc(100% - 26px); }
          .destiny-header { min-height:65px; }
          .destiny-brand { font-size:14px; }
          .destiny-crest { width:33px; height:37px; }
          .destiny-topcontent { padding:24px 0 30px; }
          .destiny-subtitle { font-size:13px; }
          .destiny-stepmeta { align-items:flex-start; flex-direction:column; }
          .destiny-content { width:calc(100% - 20px); }
          .destiny-card { border-radius:20px; padding:21px 17px; }
          .destiny-card h2 { font-size:21px; }
          .destiny-fields, .destiny-options { grid-template-columns:1fr; }
          .destiny-actions { flex-direction:column-reverse; }
          .destiny-btn.secondary { width:100%; }
          .destiny-nav a { font-size:9px; }
        }
        @media(prefers-reduced-motion:reduce) { .destiny-btn { transition:none; } .destiny-btn:hover { transform:none; } }
      `}</style>

      <header className="destiny-top">
        <div className="destiny-shell">
          <div className="destiny-header">
            <button className="destiny-back" type="button" onClick={back} aria-label="Go back" disabled={step === 1} style={{ opacity: step === 1 ? .45 : 1 }}>‹</button>
            <a className="destiny-brand" href="/" aria-label="Kingsmen Portal home">
              <span className="destiny-crest" aria-hidden="true">K</span>
              <span>Kingsmen Portal</span>
            </a>
            <button className="destiny-profile" type="button" aria-label="Profile menu" onClick={() => setShowGuide((value) => !value)}>◉</button>
          </div>
          <div className="destiny-topcontent">
            <p className="destiny-eyebrow">Free candidate service · No payment required</p>
            <h1>Free Destiny Map</h1>
            <p className="destiny-subtitle">Discover a practical next step for your education or career. Three short steps, designed for South African realities.</p>
            <div className="destiny-stepmeta">
              <strong>{step < 4 ? `Step ${step} of 3 · ${["Personal alignment", "Interests & strengths", "Your next-step goal"][step - 1]}` : "Your starting map"}</strong>
              <div className="destiny-dots" aria-label={`Step ${step} of 3`}>
                {[1, 2, 3].map((number) => <button key={number} type="button" className={number === step ? "destiny-dot active" : number < step ? "destiny-dot done" : "destiny-dot"} aria-label={`Go to step ${number}`} onClick={() => { if (number <= step || step === 4) { setStep(number); setError(""); } }} />)}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="destiny-content">
        <section className="destiny-card" aria-live="polite">
          <div className="destiny-cardhead">
            <span className="destiny-compass" aria-hidden="true">✧</span>
            <div>
              <h2>{step === 1 ? "Start with where you are" : step === 2 ? "Discover what fits you" : step === 3 ? "Choose a practical next step" : "Your Destiny Map starting point"}</h2>
              <p>{step === 1 ? "Tell us a little about your current stage and the route you want to explore." : step === 2 ? "Select the areas that interest you and the strengths you recognise in yourself." : step === 3 ? "Your priorities help shape a realistic next-step plan." : "This is a starting point based on your answers—not a formal assessment or a promise of admission or employment."}</p>
            </div>
          </div>

          {step === 1 && (
            <div className="destiny-fields">
              <div className="destiny-field">
                <label htmlFor="current-stage">Current stage</label>
                <select id="current-stage" value={answers.stage} onChange={(event) => update("stage", event.target.value)} required>
                  <option value="">Choose your current stage</option>
                  <option>Grade 9–11</option><option>Grade 12 / Matric</option><option>Matric completed</option><option>TVET / college student</option><option>Unemployed and seeking opportunity</option><option>Working and seeking an upgrade</option>
                </select>
              </div>
              <div className="destiny-field">
                <label htmlFor="province">Province</label>
                <select id="province" value={answers.province} onChange={(event) => update("province", event.target.value)} required>
                  <option value="">Choose province</option>
                  {["Eastern Cape","Free State","Gauteng","KwaZulu-Natal","Limpopo","Mpumalanga","Northern Cape","North West","Western Cape"].map((province) => <option key={province}>{province}</option>)}
                </select>
              </div>
              <div className="destiny-field full">
                <label htmlFor="pathway">Which route would you like to explore?</label>
                <select id="pathway" value={answers.pathway} onChange={(event) => update("pathway", event.target.value)} required>
                  <option value="">Choose a pathway</option>
                  {pathways.map(([key, label]) => <option value={key} key={key}>{label}</option>)}
                </select>
              </div>
              <div className="destiny-field full">
                <p className="destiny-label" style={{ margin: "5px 0 0" }}>What you’ll get</p>
                <ul className="destiny-benefits">
                  <li><span className="destiny-check">✓</span> A strengths and interests overview</li>
                  <li><span className="destiny-check">✓</span> Suggested pathways to investigate</li>
                  <li><span className="destiny-check">✓</span> Actionable next steps you can review</li>
                </ul>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="destiny-label">Choose at least one area that interests you</p>
              <div className="destiny-options">{interests.map((item) => <label className="destiny-option" key={item}><input type="checkbox" checked={answers.interests.includes(item)} onChange={() => toggle("interests", item)} />{item}</label>)}</div>
              <p className="destiny-label" style={{ marginTop: 24 }}>Choose at least one strength you recognise in yourself</p>
              <div className="destiny-options">{strengths.map((item) => <label className="destiny-option" key={item}><input type="checkbox" checked={answers.strengths.includes(item)} onChange={() => toggle("strengths", item)} />{item}</label>)}</div>
            </div>
          )}

          {step === 3 && (
            <div className="destiny-fields">
              <div className="destiny-field full">
                <label htmlFor="goal">What is the most important outcome you want to work toward?</label>
                <textarea id="goal" value={answers.goal} onChange={(event) => update("goal", event.target.value)} placeholder="For example: find a funded study route, qualify for a learnership, or prepare for my first job." required />
              </div>
              <div className="destiny-field full">
                <p className="destiny-label" style={{ margin: 0 }}>What practical constraints should the plan account for? (Optional)</p>
                <div className="destiny-options">{constraints.map((item) => <label className="destiny-option" key={item}><input type="checkbox" checked={answers.constraints.includes(item)} onChange={() => toggle("constraints", item)} />{item}</label>)}</div>
              </div>
            </div>
          )}

          {step === 4 && (
            <>
              <div className="destiny-summary">
                <article><h3>Pathway to explore</h3><p>{result.route}</p></article>
                <article><h3>Interests selected</h3><p>{result.interestText}</p></article>
                <article><h3>Strengths you identified</h3><p>{result.strengthsText}</p></article>
                <article><h3>Your stated goal</h3><p>{answers.goal}</p></article>
                <article><h3>Practical considerations</h3><p>{answers.constraints.length ? answers.constraints.join(", ") : "No additional constraints selected."}</p></article>
              </div>
              <div className="destiny-info">This summary is generated in this page session and has not been saved to a Kingsmen account or sent to the backend. Do not enter sensitive personal information. You can review it and start again.</div>
            </>
          )}

          {error && <p className="destiny-error" role="alert">{error}</p>}
          {showGuide && <p className="destiny-info" role="status">Your answers guide suggestions only. Kingsmen will not submit an application or make an official education, funding or employment decision through this map.</p>}

          <div className="destiny-actions">
            {step === 4 ? (
              <>
                <button className="destiny-btn secondary" type="button" onClick={reset}>Start again</button>
                <a className="destiny-btn primary" href="/opportunities">Explore opportunities →</a>
              </>
            ) : (
              <>
                <button className="destiny-btn secondary" type="button" onClick={() => setShowGuide((value) => !value)}>{showGuide ? "Hide how it works" : "Learn how it works"}</button>
                <button className="destiny-btn primary" type="button" onClick={next}>{step === 1 ? "START NOW →" : step === 2 ? "Continue →" : "Build my starting map →"}</button>
              </>
            )}
          </div>
          {step !== 4 && <p className="destiny-info">Free to use. This flow currently keeps answers in page memory only; it does not create an account, save sensitive data or submit an application.</p>}
        </section>
      </div>

      <nav className="destiny-bottom" aria-label="Candidate navigation">
        <div className="destiny-nav">{nav.map(([icon, label, href]) => <a href={href} key={label} className={label === "My next steps" ? "active" : ""} aria-current={label === "My next steps" ? "page" : undefined}><span aria-hidden="true">{icon}</span>{label}</a>)}</div>
      </nav>
    </main>
  );
}
