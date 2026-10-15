import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCandidatePortalContext, loadCandidatePortalState, saveCandidatePortalState, uploadCandidatePortalDocument, type PortalContext } from "@/lib/candidate-portal-storage";
import { validateFinanceEntryInput, validateFinanceStatusUpdate } from "@/lib/candidate-finance-ledger";

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

type FollowUpTask = {
  taskId: string;
  title: string;
  dueDate: string;
  priority: "LOW" | "NORMAL" | "HIGH";
  status: "OPEN" | "DONE";
  opportunityId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

type ContactLogEntry = {
  entryId: string;
  opportunityId?: string;
  contactName: string;
  organisation: string;
  channel: "EMAIL" | "PHONE" | "PORTAL" | "IN_PERSON" | "OTHER";
  direction: "OUTBOUND" | "INBOUND";
  summary: string;
  followUpDate?: string;
  createdAt: string;
};

type FinanceLedgerEntry = { entryId: string; type: "FEE" | "PAYMENT" | "REFUND" | "ADJUSTMENT"; direction: "IN" | "OUT"; status: "RECORDED" | "PENDING" | "CONFIRMED" | "FAILED" | "CANCELLED"; amountCents: number; currency: "ZAR"; description: string; reference?: string; evidenceNote?: string; opportunityId?: string; occurredOn: string; createdAt: string;
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
  tasks: FollowUpTask[];
  contactLog: ContactLogEntry[];
  financeLedger: FinanceLedgerEntry[];
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
    smartExtraction: [],
    tasks: [],
    contactLog: [],
    financeLedger: []
  };
}

const MAX_LOCAL_STORE_BYTES = 2 * 1024 * 1024;

function readStore(): Store {
  let raw: string;
  try {
    const stat = fs.statSync(STORE_PATH);
    if (!stat.isFile()) throw new Error("Candidate local store is not a regular file.");
    if (stat.size > MAX_LOCAL_STORE_BYTES) throw new Error("Candidate local store exceeds the allowed size.");
    raw = fs.readFileSync(STORE_PATH, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return defaultStore();
    throw error;
  }

  let parsed: Record<string, unknown>;
  try {
    const value = JSON.parse(raw.replace(/^\uFEFF/, ""));
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("Candidate local store has an invalid shape.");
    }
    parsed = value as Record<string, unknown>;
  } catch {
    // Never silently replace a corrupt existing store with an empty workspace.
    throw new Error("Candidate local store is invalid; existing data was preserved.");
  }

  const collectionKeys = [
    "documents", "opportunities", "applicationPacks", "proofLog",
    "smartExtraction", "tasks", "contactLog", "financeLedger"
  ] as const;
  for (const key of collectionKeys) {
    // Missing collections are allowed for older store versions; malformed existing
    // collections must not be silently replaced with empty arrays.
    if (key in parsed && !Array.isArray(parsed[key])) {
      throw new Error(`Candidate local store collection ${key} is invalid; existing data was preserved.`);
    }
  }
  if ("profile" in parsed && (!parsed.profile || typeof parsed.profile !== "object" || Array.isArray(parsed.profile))) {
    throw new Error("Candidate local store profile is invalid; existing data was preserved.");
  }

  const defaults = defaultStore();
  return {
    ...defaults,
    ...parsed,
    profile: "profile" in parsed ? parsed.profile as CandidateProfile : defaults.profile,
    documents: parsed.documents === undefined ? [] : parsed.documents as any[],
    opportunities: parsed.opportunities === undefined ? [] : parsed.opportunities as any[],
    applicationPacks: parsed.applicationPacks === undefined ? [] : parsed.applicationPacks as any[],
    proofLog: parsed.proofLog === undefined ? [] : parsed.proofLog as any[],
    smartExtraction: parsed.smartExtraction === undefined ? [] : parsed.smartExtraction as any[],
    tasks: parsed.tasks === undefined ? [] : parsed.tasks as FollowUpTask[],
    contactLog: parsed.contactLog === undefined ? [] : parsed.contactLog as ContactLogEntry[],
    financeLedger: parsed.financeLedger === undefined ? [] : parsed.financeLedger as FinanceLedgerEntry[]
  } as Store;
}

