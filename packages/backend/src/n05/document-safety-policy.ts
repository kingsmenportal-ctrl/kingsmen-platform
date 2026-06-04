const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp"
]);

const ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp"
]);

const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;

export function assertN05DocumentUploadSafe(input: {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  rawPublicUrlAllowed?: boolean;
  serviceRoleVisibleToBrowser?: boolean;
}) {
  const lower = input.filename.toLowerCase();
  const hasAllowedExtension = [...ALLOWED_EXTENSIONS].some((ext) => lower.endsWith(ext));

  if (!ALLOWED_MIME_TYPES.has(input.mimeType)) {
    throw new Error(`N05 upload blocked: unsupported MIME type ${input.mimeType}`);
  }

  if (!hasAllowedExtension) {
    throw new Error(`N05 upload blocked: unsupported file extension for ${input.filename}`);
  }

  if (input.sizeBytes <= 0 || input.sizeBytes > MAX_DOCUMENT_SIZE_BYTES) {
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
  allowedMimeTypes: [...ALLOWED_MIME_TYPES],
  allowedExtensions: [...ALLOWED_EXTENSIONS],
  maxDocumentSizeBytes: MAX_DOCUMENT_SIZE_BYTES,
  rawPublicUrlAllowed: false,
  serviceRoleBackendOnly: true,
  productionReady: false
} as const;