import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CandidateProfile = {
  fullName?: string;
  idNumber?: string;
  phone?: string;
  email?: string;
  location?: string;
  highestEducation?: string;
  workExperience?: string;
  skills?: string;
  notes?: string;
};

type Store = {
  schema: string;
  updatedAt: string;
  profile: CandidateProfile;
  documents: any[];
  opportunities: any[];
  applicationPacks: any[];
  proofLog: any[];
  smartExtraction: any[];
};

function repoRoot() {
  const cwd = process.cwd();
  if (cwd.replace(/\\/g, "/").endsWith("apps/web")) return path.resolve(cwd, "../..");
  return cwd;
}

const ROOT = repoRoot();
const DATA_DIR = path.join(ROOT, "data", "personal-job-desk");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const STORE_PATH = path.join(DATA_DIR, "apply-now.local.json");

function defaultStore(): Store {
  return {
    schema: "kingsmen.personal-job-desk.smart-apply.v2",
    updatedAt: new Date().toISOString(),
    profile: {
      location: "Johannesburg"
    },
    documents: [],
    opportunities: [],
    applicationPacks: [],
    proofLog: [],
    smartExtraction: []
  };
}

function readStore(): Store {
  try {
    const parsed = JSON.parse(fs.readFileSync(STORE_PATH, "utf8").replace(/^\uFEFF/, ""));
    return {
      ...defaultStore(),
      ...parsed,
      profile: parsed.profile || {},
      documents: Array.isArray(parsed.documents) ? parsed.documents : [],
      opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities : [],
      applicationPacks: Array.isArray(parsed.applicationPacks) ? parsed.applicationPacks : [],
      proofLog: Array.isArray(parsed.proofLog) ? parsed.proofLog : [],
      smartExtraction: Array.isArray(parsed.smartExtraction) ? parsed.smartExtraction : []
    };
  } catch {
    return defaultStore();
  }
}

function writeStore(store: Store) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  store.updatedAt = new Date().toISOString();
  fs.writeFileSync(STORE_PATH, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_DOCUMENT_TYPES = new Set(["CV", "ID", "CERTIFICATE"]);
const ALLOWED_FILE_TYPES = new Map<string, Set<string>>([
  [".pdf", new Set(["application/pdf", "application/octet-stream"])],
  [".docx", new Set(["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/octet-stream"])],
  [".txt", new Set(["text/plain", "text/txt", "application/octet-stream"])]
]);

function decodeDataUrl(dataUrl: string) {
  if (dataUrl.length > Math.ceil(MAX_UPLOAD_BYTES * 4 / 3) + 256) {
    throw new Error("File exceeds the 10 MB upload limit.");
  }
  const match = dataUrl.match(/^data:([^;,]+);base64,([A-Za-z0-9+/]*={0,2})$/);
  if (!match) throw new Error("Upload must be a valid base64-encoded PDF, DOCX or TXT file.");
  const mimeType = match[1].toLowerCase();
  const encoded = match[2];
  const buffer = Buffer.from(encoded, "base64");
  // Buffer.from is permissive; require canonical base64 so malformed input cannot be silently repaired.
  if (buffer.toString("base64").replace(/=+$/, "") !== encoded.replace(/=+$/, "")) {
    throw new Error("Upload contains malformed base64 data.");
  }
  if (buffer.length === 0) throw new Error("The uploaded file is empty.");
  if (buffer.length > MAX_UPLOAD_BYTES) throw new Error("File exceeds the 10 MB upload limit.");
  return { mimeType, buffer };
}

function validateDocumentSignature(fileName: string, mimeType: string, buffer: Buffer) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf") || mimeType === "application/pdf") {
    if (buffer.length < 8 || buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
      throw new Error("The file does not contain a valid PDF signature.");
    }
    return;
  }

  if (lower.endsWith(".docx") || mimeType.includes("wordprocessingml")) {
    // DOCX is an Open XML ZIP package. Check the ZIP local-file header before parsing.
    if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b ||
        !([0x03, 0x05, 0x07].includes(buffer[2]) && [0x04, 0x06, 0x08].includes(buffer[3]))) {
      throw new Error("The file does not contain a valid DOCX/ZIP signature.");
    }
    return;
  }

  if (lower.endsWith(".txt") || mimeType.startsWith("text/")) {
    const text = buffer.toString("utf8");
    if (buffer.includes(0x00) || text.includes("\uFFFD")) {
      throw new Error("The TXT file must contain valid UTF-8 text without NUL bytes.");
    }
  }
}

