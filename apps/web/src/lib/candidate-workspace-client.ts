"use client";

export async function candidateWorkspaceRequest<T>(method: "GET" | "PATCH" | "POST" | "DELETE", body?: unknown, query = ""): Promise<T> {
  const token = readSupabaseAccessToken();
  if (!token) throw new Error("Sign in to sync your Kingsmen candidate workspace.");
  const response = await fetch(`/api/candidate/workspace${query}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" })
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    cache: "no-store"
  });
  const result = await response.json().catch(() => ({})) as T & { error?: string; ok?: boolean };
  if (!response.ok) throw new Error(result.error || "Kingsmen could not sync this change.");
  return result;
}

function readSupabaseAccessToken(): string {
  try {
    const stores = [window.localStorage, window.sessionStorage];
    for (const store of stores) {
      for (let index = 0; index < store.length; index += 1) {
        const key = store.key(index);
        if (!key || !/^sb-.+-auth-token$/.test(key)) continue;
        const raw = store.getItem(key);
        if (!raw) continue;
        let value: unknown = raw;
        if (raw.startsWith("base64-")) {
          try { value = atob(raw.slice(7)); } catch { continue; }
        }
        if (typeof value === "string") {
          try { value = JSON.parse(value); } catch { continue; }
        }
        if (value && typeof value === "object" && "access_token" in value) {
          const token = (value as { access_token?: unknown }).access_token;
          if (typeof token === "string" && token.split(".").length === 3) return token;
        }
      }
    }
  } catch {
    // Storage may be disabled; the server will not accept an unauthenticated request.
  }
  return "";
}
