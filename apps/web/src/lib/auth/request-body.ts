export const MAX_AUTH_REQUEST_BYTES = 16_384;

export type AuthJsonReadResult =
  | { ok: true; value: unknown }
  | { ok: false; status: 400 | 413 | 415; code: "INVALID_JSON" | "REQUEST_TOO_LARGE" | "JSON_REQUIRED" };

/** Read a small JSON auth payload without buffering an unbounded request body. */
export async function readAuthJson(request: Request): Promise<AuthJsonReadResult> {
  const contentType = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  if (contentType !== "application/json") return { ok: false, status: 415, code: "JSON_REQUIRED" };
  const lengthHeader = request.headers.get("content-length");
  if (lengthHeader && /^\d+$/.test(lengthHeader) && Number(lengthHeader) > MAX_AUTH_REQUEST_BYTES) {
    return { ok: false, status: 413, code: "REQUEST_TOO_LARGE" };
  }
  if (!request.body) return { ok: false, status: 400, code: "INVALID_JSON" };
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_AUTH_REQUEST_BYTES) {
        await reader.cancel();
        return { ok: false, status: 413, code: "REQUEST_TOO_LARGE" };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, status: 400, code: "INVALID_JSON" };
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return { ok: true, value: JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) }; }
  catch { return { ok: false, status: 400, code: "INVALID_JSON" }; }
}
