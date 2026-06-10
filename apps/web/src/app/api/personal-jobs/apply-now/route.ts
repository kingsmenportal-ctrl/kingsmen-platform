import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Store = {
  schema: string;
  updatedAt: string;
  profile: Record<string, string>;
  documents: any[];
  opportunities: any[];
  applicationPacks: any[];
  proofLog: any[];
};

function repoRoot() {
  const cwd = process.cwd();
  if (cwd.replace(/\\/g, "/").endsWith("apps/web")) return path.resolve(cwd, "../..");
  return cwd;
}

const root = repoRoot();
const storePath = path.join(root, "data/personal-job-desk/apply-now.local.json");
const uploadDir = path.join(root, "data/personal-job-desk/uploads");

function now() {
  return new Date().toISOString();
}

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function safeName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 140);
}

function defaultStore(): Store {
  return {
    schema: "kingsmen.today.apply-now.v1",
    updatedAt: now(),
    profile: {
      fullName: "",
      idOrPassport: "",
      phone: "",
      email: "",
      location: "Johannesburg",
      highestEducation: "",
      workExperience: "",
      skills: "",
      targetRoutes: "Jobs, Learnerships, Internships, Funding",
      notes: ""
    },
    documents: [],
    opportunities: [],
    applicationPacks: [],
    proofLog: []
  };
}

function readStore(): Store {
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  if (!fs.existsSync(storePath)) {
    const initial = defaultStore();
    fs.writeFileSync(storePath, JSON.stringify(initial, null, 2) + "\n", "utf8");
    return initial;
  }

  try {
    return JSON.parse(fs.readFileSync(storePath, "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return defaultStore();
  }
}

function writeStore(store: Store) {
  store.updatedAt = now();
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2) + "\n", "utf8");
}

function packBody(profile: Record<string, string>, opportunity: any, docs: any[]) {
  const docLines = docs.map((doc) => `- ${doc.documentType}: ${doc.originalName}`).join("\n") || "- No documents uploaded yet.";

  return [
    `Application pack for: ${opportunity.title || "Opportunity"}`,
    `Organisation: ${opportunity.organisation || ""}`,
    `Category: ${opportunity.category || ""}`,
    `Official/source link: ${opportunity.sourceUrl || ""}`,
    "",
    "Candidate:",
    `Name: ${profile.fullName || ""}`,
    `Location: ${profile.location || ""}`,
    `Phone: ${profile.phone || ""}`,
    `Email: ${profile.email || ""}`,
    `Highest education: ${profile.highestEducation || ""}`,
    `Skills: ${profile.skills || ""}`,
    `Experience: ${profile.workExperience || ""}`,
    "",
    "Documents ready:",
    docLines,
    "",
    "Safe rule:",
    "Only truthful information and real documents may be used. No fake experience, fake references, fake certificates, fake licences, fake qualifications or false claims.",
    "",
    "Next action:",
    opportunity.applicationMethod === "EMAIL"
      ? "Send this application manually by email, then paste proof/reference back into Kingsmen."
      : "Apply on the official source/portal manually, then paste proof/reference back into Kingsmen."
  ].join("\n");
}

function makePack(store: Store, opportunity: any) {
  const body = packBody(store.profile, opportunity, store.documents);
  const subject = `Application: ${opportunity.title || "Opportunity"} - ${store.profile.fullName || "Candidate"}`;
  const to = opportunity.emailTo || "";
  const mailto = to
    ? `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : "";

  return {
    packId: `pack-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    opportunityId: opportunity.opportunityId,
    title: opportunity.title,
    organisation: opportunity.organisation,
    category: opportunity.category,
    sourceUrl: opportunity.sourceUrl,
    applicationMethod: opportunity.applicationMethod,
    emailTo: opportunity.emailTo,
    subject,
    body,
    mailto,
    documentCount: store.documents.length,
    createdAt: now(),
    status: "READY_TO_APPLY_MANUALLY"
  };
}

export async function GET() {
  return NextResponse.json(readStore());
}

