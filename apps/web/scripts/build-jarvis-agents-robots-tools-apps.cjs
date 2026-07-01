const fs = require("fs");
const path = require("path");
const root = process.cwd();
const now = new Date().toISOString();
function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
}
function write(file, text) {
  const abs = path.join(root, file);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, text, "utf8");
}
function copy(src, dst) {
  const absDst = path.join(root, dst);
  fs.mkdirSync(path.dirname(absDst), { recursive: true });
  fs.copyFileSync(path.join(root, src), absDst);
}
function esc(v) {
  return String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
function js(v) {
  return JSON.stringify(v).replaceAll("<", "\\u003c");
}
const inventory = readJson("reports/jarvis/JARVIS_FULL_REPO_INVENTORY_LATEST.json");
const hitCounts = inventory.hitCounts || {};
const providers = inventory.providerMatrix || [];
const repoFiles = [
  ...(inventory.jarvisFiles || []),
  ...(inventory.apiRouteFiles || []),
  ...(inventory.coreFiles || []),
  ...(inventory.scriptFiles || []),
  ...(inventory.validatorFiles || [])
];
const uniqueRepoFiles = [...new Set(repoFiles)].sort();
const groups = {
  agents: {
    title: "Agents",
    subtitle: "Reasoning, command, scout, operator and orchestration agents.",
    terms: ["agent", "agents", "Jarvis Agent", "OpenClaw", "brain", "router", "orchestrator", "operator", "scout", "W15", "decision", "command"]
  },
  robots: {
    title: "Robots",
    subtitle: "Automation workers, runners, scouts, bots and execution robots.",
    terms: ["robot", "robots", "bot", "bots", "worker", "workers", "runner", "automation", "playwright", "scout", "probe", "queue", "crawler"]
  },
  tools: {
    title: "Tools",
    subtitle: "Tool router, validators, proof tools, command actions and runtime tools.",
    terms: ["tool", "tools", "command", "validator", "validate", "proof", "evidence", "adapter", "registry", "PowerShell", "Docker", "Git", "Netlify"]
  },
  apps: {
    title: "Apps",
    subtitle: "Connected app ecosystem and provider surfaces.",
    terms: ["GitHub", "Netlify", "Google Drive", "Gmail", "Google Calendar", "Airtable", "Neon", "Supabase", "Canva", "PayFast", "OpenAI", "Wisebase", "B12", "Norton", "Replit", "Catalyst", "Lovable", "Namecheap", "Softonic", "Vivin", "Voice Generator"]
  }
};
function collectGroup(group) {
  const terms = group.terms.map(t => t.toLowerCase());
  const files = uniqueRepoFiles.filter(f => {
    const low = f.toLowerCase();
    return terms.some(t => low.includes(t.toLowerCase()));
  });
  return {
    title: group.title,
    subtitle: group.subtitle,
    fileCount: files.length,
    terms: group.terms,
    files: files.slice(0, 300)
  };
}
const matrix = {
  createdAt: now,
  source: "reports/jarvis/JARVIS_FULL_REPO_INVENTORY_LATEST.json",
  agents: collectGroup(groups.agents),
  robots: collectGroup(groups.robots),
  tools: collectGroup(groups.tools),
  apps: collectGroup(groups.apps),
  inventoryCounts: {
    scannedFiles: inventory.scannedFileCount,
    jarvisFiles: inventory.jarvisFileCount,
    apiRoutes: inventory.apiRouteFileCount,
    coreFiles: inventory.coreFileCount,
    scripts: inventory.scriptFileCount,
    evidenceFiles: inventory.validatorFileCount,
    totalHits: inventory.totalHitCount
  },
  hitCounts,
  providers
};
write("reports/jarvis/JARVIS_AGENTS_ROBOTS_TOOLS_APPS_MATRIX_LATEST.json", JSON.stringify(matrix, null, 2));
function listFiles(items) {
  if (!items.length) return "None found.";
  return items.map(x => "- " + x).join("\n");
}
const matrixMd = [
  "# JARVIS AGENTS / ROBOTS / TOOLS / APPS MATRIX",
  "",
  "This report surfaces what was missing from the live Jarvis screen.",
  "",
  "Rule:",
  "Agents, robots, tools and apps must be visible in Jarvis, but no connection may be called live without runtime proof.",
  "",
  "Counts:",
  `- Agents file matches: ${matrix.agents.fileCount}`,
  `- Robots file matches: ${matrix.robots.fileCount}`,
  `- Tools file matches: ${matrix.tools.fileCount}`,
  `- Apps file matches: ${matrix.apps.fileCount}`,
  "",
  "## Agents",
  matrix.agents.subtitle,
  "",
  listFiles(matrix.agents.files),
  "",
  "## Robots",
  matrix.robots.subtitle,
  "",
  listFiles(matrix.robots.files),
  "",
  "## Tools",
  matrix.tools.subtitle,
  "",
  listFiles(matrix.tools.files),
  "",
  "## Apps",
  matrix.apps.subtitle,
  "",
  listFiles(matrix.apps.files)
].join("\n");
write("reports/jarvis/JARVIS_AGENTS_ROBOTS_TOOLS_APPS_MATRIX_LATEST.md", matrixMd);
const modules = [
  ["N00", "Constitution"], ["N01", "Foundation"], ["N02", "Backend Kernel"], ["N03", "Truth Vault"], ["N04", "Candidate Core"],
  ["N05", "Document Vault"], ["N06", "Route Universe"], ["N07", "Airtable Sync"], ["N08", "Control Plane"], ["N09", "Notifications"],
  ["N10", "Finance"], ["N11", "AI Decision"], ["N12", "Governance"], ["N13", "Observability"], ["N14", "Integrations"],
  ["N15", "Opportunity Engine"], ["N16", "Execution"], ["N17", "Founder Plane"], ["N18", "Public Site"], ["N19", "Mobile PWA"], ["N20", "Final Integration"]
];
const appList = [
  "GitHub", "Netlify", "Google Drive", "Gmail", "Google Calendar", "Airtable", "Neon", "Supabase", "Canva", "PayFast",
  "OpenAI", "AI Wisebase", "B12", "Norton", "Replit", "Catalyst", "Lovable", "Namecheap", "Softonic", "Vivin", "Voice Generator"
];
function groupCards(groupKey) {
  const g = matrix[groupKey];
  return `
    <div class="groupHero">
      <div>
        <p class="kicker">${esc(g.title)}</p>
        <h2>${esc(g.title)} Command Mesh</h2>
        <p>${esc(g.subtitle)}</p>
      </div>
      <b>${g.fileCount}</b>
    </div>
    <div class="miniGrid">
      ${g.terms.map(t => `<button class="miniCard" data-detail="${esc(g.title + " term: " + t)}"><span>${esc(t)}</span><small>repo search term</small></button>`).join("")}
    </div>
    <div class="fileList">${g.files.slice(0, 80).map(f => `<div>${esc(f)}</div>`).join("") || "<div>No files found.</div>"}</div>
  `;
}
const providerCards = providers.map(p => `
  <button class="miniCard">
    <span>${esc(p.provider)}</span>
    <small>${esc(p.repoStatus)} · ${p.hitCount} hits · ${p.adapterFileCount} adapter-like</small>
  </button>
`).join("");
const moduleCards = modules.map(m => `
  <button class="miniCard">
    <span>${esc(m[0])}</span>
    <small>${esc(m[1])} · live map required</small>
  </button>
`).join("");
const appCards = appList.map(a => {
  const p = providers.find(x => String(x.provider).toLowerCase() === a.toLowerCase());
  const status = p ? p.repoStatus : "REGISTERED / NEEDS REPO PROOF";
  const hits = p ? p.hitCount : 0;
  return `<button class="miniCard"><span>${esc(a)}</span><small>${esc(status)} · ${hits} hits</small></button>`;
}).join("");
const data = {
  createdAt: now,
  matrix,
  modules,
  appList,
  providers,
  hitCounts
};
const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Kingsmen Jarvis Command Mesh</title>
<style>
:root{
  --bg:#020617; --panel:rgba(8,18,42,.86); --panel2:rgba(15,23,42,.78);
  --gold:#f6d77c; --blue:#38bdf8; --text:#f8fbff; --muted:#a6b4cc; --line:rgba(246,215,124,.24);
}
*{box-sizing:border-box}
body{
  margin:0; min-height:100vh; color:var(--text); font-family:Inter,Segoe UI,Arial,sans-serif;
  background:
    radial-gradient(circle at 20% 0%,rgba(56,189,248,.22),transparent 30%),
    radial-gradient(circle at 80% 0%,rgba(246,215,124,.14),transparent 28%),
    linear-gradient(135deg,#020617,#071126 48%,#020617);
}
.shell{max-width:1880px;margin:0 auto;padding:24px}
.top{display:grid;grid-template-columns:1.2fr .8fr;gap:16px}
.panel,.hero{border:1px solid var(--line);background:linear-gradient(180deg,rgba(8,18,42,.88),rgba(2,6,23,.9));border-radius:28px;padding:22px;box-shadow:0 0 60px rgba(56,189,248,.14)}
.kicker{letter-spacing:.28em;text-transform:uppercase;color:var(--gold);font-size:12px;font-weight:900}
h1{font-size:clamp(54px,8vw,132px);margin:12px 0;line-height:.86;letter-spacing:-.08em}
h2{margin:0 0 8px}
p{color:#dbe7ff;line-height:1.5}
.orb{width:128px;height:128px;border-radius:50%;background:radial-gradient(circle,#fff 0 4%,#f6d77c 9%,#38bdf8 30%,#071126 64%,#020617);border:1px solid var(--gold);box-shadow:0 0 50px rgba(56,189,248,.55);display:grid;place-items:center;font-size:56px;font-weight:950;margin-top:16px}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.stat{border:1px solid rgba(56,189,248,.22);border-radius:18px;padding:14px;background:rgba(2,6,23,.52)}
.stat span{display:block;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.14em}
.stat b{display:block;color:var(--gold);font-size:28px;margin-top:6px}
.tabs{display:flex;gap:10px;flex-wrap:wrap;margin:16px 0}
button{cursor:pointer;border:1px solid rgba(246,215,124,.34);border-radius:14px;background:rgba(246,215,124,.1);color:var(--text);font-weight:900;padding:12px 14px}
button.active,button:hover{border-color:var(--gold);background:rgba(246,215,124,.2)}
.grid2{display:grid;grid-template-columns:1fr .85fr;gap:16px;margin-top:16px}
.groupHero{display:flex;justify-content:space-between;gap:20px;align-items:center;border:1px solid rgba(246,215,124,.22);border-radius:22px;padding:18px;background:rgba(2,6,23,.54)}
.groupHero b{font-size:56px;color:var(--gold)}
.miniGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:12px}
.miniCard{text-align:left;display:flex;flex-direction:column;gap:8px;min-height:82px}
.miniCard span{color:var(--gold)}
.miniCard small{color:var(--muted);line-height:1.35}
.fileList{margin-top:12px;border:1px solid rgba(56,189,248,.18);border-radius:18px;background:rgba(2,6,23,.62);max-height:430px;overflow:auto;padding:12px;font-family:Consolas,monospace;font-size:12px;color:#c7f4ff}
.fileList div{padding:6px;border-bottom:1px solid rgba(255,255,255,.06)}
.console{white-space:pre-wrap;font-family:Consolas,monospace;min-height:420px;border-radius:20px;border:1px solid rgba(94,240,178,.22);background:rgba(0,8,18,.82);padding:16px;color:#d4ffe8;line-height:1.55}
.voiceRow{display:flex;gap:10px;flex-wrap:wrap}
textarea{width:100%;min-height:90px;margin-top:12px;border-radius:16px;background:rgba(2,6,23,.72);border:1px solid var(--line);color:var(--text);padding:14px;font:inherit}
.footer{margin-top:16px;display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
@media(max-width:1200px){.top,.grid2{grid-template-columns:1fr}.stats,.miniGrid,.footer{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="shell">
  <section class="top">
    <div class="hero">
      <p class="kicker">KINGSMEN COMMAND · AGENTS · ROBOTS · TOOLS · APPS · JARVIS</p>
      <h1>JARVIS COMMAND MESH</h1>
      <p>Commander, your agents, robots, tools and apps are now surfaced as first-class Jarvis systems. Nothing is called connected without runtime proof. Nothing is hidden behind a blank dashboard.</p>
      <div class="orb">J</div>
      <div class="voiceRow">
        <button id="greet">Greet Commander</button>
        <button id="speakMesh">Speak Mesh Status</button>
        <button id="listen">Wake Listener</button>
        <button id="stopVoice">Stop Voice</button>
      </div>
    </div>
    <div class="panel">
      <h2>Repo inventory truth</h2>
      <div class="stats">
        <div class="stat"><span>Scanned</span><b>${inventory.scannedFileCount}</b></div>
        <div class="stat"><span>Jarvis</span><b>${inventory.jarvisFileCount}</b></div>
        <div class="stat"><span>Agents</span><b>${matrix.agents.fileCount}</b></div>
        <div class="stat"><span>Robots</span><b>${matrix.robots.fileCount}</b></div>
        <div class="stat"><span>Tools</span><b>${matrix.tools.fileCount}</b></div>
        <div class="stat"><span>Apps</span><b>${matrix.apps.fileCount}</b></div>
        <div class="stat"><span>Evidence</span><b>${inventory.validatorFileCount}</b></div>
        <div class="stat"><span>Total hits</span><b>${inventory.totalHitCount}</b></div>
      </div>
    </div>
  </section>
  <section class="grid2">
    <div class="panel">
      <div class="tabs">
        <button class="tab active" data-view="agents">Agents</button>
        <button class="tab" data-view="robots">Robots</button>
        <button class="tab" data-view="tools">Tools</button>
        <button class="tab" data-view="apps">Apps</button>
        <button class="tab" data-view="providers">Providers</button>
        <button class="tab" data-view="modules">N00-N20</button>
        <button class="tab" data-view="evidence">Evidence</button>
      </div>
      <div id="view"></div>
    </div>
    <div class="panel">
      <h2>Jarvis output</h2>
      <div class="console" id="console">JARVIS WAKE:
Welcome to Kingsmen Command, Commander.
Your command mesh is now visible:
- Agents
- Robots
- Tools
- Apps
- Providers
- N00-N20
- Evidence
- Voice
- OpenClaw
- Playwright
Runtime truth:
Browser Jarvis will not fake PowerShell, Git, Docker, PostgreSQL, provider actions or Playwright execution. Those require local Commander runtime proof.</div>
      <textarea id="cmd" placeholder="Ask Jarvis about agents, robots, tools, apps, providers, OpenClaw, Playwright, evidence..."></textarea>
      <button id="send">Send Command</button>
    </div>
  </section>
  <section class="footer">
    <div class="panel"><h2>OpenClaw</h2><p>${hitCounts.OPENCLAW_GATEWAY || 0} gateway hits. Command registry and policy gate required.</p></div>
    <div class="panel"><h2>Playwright</h2><p>${hitCounts.PLAYWRIGHT_SCOUT_MAP || 0} scout/MAP hits. Scout only, no bypass.</p></div>
    <div class="panel"><h2>Voice</h2><p>${hitCounts.VOICE_WAKE_SPEECH || 0} voice hits. Speech must be testable.</p></div>
    <div class="panel"><h2>Fake gate</h2><p>${hitCounts.FAKE_PLACEHOLDER_MOCK_RISKS || 0} risk hits. Every live claim needs review.</p></div>
  </section>
</div>
<script>
window.__JARVIS_MESH__ = ${js(data)};
const d = window.__JARVIS_MESH__;
const view = document.getElementById("view");
const consoleEl = document.getElementById("console");
function log(x){ consoleEl.textContent += "\\n" + x; consoleEl.scrollTop = consoleEl.scrollHeight; }
function speak(text){
  if(!("speechSynthesis" in window)){ log("VOICE_BLOCKED: speechSynthesis unavailable. Not faking voice."); return; }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = .94; u.pitch = .86; u.volume = 1;
  window.speechSynthesis.speak(u);
}
const views = {
  agents: ${js(groupCards("agents"))},
  robots: ${js(groupCards("robots"))},
  tools: ${js(groupCards("tools"))},
  apps: ${js(`<div class="groupHero"><div><p class="kicker">Apps</p><h2>Connected Apps Ecosystem</h2><p>All registered apps are surfaced. Runtime proof is still required before connected claims.</p></div><b>${matrix.apps.fileCount}</b></div><div class="miniGrid">${appCards}</div><div class="fileList">${matrix.apps.files.slice(0,80).map(f=>`<div>${esc(f)}</div>`).join("")}</div>`)},
  providers: ${js(`<div class="groupHero"><div><p class="kicker">Providers</p><h2>Provider Matrix</h2><p>Repo status only. Runtime proof required for connected status.</p></div><b>${providers.length}</b></div><div class="miniGrid">${providerCards}</div>`)},
  modules: ${js(`<div class="groupHero"><div><p class="kicker">N00-N20</p><h2>Kingsmen Work Map</h2><p>Modules are not minimized. Every module must open to files, proof, validators and next command.</p></div><b>${modules.length}</b></div><div class="miniGrid">${moduleCards}</div>`)},
  evidence: ${js(`<div class="groupHero"><div><p class="kicker">Evidence</p><h2>Proof Centre</h2><p>Inventory, provider matrix, voice inventory, fake-risk and OpenClaw/Playwright proof are public review reports.</p></div><b>${inventory.validatorFileCount}</b></div><div class="miniGrid"><a class="miniCard" href="/jarvis/reports/JARVIS_AGENTS_ROBOTS_TOOLS_APPS_MATRIX_LATEST.md" target="_blank"><span>Agent Matrix</span><small>Open proof</small></a><a class="miniCard" href="/jarvis/reports/JARVIS_FULL_REPO_INVENTORY_LATEST.md" target="_blank"><span>Inventory</span><small>Open proof</small></a><a class="miniCard" href="/jarvis/reports/JARVIS_PROVIDER_CONNECTION_MATRIX_LATEST.md" target="_blank"><span>Providers</span><small>Open proof</small></a><a class="miniCard" href="/jarvis/reports/JARVIS_FAKE_PLACEHOLDER_RISK_LATEST.md" target="_blank"><span>Fake Risk</span><small>Open proof</small></a></div>`)}
};
function render(name){
  view.innerHTML = views[name];
  log("VIEW_OPENED: " + name.toUpperCase());
}
document.querySelectorAll(".tab").forEach(btn=>{
  btn.onclick = ()=>{
    document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");
    render(btn.dataset.view);
  };
});
document.getElementById("greet").onclick = ()=> speak("Welcome to Kingsmen Command, Commander. Your agents, robots, tools and apps command mesh is now visible.");
document.getElementById("speakMesh").onclick = ()=> speak("Commander, Jarvis found " + d.matrix.agents.fileCount + " agent file matches, " + d.matrix.robots.fileCount + " robot file matches, " + d.matrix.tools.fileCount + " tool file matches, and " + d.matrix.apps.fileCount + " app file matches.");
document.getElementById("stopVoice").onclick = ()=> { if("speechSynthesis" in window) window.speechSynthesis.cancel(); };
document.getElementById("listen").onclick = ()=>{
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR){ log("WAKE_LISTENER_BLOCKED: SpeechRecognition unavailable. Not faking wake listener."); return; }
  const r = new SR(); r.lang = "en-ZA";
  r.onresult = e => { const heard = e.results[0][0].transcript; log("VOICE_HEARD: " + heard); if(heard.toLowerCase().includes("jarvis")) speak("Welcome to Kingsmen Command, Commander. Jarvis heard you."); };
  r.onerror = e => log("WAKE_LISTENER_ERROR: " + e.error);
  r.start();
};
document.getElementById("send").onclick = ()=>{
  const cmd = document.getElementById("cmd").value.trim();
  if(!cmd) return;
  log("COMMANDER: " + cmd);
  const c = cmd.toLowerCase();
  if(c.includes("agent")) render("agents");
  else if(c.includes("robot")) render("robots");
  else if(c.includes("tool")) render("tools");
  else if(c.includes("app")) render("apps");
  else if(c.includes("provider")) render("providers");
  else if(c.includes("module") || c.includes("n00")) render("modules");
  else if(c.includes("evidence") || c.includes("proof")) render("evidence");
  else log("JARVIS: Command received. I will not fake execution from browser. Use Commander runtime for real actions.");
};
render("agents");
</script>
</body>
</html>`;
write("apps/web/jarvis-os/jarvis-os.html", html);
write("apps/web/public/jarvis-os/jarvis-os.html", html);
write("apps/web/public/jarvis/index.html", html);
const pageTsx = `export const metadata = {
  title: "Kingsmen Jarvis Command Mesh",
  description: "Jarvis agents, robots, tools, apps and provider command mesh"
};
export default function JarvisPage() {
  return (
    <main style={{ margin: 0, minHeight: "100vh", background: "#020617" }}>
      <iframe
        title="Kingsmen Jarvis Command Mesh"
        src="/jarvis-os/jarvis-os.html"
        style={{ width: "100%", height: "100vh", border: 0, display: "block" }}
      />
    </main>
  );
}
`;
write("apps/web/src/app/jarvis/page.tsx", pageTsx);
const proxy = `console.log("LEGACY_JARVIS_BUILDER_BLOCKED: using build-jarvis-agents-robots-tools-apps.cjs instead.");
require("./build-jarvis-agents-robots-tools-apps.cjs");
`;
write("apps/web/scripts/build-jarvis-os.cjs", proxy);
write("apps/web/scripts/build-jarvis-from-inventory.cjs", proxy);
write("apps/web/scripts/build-static-jarvis.cjs", proxy);
write("apps/web/scripts/build-jarvis-luxury.cjs", proxy);
const publicReports = [
  "reports/jarvis/JARVIS_AGENTS_ROBOTS_TOOLS_APPS_MATRIX_LATEST.md",
  "reports/jarvis/JARVIS_AGENTS_ROBOTS_TOOLS_APPS_MATRIX_LATEST.json",
  "reports/jarvis/JARVIS_FULL_REPO_INVENTORY_LATEST.md",
  "reports/jarvis/JARVIS_FULL_REPO_INVENTORY_LATEST.json",
  "reports/jarvis/JARVIS_PROVIDER_CONNECTION_MATRIX_LATEST.md",
  "reports/jarvis/JARVIS_FAKE_PLACEHOLDER_RISK_LATEST.md",
  "reports/jarvis/JARVIS_OPENCLAW_PLAYWRIGHT_PROOF_INVENTORY_LATEST.md",
  "reports/jarvis/JARVIS_VOICE_GREETING_SCRIPT_INVENTORY_LATEST.md"
];
for (const src of publicReports) {
  copy(src, "apps/web/public/jarvis/reports/" + path.basename(src));
}
const proof = [
  "# JARVIS AGENTS ROBOTS TOOLS APPS LIVE BUILD PROOF",
  "",
  `Created: ${now}`,
  "",
  "This build surfaces the missing command mesh:",
  "- Agents",
  "- Robots",
  "- Tools",
  "- Apps",
  "- Providers",
  "- N00-N20",
  "- Evidence",
  "- Voice",
  "- OpenClaw",
  "- Playwright",
  "",
  "Counts:",
  `- Agents file matches: ${matrix.agents.fileCount}`,
  `- Robots file matches: ${matrix.robots.fileCount}`,
  `- Tools file matches: ${matrix.tools.fileCount}`,
  `- Apps file matches: ${matrix.apps.fileCount}`,
  "",
  "Truth:",
  "No app, tool, robot or agent is claimed live without runtime proof."
].join("\n");
write("reports/jarvis/JARVIS_AGENTS_ROBOTS_TOOLS_APPS_LIVE_BUILD_PROOF_LATEST.md", proof);
console.log("JARVIS_AGENTS_ROBOTS_TOOLS_APPS_BUILD_COMPLETE");
console.log("Agents: " + matrix.agents.fileCount);
console.log("Robots: " + matrix.robots.fileCount);
console.log("Tools: " + matrix.tools.fileCount);
console.log("Apps: " + matrix.apps.fileCount);
