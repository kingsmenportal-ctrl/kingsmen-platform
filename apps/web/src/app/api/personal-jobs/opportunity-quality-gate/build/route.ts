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

export async function POST() {
  const root = repoRoot();
  const script = path.join(root, "scripts/agents/personal-job-opportunity-quality-gate.mjs");

  if (!fs.existsSync(script)) {
    return NextResponse.json({ status: "FAILED", error: "PJ20B agent missing." }, { status: 500 });
  }

  const run = spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: "utf8",
    timeout: 90000,
    maxBuffer: 1024 * 1024 * 20
  });

  if (run.status !== 0) {
    return NextResponse.json(
      { status: "FAILED", stdout: run.stdout, stderr: run.stderr },
      { status: 500 }
    );
  }

  const outputPath = path.join(root, "data/personal-job-desk/opportunity-quality-gate.local.json");
  const output = JSON.parse(fs.readFileSync(outputPath, "utf8"));

  return NextResponse.json(output);
}