async function extractDocumentText(fileName: string, mimeType: string, buffer: Buffer) {
  const lower = fileName.toLowerCase();

  if (mimeType.includes("text") || lower.endsWith(".txt")) {
    return buffer.toString("utf8");
  }

  if (lower.endsWith(".docx") || mimeType.includes("wordprocessingml")) {
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return result.value || "";
    } catch (error) {
      return `DOCX extraction failed: ${error instanceof Error ? error.message : "unknown error"}`;
    }
  }

  if (lower.endsWith(".pdf") || mimeType.includes("pdf")) {
    try {
      const pdfParse = await import("pdf-parse");
      const parser = (pdfParse as any).default || pdfParse;
      const result = await parser(buffer);
      return result.text || "";
    } catch (error) {
      return `PDF extraction failed: ${error instanceof Error ? error.message : "unknown error"}`;
    }
  }

  return "";
}

function cleanLine(line: string) {
  return line.replace(/\s+/g, " ").trim();
}

function findFirst(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return cleanLine(match[1]);
    if (match?.[0]) return cleanLine(match[0]);
  }
  return "";
}

function extractName(lines: string[]) {
  const banned = [
    "curriculum vitae",
    "resume",
    "cv",
    "profile",
    "personal details",
    "contact",
    "email",
    "phone",
    "address",
    "experience",
    "education",
    "skills"
  ];

  const candidate = lines
    .map(cleanLine)
    .filter(Boolean)
    .find((line) => {
      const lower = line.toLowerCase();
      if (line.length < 5 || line.length > 70) return false;
      if (/\d/.test(line)) return false;
      if (banned.some((word) => lower.includes(word))) return false;
      const parts = line.split(" ").filter(Boolean);
      return parts.length >= 2 && parts.length <= 5;
    });

  return candidate || "";
}

function extractSkills(text: string) {
  const known = [
    "customer service",
    "communication",
    "computer literacy",
    "microsoft word",
    "microsoft excel",
    "excel",
    "word",
    "powerpoint",
    "data entry",
    "admin",
    "administration",
    "retail",
    "cashier",
    "sales",
    "call centre",
    "teamwork",
    "problem solving",
    "time management",
    "driver",
    "stock taking",
    "warehouse",
    "cleaning",
    "security",
    "hospitality",
    "typing",
    "filing",
    "reception",
    "telephone etiquette"
  ];

  const lower = text.toLowerCase();
  const found = known.filter((skill) => lower.includes(skill));
  return Array.from(new Set(found)).slice(0, 18).join(", ");
}

function extractEducation(text: string) {
  const lower = text.toLowerCase();

  if (lower.includes("degree") || lower.includes("bachelor")) return "Degree / Bachelor level mentioned in CV";
  if (lower.includes("diploma")) return "Diploma mentioned in CV";
  if (lower.includes("higher certificate")) return "Higher Certificate mentioned in CV";
  if (lower.includes("certificate")) return "Certificate mentioned in CV";
  if (lower.includes("grade 12") || lower.includes("matric") || lower.includes("national senior certificate")) return "Grade 12 / Matric mentioned in CV";
  if (lower.includes("grade 11")) return "Grade 11 mentioned in CV";
  if (lower.includes("grade 10")) return "Grade 10 mentioned in CV";

  return "";
}

