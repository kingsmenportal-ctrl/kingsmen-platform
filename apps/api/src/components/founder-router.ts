import type { IncomingMessage, ServerResponse } from "node:http";
import { authenticateSupabaseUser, bearerToken, supabaseUserRequest } from "./supabase-user";
import { requireFounder } from "./founder-guard";
import { sendComponentJson, safeErrorCode } from "./http";

async function readJsonObject(request: IncomingMessage): Promise<Record<string, unknown>> {
  let raw = "";
  for await (const chunk of request) {
    raw += chunk.toString();
    if (raw.length > 16384) throw new Error("REQUEST_BODY_TOO_LARGE");
  }
  let value: unknown;
  try { value = raw.trim() ? JSON.parse(raw) : {}; } catch { throw new Error("INVALID_JSON_OBJECT"); }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("INVALID_JSON_OBJECT");
  return value as Record<string, unknown>;
}

/** Founder routes are separately authenticated with the caller JWT and database role check. */
export async function handleFounderComponentRoute(
  request: IncomingMessage,
  response: ServerResponse,
  pathname: string,
  method: string
): Promise<boolean> {
  if (!pathname.startsWith("/api/founder/")) return false;
  try {
    const token = bearerToken(request.headers.authorization);
    await authenticateSupabaseUser(token);
    await requireFounder(request.headers.authorization);

    if (method === "POST" && pathname === "/api/founder/reports") {
      const body = await readJsonObject(request);
      const reportType = body.reportType;
      if (typeof reportType !== "string" || !["candidates", "finance", "compliance", "performance"].includes(reportType)) {
        throw new Error("INVALID_REPORT_TYPE");
      }
      const result = await supabaseUserRequest<unknown>(token, "rpc/request_report_export", {
        method: "POST",
        body: JSON.stringify({ p_report_type: reportType })
      });
      sendComponentJson(response, 202, {
        ok: true,
        exportId: result,
        status: "pending",
        note: "This records an export request only; a worker must generate and securely deliver the file."
      });
      return true;
    }

    if (method === "GET" && pathname === "/api/founder/reports") {
      const reports = await supabaseUserRequest<unknown[]>(token, "report_exports?select=id,report_type,status,created_at,completed_at&order=created_at.desc&limit=100");
      sendComponentJson(response, 200, { ok: true, reports });
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
