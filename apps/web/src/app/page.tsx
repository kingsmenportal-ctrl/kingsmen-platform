"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const routes = [
  { id: "01", name: "Higher education", short: "UNIVERSITY / UoT / CAO", scope: "Universities, Universities of Technology, CAO and programme-choice preparation.", work: "Programme requirements · choice planning · submission evidence", lane: "Study" },
  { id: "02", name: "TVET & colleges", short: "TVET / NC(V) / NATED", scope: "Public TVET colleges, NC(V), NATED / Report 191 and accredited private-college routes.", work: "Entry criteria · intake checks · document readiness", lane: "Study" },
  { id: "03", name: "SETA & learnerships", short: "SETA / QCTO / SKILLS", scope: "Learnerships, occupational qualifications, skills programmes and verified training opportunities.", work: "Eligibility · source freshness · evidence checklist", lane: "Skills" },
  { id: "04", name: "Work experience", short: "INTERNSHIPS / APPRENTICESHIPS / WIL", scope: "Internships, apprenticeships, workplace-based learning and WIL opportunities.", work: "Placement criteria · supporting documents · progress tracking", lane: "Work" },
  { id: "05", name: "Employment", short: "VACANCIES / CAREER ROUTES", scope: "Entry-level and experienced employment opportunities, with careful source and deadline checks.", work: "Role fit · application pack · recorded submission", lane: "Work" },
  { id: "06", name: "Funding & support", short: "NSFAS / BURSARIES / PRACTICAL SUPPORT", scope: "Funding guidance, bursaries, sponsors and related accommodation or transport needs.", work: "Funding criteria · proof checklist · dependency planning", lane: "Support" },
];

const lifecycle = [
  { n: "01", title: "Find the route", text: "Start with a candidate's real destination, qualifications, location, timing and constraints—not a generic list of links." },
  { n: "02", title: "Check the source", text: "Separate an official institution directory from proof that a specific opportunity is open, current and relevant." },
  { n: "03", title: "Prepare the evidence", text: "Map each requirement to the document or answer that supports it. Keep private documents in the proper protected flow." },
  { n: "04", title: "Execute or guide", text: "Prepare the next step and use an approved route. If automation is blocked, use a controlled manual fallback rather than pretending it succeeded." },
  { n: "05", title: "Record what happened", text: "Keep timestamps, references and evidence. A candidate saying “submitted” is not the same as a provider confirming receipt." },
  { n: "06", title: "Follow through", text: "Surface missing information, provider replies, deadlines and the next safe action without inventing an outcome." },
];

const evidenceStates = [
  ["SOURCE FOUND", "A source or directory is identified.", "Not proof an opportunity is open."],
  ["CURRENTNESS CHECKED", "Date, source and available criteria are reviewed.", "Unknown or stale data stays visibly uncertain."],
  ["PREPARATION READY", "Known requirements have evidence or are marked missing.", "Readiness is not an application decision."],
  ["SUBMISSION REPORTED", "Candidate or operator reports that submission occurred.", "Not provider-confirmed receipt."],
  ["PROVIDER CONFIRMED", "A provider-originated reference or response supports the status.", "Only claim what that evidence proves."],
];