function extractLocation(text: string) {
  const places = [
    "Johannesburg",
    "Soweto",
    "Pretoria",
    "Tshwane",
    "Ekurhuleni",
    "Midrand",
    "Sandton",
    "Randburg",
    "Roodepoort",
    "Germiston",
    "Boksburg",
    "Kempton Park",
    "Durban",
    "Cape Town",
    "Polokwane",
    "Mbombela",
    "Bloemfontein",
    "Gqeberha",
    "East London",
    "Rustenburg",
    "Mafikeng",
    "Kimberley",
    "Pietermaritzburg"
  ];

  const lower = text.toLowerCase();
  const place = places.find((item) => lower.includes(item.toLowerCase()));
  return place || "";
}

function extractExperience(text: string) {
  const lines = text.split(/\r?\n/).map(cleanLine).filter(Boolean);
  const startIndex = lines.findIndex((line) => {
    const lower = line.toLowerCase();
    return lower.includes("experience") || lower.includes("employment") || lower.includes("work history");
  });

  if (startIndex >= 0) {
    return lines.slice(startIndex, startIndex + 8).join("\n");
  }

  const jobWords = ["cashier", "general worker", "admin", "assistant", "sales", "retail", "driver", "cleaner", "security", "call centre"];
  const matched = lines.filter((line) => jobWords.some((word) => line.toLowerCase().includes(word))).slice(0, 8);

  return matched.join("\n");
}

function extractProfileFromText(text: string): CandidateProfile {
  const lines = text.split(/\r?\n/).map(cleanLine).filter(Boolean);

  const email = findFirst(text, [
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
  ]);

  const phone = findFirst(text, [
    /(?:\+27|0)[\s-]?[6-8][0-9][\s-]?[0-9]{3}[\s-]?[0-9]{4}/,
    /(?:\+27|0)[0-9\s-]{8,14}/
  ]);

  const idNumber = findFirst(text, [
    /\b[0-9]{13}\b/
  ]);

  return {
    fullName: extractName(lines),
    idNumber,
    phone,
    email,
    location: extractLocation(text),
    highestEducation: extractEducation(text),
    workExperience: extractExperience(text),
    skills: extractSkills(text)
  };
}

function mergeSmartProfile(existing: CandidateProfile, extracted: CandidateProfile) {
  const merged: CandidateProfile = { ...existing };

  for (const key of Object.keys(extracted) as Array<keyof CandidateProfile>) {
    const value = extracted[key];
    if (value && (!merged[key] || String(merged[key]).trim().length < 2)) {
      merged[key] = value;
    }
  }

  return merged;
}

