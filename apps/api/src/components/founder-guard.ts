import { bearerToken, supabaseUserRequest } from "./supabase-user";

/** Founder authorization is evaluated by the database under the caller's JWT/RLS context. */
export async function requireFounder(authorization: string | undefined): Promise<void> {
  const token = bearerToken(authorization);
  const result = await supabaseUserRequest<boolean>(token, "rpc/is_kingsmen_founder", {
    method: "POST",
    body: "{}"
  });
  if (result !== true) throw new Error("FOUNDER_REQUIRED");
}
