import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_QUERY_LENGTH = 160;
const MAX_LOCATION_LENGTH = 100;
const ALLOWED_CATEGORIES = new Set(["JOB", "LEARNERSHIP", "INTERNSHIP", "FUNDING", "BURSARY"]);

function boundedText(value: unknown, fallback: string, maxLength: number) {
  if (typeof value !== "string") return fallback;
  return value.trim().slice(0, maxLength);
}

function repoRoot() {
  const cwd = process.cwd();
  if (cwd.replace(/\\/g, "/").endsWith("apps/web")) return path.resolve(cwd, "../..");
  return cwd;
}

const ROOT = repoRoot();
const DATA_DIR = path.join(ROOT, "data", "personal-job-desk");
const OUT = path.join(DATA_DIR, "scouted-opportunities.local.json");
const APPLY_STORE = path.join(DATA_DIR, "apply-now.local.json");

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

function defaultScout() {
  return {
    schema: "kingsmen.personal-jobs-35.opportunity-scout.v1",
    module: "PERSONAL-JOBS-35",
    status: "READY",
    generatedAt: new Date().toISOString(),
    query: "",
    location: "Johannesburg",
    category: "JOB",
    leadCount: 0,
    sourceResults: [],
    leads: [],
    diagnostics: [],
    nextAction: "Run scout. If a website blocks automation, open the source manually from this page."
  };
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

function sourceLinks(query: string, location: string, category: string) {
  const q = encodeURIComponent(query || "entry level jobs learnership internship");
  const l = encodeURIComponent(location || "Johannesburg");

  return [
    {
      leadId: `lead-${Date.now()}-indeed`,
      source: "Indeed",
      category,
      title: `${query || "Entry level jobs"} - Indeed live search`,
      organisation: "Indeed",
      location,
      sourceUrl: `https://za.indeed.com/jobs?q=${q}&l=${l}`,
      applicationMethod: "PORTAL",
      confidence: "LIVE_SOURCE_SEARCH",
      scoutStatus: "OPEN_AND_REVIEW",
      imported: false,
      createdAt: new Date().toISOString()
    },
    {
      leadId: `lead-${Date.now()}-careers24`,
      source: "Careers24",
      category,
      title: `${query || "Entry level jobs"} - Careers24 live search`,
      organisation: "Careers24",
      location,
      sourceUrl: `https://www.careers24.com/jobs/lc-${l}/?q=${q}`,
      applicationMethod: "PORTAL",
      confidence: "LIVE_SOURCE_SEARCH",
      scoutStatus: "OPEN_AND_REVIEW",
      imported: false,
      createdAt: new Date().toISOString()
    },
    {
      leadId: `lead-${Date.now()}-pnet`,
      source: "PNet",
      category,
      title: `${query || "Entry level jobs"} - PNet live search`,
      organisation: "PNet",
      location,
      sourceUrl: `https://www.pnet.co.za/jobs/${q}/in-${l}`,
      applicationMethod: "PORTAL",
      confidence: "LIVE_SOURCE_SEARCH",
      scoutStatus: "OPEN_AND_REVIEW",
      imported: false,
      createdAt: new Date().toISOString()
    },
    {
      leadId: `lead-${Date.now()}-sayouth`,
      source: "SA Youth",
      category: "LEARNERSHIP",
      title: "SA Youth opportunities",
      organisation: "SA Youth",
      location,
      sourceUrl: "https://sayouth.mobi/",
      applicationMethod: "PORTAL",
      confidence: "OFFICIAL_SOURCE_ENTRY",
      scoutStatus: "LOGIN_OR_MANUAL_REVIEW_REQUIRED",
      imported: false,
      createdAt: new Date().toISOString()
    },
    {
      leadId: `lead-${Date.now()}-essa`,
      source: "ESSA Labour",
      category: "JOB",
      title: "ESSA Labour opportunities",
      organisation: "Department of Employment and Labour",
      location,
      sourceUrl: "https://essa.labour.gov.za/EssaOnline/WebBeans/",
      applicationMethod: "PORTAL",
      confidence: "OFFICIAL_SOURCE_ENTRY",
      scoutStatus: "LOGIN_OR_MANUAL_REVIEW_REQUIRED",
      imported: false,
      createdAt: new Date().toISOString()
    },
    {
      leadId: `lead-${Date.now()}-nyda`,
      source: "NYDA",
      category: "FUNDING",
      title: "NYDA youth opportunities",
      organisation: "NYDA",
      location,
      sourceUrl: "https://www.nyda.gov.za/",
      applicationMethod: "PORTAL",
      confidence: "OFFICIAL_SOURCE_ENTRY",
      scoutStatus: "OPEN_AND_REVIEW",
      imported: false,
      createdAt: new Date().toISOString()
    }
  ];
}

export async function GET() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    return NextResponse.json(readJson(OUT, defaultScout()));
  } catch (error) {
    return NextResponse.json({
      ...defaultScout(),
      status: "ERROR_VISIBLE",
      diagnostics: [error instanceof Error ? error.message : "GET failed"]
    });
  }
}

