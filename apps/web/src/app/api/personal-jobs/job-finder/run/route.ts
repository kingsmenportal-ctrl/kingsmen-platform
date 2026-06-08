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

export async function POST() {
  const root = repoRoot();
  const script = path.join(root, "scripts/agents/personal-job-discovery-agent.mjs");

  if (!fs.existsSync(script)) {
    return NextResponse.json(
      {
        status: "FAILED",
        error: "PERSONAL-JOBS-17 discovery agent script is missing.",
        sendsApplications: false,
        contactsEmployers: false
      },
      { status: 500 }
    );
  }

  const run = spawnSync(process.execPath, [script, "--json"], {
    cwd: root,
    encoding: "utf8",
    timeout: 90000,
    maxBuffer: 1024 * 1024 * 8
  });

  if (run.status !== 0) {
    return NextResponse.json(
      {
        status: "FAILED",
        exitCode: run.status,
        stdout: run.stdout,
        stderr: run.stderr,
        sendsApplications: false,
        contactsEmployers: false
      },
      { status: 500 }
    );
  }

  try {
    const parsed = JSON.parse(run.stdout);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json(
      {
        status: "FAILED",
        error: "Discovery agent returned non-JSON output.",
        stdout: run.stdout,
        stderr: run.stderr,
        sendsApplications: false,
        contactsEmployers: false
      },
      { status: 500 }
    );
  }
}