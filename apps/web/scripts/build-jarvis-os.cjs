const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const dist = path.join(root, "dist");
const source = path.join(root, "jarvis-os", "jarvis-os.html");

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, "jarvis"), { recursive: true });
fs.mkdirSync(path.join(dist, "command"), { recursive: true });

const html = fs.readFileSync(source, "utf8");

fs.writeFileSync(path.join(dist, "index.html"), html);
fs.writeFileSync(path.join(dist, "jarvis", "index.html"), html);
fs.writeFileSync(path.join(dist, "command", "index.html"), html);
fs.writeFileSync(path.join(dist, "_redirects"), [
  "/api/jarvis/agent /.netlify/functions/jarvis-agent 200!",
  "/jarvis /jarvis/index.html 200",
  "/command /command/index.html 200",
  "/ /jarvis/index.html 200",
  "/* /jarvis/index.html 200"
].join("\n"));

console.log("JARVIS_OS_VISUAL_LOCK_BUILD_COMPLETE");
console.log(dist);