export async function POST(request: Request) {
  try {
    if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
      return NextResponse.json({ status: "FAILED", error: "Content-Type must be application/json." }, { status: 415 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ status: "FAILED", error: "Request body must be a JSON object." }, { status: 400 });
    }
    const action = typeof body.action === "string" ? body.action.trim() : "";

    if (action === "runScout") {
      const query = boundedText(body.query, "entry level general worker admin learnership internship", MAX_QUERY_LENGTH);
      const location = boundedText(body.location, "Johannesburg", MAX_LOCATION_LENGTH);
      const requestedCategory = boundedText(body.category, "JOB", 24).toUpperCase();
      if (!query || !location) {
        return NextResponse.json({ status: "FAILED", error: "Search and location are required." }, { status: 400 });
      }
      if (!ALLOWED_CATEGORIES.has(requestedCategory)) {
        return NextResponse.json({ status: "FAILED", error: "Choose a supported opportunity category." }, { status: 400 });
      }
      const category = requestedCategory;

      const script = path.join(ROOT, "scripts", "agents", "personal-job-opportunity-scout.mjs");
      const fallbackLeads = sourceLinks(query, location, category);

      let diagnostics: string[] = [];
      let leads = fallbackLeads;
      let sourceResults: any[] = fallbackLeads.map((lead) => ({
        source: lead.source,
        status: lead.scoutStatus,
        note: "Safe live-source card available. Open and review before applying.",
        openUrl: lead.sourceUrl
      }));

      if (fs.existsSync(script)) {
        const result = spawnSync(process.execPath, [
          script,
          `--query=${query}`,
          `--location=${location}`,
          `--category=${category}`
        ], {
          cwd: ROOT,
          encoding: "utf8",
          timeout: 120000,
          maxBuffer: 1024 * 1024 * 30
        });

        diagnostics.push(
          result.error
            ? "Scout agent could not start."
            : result.status === 0
              ? "Scout agent completed."
              : "Scout agent exited unsuccessfully."
        );
        // Never return raw process output: it can expose filesystem paths,
        // environment details, source-page content, or other internal data.

        const agentOut = readJson(OUT, null);
        if (result.status === 0 && agentOut && Array.isArray(agentOut.leads) && agentOut.leads.length) {
          leads = agentOut.leads;
          sourceResults = agentOut.sourceResults || sourceResults;
        }
      } else {
        diagnostics.push("Scout agent file missing. Used safe live-source cards.");
      }

      const output = {
        schema: "kingsmen.personal-jobs-35.opportunity-scout.v1",
        module: "PERSONAL-JOBS-35",
        status: "SCOUT_READY",
        generatedAt: new Date().toISOString(),
        query,
        location,
        category,
        leadCount: leads.length,
        sourceResults,
        leads,
        diagnostics,
        safetyBoundary: {
          autoApplies: false,
          bypassesLogin: false,
          bypassesOtp: false,
          bypassesCaptcha: false,
          contactsEmployers: false,
          inventsJobs: false,
          requiresCandidateReview: true
        },
        nextAction: "Review leads, open official pages, import useful leads into Apply Now, then build packs."
      };

      writeJson(OUT, output);
      return NextResponse.json(output);
    }

    if (action === "importLead") {
      const leadId = typeof body.leadId === "string" ? body.leadId.trim() : "";
      if (!leadId || leadId.length > 200) {
        return NextResponse.json({ status: "FAILED", error: "A valid lead identifier is required." }, { status: 400 });
      }
      const scout = readJson(OUT, defaultScout());
      const lead = (scout.leads || []).find((x: any) => x.leadId === leadId);

      if (!lead) {
        return NextResponse.json({
          status: "FAILED",
          error: "Lead not found. Run scout again."
        }, { status: 404 });
      }

      // Treat agent output and local JSON as untrusted input. Only import secure
      // web URLs; reject javascript:, data:, credentialed URLs and malformed links.
      let sourceUrl: URL;
      try {
        sourceUrl = new URL(String(lead.sourceUrl || ""));
      } catch {
        return NextResponse.json({ status: "FAILED", error: "This lead has an invalid source link and cannot be imported." }, { status: 422 });
      }
      if (sourceUrl.protocol !== "https:" || sourceUrl.username || sourceUrl.password) {
        return NextResponse.json({ status: "FAILED", error: "Only secure HTTPS source links can be imported." }, { status: 422 });
      }

      const store = readJson(APPLY_STORE, defaultApplyStore());
      const exists = (store.opportunities || []).some((opp: any) => opp.sourceUrl === sourceUrl.toString());

      if (!exists) {
        store.opportunities = [
          {
            opportunityId: `opp-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            title: lead.title,
            organisation: lead.organisation || lead.source,
            category: lead.category || "JOB",
            location: lead.location || "",
            sourceUrl: sourceUrl.toString(),
            applicationMethod: lead.applicationMethod || "PORTAL",
            emailTo: "",
            closingDate: "",
            notes: `Imported from ${lead.source}. Review the official page before applying.`,
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

      return NextResponse.json({
        status: "IMPORTED",
        lead,
        store,
        scout
      });
    }

    return NextResponse.json({
      status: "FAILED",
      error: "Unknown action."
    });
  } catch (error) {
    // Keep internal paths, stack traces and agent output out of public API responses.
    return NextResponse.json({
      status: "ERROR_VISIBLE",
      error: "Opportunity scout could not complete this request. Please retry."
    }, { status: 503 });
  }
}