function writeStore(store: Store) {
  fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
  try {
    fs.chmodSync(DATA_DIR, 0o700);
  } catch {
    // Some development filesystems do not support POSIX permissions.
  }
  store.updatedAt = new Date().toISOString();
  const serialized = `${JSON.stringify(store, null, 2)}\n`;
  if (Buffer.byteLength(serialized, "utf8") > MAX_LOCAL_STORE_BYTES) {
    throw new Error("Candidate local store exceeds the allowed size.");
  }

  const temporaryPath = `${STORE_PATH}.${process.pid}.${Date.now()}.tmp`;
  try {
    fs.writeFileSync(temporaryPath, serialized, { encoding: "utf8", mode: 0o600, flag: "wx" });
    try {
      fs.chmodSync(temporaryPath, 0o600);
    } catch {
      // Some development filesystems do not support POSIX permissions.
    }
    fs.renameSync(temporaryPath, STORE_PATH);
  } catch (error) {
    try { fs.unlinkSync(temporaryPath); }
    catch (cleanupError) {
      if ((cleanupError as NodeJS.ErrnoException).code !== "ENOENT") {
        // Preserve the write/rename failure; cleanup is best-effort.
      }
    }
    throw error;
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
  return { ...defaultStore(), ...saved, profile: saved.profile && typeof saved.profile === "object" ? saved.profile as CandidateProfile : {}, documents: Array.isArray(saved.documents) ? saved.documents : [], opportunities: Array.isArray(saved.opportunities) ? saved.opportunities : [], applicationPacks: Array.isArray(saved.applicationPacks) ? saved.applicationPacks : [], proofLog: Array.isArray(saved.proofLog) ? saved.proofLog : [], smartExtraction: Array.isArray(saved.smartExtraction) ? saved.smartExtraction : [], tasks: Array.isArray(saved.tasks) ? saved.tasks as FollowUpTask[] : [], contactLog: Array.isArray(saved.contactLog) ? saved.contactLog as ContactLogEntry[] : [], financeLedger: Array.isArray(saved.financeLedger) ? saved.financeLedger as FinanceLedgerEntry[] : [] };
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
    if (resolved.status === "not_configured" && process.env.NODE_ENV !== "production") {
      try {
        const store = readStore();
        return privateJson({ ...store, readiness: scoreReadiness(store) });
      } catch {
        return privateJson({ status: "STORAGE_UNAVAILABLE", error: "Candidate workspace could not be loaded." }, { status: 503 });
      }
    }
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

      try {
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
      } catch (error) {
        // A file must not be orphaned in private storage if extraction or state persistence fails.
        // Cleanup is best-effort; preserve the original error so the route's generic handler applies.
        try {
          if (context && storagePath) {
            const endpoint = new URL("/storage/v1/object/candidate-documents", context.url);
            await fetch(endpoint, {
              method: "DELETE",
              headers: {
                apikey: context.anonKey,
                Authorization: `Bearer ${context.accessToken}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ prefixes: [storagePath] }),
              cache: "no-store",
              signal: AbortSignal.timeout(10000)
            });
          } else if (!context) {
            const filePath = path.join(UPLOAD_DIR, storedName);
            try { fs.unlinkSync(filePath); }
            catch (cleanupError) {
              if ((cleanupError as NodeJS.ErrnoException).code !== "ENOENT") throw cleanupError;
            }
          }
        } catch {
          // Do not mask the primary failure or disclose storage internals to the client.
        }
        throw error;
      }
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

    if (action === "updateOpportunityStatus") {
      const opportunityId = String(body.opportunityId || "");
      const nextStatus = String(body.status || "").toUpperCase();
      const allowedStatuses = ["READY_TO_PREPARE", "PREPARING", "PACK_READY", "INTERVIEW", "OFFER", "REJECTED", "WITHDRAWN"];
      const exists = store.opportunities.some((item) => item.opportunityId === opportunityId);
      if (!exists) return privateJson({ status: "FAILED", error: "Opportunity not found." }, { status: 404 });
      if (!allowedStatuses.includes(nextStatus)) {
        return privateJson({ status: "FAILED", error: "Choose a valid application status. Record proof separately when an application has been submitted." }, { status: 400 });
      }
      store.opportunities = store.opportunities.map((item) => item.opportunityId === opportunityId ? { ...item, status: nextStatus, updatedAt: new Date().toISOString() } : item);
      await persistStore(context, store);
      return privateJson({ status: "OPPORTUNITY_STATUS_UPDATED", store, readiness: scoreReadiness(store) });
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

    if (action === "addFinanceEntry") {
      const type = String(body.type || "").toUpperCase(), direction = String(body.direction || "").toUpperCase(), status = String(body.status || "RECORDED").toUpperCase();
      const description = typeof body.description === "string" ? body.description.trim() : "", reference = typeof body.reference === "string" ? body.reference.trim() : "", evidenceNote = typeof body.evidenceNote === "string" ? body.evidenceNote.trim() : "", opportunityId = typeof body.opportunityId === "string" ? body.opportunityId : "", occurredOn = typeof body.occurredOn === "string" ? body.occurredOn.trim() : "", amountCents = body.amountCents;
      const validationError = validateFinanceEntryInput({ type, direction, status, amountCents, description, reference, evidenceNote, opportunityId, occurredOn });
      if (validationError) return privateJson({ status: "FAILED", error: validationError }, { status: 400 });
      if (opportunityId && !store.opportunities.some((item) => item.opportunityId === opportunityId)) return privateJson({ status: "FAILED", error: "Linked opportunity was not found in this workspace." }, { status: 404 });
      const entry: FinanceLedgerEntry = { entryId: `finance-${Date.now()}-${Math.random().toString(16).slice(2)}`, type: type as FinanceLedgerEntry["type"], direction: direction as FinanceLedgerEntry["direction"], status: status as FinanceLedgerEntry["status"], amountCents, currency: "ZAR", description, ...(reference ? { reference } : {}), ...(evidenceNote ? { evidenceNote } : {}), ...(opportunityId ? { opportunityId } : {}), occurredOn, createdAt: new Date().toISOString() };
      store.financeLedger = [entry, ...(store.financeLedger || [])].slice(0, 1000);
      await persistStore(context, store);
      return privateJson({ status: "FINANCE_ENTRY_CREATED", entry, store, readiness: scoreReadiness(store) });
    }

    if (action === "updateFinanceEntry") {
      const entryId = typeof body.entryId === "string" ? body.entryId : "";
      const status = String(body.status || "").toUpperCase();
      const reference = typeof body.reference === "string" ? body.reference.trim() : "";
      const evidenceNote = typeof body.evidenceNote === "string" ? body.evidenceNote.trim() : "";
      const existing = (store.financeLedger || []).find((entry) => entry.entryId === entryId);
      if (!existing) return privateJson({ status: "FAILED", error: "Finance entry not found." }, { status: 404 });
      const validationError = validateFinanceStatusUpdate({ status, reference, evidenceNote, existingReference: existing.reference, existingEvidenceNote: existing.evidenceNote });
      if (validationError) return privateJson({ status: "FAILED", error: validationError }, { status: 400 });
      store.financeLedger = store.financeLedger.map((entry) => entry.entryId === entryId ? { ...entry, status: status as FinanceLedgerEntry["status"], reference: reference || existing.reference, evidenceNote: evidenceNote || existing.evidenceNote } : entry);
      await persistStore(context, store);
      return privateJson({ status: "FINANCE_ENTRY_UPDATED", store, readiness: scoreReadiness(store) });
    }

    if (action === "deleteFinanceEntry") {
      const entryId = String(body.entryId || ""), before = (store.financeLedger || []).length;
      store.financeLedger = (store.financeLedger || []).filter((entry) => entry.entryId !== entryId);
      if (store.financeLedger.length === before) return privateJson({ status: "FAILED", error: "Finance entry not found." }, { status: 404 });
      await persistStore(context, store);
      return privateJson({ status: "FINANCE_ENTRY_DELETED", store, readiness: scoreReadiness(store) });
    }

    if (action === "addContactLog") {
      const contactName = typeof body.contactName === "string" ? body.contactName.trim() : "";
      const organisation = typeof body.organisation === "string" ? body.organisation.trim() : "";
      const summary = typeof body.summary === "string" ? body.summary.trim() : "";
      const channel = String(body.channel || "OTHER").toUpperCase();
      const direction = String(body.direction || "OUTBOUND").toUpperCase();
      const opportunityId = typeof body.opportunityId === "string" ? body.opportunityId : "";
      const followUpDate = typeof body.followUpDate === "string" ? body.followUpDate.trim() : "";
      const validDate = (value: string) => !value || (/^\\d{4}-\\d{2}-\\d{2}$/.test(value) && !Number.isNaN(Date.parse(value + "T00:00:00Z")) && new Date(value + "T00:00:00Z").toISOString().slice(0, 10) === value);
      if (contactName.length < 2 || contactName.length > 120) return privateJson({ status: "FAILED", error: "Contact name must be 2–120 characters." }, { status: 400 });
      if (organisation.length > 160 || summary.length < 2 || summary.length > 1600) return privateJson({ status: "FAILED", error: "Organisation must be at most 160 characters and summary 2–1,600 characters." }, { status: 400 });
      if (!["EMAIL", "PHONE", "PORTAL", "IN_PERSON", "OTHER"].includes(channel)) return privateJson({ status: "FAILED", error: "Choose a valid contact channel." }, { status: 400 });
      if (!["OUTBOUND", "INBOUND"].includes(direction)) return privateJson({ status: "FAILED", error: "Choose inbound or outbound direction." }, { status: 400 });
      if (!validDate(followUpDate)) return privateJson({ status: "FAILED", error: "Enter a valid follow-up date." }, { status: 400 });
      if (opportunityId && !store.opportunities.some((item) => item.opportunityId === opportunityId)) return privateJson({ status: "FAILED", error: "Linked opportunity was not found in this workspace." }, { status: 404 });
      const entry: ContactLogEntry = { entryId: `contact-${Date.now()}-${Math.random().toString(16).slice(2)}`, contactName, organisation, summary, channel: channel as ContactLogEntry["channel"], direction: direction as ContactLogEntry["direction"], ...(opportunityId ? { opportunityId } : {}), ...(followUpDate ? { followUpDate } : {}), createdAt: new Date().toISOString() };
      store.contactLog = [entry, ...(store.contactLog || [])].slice(0, 500);
      await persistStore(context, store);
      return privateJson({ status: "CONTACT_LOG_CREATED", entry, store, readiness: scoreReadiness(store) });
    }

    if (action === "deleteContactLog") {
      const entryId = String(body.entryId || "");
      const beforeCount = (store.contactLog || []).length;
      store.contactLog = (store.contactLog || []).filter((item) => item.entryId !== entryId);
      if (store.contactLog.length === beforeCount) return privateJson({ status: "FAILED", error: "Contact log entry not found." }, { status: 404 });
      await persistStore(context, store);
      return privateJson({ status: "CONTACT_LOG_DELETED", store, readiness: scoreReadiness(store) });
    }

    if (action === "addTask") {
      const title = typeof body.title === "string" ? body.title.trim() : "";
      const dueDate = typeof body.dueDate === "string" ? body.dueDate.trim() : "";
      const notes = typeof body.notes === "string" ? body.notes.trim() : "";
      const priority = String(body.priority || "NORMAL").toUpperCase();
      const opportunityId = typeof body.opportunityId === "string" ? body.opportunityId : "";

      if (title.length < 2 || title.length > 160) {
        return privateJson({ status: "FAILED", error: "Task title must be between 2 and 160 characters." }, { status: 400 });
      }
      if (dueDate && (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || Number.isNaN(Date.parse(`${dueDate}T00:00:00Z`)) || new Date(`${dueDate}T00:00:00Z`).toISOString().slice(0, 10) !== dueDate)) {
        return privateJson({ status: "FAILED", error: "Enter a valid task due date." }, { status: 400 });
      }
      if (!["LOW", "NORMAL", "HIGH"].includes(priority)) {
        return privateJson({ status: "FAILED", error: "Task priority must be LOW, NORMAL or HIGH." }, { status: 400 });
      }
      if (notes.length > 1200) return privateJson({ status: "FAILED", error: "Task notes must be 1,200 characters or fewer." }, { status: 400 });
      if (opportunityId && !store.opportunities.some((item) => item.opportunityId === opportunityId)) {
        return privateJson({ status: "FAILED", error: "Linked opportunity was not found in this workspace." }, { status: 404 });
      }

      const now = new Date().toISOString();
      const task: FollowUpTask = {
        taskId: `task-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        title, dueDate, priority: priority as FollowUpTask["priority"], status: "OPEN",
        ...(opportunityId ? { opportunityId } : {}), ...(notes ? { notes } : {}),
        createdAt: now, updatedAt: now
      };
      store.tasks = [task, ...store.tasks];
      await persistStore(context, store);
      return privateJson({ status: "TASK_CREATED", task, store, readiness: scoreReadiness(store) });
    }

    if (action === "updateTask") {
      const taskId = String(body.taskId || "");
      const status = String(body.status || "").toUpperCase();
      const existing = store.tasks.find((item) => item.taskId === taskId);
      if (!existing) return privateJson({ status: "FAILED", error: "Task not found." }, { status: 404 });
      if (!["OPEN", "DONE"].includes(status)) return privateJson({ status: "FAILED", error: "Task status must be OPEN or DONE." }, { status: 400 });
      store.tasks = store.tasks.map((item) => item.taskId === taskId ? { ...item, status: status as FollowUpTask["status"], updatedAt: new Date().toISOString() } : item);
      await persistStore(context, store);
      return privateJson({ status: "TASK_UPDATED", store, readiness: scoreReadiness(store) });
    }

    if (action === "deleteTask") {
      const taskId = String(body.taskId || "");
      const beforeCount = store.tasks.length;
      store.tasks = store.tasks.filter((item) => item.taskId !== taskId);
      if (store.tasks.length === beforeCount) return privateJson({ status: "FAILED", error: "Task not found." }, { status: 404 });
      await persistStore(context, store);
      return privateJson({ status: "TASK_DELETED", store, readiness: scoreReadiness(store) });
    }

    if (action === "deleteDocument") {
      const documentId = typeof body.documentId === "string" ? body.documentId.trim() : "";
      if (!documentId || documentId.length > 180) {
        return privateJson({ status: "FAILED", error: "A valid document ID is required." }, { status: 400 });
      }
      const document = store.documents.find((item) => item.documentId === documentId);
      if (!document) return privateJson({ status: "FAILED", error: "Document not found." }, { status: 404 });

      if (context && typeof document.storagePath === "string" && document.storagePath) {
        const prefix = `${context.userId}/`;
        const objectName = document.storagePath.startsWith(prefix) ? document.storagePath.slice(prefix.length) : "";
        if (!objectName || objectName.includes("/") || !/^[a-zA-Z0-9._-]{1,180}$/.test(objectName)) {
          return privateJson({ status: "FAILED", error: "Document storage reference is invalid; no records were removed." }, { status: 409 });
        }
        const endpoint = new URL("/storage/v1/object/candidate-documents", context.url);
        let response: Response;
        try {
          response = await fetch(endpoint, {
            method: "DELETE",
            headers: {
              apikey: context.anonKey,
              Authorization: `Bearer ${context.accessToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ prefixes: [`${context.userId}/${objectName}`] }),
            cache: "no-store",
            signal: AbortSignal.timeout(15000)
          });
        } catch {
          return privateJson({ status: "STORAGE_FAILED", error: "The private file service could not be reached. The document record was kept." }, { status: 503 });
        }
        if (!response.ok && response.status !== 404) {
          return privateJson({ status: "STORAGE_FAILED", error: "The private file could not be deleted. The document record was kept." }, { status: 503 });
        }
      } else if (!context && process.env.NODE_ENV !== "production") {
        const storedName = typeof document.storedName === "string" ? document.storedName : "";
        if (!storedName || path.basename(storedName) !== storedName || !/^[a-zA-Z0-9._-]{1,180}$/.test(storedName)) {
          return privateJson({ status: "FAILED", error: "Local document storage reference is invalid." }, { status: 409 });
        }
        try { fs.unlinkSync(path.join(UPLOAD_DIR, storedName)); }
        catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") return privateJson({ status: "STORAGE_FAILED", error: "The local file could not be deleted. The document record was kept." }, { status: 503 }); }
      } else if (typeof document.storagePath !== "string" || !document.storagePath) {
        return privateJson({ status: "STORAGE_FAILED", error: "The document has no safe storage reference; no records were removed." }, { status: 503 });
      }

      store.documents = store.documents.filter((item) => item.documentId !== documentId);
      store.smartExtraction = store.smartExtraction.filter((item) => item.documentId !== documentId);
      await persistStore(context, store);
      return privateJson({ status: "DOCUMENT_DELETED", store, readiness: scoreReadiness(store) });
    }

    if (action === "deleteOpportunity") {
      const opportunityId = typeof body.opportunityId === "string" ? body.opportunityId.trim() : "";
      if (!opportunityId || opportunityId.length > 180) {
        return privateJson({ status: "FAILED", error: "A valid opportunity ID is required." }, { status: 400 });
      }
      if (!store.opportunities.some((item) => item.opportunityId === opportunityId)) {
        return privateJson({ status: "FAILED", error: "Opportunity not found." }, { status: 404 });
      }
      store.opportunities = store.opportunities.filter((item) => item.opportunityId !== opportunityId);
      store.applicationPacks = store.applicationPacks.filter((item) => item.opportunityId !== opportunityId);
      store.proofLog = store.proofLog.filter((item) => item.opportunityId !== opportunityId);
      store.tasks = store.tasks.map((item) => item.opportunityId === opportunityId ? { ...item, opportunityId: undefined, updatedAt: new Date().toISOString() } : item);
      store.contactLog = store.contactLog.map((item) => item.opportunityId === opportunityId ? { ...item, opportunityId: undefined } : item);
      store.financeLedger = (store.financeLedger || []).map((item) => item.opportunityId === opportunityId ? { ...item, opportunityId: undefined } : item);
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
  } catch {
    // Do not disclose database, storage, filesystem, or upstream service details to clients.
    return privateJson({
      status: "INTERNAL_ERROR",
      error: "The request could not be completed. Please try again.",
    }, { status: 500 });
  }
}