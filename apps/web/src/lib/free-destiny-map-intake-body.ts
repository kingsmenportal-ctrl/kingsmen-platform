export type BoundedRequestBodyResult =
  | { ok: true; body: string }
  | {
      ok: false;
      code: "REQUEST_TOO_LARGE" | "INVALID_REQUEST_BODY";
      message: string;
    };

/**
 * Reads a request body incrementally and stops as soon as the byte limit is
 * exceeded. This protects the route even when Content-Length is missing,
 * incorrect, or supplied by an untrusted client.
 */
export async function readBoundedRequestBody(
  request: Request,
  maxBytes: number
): Promise<BoundedRequestBodyResult> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 0 || !request.body) {
    return {
      ok: false,
      code: "INVALID_REQUEST_BODY",
      message: "The intake request body could not be read."
    };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      if (!(result.value instanceof Uint8Array)) {
        await reader.cancel();
        return {
          ok: false,
          code: "INVALID_REQUEST_BODY",
          message: "The intake request body is not a valid byte stream."
        };
      }

      totalBytes += result.value.byteLength;
      if (totalBytes > maxBytes) {
        try {
          await reader.cancel();
        } catch {
          // The limit decision remains authoritative even if cancellation fails.
        }
        return {
          ok: false,
          code: "REQUEST_TOO_LARGE",
          message: "The intake request exceeds the maximum allowed size."
        };
      }
      chunks.push(result.value);
    }
  } catch {
    try {
      await reader.cancel();
    } catch {
      // Preserve the original read failure.
    }
    return {
      ok: false,
      code: "INVALID_REQUEST_BODY",
      message: "The intake request body could not be read."
    };
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return {
      ok: true,
      body: new TextDecoder("utf-8", { fatal: true }).decode(bytes)
    };
  } catch {
    return {
      ok: false,
      code: "INVALID_REQUEST_BODY",
      message: "The intake request body must be valid UTF-8."
    };
  }
}
