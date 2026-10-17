const MIME_TO_EXTENSIONS: Record<string, ReadonlySet<string>> = {
  "application/pdf": new Set([".pdf"]),
  "image/jpeg": new Set([".jpg", ".jpeg"]),
  "image/png": new Set([".png"]),
  "image/webp": new Set([".webp"])
};

const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_FILENAME_LENGTH = 255;

export function assertN05DocumentUploadSafe(input: {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  rawPublicUrlAllowed?: boolean;
  serviceRoleVisibleToBrowser?: boolean;
}) {
  if (typeof input.filename !== "string" || input.filename.length === 0 ||
      input.filename.length > MAX_FILENAME_LENGTH ||
      input.filename !== input.filename.trim() ||
      input.filename.includes("/") || input.filename.includes("\\\\") ||
      [...input.filename].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127) ||
      input.filename === "." || input.filename === ".." ||
      input.filename.includes("..")) {
    throw new Error("N05 upload blocked: unsafe filename");
  }

  const extension = input.filename.slice(input.filename.lastIndexOf(".")).toLowerCase();
  const allowedExtensions = MIME_TO_EXTENSIONS[input.mimeType];
  if (!allowedExtensions) {
    throw new Error("N05 upload blocked: unsupported MIME type");
  }

  if (!allowedExtensions.has(extension)) {
    throw new Error("N05 upload blocked: MIME type and file extension do not match");
  }

  if (!Number.isSafeInteger(input.sizeBytes) || input.sizeBytes <= 0 || input.sizeBytes > MAX_DOCUMENT_SIZE_BYTES) {
    throw new Error("N05 upload blocked: file size exceeds allowed boundary");
  }

  if (input.rawPublicUrlAllowed === true) {
    throw new Error("N05 upload blocked: raw public URL is not allowed");
  }

  if (input.serviceRoleVisibleToBrowser === true) {
    throw new Error("N05 upload blocked: service_role must never be visible to browser");
  }

  return true;
}

export const N05_DOCUMENT_UPLOAD_LIMITS = {
  allowedMimeTypes: Object.keys(MIME_TO_EXTENSIONS),
  allowedExtensions: [...new Set([...MIME_TO_EXTENSIONS.values()].flatMap((extensions) => [...extensions]))],
  maxDocumentSizeBytes: MAX_DOCUMENT_SIZE_BYTES,
  maxFilenameLength: MAX_FILENAME_LENGTH,
  rawPublicUrlAllowed: false,
  serviceRoleBackendOnly: true,
  productionReady: false
} as const;
