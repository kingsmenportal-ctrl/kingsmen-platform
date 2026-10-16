import type { IncomingMessage, ServerResponse } from "node:http";
import { authenticateSupabaseUser, bearerToken, supabaseUserRequest } from "./supabase-user";
import { sendComponentJson, safeErrorCode } from "./http";

/**
 * Minimal candidate self-service read/submit routes. These rely on the draft schema
 * and SECURITY DEFINER RPCs being reviewed/applied first; until then requests fail closed
 * at PostgREST and no service-role credentials are used.
 */
export async function handleCandidateComponentRoute(
  request: IncomingMessage,
  response: ServerResponse,
  pathname: string,
  method: string
): Promise<boolean> {
  if (!pathname.startsWith("/api/candidate/")) return false;

  try {
    const token = bearerToken(request.headers.authorization);
    const user = await authenticateSupabaseUser(token);

    if (method === "GET" && pathname === "/api/candidate/kyc") {
      const rows = await supabaseUserRequest<unknown[]>(token, "kyc_verifications?select=id,status,submitted_at,reviewed_at,created_at,updated_at&order=created_at.desc");
      sendComponentJson(response, 200, { ok: true, userId: user.id, kyc: rows });
      return true;
    }

    if (method === "POST" && pathname === "/api/candidate/kyc/submit") {
      let raw = "";
      for await (const chunk of request) {
        raw += chunk.toString();
        if (raw.length > 16384) throw new Error("REQUEST_BODY_TOO_LARGE");
      }
      let body: unknown = {};
      try { body = raw.trim() ? JSON.parse(raw) : {}; } catch { throw new Error("INVALID_JSON_OBJECT"); }
      if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("INVALID_JSON_OBJECT");
      const verificationId = (body as Record<string, unknown>).verificationId;
      if (typeof verificationId !== "string" || !/^[0-9a-f-]{36}$/i.test(verificationId)) throw new Error("INVALID_VERIFICATION_ID");
      const result = await supabaseUserRequest<unknown>(token, "rpc/submit_kyc", {
        method: "POST",
        body: JSON.stringify({ p_verification_id: verificationId })
      });
      sendComponentJson(response, 200, { ok: true, result });
      return true;
    }

    sendComponentJson(response, 404, { ok: false, code: "COMPONENT_ROUTE_NOT_FOUND" });
    return true;
  } catch (error) {
    const code = safeErrorCode(error);
    const status = code === "UNAUTHENTICATED" ? 401
      : code === "FOUNDER_REQUIRED" || code === "FORBIDDEN" ? 403
      : code === "REQUEST_BODY_TOO_LARGE" ? 413
      : code.startsWith("INVALID_") ? 400
      : code === "SUPABASE_USER_AUTH_NOT_CONFIGURED" ? 503
      : 502;
    sendComponentJson(response, status, { ok: false, code });
    return true;
  }
}
