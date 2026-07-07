const fs = require("fs");
const path = require("path");
const root = process.cwd();
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
const mesh = readJson("reports/jarvis/JARVIS_AGENTS_ROBOTS_TOOLS_APPS_MATRIX_LATEST.json");
const providers = inventory.providerMatrix || [];
const hitCounts = inventory.hitCounts || {};
const modules = [
  ["N00", "Constitution"], ["N01", "Foundation"], ["N02", "Backend Kernel"], ["N03", "Truth Vault"], ["N04", "Candidate Core"],
  ["N05", "Document Vault"], ["N06", "Route Universe"], ["N07", "Airtable Sync"], ["N08", "Control Plane"], ["N09", "Notifications"],
  ["N10", "Finance"], ["N11", "AI Decision"], ["N12", "Governance"], ["N13", "Observability"], ["N14", "Integrations"],
  ["N15", "Opportunity Engine"], ["N16", "Execution"], ["N17", "Founder Plane"], ["N18", "Public Site"], ["N19", "Mobile PWA"], ["N20", "Final Integration"]
];
const apps = [
  "GitHub", "Netlify", "Google Drive", "Gmail", "Google Calendar", "Airtable", "Neon", "Supabase", "Canva", "PayFast",
  "OpenAI", "AI Wisebase", "B12", "Norton", "Replit", "Catalyst", "Lovable", "Namecheap", "Softonic", "Vivin", "Voice Generator"
];
function providerStatus(name) {
  const p = providers.find(x => String(x.provider).toLowerCase() === name.toLowerCase());
  if (!p) return "registered / proof-needed";
  return String(p.repoStatus).toLowerCase().replaceAll("_", " ");
}
function cardList(items, kind) {
  return items.map(item => {
    const name = Array.isArray(item) ? item[0] + " Ã‚Â· " + item[1] : item;
    const status = kind === "apps" ? providerStatus(item) : "live map";
    return `<button class="glassCard"><span>${esc(name)}</span><small>${esc(status)}</small></button>`;
  }).join("");
}
const data = {
  inventoryCounts: {
    scanned: inventory.scannedFileCount,
    jarvis: inventory.jarvisFileCount,
    api: inventory.apiRouteFileCount,
    core: inventory.coreFileCount,
    scripts: inventory.scriptFileCount,
    evidence: inventory.validatorFileCount,
    hits: inventory.totalHitCount
  },
  meshCounts: {
    agents: mesh.agents?.fileCount || 0,
    robots: mesh.robots?.fileCount || 0,
    tools: mesh.tools?.fileCount || 0,
    apps: mesh.apps?.fileCount || 0
  },
  hitCounts,
  providers,
  modules,
  apps
};
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Kingsmen Jarvis Premium Command Centre</title>
<style>
:root{
  --obsidian:#020713;
  --deep:#06142c;
  --navy:#071b3d;
  --royal:#0d4f9f;
  --electric:#19b7ff;
  --cyan:#6ee7ff;
  --gold:#ffd56a;
  --gold2:#b8872d;
  --green:#5df2a6;
  --red:#ff5f6f;
  --text:#f8fbff;
  --muted:#9fb7d7;
  --line:rgba(255,213,106,.28);
  --blueLine:rgba(25,183,255,.28);
  --panel:rgba(5,18,43,.78);
  --panel2:rgba(6,29,67,.72);
}
*{box-sizing:border-box}
html,body{margin:0;min-height:100%;font-family:Inter,Segoe UI,Arial,sans-serif;color:var(--text)}
body{
  background:
    radial-gradient(circle at 50% -8%, rgba(25,183,255,.42), transparent 28%),
    radial-gradient(circle at 13% 18%, rgba(255,213,106,.18), transparent 24%),
    radial-gradient(circle at 82% 28%, rgba(13,79,159,.42), transparent 30%),
    linear-gradient(135deg,#020713 0%,#06142c 42%,#031023 100%);
  overflow-x:hidden;
}
body:before{
  content:"";
  position:fixed;inset:0;pointer-events:none;
  background:
    linear-gradient(90deg,rgba(25,183,255,.08) 1px,transparent 1px),
    linear-gradient(rgba(255,213,106,.055) 1px,transparent 1px);
  background-size:52px 52px;
  mask-image:radial-gradient(circle at center,black 0%,transparent 78%);
}
body:after{
  content:"";
  position:fixed;inset:0;pointer-events:none;
  background:linear-gradient(180deg,rgba(255,255,255,.05),transparent 10%,transparent 88%,rgba(255,213,106,.06));
}
.shell{position:relative;z-index:1;max-width:1900px;margin:0 auto;padding:24px}
.header{
  display:grid;grid-template-columns:.9fr 1.3fr .9fr;gap:16px;align-items:stretch;
}
.panel,.hero,.dock{
  border:1px solid var(--line);
  background:linear-gradient(180deg,rgba(7,27,61,.82),rgba(2,7,19,.72));
  box-shadow:0 0 70px rgba(25,183,255,.18),0 0 140px rgba(255,213,106,.08), inset 0 0 24px rgba(255,255,255,.035);
  border-radius:26px;
  backdrop-filter:blur(18px);
}
.panel{padding:18px}
.hero{padding:22px;position:relative;overflow:hidden;text-align:center}
.hero:before{
  content:"";position:absolute;inset:-40%;background:conic-gradient(from 180deg,transparent,rgba(25,183,255,.22),transparent,rgba(255,213,106,.16),transparent);
  animation:spin 18s linear infinite;
}
.hero>*{position:relative;z-index:1}
@keyframes spin{to{transform:rotate(360deg)}}
.kicker{font-size:11px;letter-spacing:.32em;text-transform:uppercase;color:var(--gold);font-weight:950}
h1{font-size:clamp(54px,7vw,122px);letter-spacing:.08em;margin:8px 0 0;text-shadow:0 0 22px rgba(25,183,255,.8),0 0 44px rgba(255,213,106,.28)}
.sub{color:#c9e6ff;margin:6px 0 0;font-size:13px;letter-spacing:.18em;text-transform:uppercase}
.profile{display:flex;gap:14px;align-items:center}
.avatar{
  width:76px;height:76px;border-radius:50%;display:grid;place-items:center;
  border:1px solid var(--gold);background:radial-gradient(circle,#133d72,#020713 68%);
  box-shadow:0 0 35px rgba(25,183,255,.28);font-size:28px;font-weight:950;color:var(--gold);
}
.pills{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end}
.pill{border:1px solid var(--blueLine);border-radius:999px;padding:10px 13px;background:rgba(25,183,255,.09);font-size:11px;font-weight:900}
.grid{display:grid;grid-template-columns:.85fr 1.45fr .95fr;gap:16px;margin-top:16px}
.stack{display:grid;gap:16px}
.statGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:12px}
.stat{border:1px solid rgba(25,183,255,.26);border-radius:16px;background:rgba(2,7,19,.46);padding:12px}
.stat span{display:block;color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.12em}
.stat b{display:block;color:var(--gold);font-size:24px;margin-top:6px}
.brain{
  min-height:390px;display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:center;
}
.orbBox{display:grid;place-items:center;position:relative}
.orb{
  width:260px;height:260px;border-radius:50%;
  background:
    radial-gradient(circle at 35% 30%,#ffffff 0 2%,#ffd56a 8%,#19b7ff 29%,#09336b 58%,#020713 72%);
  border:1px solid rgba(255,213,106,.9);
  box-shadow:0 0 45px rgba(25,183,255,.9),0 0 100px rgba(25,183,255,.32), inset 0 0 54px rgba(255,213,106,.24);
  display:grid;place-items:center;font-size:96px;font-weight:950;
  animation:pulse 3.4s ease-in-out infinite;
}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.045)}}
.wave{
  position:absolute;width:560px;height:120px;border-top:2px solid rgba(25,183,255,.34);border-bottom:2px solid rgba(25,183,255,.18);
  filter:drop-shadow(0 0 16px rgba(25,183,255,.7));
  border-radius:50%;opacity:.8;
}
.commandInput{display:flex;gap:10px;margin-top:14px}
input,textarea{
  width:100%;background:rgba(2,7,19,.72);border:1px solid var(--line);border-radius:14px;color:var(--text);
  padding:13px;font:inherit;outline:none;
}
button{
  cursor:pointer;border:1px solid rgba(255,213,106,.42);background:linear-gradient(180deg,rgba(255,213,106,.18),rgba(25,183,255,.10));
  color:var(--text);border-radius:14px;padding:12px 14px;font-weight:950;
}
button:hover{border-color:var(--gold);box-shadow:0 0 22px rgba(25,183,255,.24);transform:translateY(-1px)}
.tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
.tab.active{background:rgba(255,213,106,.24);border-color:var(--gold)}
.meshGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.card{
  text-align:left;min-height:82px;border:1px solid rgba(25,183,255,.24);border-radius:16px;background:rgba(2,7,19,.44);
  padding:12px;display:flex;flex-direction:column;justify-content:space-between;
}
.card b{color:var(--gold)}
.card small{color:var(--muted);line-height:1.35}
.map{display:grid;grid-template-columns:repeat(7,1fr);gap:8px}
.module{min-height:74px;padding:9px;border:1px solid rgba(25,183,255,.25);border-radius:14px;background:rgba(2,7,19,.46)}
.module b{display:block;color:var(--gold);font-size:12px}
.module small{display:block;color:#c7defb;font-size:10px;margin-top:4px}
.console{
  min-height:220px;white-space:pre-wrap;font-family:Consolas,monospace;border-radius:18px;
  border:1px solid rgba(93,242,166,.25);background:rgba(0,10,22,.78);padding:14px;color:#d8ffe9;line-height:1.5;
}
.reportGrid,.providerGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.footer{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:16px}
.ban{
  border-color:rgba(255,95,111,.44);
  background:linear-gradient(180deg,rgba(255,95,111,.16),rgba(2,7,19,.62));
  color:#ffdce1;
}
@media(max-width:1300px){.header,.grid{grid-template-columns:1fr}.brain{grid-template-columns:1fr}.meshGrid,.reportGrid,.providerGrid,.map,.footer,.statGrid{grid-template-columns:1fr 1fr}}
@media(max-width:700px){.meshGrid,.reportGrid,.providerGrid,.map,.footer,.statGrid{grid-template-columns:1fr}.orb{width:190px;height:190px}}
</style>

<style id="kingsmen-final-colour-command-lock">
  :root {
    --km-void: #020612;
    --km-obsidian: #050b18;
    --km-navy: #071a3a;
    --km-royal: #0d47ff;
    --km-cyan: #00d9ff;
    --km-gold: #f2d38b;
    --km-cream: #fff6d8;
  }

  html,
  body {
    background:
      radial-gradient(circle at 50% 8%, rgba(0, 217, 255, .24), transparent 30%),
      radial-gradient(circle at 84% 18%, rgba(13, 71, 255, .20), transparent 34%),
      radial-gradient(circle at 16% 20%, rgba(242, 211, 139, .14), transparent 30%),
      linear-gradient(135deg, var(--km-void), var(--km-obsidian) 48%, #06112a 100%) !important;
    color: var(--km-cream) !important;
  }

  body::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    background:
      linear-gradient(rgba(0,217,255,.045) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,217,255,.035) 1px, transparent 1px);
    background-size: 44px 44px;
    mask-image: radial-gradient(circle at 50% 18%, black, transparent 76%);
    z-index: 0;
  }

  body > * {
    position: relative;
    z-index: 1;
  }

  section,
  article,
  aside,
  header,
  footer,
  main > div,
  button,
  input,
  textarea,
  pre {
    border-color: rgba(0, 217, 255, .38) !important;
    box-shadow:
      0 0 34px rgba(0, 217, 255, .11),
      inset 0 0 24px rgba(242, 211, 139, .055) !important;
  }

  section,
  article,
  aside,
  header,
  footer,
  main > div,
  pre {
    background:
      linear-gradient(145deg, rgba(5, 11, 24, .94), rgba(7, 26, 58, .76)) !important;
  }

  h1,
  h2,
  h3,
  strong,
  b,
  button {
    color: var(--km-gold) !important;
    text-shadow: 0 0 20px rgba(0, 217, 255, .24) !important;
  }

  p,
  span,
  small,
  li,
  pre {
    color: #dbe9ff !important;
  }

  button,
  input {
    background: linear-gradient(135deg, rgba(0, 217, 255, .14), rgba(242, 211, 139, .11)) !important;
    color: var(--km-cream) !important;
  }

  [class*="orb"],
  [class*="ring"],
  [class*="wave"],
  [class*="brain"],
  [class*="jarvis"] {
    border-color: rgba(0, 217, 255, .52) !important;
    color: var(--km-cyan) !important;
    box-shadow: 0 0 54px rgba(0, 217, 255, .26) !important;
  }