export async function POST(request: Request) {
  const store = readStore();

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: "FAILED", error: "Invalid JSON body." }, { status: 400 });
  }

  const action = clean(body.action);

  if (action === "saveProfile") {
    store.profile = {
      ...store.profile,
      ...Object.fromEntries(Object.entries(body.profile ?? {}).map(([k, v]) => [k, clean(v)]))
    };
    writeStore(store);
    return NextResponse.json({ status: "SAVED", store });
  }

  if (action === "uploadDocument") {
    const fileName = safeName(clean(body.fileName || "document.bin"));
    const documentType = clean(body.documentType || "OTHER");
    const dataUrl = clean(body.dataUrl);
    const comma = dataUrl.indexOf(",");

    if (!dataUrl.startsWith("data:") || comma < 0) {
      return NextResponse.json({ status: "FAILED", error: "Invalid upload data." }, { status: 400 });
    }

    const meta = dataUrl.slice(5, comma);
    const base64 = dataUrl.slice(comma + 1);
    const mimeType = meta.split(";")[0] || "application/octet-stream";
    const savedName = `${Date.now()}-${fileName}`;
    const savedPath = path.join(uploadDir, savedName);

    fs.mkdirSync(uploadDir, { recursive: true });
    fs.writeFileSync(savedPath, Buffer.from(base64, "base64"));

    const doc = {
      documentId: `doc-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      documentType,
      originalName: fileName,
      savedName,
      localPath: `data/personal-job-desk/uploads/${savedName}`,
      mimeType,
      uploadedAt: now(),
      verified: false,
      safeRule: "Document stored locally. Must be real and truthful before use."
    };

    store.documents.unshift(doc);
    writeStore(store);
    return NextResponse.json({ status: "UPLOADED", document: doc, store });
  }

  if (action === "addOpportunity") {
    const opportunity = {
      opportunityId: `opp-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: clean(body.opportunity?.title),
      organisation: clean(body.opportunity?.organisation),
      category: clean(body.opportunity?.category || "JOB"),
      location: clean(body.opportunity?.location || store.profile.location || "Johannesburg"),
      sourceUrl: clean(body.opportunity?.sourceUrl),
      applicationMethod: clean(body.opportunity?.applicationMethod || "PORTAL"),
      emailTo: clean(body.opportunity?.emailTo),
      closingDate: clean(body.opportunity?.closingDate),
      notes: clean(body.opportunity?.notes),
      status: "SAVED_REAL_SOURCE",
      proof: "",
      createdAt: now(),
      updatedAt: now()
    };

    if (!opportunity.title || !opportunity.organisation || !opportunity.sourceUrl) {
      return NextResponse.json({ status: "FAILED", error: "Title, organisation and official/source link are required." }, { status: 400 });
    }

    store.opportunities.unshift(opportunity);
    writeStore(store);
    return NextResponse.json({ status: "ADDED", opportunity, store });
  }

  if (action === "generatePack") {
    const opportunityId = clean(body.opportunityId);
    const opportunity = store.opportunities.find((x: any) => x.opportunityId === opportunityId);

    if (!opportunity) {
      return NextResponse.json({ status: "FAILED", error: "Opportunity not found." }, { status: 404 });
    }

    const pack = makePack(store, opportunity);
    store.applicationPacks.unshift(pack);
    opportunity.status = "PACK_READY";
    opportunity.updatedAt = now();

    writeStore(store);
    return NextResponse.json({ status: "PACK_READY", pack, store });
  }

  if (action === "markApplied") {
    const opportunityId = clean(body.opportunityId);
    const proof = clean(body.proof);
    const opportunity = store.opportunities.find((x: any) => x.opportunityId === opportunityId);

    if (!opportunity) {
      return NextResponse.json({ status: "FAILED", error: "Opportunity not found." }, { status: 404 });
    }

    if (!proof) {
      return NextResponse.json({ status: "FAILED", error: "Proof/reference is required after applying." }, { status: 400 });
    }

    opportunity.status = "APPLIED_PROOF_CAPTURED";
    opportunity.proof = proof;
    opportunity.updatedAt = now();

    store.proofLog.unshift({
      proofId: `proof-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      opportunityId,
      title: opportunity.title,
      organisation: opportunity.organisation,
      proof,
      capturedAt: now()
    });

    writeStore(store);
    return NextResponse.json({ status: "APPLIED_PROOF_CAPTURED", opportunity, store });
  }

  if (action === "deleteOpportunity") {
    const opportunityId = clean(body.opportunityId);
    store.opportunities = store.opportunities.filter((x: any) => x.opportunityId !== opportunityId);
    store.applicationPacks = store.applicationPacks.filter((x: any) => x.opportunityId !== opportunityId);
    writeStore(store);
    return NextResponse.json({ status: "DELETED", store });
  }

  return NextResponse.json({ status: "FAILED", error: `Unknown action: ${action}` }, { status: 400 });
}