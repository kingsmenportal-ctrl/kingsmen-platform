import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function repoRoot() {
  const cwd = process.cwd();
  if (cwd.replace(/\\/g, "/").endsWith("apps/web")) return path.resolve(cwd, "../..");
  return cwd;
}

const ROOT = repoRoot();
const OUT = path.join(ROOT, "data/personal-job-desk/scouted-opportunities.local.json");
const APPLY_STORE = path.join(ROOT, "data/personal-job-desk/apply-now.local.json");

function readJson(file: string, fallback: any) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return fallback;
  }
}

function writeJson(file: string, data: any) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function defaultApplyStore() {
  return {
    updatedAt: new Date().toISOString(),
    profile: {},
    documents: [],
    opportunities: [],
    applicationPacks: [],
    proofLog: [],
    smartExtraction: []
  };
}

export async function GET() {
  const output = readJson(OUT, {
    schema: "kingsmen.personal-jobs-35.opportunity-scout.v1",
    module: "PERSONAL-JOBS-35",
    status: "EMPTY",
    generatedAt: new Date().toISOString(),
    leadCount: 0,
    sourceResults: [],
    leads: []
  });

  return NextResponse.json(output);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "").trim();

  if (action === "runScout") {
    const script = path.join(ROOT, "scripts/agents/personal-job-opportunity-scout.mjs");
    const args = [
      script,
      `--query=${String(body.query || "")}`,
      `--location=${String(body.location || "Johannesburg")}`,
      `--category=${String(body.category || "JOB")}`
    ];

    const result = spawnSync(process.execPath, args, {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 120000,
      maxBuffer: 1024 * 1024 * 30
    });

    if (result.status !== 0) {
      return NextResponse.json({
        status: "FAILED",
        error: result.stderr || result.stdout || "Scout failed."
      }, { status: 500 });
    }

    return NextResponse.json(readJson(OUT, {}));
  }

  if (action === "importLead") {
    const leadId = String(body.leadId || "");
    const scout = readJson(OUT, { leads: [] });
    const lead = (scout.leads || []).find((x: any) => x.leadId === leadId);

    if (!lead) {
      return NextResponse.json({ status: "FAILED", error: "Lead not found." }, { status: 404 });
    }

    const store = readJson(APPLY_STORE, defaultApplyStore());
    const exists = (store.opportunities || []).some((opp: any) => opp.sourceUrl === lead.sourceUrl);

    if (!exists) {
      store.opportunities = [
        {
          opportunityId: `opp-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          title: lead.title,
          organisation: lead.organisation || lead.source,
          category: lead.category || "JOB",
          location: lead.location || "",
          sourceUrl: lead.sourceUrl,
          applicationMethod: lead.applicationMethod || "PORTAL",
          emailTo: "",
          closingDate: "",
          notes: `Imported from ${lead.source}. Review official page before applying.`,
          status: "IMPORTED_BY_SCOUT",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        ...(store.opportunities || [])
      ];
    }

    store.updatedAt = new Date().toISOString();
    writeJson(APPLY_STORE, store);

    scout.leads = (scout.leads || []).map((x: any) =>
      x.leadId === leadId ? { ...x, imported: true, importedAt: new Date().toISOString() } : x
    );
    writeJson(OUT, scout);

    return NextResponse.json({ status: "IMPORTED", lead, store, scout });
  }

  return NextResponse.json({ status: "FAILED", error: "Unknown action." }, { status: 400 });
}