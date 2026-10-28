export type LimitedJsonResult =
  | { ok: true; value: unknown }
  | { ok: false; status: 400 | 413 | 415; error: "INVALID_JSON" | "REQUEST_TOO_LARGE" | "JSON_CONTENT_TYPE_REQUIRED" };

export async function readLimitedJson(request: Request, maxBytes = 16 * 1024): Promise<LimitedJsonResult> {
  const contentType = request.headers.get("content-type") || "";
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
    return { ok: false, status: 415, error: "JSON_CONTENT_TYPE_REQUIRED" };
  }
  const declaredHeader = request.headers.get("content-length");
  if (declaredHeader !== null) {
    const declaredLength = Number(declaredHeader);
    if (!Number.isSafeInteger(declaredLength) || declaredLength < 0) {
      return { ok: false, status: 400, error: "INVALID_JSON" };
    }
    if (declaredLength > maxBytes) {
      return { ok: false, status: 413, error: "REQUEST_TOO_LARGE" };
    }
  }
  if (!request.body) return { ok: false, status: 400, error: "INVALID_JSON" };
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return { ok: false, status: 413, error: "REQUEST_TOO_LARGE" };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, status: 400, error: "INVALID_JSON" };
  } finally {
    try { reader.releaseLock(); } catch {}
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return { ok: true, value: JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) };
  } catch {
    return { ok: false, status: 400, error: "INVALID_JSON" };
  }
}
