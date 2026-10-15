import { cookies } from "next/headers";
import { candidateAccessCookie, supabaseAuthConfig } from "@/lib/supabase-auth";
import { founderAccessDenied, founderPrivateJson, requireFounderAccess } from "@/lib/founder-auth";

export async function GET() {
  const access = await requireFounderAccess();
  if (!access.ok) return founderAccessDenied(access);

  const config = supabaseAuthConfig();
  const token = (await cookies()).get(candidateAccessCookie)?.value;
  if (!config || !token || token.length > 8192 || !/^[A-Za-z0-9._~-]+$/.test(token)) {
    return founderPrivateJson({ ok: false, error: "Authenticated database access is unavailable." }, { status: 503 });
  }

  try {
    const response = await fetch(
      `${config.url}/rest/v1/founder_command_intake?select=id,request_ref,command_key,command_name,actor_user_id,actor_email,request_status,reason,evidence_ref,audit_ref,created_at&order=created_at.desc&limit=100`,
      {
        headers: { apikey: config.anonKey, Authorization: `Bearer ${token}`, Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(8000)
      }
    );
    if (!response.ok) {
      return founderPrivateJson({ ok: false, error: "Could not load the command review queue. Confirm migration 0016 and database grants." }, { status: response.status === 401 || response.status === 403 ? 403 : 503 });
    }
    const requests = await response.json();
    if (!Array.isArray(requests)) return founderPrivateJson({ ok: false, error: "Review queue response was invalid." }, { status: 502 });
    return founderPrivateJson({ ok: true, requests, count: requests.length, limit: 100, productionReady: false });
  } catch {
    return founderPrivateJson({ ok: false, error: "Review queue request timed out." }, { status: 503 });
  }
}