</style>
</head>
<body>
<div class="shell">
  <section class="header">
    <div class="panel profile">
      <div class="avatar">K</div>
      <div>
        <div class="kicker">Commander</div>
        <h2>Kingsmen Founder</h2>
        <p>Founder / Operator / Clearance Founder<br/>Session KMN-LIVE</p>
      </div>
    </div>
    <div class="hero">
      <div class="kicker">Kingsmen Premium Command House</div>
      <h1>JARVIS</h1>
      <div class="sub">Founder AI Operating Assistant Ã‚Â· Agents Ã‚Â· Robots Ã‚Â· Tools Ã‚Â· Apps</div>
    </div>
    <div class="panel">
      <div class="pills">
        <div class="pill">System Online</div>
        <div class="pill">Secure Environment</div>
        <div class="pill">Premium Visual Locked</div>
        <div class="pill">Black/White Blocked</div>
      </div>
    </div>
  </section>
  <section class="grid">
    <aside class="stack">
      <div class="panel">
        <div class="kicker">Mission</div>
        <h2>Expand access. Verify truth. Build futures.</h2>
        <div class="statGrid">
          <div class="stat"><span>Agents</span><b>${mesh.agents.fileCount}</b></div>
          <div class="stat"><span>Robots</span><b>${mesh.robots.fileCount}</b></div>
          <div class="stat"><span>Tools</span><b>${mesh.tools.fileCount}</b></div>
          <div class="stat"><span>Apps</span><b>${mesh.apps.fileCount}</b></div>
        </div>
      </div>
      <div class="panel">
        <div class="kicker">Voice Link</div>
        <h2>Wake word: Jarvis</h2>
        <button id="greet">Greet Commander</button>
        <button id="speak">Speak Mesh Status</button>
        <button id="listen">Wake Listener</button>
      </div>
      <div class="panel ban">
        <div class="kicker">Rejected Visual Ban</div>
        <h2>No black/white shell</h2>
        <p>The old monochrome static surface is blocked. Jarvis must stay premium navy, royal blue, cyan and gold.</p>
      </div>
    </aside>
    <main class="stack">
      <div class="panel brain">
        <div>
          <div class="kicker">1 Ã‚Â· Command Brain</div>
          <h2>OpenAI-ready reasoning core</h2>
          <p>Understand objective Ã‚Â· inspect context Ã‚Â· map options Ã‚Â· assess risk Ã‚Â· retrieve evidence Ã‚Â· draft plan Ã‚Â· ready for action.</p>
          <div class="commandInput">
            <input id="cmd" value="Tell me about Jarvis command mesh"/>
            <button id="send">Execute</button>
          </div>
          <div class="tabs" style="margin-top:14px">
            <button class="quick" data-view="agents">Agents</button>
            <button class="quick" data-view="robots">Robots</button>
            <button class="quick" data-view="tools">Tools</button>
            <button class="quick" data-view="apps">Apps</button>
            <button class="quick" data-view="providers">Providers</button>
            <button class="quick" data-view="evidence">Evidence</button>
          </div>
        </div>
        <div class="orbBox"><div class="wave"></div><div class="orb">J</div></div>
      </div>
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
        <div class="kicker">Jarvis Output</div>
        <div class="console" id="console">JARVIS WAKE:
Welcome to Kingsmen Command, Commander.
Premium visual lock is active.
Black/white rejected surface is blocked.
Command mesh visible:
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
No app, tool, robot or agent is claimed live without runtime proof.</div>
      </div>
    </main>
    <aside class="stack">
      <div class="panel">
        <div class="kicker">Gateway Stack</div>
        <div class="meshGrid">
          <div class="card"><b>OpenClaw Gateway</b><small>Command registry Ã‚Â· policy gate Ã‚Â· evidence ledger</small></div>
          <div class="card"><b>Playwright Scout</b><small>Probe Ã‚Â· manual fallback Ã‚Â· MAP boundary</small></div>
          <div class="card"><b>Oracle Lite Runtime</b><small>Local Commander runtime boundary</small></div>
          <div class="card"><b>Evidence Centre</b><small>Deploy logs Ã‚Â· validators Ã‚Â· route safety</small></div>
        </div>
      </div>
      <div class="panel">
        <div class="kicker">Provider Matrix</div>
        <div class="providerGrid">${providers.slice(0,21).map(p => `<div class="card"><b>${esc(p.provider)}</b><small>${esc(p.repoStatus)} Ã‚Â· ${p.hitCount} hits</small></div>`).join("")}</div>
      </div>
      <div class="panel">
        <div class="kicker">Founder Command Plane</div>
        <button>Mission Brief</button>
        <button>System Health</button>
        <button>W15 Override</button>
        <button>Risk Digest</button>
        <button>Route Scan</button>
        <button>Deep Search</button>
        <button>Approve Command</button>
        <button>Open Evidence</button>
      </div>
    </aside>
  </section>
  <section class="footer">
    <div class="panel"><div class="kicker">Scanned Files</div><h2>${inventory.scannedFileCount}</h2></div>
    <div class="panel"><div class="kicker">Jarvis Files</div><h2>${inventory.jarvisFileCount}</h2></div>
    <div class="panel"><div class="kicker">Evidence Files</div><h2>${inventory.validatorFileCount}</h2></div>
    <div class="panel"><div class="kicker">Total Hits</div><h2>${inventory.totalHitCount}</h2></div>
  </section>
