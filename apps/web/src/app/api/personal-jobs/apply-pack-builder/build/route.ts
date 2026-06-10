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

function writeJson(filePath: string, data: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export async function POST(request: Request) {
  const root = repoRoot();
  const script = path.join(root, "scripts/agents/personal-job-apply-pack-builder.mjs");

  if (!fs.existsSync(script)) {
    return NextResponse.json({ status: "FAILED", error: "PJ21 agent missing." }, { status: 500 });
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  if (body?.profile) {
    writeJson(path.join(root, "data/personal-job-desk/one-profile.local.json"), body.profile);
  }

  const run = spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: "utf8",
    timeout: 90000,
    maxBuffer: 1024 * 1024 * 30
  });

  if (run.status !== 0) {
    return NextResponse.json(
      { status: "FAILED", stdout: run.stdout, stderr: run.stderr },
      { status: 500 }
    );
  }

  const outputPath = path.join(root, "data/personal-job-desk/application-packs.local.json");
  const output = JSON.parse(fs.readFileSync(outputPath, "utf8"));

  return NextResponse.json(output);
}