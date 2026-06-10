import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Store = {
  updatedAt?: string;
  profile?: Record<string, string>;
  documents?: any[];
  opportunities?: any[];
  applicationPacks?: any[];
  proofLog?: any[];
  smartExtraction?: any[];
};

function repoRoot() {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, "apps", "web"))) return cwd;
  if (cwd.endsWith(path.join("apps", "web"))) return path.resolve(cwd, "../..");
  return cwd;
}

const ROOT = repoRoot();
const DATA_DIR = path.join(ROOT, "data", "personal-job-desk");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const STORE_PATH = path.join(DATA_DIR, "apply-now.local.json");

const blankProfile = {
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
};

function ensureDirs() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function readStore(): Store {
  ensureDirs();

  if (!fs.existsSync(STORE_PATH)) {
    return {
      updatedAt: new Date().toISOString(),
      profile: { ...blankProfile },
      documents: [],
      opportunities: [],
      applicationPacks: [],
      proofLog: [],
      smartExtraction: []
    };
  }

  const store = JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
  return {
    updatedAt: store.updatedAt || new Date().toISOString(),
    profile: { ...blankProfile, ...(store.profile || {}) },
    documents: Array.isArray(store.documents) ? store.documents : [],
    opportunities: Array.isArray(store.opportunities) ? store.opportunities : [],
    applicationPacks: Array.isArray(store.applicationPacks) ? store.applicationPacks : [],
    proofLog: Array.isArray(store.proofLog) ? store.proofLog : [],
    smartExtraction: Array.isArray(store.smartExtraction) ? store.smartExtraction : []
  };
}

function writeStore(store: Store) {
  ensureDirs();
  const next = { ...store, updatedAt: new Date().toISOString() };
  fs.writeFileSync(STORE_PATH, JSON.stringify(next, null, 2) + "\n", "utf8");
  return next;
}

function id(prefix: string) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

function safeName(name: string) {
  return String(name || "document")
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 120);
}

function dataUrlToBuffer(dataUrl: string) {
  const match = String(dataUrl || "").match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid upload payload.");
  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], "base64")
  };
}

function cleanText(text: string) {
  return String(text || "")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extractText(buffer: Buffer, fileName: string, mimeType: string) {
  const ext = path.extname(fileName).toLowerCase();

  if ([".txt", ".md", ".csv", ".json"].includes(ext) || mimeType.startsWith("text/")) {
    return cleanText(buffer.toString("utf8"));
  }

  if (ext === ".docx" || mimeType.includes("wordprocessingml")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return cleanText(result.value || "");
  }

  if (ext === ".pdf" || mimeType === "application/pdf") {
    const imported = await import("pdf-parse");
    const pdfParse = (imported as any).default || imported;
    const result = await pdfParse(buffer);
    return cleanText(result.text || "");
  }

  return "";
}

function pickSection(lines: string[], starts: string[], stops: string[]) {
  const startIndex = lines.findIndex((line) => starts.some((s) => line.toLowerCase().includes(s)));
  if (startIndex < 0) return "";

  const collected: string[] = [];

  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    const lower = line.toLowerCase();

    if (stops.some((s) => lower.includes(s)) && collected.length > 0) break;
    if (line) collected.push(line);
    if (collected.length >= 10) break;
  }

  return collected.join("; ");
}

