"use client";

import { useMemo, useState } from "react";

type Workspace = {
  title: string;
  description: string;
  href: string;
  category: "Career" | "Personal" | "Operations";
  label: string;
};

const workspaces: Workspace[] = [
  { title: "Personal Job Desk", description: "Organise your search, track applications and keep your next career move moving.", href: "/personal-job-desk", category: "Career", label: "Career workspace" },
  { title: "CV Revamp", description: "Work on a clearer, stronger CV tailored to the opportunities you want.", href: "/cv-revamp", category: "Career", label: "CV & profile" },
  { title: "Candidate Portal", description: "Continue your candidate journey and review your application progress.", href: "/candidate", category: "Career", label: "Candidate tools" },
  { title: "Free Destiny Map", description: "Explore your direction with a guided personal reflection experience.", href: "/free-destiny-map", category: "Personal", label: "Personal growth" },
  { title: "JARVIS", description: "Open the assistant workspace and available command tools.", href: "/jarvis", category: "Operations", label: "AI assistant" },
  { title: "Founder Command", description: "Access founder-facing controls and operating workspaces.", href: "/founder-command", category: "Operations", label: "Founder tools" }
];

const categories = ["All", "Career", "Personal", "Operations"] as const;

export default function HomePage() {
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [query, setQuery] = useState("");
  const visibleWorkspaces = useMemo(() => workspaces.filter((item) => {
    const matchesCategory = category === "All" || item.category === category;
    const searchText = `${item.title} ${item.description} ${item.label}`.toLowerCase();
    return matchesCategory && searchText.includes(query.trim().toLowerCase());
  }), [category, query]);

  return (
    <main className="portal-shell">
      <style jsx global>{`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #080d19; color: #f4f6fb; }
        a { color: inherit; text-decoration: none; }
        button, input { font: inherit; }
        .portal-shell { min-height: 100vh; background: radial-gradient(ellipse at 82% 0%, rgba(27, 76, 105, .24), transparent 36%), #080d19; }
        .topbar { display:flex; align-items:center; justify-content:space-between; gap:20px; padding:22px clamp(20px, 5vw, 72px); border-bottom:1px solid rgba(255,255,255,.09); }
        .brand { display:flex; align-items:center; gap:12px; font-weight:750; letter-spacing:.04em; }
        .brand-mark { display:grid; place-items:center; width:40px; height:40px; border:1px solid #d5b56c; border-radius:12px; color:#e8ca83; font-family:Georgia,serif; font-size:21px; }
        .brand small { display:block; margin-top:3px; color:#8f9bb0; font-size:10px; letter-spacing:.2em; font-weight:600; }
        .top-actions { display:flex; align-items:center; gap:12px; }
        .text-link { color:#c4ccda; font-size:13px; padding:10px 12px; }
        .button { display:inline-flex; align-items:center; justify-content:center; border:1px solid #d4b66e; border-radius:10px; padding:11px 16px; background:#d4b66e; color:#111827; font-weight:750; font-size:13px; cursor:pointer; transition:transform .15s, background .15s; }
        .button:hover { transform:translateY(-1px); background:#e6ca87; }
        .button.secondary { color:#f3dca1; background:transparent; border-color:rgba(212,182,110,.45); }
        .hero { max-width:1180px; margin:0 auto; padding:clamp(52px, 8vw, 96px) 24px 44px; }
        .eyebrow { display:flex; align-items:center; gap:10px; color:#e5c77d; font-size:11px; letter-spacing:.2em; text-transform:uppercase; font-weight:750; }
        .eyebrow:before { content:""; width:28px; height:1px; background:#d4b66e; }
        h1 { max-width:790px; margin:20px 0 18px; font-family:Georgia, "Times New Roman", serif; font-weight:500; font-size:clamp(42px, 6.4vw, 76px); line-height:1.04; letter-spacing:-.035em; }
        h1 span { color:#e2c477; }
        .hero-copy { max-width:620px; color:#aab5c7; font-size:17px; line-height:1.8; margin:0; }
        .hero-actions { display:flex; flex-wrap:wrap; gap:12px; margin-top:28px; }
        .section { max-width:1180px; margin:0 auto; padding:20px 24px 76px; }
        .section-heading { display:flex; align-items:flex-end; justify-content:space-between; gap:24px; margin-bottom:22px; }
        .section-heading h2 { margin:0; font-family:Georgia,serif; font-size:29px; font-weight:500; }
        .section-heading p { margin:8px 0 0; color:#8f9bb0; font-size:13px; }
        .workspace-count { color:#8f9bb0; font-size:12px; white-space:nowrap; }
        .toolbar { display:flex; align-items:center; gap:12px; margin-bottom:20px; flex-wrap:wrap; }
        .search { flex:1; min-width:210px; background:#0e1626; color:#f4f6fb; border:1px solid #253146; border-radius:10px; padding:13px 15px; outline:none; }
        .search:focus { border-color:#d4b66e; box-shadow:0 0 0 3px rgba(212,182,110,.1); }
        .filters { display:flex; gap:7px; flex-wrap:wrap; }
        .filter { padding:10px 13px; color:#9eabc0; background:#0e1626; border:1px solid #253146; border-radius:9px; font-size:12px; cursor:pointer; }
        .filter.active { color:#f4d995; border-color:#8e7541; background:#211d15; }
        .workspace-grid { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:14px; }
        .workspace-card { display:flex; flex-direction:column; min-height:214px; padding:22px; border:1px solid #202b3e; border-radius:15px; background:linear-gradient(145deg, rgba(20,31,49,.95), rgba(13,20,33,.95)); transition:transform .18s, border-color .18s; }
        .workspace-card:hover { transform:translateY(-3px); border-color:#6e5c37; }
        .card-top { display:flex; justify-content:space-between; align-items:center; gap:12px; }
        .card-icon { display:grid; place-items:center; width:37px; height:37px; border-radius:10px; border:1px solid rgba(212,182,110,.3); background:rgba(212,182,110,.08); color:#e5c77d; font-size:17px; }
        .card-label { color:#8f9bb0; font-size:10px; letter-spacing:.1em; text-transform:uppercase; }
        .workspace-card h3 { margin:20px 0 8px; font-size:17px; font-weight:650; }
        .workspace-card p { color:#9eabc0; font-size:13px; line-height:1.65; margin:0 0 22px; }
        .card-link { margin-top:auto; color:#e5c77d; font-size:12px; font-weight:700; }
        .empty-state { grid-column:1/-1; padding:34px; border:1px dashed #29364b; border-radius:12px; text-align:center; color:#aab5c7; }
        .footer { max-width:1180px; margin:0 auto; padding:22px 24px 32px; border-top:1px solid rgba(255,255,255,.08); display:flex; flex-wrap:wrap; justify-content:space-between; gap:14px; color:#77849a; font-size:11px; }
        .footer strong { color:#b8c1d0; font-weight:600; }
        @media(max-width:820px) { .workspace-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .section-heading { align-items:flex-start; flex-direction:column; gap:10px; } }
        @media(max-width:560px) { .topbar { padding:16px 18px; } .top-actions .text-link { display:none; } .hero { padding-top:54px; } .hero-copy { font-size:15px; } .workspace-grid { grid-template-columns:1fr; } .workspace-card { min-height:190px; } .filters { width:100%; } .filter { flex:1; } }
      `}</style>

      <header className="topbar">
        <a className="brand" href="/" aria-label="Kingsmen Portal home">
          <span className="brand-mark" aria-hidden="true">K</span>
          <span>KINGSMEN<small>PORTAL</small></span>
        </a>
        <nav className="top-actions" aria-label="Main navigation">
          <a className="text-link" href="#workspaces">Explore workspaces</a>
          <a className="button secondary" href="/auth">Sign in <span aria-hidden="true">↗</span></a>
        </nav>
      </header>

      <section className="hero">
        <div className="eyebrow">One portal. Your next chapter.</div>
        <h1>Make your next move<br /><span>count.</span></h1>
        <p className="hero-copy">A connected space for your career, personal direction and the tools that help you move forward. Choose a workspace and pick up where you need to.</p>
        <div className="hero-actions">
          <a className="button" href="/personal-job-desk">Open my job desk <span aria-hidden="true">&nbsp;→</span></a>
          <a className="button secondary" href="#workspaces">Explore all workspaces</a>
        </div>
      </section>

      <section className="section" id="workspaces">
        <div className="section-heading">
          <div><h2>Your workspaces</h2><p>Purpose-built tools, gathered in one place.</p></div>
          <div className="workspace-count">{visibleWorkspaces.length} workspace{visibleWorkspaces.length === 1 ? "" : "s"}</div>
        </div>
        <div className="toolbar">
          <input className="search" type="search" placeholder="Search workspaces…" aria-label="Search workspaces" value={query} onChange={(event) => setQuery(event.target.value)} />
          <div className="filters" aria-label="Filter workspaces">
            {categories.map((item) => <button key={item} type="button" className={`filter ${category === item ? "active" : ""}`} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}
          </div>
        </div>
        <div className="workspace-grid">
          {visibleWorkspaces.map((item, index) => (
            <a className="workspace-card" href={item.href} key={item.title}>
              <div className="card-top"><span className="card-icon" aria-hidden="true">{["↗", "✦", "◎", "✧", "⌘", "◈"][workspaces.indexOf(item)]}</span><span className="card-label">{item.label}</span></div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <span className="card-link">Open workspace <span aria-hidden="true">→</span></span>
            </a>
          ))}
          {visibleWorkspaces.length === 0 && <div className="empty-state">No workspaces match that search. Try a different term or category.</div>}
        </div>
      </section>

      <footer className="footer">
        <span><strong>KINGSMEN PORTAL</strong> · Built to help you move forward.</span>
        <span>Private workspace · Use sign in for account access</span>
      </footer>
    </main>
  );
}
