import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCandidatePortalContext, loadCandidatePortalState, saveCandidatePortalState, uploadCandidatePortalDocument, type PortalContext } from "@/lib/candidate-portal-storage";

function privateJson(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("Pragma", "no-cache");
  return NextResponse.json(body, { ...init, headers });
}

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
  fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
  try {
    fs.chmodSync(DATA_DIR, 0o700);
  } catch {
    // Some development filesystems do not support POSIX permissions.
  }
  store.updatedAt = new Date().toISOString();
  fs.writeFileSync(STORE_PATH, `${JSON.stringify(store, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  try {
    fs.chmodSync(STORE_PATH, 0o600);
  } catch {
    // Some development filesystems do not support POSIX permissions.
  }
}

function localCandidateStorageUnavailable() {
  // File-backed candidate records are development-only until authenticated database
  // and private object storage are wired. Never silently deploy this as production storage.
  return process.env.NODE_ENV === "production";
}

function storageUnavailableResponse() {
  return privateJson({
    status: "STORAGE_NOT_CONFIGURED",
    error: "Candidate storage is not configured for production. Configure authenticated database and private document storage before enabling this workflow."
  }, { status: 503 });
}

async function loadStoreForContext(context: PortalContext | null): Promise<Store> {
  if (!context) return readStore();
  const saved = await loadCandidatePortalState(context);
  if (!saved || typeof saved !== "object") return defaultStore();
  return { ...defaultStore(), ...saved, profile: saved.profile && typeof saved.profile === "object" ? saved.profile as CandidateProfile : {}, documents: Array.isArray(saved.documents) ? saved.documents : [], opportunities: Array.isArray(saved.opportunities) ? saved.opportunities : [], applicationPacks: Array.isArray(saved.applicationPacks) ? saved.applicationPacks : [], proofLog: Array.isArray(saved.proofLog) ? saved.proofLog : [], smartExtraction: Array.isArray(saved.smartExtraction) ? saved.smartExtraction : [] };
}
async function persistStore(context: PortalContext | null, store: Store) {
  if (context) { store.updatedAt = new Date().toISOString(); await saveCandidatePortalState(context, store as unknown as Record<string, unknown>); return; }
  writeStore(store);
}
function authOrStorageResponse(status: "not_configured" | "unauthenticated") {
  return status === "unauthenticated" ? privateJson({ status: "AUTHENTICATION_REQUIRED", error: "Sign in to access your private candidate workspace." }, { status: 401 }) : storageUnavailableResponse();
}
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_JSON_BODY_BYTES = 14 * 1024 * 1024;
const PROFILE_FIELD_LIMITS: Record<keyof CandidateProfile, number> = {
  fullName: 160,
  idNumber: 40,
  phone: 40,
  email: 254,
  location: 160,
  highestEducation: 500,
  workExperience: 4_000,
  skills: 2_000,
  notes: 2_000
};

async function readBoundedJson(request: Request): Promise<Record<string, any>> {
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_JSON_BODY_BYTES) {
    throw new Error("Request body exceeds the allowed limit.");
  }
  if (!request.body) throw new Error("Request body is required.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_JSON_BODY_BYTES) {
        await reader.cancel();
        throw new Error("Request body exceeds the allowed limit.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  const parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Request body must be a JSON object.");
  }
  return parsed as Record<string, any>;
}

function validateProfilePatch(input: unknown): CandidateProfile {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Profile must be an object.");
  }
  const source = input as Record<string, unknown>;
  const patch: CandidateProfile = {};
  for (const [rawKey, rawValue] of Object.entries(source)) {
    if (!(rawKey in PROFILE_FIELD_LIMITS)) continue;
    if (typeof rawValue !== "string") throw new Error("Profile fields must be text.");
    const key = rawKey as keyof CandidateProfile;
    const value = rawValue.trim();
    if (value.length > PROFILE_FIELD_LIMITS[key]) {
      throw new Error(`Profile field ${key} exceeds its allowed length.`);
    }
    patch[key] = value;
  }
  return patch;
}
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
  const resolved = await getCandidatePortalContext();
  if (resolved.status !== "ready") {
    if (resolved.status === "not_configured" && process.env.NODE_ENV !== "production") { const store = readStore(); return privateJson({ ...store, readiness: scoreReadiness(store) }); }
    return authOrStorageResponse(resolved.status);
  }
  try { const store = await loadStoreForContext(resolved.context); return privateJson({ ...store, readiness: scoreReadiness(store) }); }
  catch { return privateJson({ status: "STORAGE_UNAVAILABLE", error: "Candidate workspace could not be loaded." }, { status: 503 }); }
}

export async function POST(request: Request) {
  const resolved = await getCandidatePortalContext();
  const localDevelopment = resolved.status === "not_configured" && process.env.NODE_ENV !== "production";
  if (resolved.status !== "ready" && !localDevelopment) return authOrStorageResponse(resolved.status);
  const context = resolved.status === "ready" ? resolved.context : null;
  try {
    let body: Record<string, any>;
    try { body = await readBoundedJson(request); }
    catch (error) {
      const message = error instanceof Error ? error.message : "Invalid request body.";
      return privateJson({ status: "FAILED", error: message }, { status: message.includes("limit") ? 413 : 400 });
    }
    const action = String(body.action || "");
    const store = await loadStoreForContext(context);

    if (action === "saveProfile") {
      let profilePatch: CandidateProfile;
      try { profilePatch = validateProfilePatch(body.profile); }
      catch (error) {
        return privateJson({ status: "FAILED", error: error instanceof Error ? error.message : "Invalid profile." }, { status: 400 });
      }
      store.profile = { ...store.profile, ...profilePatch };

      await persistStore(context, store);
      return privateJson({
        status: "SAVED",
        store,
        readiness: scoreReadiness(store)
      });
    }

    if (action === "uploadDocument") {
      const fileName = String(body.fileName || "").trim();
      const type = String(body.documentType || "CV").trim().toUpperCase();
      const dataUrl = String(body.dataUrl || "");

      if (!fileName || !dataUrl || fileName.length > 180 || /[\\u0000-\\u001f\\u007f]/.test(fileName)) {
        return privateJson({ status: "FAILED", error: "Missing file." }, { status: 400 });
      }
      if (!ALLOWED_DOCUMENT_TYPES.has(type)) {
        return privateJson({ status: "FAILED", error: "Document type must be CV, ID or CERTIFICATE." }, { status: 400 });
      }

      const extension = path.extname(fileName).toLowerCase();
      const allowedMimes = ALLOWED_FILE_TYPES.get(extension);
      if (!allowedMimes) {
        return privateJson({ status: "FAILED", error: "Only PDF, DOCX and TXT documents are supported." }, { status: 415 });
      }

      let decoded: { mimeType: string; buffer: Buffer };
      try {
        decoded = decodeDataUrl(dataUrl);
      } catch (error) {
        return privateJson({ status: "FAILED", error: error instanceof Error ? error.message : "Invalid file upload." }, { status: 413 });
      }
      if (!allowedMimes.has(decoded.mimeType)) {
        return privateJson({ status: "FAILED", error: "File extension and content type do not match." }, { status: 415 });
      }
      try {
        validateDocumentSignature(fileName, decoded.mimeType, decoded.buffer);
      } catch (error) {
        return privateJson({ status: "FAILED", error: error instanceof Error ? error.message : "Invalid document content." }, { status: 415 });
      }

      const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storedName = `${Date.now()}-${safeName}`;
      let storagePath = "";
      if (context) {
        try { storagePath = await uploadCandidatePortalDocument(context, storedName, decoded.mimeType, decoded.buffer); }
        catch { return privateJson({ status: "STORAGE_FAILED", error: "The document could not be saved to private storage." }, { status: 503 }); }
      } else {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true, mode: 0o700 });
        try { fs.chmodSync(UPLOAD_DIR, 0o700); } catch { /* Unsupported filesystem permissions in some dev environments. */ }
        const filePath = path.join(UPLOAD_DIR, storedName);
        fs.writeFileSync(filePath, decoded.buffer, { mode: 0o600 });
        try { fs.chmodSync(filePath, 0o600); } catch { /* Unsupported filesystem permissions in some dev environments. */ }
      }

      const text = await extractDocumentText(fileName, decoded.mimeType, decoded.buffer);
      const extracted = extractProfileFromText(text || "");

      const documentRecord = {
        documentId: `doc-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        type,
        fileName,
        storedName,
        ...(storagePath ? { storagePath } : {}),
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

      await persistStore(context, store);

      return privateJson({
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
        return privateJson({
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
      await persistStore(context, store);

      return privateJson({
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
        return privateJson({ status: "FAILED", error: "Opportunity not found." }, { status: 404 });
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

      await persistStore(context, store);

      return privateJson({
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
        return privateJson({
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

      await persistStore(context, store);

      return privateJson({
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
      await persistStore(context, store);

      return privateJson({
        status: "DELETED",
        store,
        readiness: scoreReadiness(store)
      });
    }

    return privateJson({
      status: "FAILED",
      error: "Unknown action."
    }, { status: 400 });
  } catch (error) {
    return privateJson({
      status: "ERROR_VISIBLE",
      error: error instanceof Error ? error.message : "Unknown Apply Desk error",
    }, { status: 500 });
  }
}