function extractProfile(text: string, existingProfile: Record<string, string> = {}) {
  const cleaned = cleanText(text);
  const lines = cleaned
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 220);

  const joined = lines.join("\n");

  const email = joined.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";

  const phone =
    joined.match(/(?:\+27|27|0)[\s\-]?(?:\d[\s\-]?){8,10}/)?.[0]?.replace(/\s+/g, " ").trim() || "";

  const idNumber =
    joined.match(/\b\d{13}\b/)?.[0] ||
    joined.match(/\b[A-Z0-9]{6,12}\b(?=.*passport)/i)?.[0] ||
    "";

  const badNameWords = [
    "curriculum vitae",
    "resume",
    "cv",
    "profile",
    "personal details",
    "contact",
    "email",
    "phone",
    "address"
  ];

  let fullName = "";
  const explicitName = joined.match(/(?:full name|name)\s*[:\-]\s*([A-Z][A-Za-z .'-]{3,80})/i)?.[1]?.trim() || "";

  if (explicitName) {
    fullName = explicitName;
  } else {
    for (const line of lines.slice(0, 20)) {
      const lower = line.toLowerCase();
      const wordCount = line.split(/\s+/).length;
      const looksName =
        wordCount >= 2 &&
        wordCount <= 5 &&
        /^[A-Za-z .'-]+$/.test(line) &&
        !badNameWords.some((bad) => lower.includes(bad)) &&
        !line.includes("@");

      if (looksName) {
        fullName = line;
        break;
      }
    }
  }

  const locationCandidates = [
    "Johannesburg", "Soweto", "Pretoria", "Midrand", "Sandton", "Roodepoort",
    "Germiston", "Boksburg", "Kempton Park", "Tembisa", "Centurion",
    "Durban", "Cape Town", "Polokwane", "Bloemfontein", "Nelspruit",
    "Mbombela", "Rustenburg", "Vereeniging", "Benoni"
  ];

  let location = "";
  for (const candidate of locationCandidates) {
    if (new RegExp(`\\b${candidate}\\b`, "i").test(joined)) {
      location = candidate;
      break;
    }
  }

  const educationLine =
    lines.find((line) =>
      /(matric|grade 12|nqf|certificate|diploma|degree|bachelor|national senior certificate|higher certificate)/i.test(line)
    ) || "";

  const skills = pickSection(
    lines,
    ["skills", "key skills", "competencies", "abilities"],
    ["experience", "employment", "education", "qualification", "reference"]
  );

  const workExperience = pickSection(
    lines,
    ["work experience", "employment history", "experience", "previous employment"],
    ["education", "qualification", "skills", "reference"]
  );

  const highestEducation = pickSection(
    lines,
    ["education", "qualification", "academic"],
    ["experience", "employment", "skills", "reference"]
  ) || educationLine;

  const suggestions: Record<string, string> = {
    fullName,
    idOrPassport: idNumber,
    phone,
    email,
    location,
    highestEducation,
    workExperience,
    skills
  };

  const merged: Record<string, string> = { ...blankProfile, ...existingProfile };

  for (const [key, value] of Object.entries(suggestions)) {
    if (value && !String(merged[key] || "").trim()) merged[key] = value;
  }

  if (!merged.targetRoutes) merged.targetRoutes = "Jobs, Learnerships, Internships, Funding";

  const filled = Object.entries(suggestions).filter(([, value]) => Boolean(value)).map(([key]) => key);

  return {
    profile: merged,
    suggestions,
    confidence: Math.min(95, 25 + filled.length * 10),
    filledFields: filled,
    extractedTextPreview: cleaned.slice(0, 2500)
  };
}

function opportunityStatus(opp: any) {
  if (opp.status) return opp.status;
  return "READY_TO_PREPARE";
}

function buildPack(profile: any, opportunity: any, documents: any[]) {
  const cv = documents.find((doc) => doc.documentType === "CV");
  const idDoc = documents.find((doc) => doc.documentType === "ID_COPY");

  const lines = [
    `APPLICATION PACK`,
    ``,
    `Candidate: ${profile.fullName || "[review name]"}`,
    `Phone: ${profile.phone || "[review phone]"}`,
    `Email: ${profile.email || "[review email]"}`,
    `Location: ${profile.location || "[review location]"}`,
    ``,
    `Opportunity: ${opportunity.title || "[opportunity title]"}`,
    `Organisation: ${opportunity.organisation || "[organisation]"}`,
    `Category: ${opportunity.category || "JOB"}`,
    `Application method: ${opportunity.applicationMethod || "PORTAL"}`,
    `Official/source link: ${opportunity.sourceUrl || "[source link]"}`,
    `Closing date: ${opportunity.closingDate || "[not captured]"}`,
    ``,
    `Profile summary:`,
    `${profile.highestEducation ? `Education: ${profile.highestEducation}` : "Education: [review education]"}`,
    `${profile.skills ? `Skills: ${profile.skills}` : "Skills: [review skills]"}`,
    `${profile.workExperience ? `Experience: ${profile.workExperience}` : "Experience: [review experience]"}`,
    ``,
    `Documents ready:`,
    `CV: ${cv ? cv.originalName : "Missing"}`,
    `ID copy: ${idDoc ? idDoc.originalName : "Missing / upload if required"}`,
    ``,
    `Source requirements copied by candidate:`,
    `${opportunity.notes || "[copy requirements from official source]"}`,
    ``,
    `Reality rule: apply only through the official source or official email. Do not invent qualifications, experience, references, certificates or outcomes.`
  ];

  const body = lines.join("\n");

  let mailto = "";
  if (opportunity.emailTo) {
    const subject = encodeURIComponent(`Application: ${opportunity.title || "Opportunity"}`);
    const text = encodeURIComponent(body);
    mailto = `mailto:${opportunity.emailTo}?subject=${subject}&body=${text}`;
  }

  return {
    packId: id("pack"),
    opportunityId: opportunity.opportunityId,
    createdAt: new Date().toISOString(),
    title: opportunity.title,
    body,
    mailto
  };
}

export async function GET() {
  return NextResponse.json(readStore());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action;
    const store = readStore();

    if (action === "saveProfile") {
      store.profile = { ...blankProfile, ...(body.profile || {}) };
      return NextResponse.json({ ok: true, store: writeStore(store) });
    }

    if (action === "uploadDocument") {
      const { mimeType, buffer } = dataUrlToBuffer(body.dataUrl);
      const documentId = id("doc");
      const originalName = safeName(body.fileName || "document");
      const documentType = body.documentType || "OTHER";
      const fileName = `${documentId}_${originalName}`;
      const localPath = path.join(UPLOAD_DIR, fileName);

      fs.writeFileSync(localPath, buffer);

      let extractedText = "";
      let extractionStatus = "not_extracted";
      let extractionMessage = "Document stored. Text extraction was not available for this file type.";
      let smartProfile = null;

      try {
        extractedText = await extractText(buffer, originalName, mimeType);

        if (extractedText) {
          extractionStatus = "extracted";
          extractionMessage = "Document text extracted.";
          smartProfile = extractProfile(extractedText, store.profile || {});
          store.profile = smartProfile.profile;
          store.smartExtraction = [
            ...(store.smartExtraction || []),
            {
              extractionId: id("extract"),
              documentId,
              documentType,
              originalName,
              createdAt: new Date().toISOString(),
              confidence: smartProfile.confidence,
              filledFields: smartProfile.filledFields,
              suggestions: smartProfile.suggestions,
              textPreview: smartProfile.extractedTextPreview
            }
          ];
        }
      } catch (error) {
        extractionStatus = "failed";
        extractionMessage = error instanceof Error ? error.message : "Extraction failed.";
      }

      const document = {
        documentId,
        documentType,
        originalName,
        mimeType,
        bytes: buffer.length,
        localPath: path.relative(ROOT, localPath).replace(/\\/g, "/"),
        uploadedAt: new Date().toISOString(),
        extractionStatus,
        extractionMessage,
        extractedFields: smartProfile?.filledFields || []
      };

      store.documents = [document, ...(store.documents || [])];

      return NextResponse.json({
        ok: true,
        document,
        smartProfile,
        store: writeStore(store)
      });
    }

    if (action === "smartProfileFromDocuments") {
      const documents = store.documents || [];
      let combined = "";

      for (const doc of documents) {
        const filePath = path.join(ROOT, doc.localPath || "");
        if (fs.existsSync(filePath)) {
          try {
            const buffer = fs.readFileSync(filePath);
            combined += "\n\n" + await extractText(buffer, doc.originalName || "", doc.mimeType || "");
          } catch {
            // keep going
          }
        }
      }

      const smartProfile = extractProfile(combined, store.profile || {});
      store.profile = smartProfile.profile;
      store.smartExtraction = [
        ...(store.smartExtraction || []),
        {
          extractionId: id("extract"),
          documentId: "ALL_DOCUMENTS",
          documentType: "SMART_PROFILE_REFRESH",
          originalName: "All uploaded documents",
          createdAt: new Date().toISOString(),
          confidence: smartProfile.confidence,
          filledFields: smartProfile.filledFields,
          suggestions: smartProfile.suggestions,
          textPreview: smartProfile.extractedTextPreview
        }
      ];

      return NextResponse.json({ ok: true, smartProfile, store: writeStore(store) });
    }

    if (action === "addOpportunity") {
      const opportunity = {
        opportunityId: id("opp"),
        createdAt: new Date().toISOString(),
        status: "READY_TO_PREPARE",
        ...(body.opportunity || {})
      };

      if (!opportunity.title) throw new Error("Opportunity title is required.");
      if (!opportunity.sourceUrl) throw new Error("Official/source link is required.");

      store.opportunities = [opportunity, ...(store.opportunities || [])];
      return NextResponse.json({ ok: true, opportunity, store: writeStore(store) });
    }

    if (action === "deleteOpportunity") {
      store.opportunities = (store.opportunities || []).filter((opp) => opp.opportunityId !== body.opportunityId);
      return NextResponse.json({ ok: true, store: writeStore(store) });
    }

    if (action === "generatePack") {
      const opportunity = (store.opportunities || []).find((opp) => opp.opportunityId === body.opportunityId);
      if (!opportunity) throw new Error("Opportunity not found.");

      const pack = buildPack(store.profile || {}, opportunity, store.documents || []);
      store.applicationPacks = [pack, ...(store.applicationPacks || [])];

      store.opportunities = (store.opportunities || []).map((opp) =>
        opp.opportunityId === body.opportunityId
          ? { ...opp, status: opportunityStatus({ ...opp, status: "PACK_READY" }) }
          : opp
      );

      return NextResponse.json({ ok: true, pack, store: writeStore(store) });
    }

    if (action === "markApplied") {
      const proof = {
        proofId: id("proof"),
        opportunityId: body.opportunityId,
        proof: body.proof || "",
        createdAt: new Date().toISOString()
      };

      store.proofLog = [proof, ...(store.proofLog || [])];
      store.opportunities = (store.opportunities || []).map((opp) =>
        opp.opportunityId === body.opportunityId ? { ...opp, status: "APPLIED_PROOF_CAPTURED" } : opp
      );

      return NextResponse.json({ ok: true, proof, store: writeStore(store) });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Request failed." },
      { status: 400 }
    );
  }
}