export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization || !/^Bearer\s+\S+/i.test(authorization)) {
    return Response.json(
      { ok: false, productionReady: false, error: "Authenticated founder session required" },
      { status: 401 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return Response.json(
      { ok: false, productionReady: false, error: "Supabase public endpoint configuration is missing" },
      { status: 503 }
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(
      `${supabaseUrl.replace(/\/$/, "")}/functions/v1/n08-founder-control-plane-health`,
      {
        method: "GET",
        headers: { authorization, apikey: anonKey },
        cache: "no-store"
      }
    );
  } catch {
    return Response.json(
      { ok: false, productionReady: false, error: "Founder health service is unavailable" },
      { status: 503 }
    );
  }

  try {
    const result = await upstream.json();
    return Response.json(result, { status: upstream.status });
  } catch {
    return Response.json(
      { ok: false, productionReady: false, error: "Founder health service returned an invalid response" },
      { status: 502 }
    );
  }
}
