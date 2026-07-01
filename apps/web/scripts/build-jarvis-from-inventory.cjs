const fs = require("fs");
const path = require("path");

const root = process.cwd();
const stamp = new Date().toISOString();

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
}

function readText(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function mkdir(fileOrDir) {
  const dir = path.extname(fileOrDir) ? path.dirname(fileOrDir) : fileOrDir;
  fs.mkdirSync(dir, { recursive: true });
}

function write(file, text) {
  const abs = path.join(root, file);
  mkdir(abs);
  fs.writeFileSync(abs, text, "utf8");
}

function copy(src, dst) {
  const absDst = path.join(root, dst);
  mkdir(absDst);
  fs.copyFileSync(path.join(root, src), absDst);
}

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function js(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

const inventory = readJson("reports/jarvis/JARVIS_FULL_REPO_INVENTORY_LATEST.json");
const buildPlan = readText("reports/jarvis/JARVIS_LIVE_BUILD_PLAN_FROM_INVENTORY_LATEST.md");
const providerMatrixMd = readText("reports/jarvis/JARVIS_PROVIDER_CONNECTION_MATRIX_LATEST.md");
const voiceInventory = readText("reports/jarvis/JARVIS_VOICE_GREETING_SCRIPT_INVENTORY_LATEST.md");
const fakeRisk = readText("reports/jarvis/JARVIS_FAKE_PLACEHOLDER_RISK_LATEST.md");
const openClawPw = readText("reports/jarvis/JARVIS_OPENCLAW_PLAYWRIGHT_PROOF_INVENTORY_LATEST.md");

const providers = inventory.providerMatrix || [];
const hitCounts = inventory.hitCounts || {};

const modules = [
  ["N00", "Constitution / Doctrine Lock", "Doctrine, no fake data, no useless layers, POPIA and Kingsmen law."],
  ["N01", "Foundation / Monorepo / Runtime", "Repo structure, PowerShell creator, Oracle Lite, Docker and boot proof."],
  ["N02", "Backend API Kernel", "Envelope, command bus, policy middleware, API boundary and read model boundary."],
  ["N03", "Truth Vault / PostgreSQL", "PostgreSQL truth, RLS, audit, read models and outbox."],
  ["N04", "Candidate Core / Portal", "Intake, auth, profile, communications, support and security."],
  ["N05", "Document Vault", "Upload, review, signer, evidence and document readiness."],
  ["N06", "Route Universe / Workbench", "CAO, NSFAS, TVET, universities, SETA/QCTO and route readiness."],
  ["N07", "Airtable Sync / Human Mirror", "Airtable as mirror only, PostgreSQL remains truth."],
  ["N08", "Operator Command Room", "Control plane, operational screens and decision support."],
  ["N09", "Notifications", "Email primary, WhatsApp urgent-only, SMS backup."],
  ["N10", "Finance", "Pricing, payment boundaries, PayFast gates and refund rules."],
  ["N11", "AI Decision Engine", "Scoring, risk, advice and no fake official claims."],
  ["N12", "Governance / Tribunal", "POPIA, audit, dispute, tribunal and route safety."],
  ["N13", "Observability", "Logs, alerts, incidents, backups, recovery and proof."],
  ["N14", "Integrations Registry", "Provider adapters, credentials, status and runtime gates."],
  ["N15", "Opportunity Engine", "Jobs, bursaries, learnerships, employers and verified opportunities."],
  ["N16", "Execution Orchestrator", "Priority queue, W15 override, safe nets and fallback."],
  ["N17", "Founder Control Plane", "Commander reports, approvals, health, risk and minimal contact ops."],
  ["N18", "Public Website", "Product front, sales funnel and no-guarantee boundaries."],
  ["N19", "Mobile PWA", "Offline, accessibility and candidate mobile journey."],
  ["N20", "Final Integration", "Boot validation, production gate and handover pack."]
];

const reportLinks = [
  ["Audit index", "/jarvis/reports/JARVIS_AUDIT_INDEX_LATEST.md"],
  ["Full inventory", "/jarvis/reports/JARVIS_FULL_REPO_INVENTORY_LATEST.md"],
  ["Inventory JSON", "/jarvis/reports/JARVIS_FULL_REPO_INVENTORY_LATEST.json"],
  ["Build plan", "/jarvis/reports/JARVIS_LIVE_BUILD_PLAN_FROM_INVENTORY_LATEST.md"],
  ["Provider matrix", "/jarvis/reports/JARVIS_PROVIDER_CONNECTION_MATRIX_LATEST.md"],
  ["Voice and greeting inventory", "/jarvis/reports/JARVIS_VOICE_GREETING_SCRIPT_INVENTORY_LATEST.md"],
  ["OpenClaw / Playwright proof", "/jarvis/reports/JARVIS_OPENCLAW_PLAYWRIGHT_PROOF_INVENTORY_LATEST.md"],
  ["Fake / placeholder risk", "/jarvis/reports/JARVIS_FAKE_PLACEHOLDER_RISK_LATEST.md"]
];

const clientData = {
  createdAt: stamp,
  counts: {
    scannedFiles: inventory.scannedFileCount,
    jarvisFiles: inventory.jarvisFileCount,
    apiRoutes: inventory.apiRouteFileCount,
    coreFiles: inventory.coreFileCount,
    scripts: inventory.scriptFileCount,
    evidenceFiles: inventory.validatorFileCount,
    totalHits: inventory.totalHitCount
  },
  hitCounts,
  providers,
  modules,
  reports: reportLinks,
  git: {
    branch: inventory.branch,
    commits: inventory.latestCommits || []
  }
};

const providerCards = providers.map((p, index) => {
  const statusClass = p.repoStatus === "FOUND_NEEDS_RUNTIME_PROOF" ? "warn" : p.repoStatus === "REFERENCED_ONLY" ? "hold" : "blocked";
  return `<button class="provider ${statusClass}" data-provider="${index}">
    <span>${esc(p.provider)}</span>
    <b>${esc(p.repoStatus)}</b>
    <small>${p.hitCount} hits · ${p.fileCount} files · ${p.adapterFileCount} adapter-like</small>
  </button>`;
}).join("");

const moduleCards = modules.map((m, index) => {
  return `<button class="moduleCard" data-module="${index}">
    <span>${esc(m[0])}</span>
    <b>${esc(m[1])}</b>
    <small>${esc(m[2])}</small>
  </button>`;
}).join("");

const reportCards = reportLinks.map(([name, href]) => {
  return `<a class="reportLink" href="${href}" target="_blank" rel="noreferrer">${esc(name)}<span>Open proof</span></a>`;
}).join("");

const hitRows = Object.entries(hitCounts).map(([k, v]) => {
  return `<div class="hitRow"><span>${esc(k)}</span><b>${esc(v)}</b></div>`;
}).join("");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Kingsmen Jarvis Command</title>
<style>
:root{
  --bg:#030713;
  --bg2:#071126;
  --panel:rgba(11,22,47,.84);
  --panel2:rgba(16,31,67,.72);
  --gold:#f6d77c;
  --gold2:#b88a2b;
  --blue:#38bdf8;
  --blue2:#1e3a8a;
  --text:#f8fbff;
  --muted:#9fb1ce;
  --danger:#ff6b6b;
  --ok:#5ef0b2;
  --warn:#ffd166;
  --line:rgba(246,215,124,.22);
  --shadow:0 0 50px rgba(56,189,248,.18),0 0 110px rgba(246,215,124,.08);
}
*{box-sizing:border-box}
body{
  margin:0;
  min-height:100vh;
  background:
    radial-gradient(circle at 50% 0%, rgba(56,189,248,.26), transparent 34%),
    radial-gradient(circle at 80% 15%, rgba(246,215,124,.12), transparent 28%),
    linear-gradient(135deg,#02040b 0%,#071126 42%,#02040b 100%);
  color:var(--text);
  font-family:Inter,Segoe UI,Arial,sans-serif;
  overflow-x:hidden;
}
body:before{
  content:"";
  position:fixed;inset:0;
  background-image:
    linear-gradient(rgba(246,215,124,.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(56,189,248,.04) 1px, transparent 1px);
  background-size:54px 54px;
  mask-image:radial-gradient(circle at center, black 0%, transparent 78%);
  pointer-events:none;
}
.shell{position:relative;z-index:1;max-width:1840px;margin:0 auto;padding:26px}
.top{
  display:grid;
  grid-template-columns:1.1fr .9fr;
  gap:18px;
  align-items:stretch;
}
.hero,.panel{
  border:1px solid var(--line);
  background:linear-gradient(180deg,rgba(10,21,47,.9),rgba(5,11,28,.82));
  box-shadow:var(--shadow);
  border-radius:28px;
  backdrop-filter:blur(14px);
}
.hero{padding:28px;position:relative;overflow:hidden;min-height:310px}
.hero:after{
  content:"";
  position:absolute;right:-120px;top:-160px;width:520px;height:520px;border-radius:50%;
  background:radial-gradient(circle,rgba(56,189,248,.24),transparent 62%);
}
.kicker{letter-spacing:.26em;text-transform:uppercase;color:var(--gold);font-size:12px;font-weight:900}
h1{font-size:clamp(48px,7vw,118px);line-height:.82;margin:18px 0 14px;font-weight:950;letter-spacing:-.08em}
.sub{max-width:980px;color:#dbe8ff;font-size:18px;line-height:1.55}
.rule{margin-top:18px;padding:14px 16px;border:1px solid rgba(255,107,107,.38);background:rgba(120,20,32,.26);border-radius:18px;color:#ffdede;font-weight:800}
.orbWrap{display:flex;align-items:center;gap:22px;margin-top:24px;position:relative;z-index:1}
.orb{
  width:150px;height:150px;border-radius:50%;
  background:
    radial-gradient(circle at 35% 30%,#fff 0 4%,#f6d77c 8%,#38bdf8 28%,#0b1635 60%,#030713 100%);
  border:1px solid rgba(246,215,124,.62);
  box-shadow:0 0 38px rgba(56,189,248,.55), inset 0 0 40px rgba(246,215,124,.28);
  animation:pulse 3.6s ease-in-out infinite;
}
@keyframes pulse{0%,100%{transform:scale(1);filter:saturate(1)}50%{transform:scale(1.045);filter:saturate(1.35)}}
.voiceBox{flex:1}
.voiceButtons{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}
button,.btn{
  cursor:pointer;border:1px solid rgba(246,215,124,.34);
  background:linear-gradient(180deg,rgba(246,215,124,.18),rgba(56,189,248,.08));
  color:var(--text);border-radius:14px;padding:12px 14px;font-weight:900;
}
button:hover,.btn:hover{border-color:var(--gold);transform:translateY(-1px)}
.grid{display:grid;grid-template-columns:repeat(7,1fr);gap:12px;margin-top:18px}
.stat{padding:16px;border:1px solid rgba(56,189,248,.22);border-radius:18px;background:rgba(7,17,38,.72)}
.stat span{display:block;color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.14em}
.stat b{display:block;font-size:28px;margin-top:6px;color:var(--gold)}
.panel{padding:20px}
.panel h2{margin:0 0 12px;font-size:22px}
.commandPanel{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.statusPill{padding:14px;border-radius:16px;background:rgba(255,209,102,.09);border:1px solid rgba(255,209,102,.22)}
.statusPill b{color:var(--gold)}
.mainGrid{display:grid;grid-template-columns:1.15fr .85fr;gap:18px;margin-top:18px}
.sectionGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.moduleCard,.provider,.reportLink{
  width:100%;text-align:left;display:flex;flex-direction:column;gap:8px;
  padding:16px;border-radius:18px;text-decoration:none;color:var(--text);
  background:rgba(8,18,42,.74);border:1px solid rgba(56,189,248,.18);
}
.moduleCard span{color:var(--gold);letter-spacing:.16em;font-weight:950}
.moduleCard b,.provider span{font-size:16px}
.moduleCard small,.provider small,.reportLink span{color:var(--muted);line-height:1.35}
.provider.warn{border-color:rgba(255,209,102,.42)}
.provider.hold{border-color:rgba(56,189,248,.35)}
.provider.blocked{border-color:rgba(255,107,107,.32)}
.provider b{font-size:11px;color:var(--warn);letter-spacing:.08em}
.reportLink{border-color:rgba(246,215,124,.22)}
.hitRow{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid rgba(255,255,255,.07);padding:10px 0}
.hitRow span{color:#d8e6ff;font-size:13px}
.hitRow b{color:var(--gold)}
.console{
  min-height:270px;border-radius:20px;border:1px solid rgba(94,240,178,.22);
  background:rgba(1,8,18,.86);padding:16px;font-family:Consolas,monospace;color:#c9ffe7;
  white-space:pre-wrap;line-height:1.55;overflow:auto;
}
.tabs{display:flex;gap:10px;flex-wrap:wrap;margin:0 0 14px}
.tab.active{background:rgba(246,215,124,.24);border-color:var(--gold)}
.detail{padding:16px;border:1px solid rgba(246,215,124,.2);border-radius:18px;background:rgba(3,7,19,.52);min-height:160px;white-space:pre-wrap;line-height:1.5}
.footer{margin-top:18px;display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.footer .panel{min-height:150px}
textarea{
  width:100%;min-height:96px;border-radius:16px;border:1px solid rgba(246,215,124,.26);
  background:rgba(3,7,19,.72);color:var(--text);padding:14px;font:inherit;resize:vertical;
}
@media(max-width:1250px){.top,.mainGrid,.commandPanel{grid-template-columns:1fr}.grid{grid-template-columns:repeat(2,1fr)}.sectionGrid{grid-template-columns:1fr}.footer{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="shell">
  <section class="top">
    <div class="hero">
      <div class="kicker">KINGSMEN COMMAND · INVENTORY-BACKED JARVIS · COMMANDER ONLY</div>
      <h1>JARVIS</h1>
      <p class="sub">Welcome to Kingsmen Command, Commander. Jarvis is now rendered from the registered repo audit: voice, greetings, OpenClaw, Playwright, Oracle Lite, providers, N00-N20, candidate operations, route universe, evidence and fake-data gates.</p>
      <div class="rule">Rejected screen blocked: no black/white child-play UI, no placeholder numbers, no fake provider claims, no blank dashboard rebuild.</div>
      <div class="orbWrap">
        <div class="orb" id="orb"></div>
        <div class="voiceBox">
          <div class="kicker">Voice core</div>
          <p id="voiceState">Voice ready check pending. Click Greet Commander.</p>
          <div class="voiceButtons">
            <button id="greetBtn">Greet Commander</button>
            <button id="speakStatusBtn">Speak Audit Status</button>
            <button id="listenBtn">Start Wake Listener</button>
            <button id="stopVoiceBtn">Stop Voice</button>
          </div>
        </div>
      </div>
    </div>

    <div class="panel">
      <h2>Live audit truth</h2>
      <div class="commandPanel">
        <div class="statusPill"><b>Source</b><br/>GitHub main audit inventory</div>
        <div class="statusPill"><b>Build law</b><br/>Screen -> real file -> report -> validator -> proof -> action gate</div>
        <div class="statusPill"><b>Provider rule</b><br/>No provider is called connected without runtime proof</div>
        <div class="statusPill"><b>Voice rule</b><br/>Voice must be visible, testable and failure-clear</div>
      </div>
      <div class="grid">
        <div class="stat"><span>Scanned files</span><b>${esc(inventory.scannedFileCount)}</b></div>
        <div class="stat"><span>Jarvis files</span><b>${esc(inventory.jarvisFileCount)}</b></div>
        <div class="stat"><span>API routes</span><b>${esc(inventory.apiRouteFileCount)}</b></div>
        <div class="stat"><span>Core files</span><b>${esc(inventory.coreFileCount)}</b></div>
        <div class="stat"><span>Scripts</span><b>${esc(inventory.scriptFileCount)}</b></div>
        <div class="stat"><span>Evidence files</span><b>${esc(inventory.validatorFileCount)}</b></div>
        <div class="stat"><span>Total hits</span><b>${esc(inventory.totalHitCount)}</b></div>
      </div>
    </div>
  </section>

  <section class="mainGrid">
    <div class="panel">
      <div class="tabs">
        <button class="tab active" data-view="modules">N00-N20 Modules</button>
        <button class="tab" data-view="providers">Provider Matrix</button>
        <button class="tab" data-view="evidence">Evidence Reports</button>
        <button class="tab" data-view="hits">Hit Counts</button>
      </div>
      <div id="view"></div>
    </div>

    <div class="panel">
      <h2>Jarvis command console</h2>
      <div class="console" id="console">Jarvis: Welcome to Kingsmen Command, Commander.
Audit source: reports/jarvis/JARVIS_FULL_REPO_INVENTORY_LATEST.json
Voice source: reports/jarvis/JARVIS_VOICE_GREETING_SCRIPT_INVENTORY_LATEST.md
Provider source: reports/jarvis/JARVIS_PROVIDER_CONNECTION_MATRIX_LATEST.md
OpenClaw/Playwright source: reports/jarvis/JARVIS_OPENCLAW_PLAYWRIGHT_PROOF_INVENTORY_LATEST.md
Fake-risk source: reports/jarvis/JARVIS_FAKE_PLACEHOLDER_RISK_LATEST.md

Awaiting command.</div>
      <textarea id="commandInput" placeholder="Command Jarvis from Kingsmen Command..."></textarea>
      <div class="voiceButtons">
        <button id="runCommandBtn">Send Command</button>
        <button id="copyProofBtn">Copy Proof Summary</button>
      </div>
      <div class="detail" id="detail">Select a module, provider or report. Jarvis will show the real source state here.</div>
    </div>
  </section>

  <section class="footer">
    <div class="panel"><h2>Voice</h2><p>${esc(hitCounts.VOICE_WAKE_SPEECH || 0)} voice/wake/speech hits and ${esc(hitCounts.GREETINGS_ADDRESS_SCRIPTS || 0)} greeting/address/script hits found.</p></div>
    <div class="panel"><h2>OpenClaw</h2><p>${esc(hitCounts.OPENCLAW_GATEWAY || 0)} OpenClaw gateway hits. Commands remain approval-gated.</p></div>
    <div class="panel"><h2>Playwright</h2><p>${esc(hitCounts.PLAYWRIGHT_SCOUT_MAP || 0)} Playwright/scout/MAP hits. Scout only. No bypass.</p></div>
    <div class="panel"><h2>Fake-data gate</h2><p>${esc(hitCounts.FAKE_PLACEHOLDER_MOCK_RISKS || 0)} fake/placeholder/mock risk hits. Every live claim requires review.</p></div>
  </section>
</div>

<script>
window.__JARVIS__ = ${js(clientData)};

const data = window.__JARVIS__;
const view = document.getElementById("view");
const detail = document.getElementById("detail");
const consoleEl = document.getElementById("console");
const voiceState = document.getElementById("voiceState");
const commandInput = document.getElementById("commandInput");

function log(line){
  consoleEl.textContent += "\\n" + line;
  consoleEl.scrollTop = consoleEl.scrollHeight;
}

function speak(text){
  if (!("speechSynthesis" in window)) {
    voiceState.textContent = "Speech synthesis unavailable in this browser. Jarvis will not fake voice.";
    log("VOICE_BLOCKED: Browser speech synthesis unavailable.");
    return;
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.94;
  u.pitch = 0.86;
  u.volume = 1;
  window.speechSynthesis.speak(u);
  voiceState.textContent = "Speaking: " + text.slice(0, 90);
}

function renderModules(){
  view.innerHTML = '<div class="sectionGrid">${moduleCards.replaceAll("`", "\\`")}</div>';
  document.querySelectorAll("[data-module]").forEach(btn=>{
    btn.onclick = ()=>{
      const m = data.modules[Number(btn.dataset.module)];
      detail.textContent = m[0] + " - " + m[1] + "\\n\\n" + m[2] + "\\n\\nRequired next live state: purpose, files, APIs, validators, reports, missing work and next command must open from this module.";
      log("MODULE_SELECTED: " + m[0] + " " + m[1]);
    };
  });
}

function renderProviders(){
  view.innerHTML = '<div class="sectionGrid">${providerCards.replaceAll("`", "\\`")}</div>';
  document.querySelectorAll("[data-provider]").forEach(btn=>{
    btn.onclick = ()=>{
      const p = data.providers[Number(btn.dataset.provider)];
      detail.textContent =
        p.provider + "\\n" +
        "Status: " + p.repoStatus + "\\n" +
        "Hits: " + p.hitCount + "\\n" +
        "Files: " + p.fileCount + "\\n" +
        "Adapter-like files: " + p.adapterFileCount + "\\n" +
        "Env references: " + p.envReferenceCount + "\\n\\n" +
        "Truth: this is not called connected until runtime proof and credential boundaries pass.";
      log("PROVIDER_SELECTED: " + p.provider + " => " + p.repoStatus);
    };
  });
}

function renderEvidence(){
  view.innerHTML = '<div class="sectionGrid">${reportCards.replaceAll("`", "\\`")}</div>';
  detail.textContent = "Evidence reports are copied into the public Jarvis proof folder for review. Large CSV and JSON may take time to open.";
}

function renderHits(){
  view.innerHTML = '<div class="panel" style="box-shadow:none">${hitRows.replaceAll("`", "\\`")}</div>';
  detail.textContent = "Hit counts came from JARVIS_FULL_REPO_INVENTORY_LATEST.json. These are not placeholder numbers.";
}

document.querySelectorAll(".tab").forEach(btn=>{
  btn.onclick = ()=>{
    document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");
    if(btn.dataset.view==="modules") renderModules();
    if(btn.dataset.view==="providers") renderProviders();
    if(btn.dataset.view==="evidence") renderEvidence();
    if(btn.dataset.view==="hits") renderHits();
  };
});

document.getElementById("greetBtn").onclick = ()=>{
  const text = "Welcome to Kingsmen Command, Commander. Jarvis is awake. Voice, greetings, OpenClaw, Playwright, provider matrix, N zero zero to N twenty, evidence and fake data gates are loaded from the repo audit.";
  speak(text);
  log("VOICE_GREETING: " + text);
};

document.getElementById("speakStatusBtn").onclick = ()=>{
  const text = "Commander, the audit scanned " + data.counts.scannedFiles + " files, found " + data.counts.jarvisFiles + " Jarvis files, " + data.counts.apiRoutes + " API route files, and " + data.counts.evidenceFiles + " validator and evidence files. Provider actions remain runtime proof gated.";
  speak(text);
  log("VOICE_STATUS: " + text);
};

document.getElementById("stopVoiceBtn").onclick = ()=>{
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  voiceState.textContent = "Voice stopped.";
  log("VOICE_STOPPED");
};

document.getElementById("listenBtn").onclick = ()=>{
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    voiceState.textContent = "Speech recognition unavailable in this browser. Jarvis will not fake wake listening.";
    log("WAKE_LISTENER_BLOCKED: SpeechRecognition unavailable.");
    return;
  }
  const rec = new SR();
  rec.continuous = false;
  rec.interimResults = false;
  rec.lang = "en-ZA";
  voiceState.textContent = "Listening for wake phrase: Jarvis";
  rec.onresult = (event)=>{
    const heard = event.results[0][0].transcript;
    log("VOICE_HEARD: " + heard);
    if (heard.toLowerCase().includes("jarvis")) {
      speak("Welcome to Kingsmen Command, Commander. Jarvis heard you.");
    } else {
      speak("Commander, I heard speech, but not the Jarvis wake phrase.");
    }
  };
  rec.onerror = (event)=>{
    voiceState.textContent = "Voice recognition error: " + event.error + ". Not faking voice.";
    log("WAKE_LISTENER_ERROR: " + event.error);
  };
  rec.start();
};

document.getElementById("runCommandBtn").onclick = ()=>{
  const cmd = commandInput.value.trim();
  if (!cmd) return;
  log("COMMANDER: " + cmd);
  const lower = cmd.toLowerCase();
  if (lower.includes("voice")) {
    detail.textContent = "Voice inventory loaded. Hits: " + (data.hitCounts.VOICE_WAKE_SPEECH || 0) + ". Greeting/script hits: " + (data.hitCounts.GREETINGS_ADDRESS_SCRIPTS || 0) + ".";
  } else if (lower.includes("provider") || lower.includes("apps")) {
    renderProviders();
    detail.textContent = "Provider matrix opened. No provider is claimed connected without runtime proof.";
  } else if (lower.includes("playwright")) {
    detail.textContent = "Playwright is scout/probe only. CAPTCHA, OTP, blocked portal or selector failure must move to MAP/Phoenix/manual fallback.";
  } else if (lower.includes("openclaw")) {
    detail.textContent = "OpenClaw gateway must route commands through registry, policy gate, tool router, evidence ledger and approval boundary.";
  } else if (lower.includes("fake") || lower.includes("placeholder")) {
    detail.textContent = "Fake-data gate active. Risk hits: " + (data.hitCounts.FAKE_PLACEHOLDER_MOCK_RISKS || 0) + ". No live claim may use unreviewed placeholder/static/mock/demo data.";
  } else {
    detail.textContent = "Command received. Jarvis will not fake execution from the browser. Local PowerShell, Git, PostgreSQL, provider actions and filesystem writes require Commander runtime adapters and proof.";
  }
};

document.getElementById("copyProofBtn").onclick = async ()=>{
  const text = "Jarvis inventory-backed build proof: scanned " + data.counts.scannedFiles + " files; Jarvis files " + data.counts.jarvisFiles + "; API routes " + data.counts.apiRoutes + "; core files " + data.counts.coreFiles + "; script files " + data.counts.scripts + "; evidence files " + data.counts.evidenceFiles + "; total hits " + data.counts.totalHits + ".";
  await navigator.clipboard.writeText(text);
  log("PROOF_COPIED");
};

renderModules();
</script>
</body>
</html>`;

write("apps/web/jarvis-os/jarvis-os.html", html);
write("apps/web/public/jarvis-os/jarvis-os.html", html);
write("apps/web/public/jarvis/index.html", html);

const pageTsx = `export const metadata = {
  title: "Kingsmen Jarvis Command",
  description: "Inventory-backed Commander-only Jarvis command surface"
};

export default function JarvisPage() {
  return (
    <main style={{ margin: 0, minHeight: "100vh", background: "#030713" }}>
      <iframe
        title="Kingsmen Jarvis Command"
        src="/jarvis-os/jarvis-os.html"
        style={{ width: "100%", height: "100vh", border: 0, display: "block" }}
      />
    </main>
  );
}
`;
write("apps/web/src/app/jarvis/page.tsx", pageTsx);

const proxy = `console.log("LEGACY_JARVIS_BUILDER_BLOCKED: using build-jarvis-from-inventory.cjs instead.");
require("./build-jarvis-from-inventory.cjs");
`;
write("apps/web/scripts/build-jarvis-os.cjs", proxy);
write("apps/web/scripts/build-static-jarvis.cjs", proxy);
write("apps/web/scripts/build-jarvis-luxury.cjs", proxy);

const reportPublicDir = "apps/web/public/jarvis/reports";
const reportCopies = [
  "reports/jarvis/JARVIS_AUDIT_INDEX_LATEST.md",
  "reports/jarvis/JARVIS_FULL_REPO_INVENTORY_LATEST.md",
  "reports/jarvis/JARVIS_FULL_REPO_INVENTORY_LATEST.json",
  "reports/jarvis/JARVIS_LIVE_BUILD_PLAN_FROM_INVENTORY_LATEST.md",
  "reports/jarvis/JARVIS_PROVIDER_CONNECTION_MATRIX_LATEST.md",
  "reports/jarvis/JARVIS_VOICE_GREETING_SCRIPT_INVENTORY_LATEST.md",
  "reports/jarvis/JARVIS_FAKE_PLACEHOLDER_RISK_LATEST.md",
  "reports/jarvis/JARVIS_OPENCLAW_PLAYWRIGHT_PROOF_INVENTORY_LATEST.md"
];

for (const src of reportCopies) {
  copy(src, path.join(reportPublicDir, path.basename(src)));
}

const proof = [
  "# JARVIS LIVE FROM INVENTORY BUILD PROOF",
  "",
  `Created: ${stamp}`,
  "",
  "This build replaced the rejected black/white/static Jarvis screen with an inventory-backed Commander-only Jarvis command surface.",
  "",
  "Source reports used:",
  "- reports/jarvis/JARVIS_FULL_REPO_INVENTORY_LATEST.json",
  "- reports/jarvis/JARVIS_LIVE_BUILD_PLAN_FROM_INVENTORY_LATEST.md",
  "- reports/jarvis/JARVIS_PROVIDER_CONNECTION_MATRIX_LATEST.md",
  "- reports/jarvis/JARVIS_VOICE_GREETING_SCRIPT_INVENTORY_LATEST.md",
  "- reports/jarvis/JARVIS_OPENCLAW_PLAYWRIGHT_PROOF_INVENTORY_LATEST.md",
  "- reports/jarvis/JARVIS_FAKE_PLACEHOLDER_RISK_LATEST.md",
  "",
  "Inventory counts rendered:",
  `- Scanned files: ${inventory.scannedFileCount}`,
  `- Jarvis files: ${inventory.jarvisFileCount}`,
  `- Jarvis API route files: ${inventory.apiRouteFileCount}`,
  `- Jarvis core files: ${inventory.coreFileCount}`,
  `- Jarvis script files: ${inventory.scriptFileCount}`,
  `- Validator/report/evidence files: ${inventory.validatorFileCount}`,
  `- Total keyword hits: ${inventory.totalHitCount}`,
  "",
  "Live surface includes:",
  "- Voice greeting button.",
  "- Speech status button.",
  "- Wake listener with clear browser-support boundary.",
  "- Commander/sir address language.",
  "- N00-N20 clickable module cards.",
  "- Provider matrix with honest runtime-proof-needed statuses.",
  "- Evidence report links.",
  "- Fake/placeholder risk gate.",
  "- OpenClaw and Playwright boundaries.",
  "",
  "Blocked:",
  "- Fake connected provider claims.",
  "- Placeholder numbers.",
  "- Static black/white child-play screen.",
  "- Browser pretending to run local PowerShell, Git, PostgreSQL, Playwright or provider actions."
].join("\\n");

write("reports/jarvis/JARVIS_LIVE_FROM_INVENTORY_BUILD_PROOF_LATEST.md", proof);

console.log("JARVIS_FROM_INVENTORY_BUILD_COMPLETE");
console.log("Wrote apps/web/jarvis-os/jarvis-os.html");
console.log("Wrote apps/web/public/jarvis-os/jarvis-os.html");
console.log("Wrote apps/web/public/jarvis/index.html");
console.log("Wrote apps/web/src/app/jarvis/page.tsx");
console.log("Wrote reports/jarvis/JARVIS_LIVE_FROM_INVENTORY_BUILD_PROOF_LATEST.md");
