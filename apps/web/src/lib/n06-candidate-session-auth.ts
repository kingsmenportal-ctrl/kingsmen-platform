type VerifiedCandidateSession = { ok: true; userId: string } | { ok: false; response: Response };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(status: number, code: string): Response {
  return Response.json(
    { ok: false, productionReady: false, code },
    { status, headers: { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache", Vary: "Authorization" } }
  );
}

/**
 * Verifies the Supabase bearer session without trusting candidateId from request
 * JSON and without using a service-role credential. This authenticates the user;
 * it does not claim that an auth user has been linked to a candidate record.
 */
export async function verifyN06CandidateSession(request: Request): Promise<VerifiedCandidateSession> {
  const authorization = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(\S+)$/i.exec(authorization);
  if (!match) return { ok: false, response: json(401, "AUTHENTICATION_REQUIRED") };

  const baseValue = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!baseValue || !anonKey) {
    return { ok: false, response: json(503, "WORKBENCH_AUTH_NOT_CONFIGURED") };
  }

  let base: URL;
  try {
    base = new URL(baseValue);
    if (base.protocol !== "https:" && base.hostname !== "localhost" && base.hostname !== "127.0.0.1") {
      return { ok: false, response: json(503, "WORKBENCH_AUTH_NOT_CONFIGURED") };
    }
  } catch {
    return { ok: false, response: json(503, "WORKBENCH_AUTH_NOT_CONFIGURED") };
  }

  try {
    const response = await fetch(new URL("/auth/v1/user", base), {
      method: "GET",
      headers: { apikey: anonKey, Authorization: "Bearer " + match[1] },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) return { ok: false, response: json(401, "SESSION_INVALID") };

    const user = await response.json() as { id?: unknown };
    if (typeof user.id !== "string" || !UUID.test(user.id)) {
      return { ok: false, response: json(401, "SESSION_INVALID") };
    }
    return { ok: true, userId: user.id };
  } catch {
    return { ok: false, response: json(503, "WORKBENCH_AUTH_UNAVAILABLE") };
  }
}

/**
 * Until the canonical candidate-to-auth linkage and verified route read model
 * are available, authenticated requests fail closed rather than returning a
 * fabricated successful readiness/optimizer result.
 */
export function n06WorkbenchAdapterRequired(): Response {
  return Response.json(
    {
      ok: false,
      productionReady: false,
      code: "N06_WORKBENCH_ADAPTER_REQUIRED",
      message: "The verified candidate-to-route read model is not configured. No payment, provider submission, application status, or outcome has been changed."
    },
    {
      status: 503,
      headers: { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache", Vary: "Authorization" }
    }
  );
}
