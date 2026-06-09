import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function repoRoot() {
  const cwd = process.cwd();
  if (cwd.replace(/\\/g, "/").endsWith("apps/web")) {
    return path.resolve(cwd, "../..");
  }
  return cwd;
}

export async function POST(request: Request) {
  const root = repoRoot();
  const script = path.join(root, "scripts/agents/personal-job-playwright-source-scout.mjs");

  if (!fs.existsSync(script)) {
    return NextResponse.json(
      {
        status: "FAILED",
        error: "PERSONAL-JOBS-19 Playwright source scout script is missing.",
        sendsApplications: false,
        contactsEmployers: false
      },
      { status: 500 }
    );
  }

  let body: { limit?: number; source?: string; headed?: boolean } = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const args = [script, "--json"];
  const limit = Math.max(1, Math.min(Number(body.limit ?? 8), 25));
  args.push("--limit", String(limit));

  if (body.source) {
    args.push("--source", String(body.source));
  }

  if (body.headed === true) {
    args.push("--headed");
  }

  const run = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: "utf8",
    timeout: 180000,
    maxBuffer: 1024 * 1024 * 20
  });

  if (run.status !== 0) {
    let parsed = null;
    try {
      parsed = JSON.parse(run.stderr || run.stdout);
    } catch {
      parsed = null;
    }

    return NextResponse.json(
      {
        status: "FAILED",
        exitCode: run.status,
        error: parsed?.error || "Playwright source scout failed.",
        stdout: run.stdout,
        stderr: run.stderr,
        sendsApplications: false,
        contactsEmployers: false
      },
      { status: 500 }
    );
  }

  try {
    return NextResponse.json(JSON.parse(run.stdout));
  } catch {
    return NextResponse.json(
      {
        status: "FAILED",
        error: "Playwright source scout returned non-JSON output.",
        stdout: run.stdout,
        stderr: run.stderr,
        sendsApplications: false,
        contactsEmployers: false
      },
      { status: 500 }
    );
  }
}