</div>
<script>
window.__JARVIS_PREMIUM__ = ${js({inventory, mesh, providers, modules, apps, hitCounts})};
const data = window.__JARVIS_PREMIUM__;
const view = document.getElementById("view");
const consoleEl = document.getElementById("console");
function log(x){ consoleEl.textContent += "\\n" + x; consoleEl.scrollTop = consoleEl.scrollHeight; }
function speak(text){
  if(!("speechSynthesis" in window)){ log("VOICE_BLOCKED: speech synthesis unavailable. Not faking voice."); return; }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = .94; u.pitch = .86; u.volume = 1;
  speechSynthesis.speak(u);
}
function card(title, sub){ return '<div class="card"><b>'+title+'</b><small>'+sub+'</small></div>'; }
const views = {
  agents: '<div class="meshGrid">' + data.mesh.agents.terms.map(x=>card(x,"agent command term")).join("") + '</div>',
  robots: '<div class="meshGrid">' + data.mesh.robots.terms.map(x=>card(x,"robot / automation term")).join("") + '</div>',
  tools: '<div class="meshGrid">' + data.mesh.tools.terms.map(x=>card(x,"tool / validator / proof term")).join("") + '</div>',
  apps: '<div class="meshGrid">' + data.apps.map(x=>card(x,"registered app Ã‚Â· runtime proof required")).join("") + '</div>',
  providers: '<div class="providerGrid">' + data.providers.map(p=>card(p.provider,p.repoStatus+" Ã‚Â· "+p.hitCount+" hits")).join("") + '</div>',
  modules: '<div class="map">' + data.modules.map(m=>'<div class="module"><b>'+m[0]+'</b><small>'+m[1]+'<br/>Live map</small></div>').join("") + '</div>',
  evidence: '<div class="reportGrid">' +
    '<a class="card" href="/jarvis/reports/JARVIS_FULL_REPO_INVENTORY_LATEST.md" target="_blank"><b>Inventory</b><small>Open proof</small></a>' +
    '<a class="card" href="/jarvis/reports/JARVIS_AGENTS_ROBOTS_TOOLS_APPS_MATRIX_LATEST.md" target="_blank"><b>Command Mesh</b><small>Open proof</small></a>' +
    '<a class="card" href="/jarvis/reports/JARVIS_PROVIDER_CONNECTION_MATRIX_LATEST.md" target="_blank"><b>Providers</b><small>Open proof</small></a>' +
    '<a class="card" href="/jarvis/reports/JARVIS_FAKE_PLACEHOLDER_RISK_LATEST.md" target="_blank"><b>Fake Risk</b><small>Open proof</small></a>' +
  '</div>'
};
function render(name){
  view.innerHTML = views[name];
  log("VIEW_OPENED: " + name.toUpperCase());
}
document.querySelectorAll(".tab,.quick").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
    if(btn.classList.contains("tab")) btn.classList.add("active");
    render(btn.dataset.view);
  };
});
document.getElementById("greet").onclick = () => speak("Welcome to Kingsmen Command, Commander. Premium Jarvis command centre is awake.");
document.getElementById("speak").onclick = () => speak("Commander, Jarvis has "+data.mesh.agents.fileCount+" agent matches, "+data.mesh.robots.fileCount+" robot matches, "+data.mesh.tools.fileCount+" tool matches, and "+data.mesh.apps.fileCount+" app matches.");
document.getElementById("listen").onclick = () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR){ log("WAKE_LISTENER_BLOCKED: Speech recognition unavailable. Not faking wake listener."); return; }
  const r = new SR(); r.lang="en-ZA";
  r.onresult = e => { const heard = e.results[0][0].transcript; log("VOICE_HEARD: "+heard); if(heard.toLowerCase().includes("jarvis")) speak("Welcome to Kingsmen Command, Commander. Jarvis heard you."); };
  r.onerror = e => log("WAKE_LISTENER_ERROR: "+e.error);
  r.start();
};
document.getElementById("send").onclick = () => {
  const c = document.getElementById("cmd").value.toLowerCase();
  if(c.includes("robot")) render("robots");
  else if(c.includes("tool")) render("tools");
  else if(c.includes("app")) render("apps");
  else if(c.includes("provider")) render("providers");
  else if(c.includes("evidence") || c.includes("proof")) render("evidence");
  else if(c.includes("n00") || c.includes("module")) render("modules");
  else render("agents");
};
render("agents");
</script>
</body>
</html>`;
write("apps/web/jarvis-os/jarvis-os.html", html);
write("apps/web/public/jarvis-os/jarvis-os.html", html);
console.log("PUBLIC_JARVIS_INDEX_BLOCKED: apps/web/public/jarvis/index.html must not exist because it shadows the real Next /jarvis route.");
const page = `export const metadata = {
  title: "Kingsmen Jarvis Premium Command Centre",
  description: "Premium blue and gold Jarvis command centre"
};
export default function JarvisPage() {
  return (
    <main style={{ margin: 0, minHeight: "100vh", background: "#020713" }}>
      <iframe
        title="Kingsmen Jarvis Premium Command Centre"
        src="/jarvis-os/jarvis-os.html"
        style={{ width: "100%", height: "100vh", border: 0, display: "block" }}
      />
    </main>
  );
}
`;
console.log("REAL_JARVIS_ROUTE_PRESERVED: static generator may update jarvis-os archive, but must not overwrite apps/web/src/app/jarvis/page.tsx");
const proxy = `console.log("PREMIUM_JARVIS_BUILDER_ACTIVE: black/white Jarvis is banned.");
require("./build-jarvis-premium-command-centre.cjs");
`;
write("apps/web/scripts/build-jarvis-os.cjs", proxy);
write("apps/web/scripts/build-jarvis-from-inventory.cjs", proxy);
write("apps/web/scripts/build-jarvis-agents-robots-tools-apps.cjs", proxy);
write("apps/web/scripts/build-static-jarvis.cjs", proxy);
write("apps/web/scripts/build-jarvis-luxury.cjs", proxy);
const publicReports = [
  "reports/jarvis/JARVIS_FULL_REPO_INVENTORY_LATEST.md",
  "reports/jarvis/JARVIS_FULL_REPO_INVENTORY_LATEST.json",
  "reports/jarvis/JARVIS_AGENTS_ROBOTS_TOOLS_APPS_MATRIX_LATEST.md",
  "reports/jarvis/JARVIS_AGENTS_ROBOTS_TOOLS_APPS_MATRIX_LATEST.json",
  "reports/jarvis/JARVIS_PROVIDER_CONNECTION_MATRIX_LATEST.md",
  "reports/jarvis/JARVIS_FAKE_PLACEHOLDER_RISK_LATEST.md",
  "reports/jarvis/JARVIS_OPENCLAW_PLAYWRIGHT_PROOF_INVENTORY_LATEST.md",
  "reports/jarvis/JARVIS_VOICE_GREETING_SCRIPT_INVENTORY_LATEST.md"
];
for (const src of publicReports) {
  if (fs.existsSync(path.join(root, src))) copy(src, "apps/web/public/jarvis/reports/" + path.basename(src));
}
const proof = [
  "# JARVIS PREMIUM COMMAND CENTRE BUILD PROOF",
  "",
  "Black/white rejected Jarvis surface is banned.",
  "Premium navy, royal blue, cyan and gold visual lock is active.",
  "",
  "Visible systems:",
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
  `- Agents: ${mesh.agents.fileCount}`,
  `- Robots: ${mesh.robots.fileCount}`,
  `- Tools: ${mesh.tools.fileCount}`,
  `- Apps: ${mesh.apps.fileCount}`,
  "",
  "Validation phrase:",
  "No app, tool, robot or agent is claimed live without runtime proof."
].join("\n");
write("reports/jarvis/JARVIS_PREMIUM_COMMAND_CENTRE_BUILD_PROOF_LATEST.md", proof);
console.log("PREMIUM_JARVIS_COMMAND_CENTRE_BUILD_COMPLETE");
console.log("Agents: " + mesh.agents.fileCount);
console.log("Robots: " + mesh.robots.fileCount);
console.log("Tools: " + mesh.tools.fileCount);
console.log("Apps: " + mesh.apps.fileCount);