function scoreReadiness(store: Store) {
  const profile = store.profile || {};
  const hasProfile = Boolean(profile.fullName && profile.phone && profile.email);
  const hasCv = store.documents.some((doc) => String(doc.type).toUpperCase() === "CV");
  const hasId = store.documents.some((doc) => String(doc.type).toUpperCase() === "ID");
  const hasOpportunity = store.opportunities.length > 0;
  const hasPack = store.applicationPacks.length > 0;
  const hasProof = store.proofLog.length > 0;

  const checks = [hasProfile, hasCv, hasId, hasOpportunity, hasPack, hasProof];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function buildPack(profile: CandidateProfile, opportunity: any) {
  const name = profile.fullName || "[Candidate name]";
  const phone = profile.phone || "[Phone]";
  const email = profile.email || "[Email]";
  const location = profile.location || "[Location]";
  const education = profile.highestEducation || "[Highest education]";
  const skills = profile.skills || "[Skills]";
  const experience = profile.workExperience || "[Work experience]";

  return [
    `Application Pack: ${opportunity.title}`,
    ``,
    `Candidate: ${name}`,
    `Phone: ${phone}`,
    `Email: ${email}`,
    `Location: ${location}`,
    `Education: ${education}`,
    ``,
    `Target opportunity`,
    `- Title: ${opportunity.title}`,
    `- Organisation: ${opportunity.organisation}`,
    `- Category: ${opportunity.category}`,
    `- Method: ${opportunity.applicationMethod}`,
    `- Source: ${opportunity.sourceUrl}`,
    ``,
    `Candidate strengths`,
    skills,
    ``,
    `Experience summary`,
    experience,
    ``,
    `Truth and safety`,
    `This pack reuses candidate-provided information and uploaded documents. It does not invent experience, qualifications, references, certificates, identity details, or submission proof.`,
    ``,
    `Suggested short message`,
    `Good day,`,
    ``,
    `I would like to apply for the ${opportunity.title} opportunity at ${opportunity.organisation}. I have attached my CV and supporting documents where required. I am available to provide any additional information needed.`,
    ``,
    `Kind regards,`,
    `${name}`,
    `${phone}`,
    `${email}`
  ].join("\n");
}

export async function GET() {
  const store = readStore();
  return NextResponse.json({
    ...store,
    readiness: scoreReadiness(store)
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = String(body.action || "");
    const store = readStore();

    if (action === "saveProfile") {
      store.profile = {
        ...store.profile,
        ...(body.profile || {})
      };

      writeStore(store);
      return NextResponse.json({
        status: "SAVED",
        store,
        readiness: scoreReadiness(store)
      });
    }

    if (action === "uploadDocument") {
      const fileName = String(body.fileName || "").trim();
      const type = String(body.documentType || "CV").trim().toUpperCase();
      const dataUrl = String(body.dataUrl || "");

      if (!fileName || !dataUrl) {
        return NextResponse.json({ status: "FAILED", error: "Missing file." }, { status: 400 });
      }
      if (!ALLOWED_DOCUMENT_TYPES.has(type)) {
        return NextResponse.json({ status: "FAILED", error: "Document type must be CV, ID or CERTIFICATE." }, { status: 400 });
      }

      const extension = path.extname(fileName).toLowerCase();
      const allowedMimes = ALLOWED_FILE_TYPES.get(extension);
      if (!allowedMimes) {
        return NextResponse.json({ status: "FAILED", error: "Only PDF, DOCX and TXT documents are supported." }, { status: 415 });
      }

      let decoded: { mimeType: string; buffer: Buffer };
      try {
        decoded = decodeDataUrl(dataUrl);
      } catch (error) {
        return NextResponse.json({ status: "FAILED", error: error instanceof Error ? error.message : "Invalid file upload." }, { status: 413 });
      }
      if (!allowedMimes.has(decoded.mimeType)) {
        return NextResponse.json({ status: "FAILED", error: "File extension and content type do not match." }, { status: 415 });
      }
      try {
        validateDocumentSignature(fileName, decoded.mimeType, decoded.buffer);
      } catch (error) {
        return NextResponse.json({ status: "FAILED", error: error instanceof Error ? error.message : "Invalid document content." }, { status: 415 });
      }

      fs.mkdirSync(UPLOAD_DIR, { recursive: true });

      const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storedName = `${Date.now()}-${safeName}`;
      const filePath = path.join(UPLOAD_DIR, storedName);

      fs.writeFileSync(filePath, decoded.buffer);

      const text = await extractDocumentText(fileName, decoded.mimeType, decoded.buffer);
      const extracted = extractProfileFromText(text || "");

      const documentRecord = {
        documentId: `doc-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        type,
        fileName,
        storedName,
        localPath: filePath,
        mimeType: decoded.mimeType,
        sizeBytes: decoded.buffer.length,
        extractedTextPreview: text ? text.slice(0, 1800) : "",
        smartFields: extracted,
        createdAt: new Date().toISOString()
      };

      store.documents = [documentRecord, ...store.documents];
      store.profile = mergeSmartProfile(store.profile || {}, extracted);

      store.smartExtraction = [
        {
          extractionId: `extract-${Date.now()}`,
          documentId: documentRecord.documentId,
          fileName,
          type,
          extracted,
          textLength: text.length,
          status: text.includes("extraction failed") ? "PARTIAL" : "EXTRACTED",
          createdAt: new Date().toISOString()
        },
        ...store.smartExtraction
      ];

      writeStore(store);

      return NextResponse.json({
        status: "DOCUMENT_UPLOADED",
        document: documentRecord,
        extracted,
        store,
        readiness: scoreReadiness(store)
      });
    }

    if (action === "addOpportunity") {
      const opportunity = body.opportunity || {};

      if (!opportunity.title || !opportunity.organisation || !opportunity.sourceUrl) {
        return NextResponse.json({
          status: "FAILED",
          error: "Title, organisation and official/source link are required."
        }, { status: 400 });
      }

      const record = {
        opportunityId: `opp-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        title: String(opportunity.title),
        organisation: String(opportunity.organisation),
        category: String(opportunity.category || "JOB"),
        applicationMethod: String(opportunity.applicationMethod || "PORTAL"),
        emailTo: String(opportunity.emailTo || ""),
        closingDate: String(opportunity.closingDate || ""),
        sourceUrl: String(opportunity.sourceUrl),
        notes: String(opportunity.notes || ""),
        status: "READY_TO_PREPARE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      store.opportunities = [record, ...store.opportunities];
      writeStore(store);

      return NextResponse.json({
        status: "OPPORTUNITY_ADDED",
        opportunity: record,
        store,
        readiness: scoreReadiness(store)
      });
    }

    if (action === "generatePack") {
      const opportunityId = String(body.opportunityId || "");
      const opportunity = store.opportunities.find((item) => item.opportunityId === opportunityId);

      if (!opportunity) {
        return NextResponse.json({ status: "FAILED", error: "Opportunity not found." }, { status: 404 });
      }

      const packText = buildPack(store.profile || {}, opportunity);

      const pack = {
        packId: `pack-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        opportunityId,
        title: `Application Pack — ${opportunity.title}`,
        body: packText,
        createdAt: new Date().toISOString()
      };

      store.applicationPacks = [pack, ...store.applicationPacks];
      store.opportunities = store.opportunities.map((item) =>
        item.opportunityId === opportunityId
          ? { ...item, status: "PACK_READY", updatedAt: new Date().toISOString() }
          : item
      );

      writeStore(store);

      return NextResponse.json({
        status: "PACK_READY",
        pack,
        store,
        readiness: scoreReadiness(store)
      });
    }

    if (action === "markApplied") {
      const opportunityId = String(body.opportunityId || "");
      const proof = String(body.proof || "").trim();

      if (!opportunityId || !proof) {
        return NextResponse.json({
          status: "FAILED",
          error: "Proof or reference is required."
        }, { status: 400 });
      }

      const proofRecord = {
        proofId: `proof-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        opportunityId,
        proof,
        createdAt: new Date().toISOString()
      };

      store.proofLog = [proofRecord, ...store.proofLog];
      store.opportunities = store.opportunities.map((item) =>
        item.opportunityId === opportunityId
          ? { ...item, status: "APPLIED_PROOF_CAPTURED", updatedAt: new Date().toISOString() }
          : item
      );

      writeStore(store);

      return NextResponse.json({
        status: "PROOF_CAPTURED",
        proof: proofRecord,
        store,
        readiness: scoreReadiness(store)
      });
    }

    if (action === "deleteOpportunity") {
      const opportunityId = String(body.opportunityId || "");
      store.opportunities = store.opportunities.filter((item) => item.opportunityId !== opportunityId);
      store.applicationPacks = store.applicationPacks.filter((item) => item.opportunityId !== opportunityId);
      store.proofLog = store.proofLog.filter((item) => item.opportunityId !== opportunityId);
      writeStore(store);

      return NextResponse.json({
        status: "DELETED",
        store,
        readiness: scoreReadiness(store)
      });
    }

    return NextResponse.json({
      status: "FAILED",
      error: "Unknown action."
    }, { status: 400 });
  } catch (error) {
    return NextResponse.json({
      status: "ERROR_VISIBLE",
      error: error instanceof Error ? error.message : "Unknown Apply Desk error",
      stack: error instanceof Error ? error.stack : ""
    }, { status: 500 });
  }
}