export default function HomePage() {
  const [filter, setFilter] = useState("All routes");
  const [expanded, setExpanded] = useState("01");
  const visibleRoutes = useMemo(() => filter === "All routes" ? routes : routes.filter((r) => r.lane === filter), [filter]);

  return (
    <main className="rh">
      <style>{`
        :root{color-scheme:dark}
        *{box-sizing:border-box}
        html{scroll-behavior:smooth}
        body{margin:0;background:#0a0d11}
        .rh{--ink:#0a0d11;--panel:#10151a;--line:#303630;--muted:#a4aaa0;--paper:#e9e5d9;--gold:#d7b56d;--rust:#9d5a3f;background:var(--ink);color:var(--paper);font-family:Arial,Helvetica,sans-serif;min-height:100vh}
        .rh a{color:inherit;text-decoration:none}
        .rh button{font:inherit}
        .rh-wrap{width:min(1320px,calc(100% - 52px));margin:0 auto}
        .rh-topline{border-bottom:1px solid var(--line);font:10px/1.4 monospace;letter-spacing:1.8px;text-transform:uppercase;color:#a4aaa0;padding:10px 0}
        .rh-topline .rh-wrap{display:flex;justify-content:space-between;gap:18px;flex-wrap:wrap}
        .rh-header{display:flex;align-items:center;justify-content:space-between;gap:25px;min-height:86px;border-bottom:1px solid var(--line)}
        .rh-brand{display:flex;align-items:center;gap:13px;min-width:190px}
        .rh-crest{width:43px;height:43px;border:1px solid var(--gold);display:grid;place-items:center;color:var(--gold);font:bold 21px/1 Georgia,serif;position:relative}
        .rh-crest:after{content:"";position:absolute;inset:5px;border:1px solid #d7b56d55}
        .rh-brandname{font:700 16px/1 Georgia,serif;letter-spacing:2.3px}
        .rh-brandtag{font:9px/1.6 monospace;letter-spacing:1.4px;color:var(--muted);margin-top:5px}
        .rh-nav{display:flex;align-items:center;justify-content:flex-end;gap:clamp(13px,2.4vw,32px);font:11px/1 monospace;text-transform:uppercase;letter-spacing:.7px;color:#c0c3b9}
        .rh-nav a:hover,.rh-link:hover{color:var(--gold)}
        .rh-nav .rh-navcta{padding:13px 16px;border:1px solid var(--gold);color:var(--gold)}
        .rh-hero{padding:62px 0 56px;border-bottom:1px solid var(--line)}
        .rh-hero-grid{display:grid;grid-template-columns:minmax(0,1.03fr) minmax(400px,.97fr);gap:50px;align-items:center}
        .rh-overline{font:10px/1.6 monospace;letter-spacing:2.4px;text-transform:uppercase;color:var(--gold);display:flex;align-items:center;gap:12px}
        .rh-overline:before{content:"";width:28px;height:1px;background:var(--gold)}
        .rh-h1{font:400 clamp(46px,6.4vw,88px)/.99 Georgia,'Times New Roman',serif;letter-spacing:-3.5px;margin:25px 0 25px;max-width:760px}
        .rh-h1 em{color:var(--gold);font-weight:400}
        .rh-lead{max-width:610px;color:#c1c4ba;font:16px/1.85 Arial,sans-serif}
        .rh-actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:29px}
        .rh-button{display:inline-flex;align-items:center;justify-content:center;gap:18px;padding:15px 18px;font:11px/1 monospace;letter-spacing:.8px;text-transform:uppercase;border:1px solid var(--gold);background:var(--gold);color:#10120f!important}
        .rh-button.secondary{background:transparent;color:var(--paper)!important;border-color:#5a6158}
        .rh-footnote{font:10px/1.8 monospace;color:#838b81;margin-top:18px}
        .rh-atlas{position:relative;border:1px solid #535748;background:#101510;min-height:445px;overflow:hidden}
        .rh-atlas-head{display:flex;justify-content:space-between;align-items:center;padding:15px 17px;border-bottom:1px solid #3a4036;font:9px/1.4 monospace;letter-spacing:1.2px;color:#a7ad9c}
        .rh-atlas-body{position:relative;padding:22px 20px 18px;min-height:350px}
        .rh-map{position:absolute;inset:0;width:100%;height:100%;opacity:.7}
        .rh-map path,.rh-map circle{vector-effect:non-scaling-stroke}
        .rh-node{position:relative;z-index:1;display:flex;align-items:center;gap:12px;padding:12px 13px;border:1px solid #444b3f;background:#111811eF;max-width:300px;margin-bottom:11px}
        .rh-node:nth-of-type(2){margin-left:8%}.rh-node:nth-of-type(3){margin-left:17%}.rh-node:nth-of-type(4){margin-left:26%}.rh-node:nth-of-type(5){margin-left:17%}.rh-node:nth-of-type(6){margin-left:8%}
        .rh-node-num{font:10px/1 monospace;color:var(--gold);border-right:1px solid #555b4c;padding-right:12px}
        .rh-node strong{display:block;font:14px/1.2 Georgia,serif}.rh-node small{display:block;font:9px/1.5 monospace;color:#a8b09f;margin-top:4px}
        .rh-atlas-foot{position:absolute;z-index:2;bottom:0;left:0;right:0;padding:12px 17px;background:#0c100df0;border-top:1px solid #3a4036;display:flex;justify-content:space-between;gap:12px;font:9px/1.5 monospace;letter-spacing:.5px;color:#a4aa9b}
        .rh-index{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid var(--line)}
        .rh-index div{padding:19px 18px;border-right:1px solid var(--line)}
        .rh-index div:last-child{border:0}.rh-index b{display:block;font:20px/1.2 Georgia,serif;color:var(--gold);font-weight:400}.rh-index span{display:block;font:9px/1.7 monospace;letter-spacing:1px;color:var(--muted);text-transform:uppercase;margin-top:5px}
        .rh-section{padding:76px 0;border-bottom:1px solid var(--line)}
        .rh-section-head{display:grid;grid-template-columns:.75fr 1.25fr;gap:50px;align-items:end;margin-bottom:31px}
        .rh-label{font:10px/1.6 monospace;letter-spacing:2px;text-transform:uppercase;color:var(--gold)}
        .rh-h2{font:400 clamp(33px,4.4vw,54px)/1.04 Georgia,'Times New Roman',serif;letter-spacing:-1.6px;margin:13px 0 0}
        .rh-intro{max-width:680px;color:var(--muted);font:14px/1.85 Arial,sans-serif}
        .rh-filterbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:24px 0}
        .rh-filter{border:1px solid #3b4238;background:transparent;color:#bfc3b7;padding:10px 13px;font:10px/1 monospace;text-transform:uppercase;letter-spacing:.7px;cursor:pointer}
        .rh-filter[aria-pressed=true]{background:var(--gold);border-color:var(--gold);color:#11140f}
        .rh-route-table{border-top:1px solid #4a5145}
        .rh-route-row{display:grid;grid-template-columns:70px minmax(190px,.8fr) minmax(220px,1.2fr) 34px;gap:22px;align-items:center;padding:21px 14px;border-bottom:1px solid var(--line);transition:background .15s}
        .rh-route-row:hover,.rh-route-row[data-open=true]{background:#111711}
        .rh-route-id{font:11px/1 monospace;color:var(--gold)}
        .rh-route-title{font:22px/1.15 Georgia,serif}
        .rh-route-sub{font:9px/1.7 monospace;letter-spacing:.6px;color:#9ea697;margin-top:7px}
        .rh-route-scope{font:12px/1.7 Arial,sans-serif;color:#b6bdb0}
        .rh-route-expand{border:1px solid #555d4e;background:transparent;color:var(--gold);width:32px;height:32px;cursor:pointer;font-size:17px}
        .rh-route-detail{grid-column:2/4;font:11px/1.8 monospace;color:var(--gold);padding:0 0 4px}
        .rh-lifecycle{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid #4b5146;border-left:1px solid #4b5146}
        .rh-stage{min-height:190px;padding:22px;border-right:1px solid #4b5146;border-bottom:1px solid #4b5146;position:relative}
        .rh-stage-no{font:10px/1 monospace;color:var(--gold)}
        .rh-stage h3{font:22px/1.2 Georgia,serif;font-weight:400;margin:25px 0 10px}
        .rh-stage p{font:12px/1.8 Arial,sans-serif;color:var(--muted);margin:0}
        .rh-evidence{display:grid;grid-template-columns:220px 1fr;border-top:1px solid #4b5146}
        .rh-evidence-label{padding:21px 16px;border-bottom:1px solid var(--line);font:11px/1.4 monospace;color:var(--gold);letter-spacing:.5px}
        .rh-evidence-copy{padding:19px 16px;border-bottom:1px solid var(--line);display:grid;grid-template-columns:1fr 1fr;gap:20px;font:12px/1.7 Arial,sans-serif;color:#c0c5b9}
        .rh-evidence-copy span{color:#8e988b}
        .rh-final{padding:62px 0 70px;display:grid;grid-template-columns:1fr auto;gap:30px;align-items:center}
        .rh-final h2{font:400 clamp(32px,4vw,49px)/1.06 Georgia,serif;margin:13px 0}
        .rh-final p{color:var(--muted);font:13px/1.8 Arial,sans-serif;max-width:650px}
        .rh-footer{border-top:1px solid var(--line);padding:22px 0 30px;display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;color:#879084;font:10px/1.8 monospace}
        .rh-footer-links{display:flex;gap:18px;flex-wrap:wrap}
        @media(max-width:900px){.rh-hero-grid{grid-template-columns:1fr;gap:35px}.rh-atlas{max-width:680px}.rh-section-head{grid-template-columns:1fr;gap:15px}.rh-route-row{grid-template-columns:42px minmax(150px,.8fr) minmax(170px,1.2fr) 32px;gap:13px}.rh-lifecycle{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:620px){.rh-wrap{width:calc(100% - 30px)}.rh-header{padding:16px 0;align-items:flex-start;flex-direction:column;gap:17px}.rh-nav{width:100%;justify-content:flex-start;gap:16px;flex-wrap:wrap;font-size:10px}.rh-nav .rh-navcta{padding:10px}.rh-hero{padding:44px 0}.rh-hero-grid{grid-template-columns:minmax(0,1fr)}.rh-h1{font-size:clamp(44px,13vw,65px);letter-spacing:-2.5px}.rh-lead{font-size:14px}.rh-atlas{min-height:420px}.rh-node{max-width:250px;padding:10px}.rh-node:nth-of-type(2){margin-left:2%}.rh-node:nth-of-type(3){margin-left:8%}.rh-node:nth-of-type(4){margin-left:14%}.rh-node:nth-of-type(5){margin-left:8%}.rh-node:nth-of-type(6){margin-left:2%}.rh-index{grid-template-columns:repeat(2,1fr)}.rh-index div:nth-child(2){border-right:0}.rh-index div:nth-child(-n+2){border-bottom:1px solid var(--line)}.rh-section{padding:52px 0}.rh-route-row{grid-template-columns:30px minmax(0,1fr) 32px;gap:12px;padding:18px 6px}.rh-route-title{font-size:20px}.rh-route-scope{grid-column:2/3}.rh-route-expand{grid-column:3;grid-row:1}.rh-route-detail{grid-column:2/4}.rh-lifecycle{grid-template-columns:1fr}.rh-stage{min-height:155px}.rh-evidence{grid-template-columns:1fr}.rh-evidence-label{padding:13px 10px 0;border-bottom:0}.rh-evidence-copy{grid-template-columns:1fr;gap:4px;padding:10px}.rh-final{grid-template-columns:1fr;padding:48px 0}.rh-final .rh-button{justify-self:start}.rh-topline .rh-wrap{font-size:8px;letter-spacing:1px}}
        @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.rh *{transition:none!important}}
      `}</style>

      <div className="rh-topline"><div className="rh-wrap"><span>THE KINGSmen ROUTE HOUSE / SOUTH AFRICA</span><span>PUBLIC FRONT DOOR · CANDIDATE-FIRST · EVIDENCE-LED</span></div></div>
      <header className="rh-wrap rh-header">
        <Link href="/" className="rh-brand" aria-label="Kingsmen Route House home">
          <span className="rh-crest" aria-hidden="true">K</span>
          <span><span className="rh-brandname">KINGSMEN</span><span className="rh-brandtag" style={{display:"block"}}>ROUTE HOUSE · OPPORTUNITY EXECUTION</span></span>
        </Link>
        <nav className="rh-nav" aria-label="Main navigation">
          <Link href="/pathways">Route universe</Link>
          <Link href="/how-it-works">The method</Link>
          <Link href="/trust">Evidence & trust</Link>
          <Link className="rh-navcta" href="/get-started">Enter the journey ↗</Link>
        </nav>
      </header>

      <section className="rh-hero">
        <div className="rh-wrap rh-hero-grid">
          <div>
            <div className="rh-overline">One candidate · multiple routes · one accountable journey</div>
            <h1 className="rh-h1">Opportunity is a route.<br/><em>Make every step count.</em></h1>
            <p className="rh-lead">Kingsmen is being built to help South African candidates move from “where do I start?” to a prepared, evidenced and traceable next step—across education, skills, work and funding. Not another directory. A route through the work.</p>
            <div className="rh-actions">
              <Link className="rh-button" href="/pathways">Explore the route universe <span>↗</span></Link>
              <Link className="rh-button secondary" href="/how-it-works">See the execution method <span>→</span></Link>
            </div>
            <div className="rh-footnote">NO GUARANTEED OUTCOMES · NO INVENTED OPENINGS · NO CLAIM OF PROVIDER DECISIONS WITHOUT PROOF</div>
          </div>
          <div className="rh-atlas" aria-label="Illustrative Kingsmen route atlas">
            <div className="rh-atlas-head"><span>FIELD ATLAS / 001</span><span>ROUTE LOGIC · ILLUSTRATIVE</span></div>
            <div className="rh-atlas-body">
              <svg className="rh-map" viewBox="0 0 520 400" preserveAspectRatio="none" aria-hidden="true">
                <defs><pattern id="rh-grid" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M 26 0 L 0 0 0 26" fill="none" stroke="#444c3d" strokeWidth=".45"/></pattern></defs>
                <rect width="520" height="400" fill="url(#rh-grid)"/>
                <path d="M28 22 C170 38 94 102 260 112 S420 152 210 193 S130 250 330 280 S430 330 482 372" fill="none" stroke="#d7b56d" strokeWidth="1.2" strokeDasharray="4 5"/>
                <path d="M48 80 L480 80 M48 160 L480 160 M48 240 L480 240 M48 320 L480 320" stroke="#5a624e" strokeWidth=".6" opacity=".6"/>
                <circle cx="260" cy="112" r="5" fill="#d7b56d"/><circle cx="210" cy="193" r="4" fill="#d7b56d"/><circle cx="330" cy="280" r="4" fill="#d7b56d"/>
              </svg>
              <div className="rh-node"><span className="rh-node-num">A / 01</span><span><strong>Discover a route</strong><small>GOAL · FIT · VERIFIED SOURCE</small></span></div>
              <div className="rh-node"><span className="rh-node-num">B / 02</span><span><strong>Map the requirements</strong><small>CRITERIA · DATES · DEPENDENCIES</small></span></div>
              <div className="rh-node"><span className="rh-node-num">C / 03</span><span><strong>Assemble the evidence</strong><small>DOCUMENTS · READINESS · GAPS</small></span></div>
              <div className="rh-node"><span className="rh-node-num">D / 04</span><span><strong>Record the action</strong><small>SUBMISSION · REFERENCE · TIME</small></span></div>
              <div className="rh-node"><span className="rh-node-num">E / 05</span><span><strong>Verify the response</strong><small>CANDIDATE REPORT ≠ PROVIDER PROOF</small></span></div>
              <div className="rh-node"><span className="rh-node-num">F / 06</span><span><strong>Choose the next move</strong><small>FOLLOW-UP · ALTERNATIVE · SUPPORT</small></span></div>
              <div className="rh-atlas-foot"><span>ROUTE CONTINUES UNTIL THE NEXT ACTION IS CLEAR</span><span>NOT LIVE CANDIDATE DATA</span></div>
            </div>
          </div>
        </div>
      </section>

      <div className="rh-wrap rh-index" aria-label="Kingsmen operating principles">
        <div><b>06</b><span>Connected pathways</span></div>
        <div><b>01</b><span>Candidate journey</span></div>
        <div><b>Proof first</b><span>Evidence before claims</span></div>
        <div><b>Human-led</b><span>Decisions stay with authorities</span></div>
      </div>

      <section className="rh-section" id="routes">
        <div className="rh-wrap">
          <div className="rh-section-head"><div><div className="rh-label">01 / The route universe</div><h2 className="rh-h2">Six routes.<br/>One connected map.</h2></div><div className="rh-intro">Candidates rarely have one isolated need. A study route may depend on funding, accommodation or transport. A qualification route may lead into workplace learning and employment. Kingsmen is designed to make those connections visible while keeping each application, requirement and decision traceable.</div></div>
          <div className="rh-filterbar" role="group" aria-label="Filter routes">
            {["All routes","Study","Skills","Work","Support"].map((f)=><button key={f} className="rh-filter" aria-pressed={filter===f} onClick={()=>setFilter(f)}>{f}</button>)}
          </div>
          <div className="rh-route-table">
            {visibleRoutes.map((r)=><article key={r.id} className="rh-route-row" data-open={expanded===r.id}>
              <span className="rh-route-id">{r.id}</span>
              <div><div className="rh-route-title">{r.name}</div><div className="rh-route-sub">{r.short}</div></div>
              <div className="rh-route-scope">{r.scope}</div>
              <button className="rh-route-expand" aria-label={(expanded===r.id?"Collapse ":"Expand ")+r.name} aria-expanded={expanded===r.id} onClick={()=>setExpanded(expanded===r.id?"":r.id)}>{expanded===r.id?"−":"+"}</button>
              {expanded===r.id&&<div className="rh-route-detail">WORKBENCH FOCUS → {r.work}</div>}
            </article>)}
          </div>
          <div style={{marginTop:24}}><Link className="rh-link" href="/pathways" style={{font:"11px monospace",letterSpacing:".8px",textTransform:"uppercase",color:"var(--gold)"}}>Open the full pathway guide ↗</Link></div>
        </div>
      </section>

      <section className="rh-section">
        <div className="rh-wrap">
          <div className="rh-section-head"><div><div className="rh-label">02 / The execution lifecycle</div><h2 className="rh-h2">Not just where to go.<br/>What happens next.</h2></div><div className="rh-intro">The Route House is the public front door to a more disciplined service. Each step should produce a clear next action, a known owner, and—where the action matters—evidence that records what actually happened. If a source or integration fails, uncertainty must remain visible.</div></div>
          <div className="rh-lifecycle">{lifecycle.map((s)=><article className="rh-stage" key={s.n}><div className="rh-stage-no">STEP / {s.n}</div><h3>{s.title}</h3><p>{s.text}</p></article>)}</div>
        </div>
      </section>

      <section className="rh-section">
        <div className="rh-wrap">
          <div className="rh-section-head"><div><div className="rh-label">03 / Evidence discipline</div><h2 className="rh-h2">A status is a claim.<br/>Evidence gives it weight.</h2></div><div className="rh-intro">Kingsmen must not turn a hopeful status into a false promise. The record should show the source, timestamp and strength of the evidence behind each claim. A source listing a college does not prove applications are open; a candidate's report does not prove a provider received the application.</div></div>
          <div className="rh-evidence">{evidenceStates.map(([label,copy,caveat])=><div key={label} style={{display:"contents"}}><div className="rh-evidence-label">{label}</div><div className="rh-evidence-copy"><div>{copy}</div><div><span>{caveat}</span></div></div></div>)}</div>
          <p className="rh-footnote">TRUST PRINCIPLE / STALE, MISSING OR UNVERIFIED INFORMATION MUST NOT BE PRESENTED AS CURRENT FACT.</p>
        </div>
      </section>

      <section className="rh-section">
        <div className="rh-wrap">
          <div className="rh-section-head"><div><div className="rh-label">04 / Built for real life in South Africa</div><h2 className="rh-h2">A route must survive<br/>the real world.</h2></div><div className="rh-intro">The experience must account for application windows, changing requirements, supporting documents, identity review, limited connectivity and the practical dependencies around a candidate's next step. Where an automated portal action is blocked, the system must expose the block and route to a controlled manual fallback—not manufacture success.</div></div>
          <div className="rh-lifecycle">
            <article className="rh-stage"><div className="rh-stage-no">FIELD NOTE / 01</div><h3>Requirements change</h3><p>Check current official sources before describing a programme, vacancy, deadline or eligibility rule as open and current.</p></article>
            <article className="rh-stage"><div className="rh-stage-no">FIELD NOTE / 02</div><h3>Documents are sensitive</h3><p>Use protected document flows for identity and supporting evidence. This public preview does not accept or store identity documents.</p></article>
            <article className="rh-stage"><div className="rh-stage-no">FIELD NOTE / 03</div><h3>People decide outcomes</h3><p>Institutions, employers and funders retain their decision authority. Kingsmen supports preparation, tracking and clear follow-through.</p></article>
          </div>
        </div>
      </section>

      <section className="rh-wrap rh-final">
        <div><div className="rh-label">05 / Begin with the route</div><h2>The next step should be clearer<br/>than the starting point.</h2><p>This temporary public preview explains the Kingsmen service and route logic. It is not candidate registration, does not create an application record and is not connected to the protected candidate systems. Do not submit identity numbers or private documents here.</p></div>
        <Link className="rh-button" href="/get-started">Explore early access <span>↗</span></Link>
      </section>

      <footer className="rh-wrap rh-footer">
        <div>© KINGSMEN · ROUTE HOUSE / SOUTH AFRICA<br/>PUBLIC WEBSITE · N18</div>
        <div className="rh-footer-links"><Link href="/pathways">Route universe</Link><Link href="/how-it-works">Method</Link><Link href="/trust">Evidence & trust</Link><Link href="/get-started">Early access</Link></div>
        <div>NO GUARANTEED OUTCOMES<br/>PROOF BEFORE CLAIMS</div>
      </footer>
    </main>
  );
}
