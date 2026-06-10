import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function repoRoot() {
  const cwd = process.cwd();
  if (cwd.replace(/\\/g, "/").endsWith("apps/web")) return path.resolve(cwd, "../..");
  return cwd;
}

function outputPath() {
  return path.join(repoRoot(), "data/personal-job-desk/document-pack-index.local.json");
}

function syncIndex(): { ok: true; output: any } | { ok: false; error: string; status: number } {
  const root = repoRoot();
  const script = path.join(root, "scripts/agents/personal-job-document-pack-index.mjs");

  if (!fs.existsSync(script)) {
    return { ok: false, error: "PJ33 agent missing.", status: 500 };
  }

  const run = spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: "utf8",
    timeout: 90000,
    maxBuffer: 1024 * 1024 * 30
  });

  if (run.status !== 0) {
    return { ok: false, error: run.stderr || run.stdout || "PJ33 sync failed.", status: 500 };
  }

  const output = JSON.parse(fs.readFileSync(outputPath(), "utf8"));
  return { ok: true, output };
}

export async function GET() {
  const synced = syncIndex();
  if (!synced.ok) {
    return NextResponse.json({ status: "FAILED", error: synced.error }, { status: synced.status });
  }

  return NextResponse.json(synced.output);
}