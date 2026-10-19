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
  let output: any;
  try {
    const raw = fs.readFileSync(outputPath, "utf8");
    if (Buffer.byteLength(raw, "utf8") > 20 * 1024 * 1024) {
      return NextResponse.json({ status: "FAILED", error: "Application-pack output exceeds the allowed size." }, { status: 500 });
    }
    output = JSON.parse(raw);
  } catch {
    return NextResponse.json({ status: "FAILED", error: "Application-pack output is missing or invalid; existing data was preserved." }, { status: 500 });
  }

  const packs = Array.isArray(output?.packs) ? output.packs : null;
  if (output?.status !== "COMPLETED" || !packs || packs.length !== Number(output.applicationPackCount)) {
    return NextResponse.json({ status: "FAILED", error: "Application-pack output failed its structural integrity check." }, { status: 500 });
  }

  const validationErrors: string[] = [];
  const seenPackIds = new Set<string>();
  for (const [index, pack] of packs.entries()) {
    if (!pack || typeof pack !== "object" || typeof pack.packId !== "string" || !pack.packId.trim()) {
      validationErrors.push(`Pack ${index + 1} has no stable identifier.`);
      continue;
    }
    if (seenPackIds.has(pack.packId)) validationErrors.push(`Pack ${pack.packId} has a duplicate identifier.`);
    seenPackIds.add(pack.packId);
    if (!["READY_FOR_HUMAN_REVIEW", "NEEDS_PROFILE_COMPLETION"].includes(pack.status)) {
      validationErrors.push(`Pack ${pack.packId} has an unsupported review status.`);
    }
    if (!pack.lead || typeof pack.lead.title !== "string" || !pack.lead.title.trim() ||
        typeof pack.lead.company !== "string" || !pack.lead.company.trim()) {
      validationErrors.push(`Pack ${pack.packId} is missing vacancy title or employer.`);
    }
    const source = typeof pack.lead?.sourceUrl === "string" ? pack.lead.sourceUrl : "";
    let sourceIsHttps = false;
    try { sourceIsHttps = new URL(source).protocol === "https:"; } catch {}
    if (!sourceIsHttps) validationErrors.push(`Pack ${pack.packId} has no valid HTTPS source URL; confirm the employer's official channel manually.`);
    if (typeof pack.motivationDraft !== "string" || pack.motivationDraft.trim().length < 40) {
      validationErrors.push(`Pack ${pack.packId} has no usable motivation draft.`);
    }
    if (!Array.isArray(pack.cvFocus) || pack.cvFocus.length === 0 ||
        !Array.isArray(pack.manualApplySteps) || pack.manualApplySteps.length === 0) {
      validationErrors.push(`Pack ${pack.packId} is missing CV focus or manual application steps.`);
    }
    const boundary = pack.safetyBoundary || {};
    if (boundary.sendsApplications || boundary.sendsEmail || boundary.sendsWhatsApp ||
        boundary.contactsEmployers || boundary.touchesPayments || boundary.bypassesLoginOrCaptcha) {
      validationErrors.push(`Pack ${pack.packId} violates the manual-review-only safety boundary.`);
    }
  }

  const validatedPacks = packs.map((pack: any) => ({
    ...pack,
    documentChecklist: [
      { type: "CV", status: "CANDIDATE_CONFIRMATION_REQUIRED", note: "Attach the current active CV and confirm its details before submission." },
      { type: "IDENTITY_DOCUMENT", status: "REQUIREMENT_NOT_CONFIRMED", note: "Attach only if the employer's official vacancy instructions require it." },
      { type: "QUALIFICATIONS_OR_CERTIFICATES", status: "REQUIREMENT_NOT_CONFIRMED", note: "Attach only relevant, available documents requested by the employer." },
      { type: "APPLICATION_PROOF", status: "MISSING_UNTIL_SUBMITTED", note: "Capture the employer confirmation or reference after manual submission." }
    ],
    documentChecklistNotice: "This checklist is guidance only. The builder has not verified canonical vault files, file authenticity, employer-specific requirements, or application submission."
  }));

  if (validationErrors.length) {
    return NextResponse.json({
      status: "FAILED",
      error: "Application-pack validation failed. Review the reported issues before using these packs.",
      validationErrors: validationErrors.slice(0, 100)
    }, { status: 422 });
  }

  return NextResponse.json({
    ...output,
    packs: validatedPacks,
    validation: {
      status: "STRUCTURE_VALIDATED",
      packCount: packs.length,
      sourceUrlChecks: "HTTPS_SYNTAX_ONLY",
      documentAvailabilityVerified: false,
      documentAuthenticityVerified: false,
      employerRequirementsVerified: false,
      applicationSubmitted: false,
      errors: []
    }
  });
}