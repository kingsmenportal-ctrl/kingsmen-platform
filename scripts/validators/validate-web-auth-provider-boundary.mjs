import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const auth = read("apps/web/src/lib/auth/supabase-rest.ts");
const body = read("apps/web/src/lib/auth/request-body.ts");
const login = read("apps/web/src/app/api/auth/login/route.ts");
const register = read("apps/web/src/app/api/auth/register/route.ts");
const recovery = read("apps/web/src/app/api/auth/recovery/route.ts");
const refresh = read("apps/web/src/app/api/auth/refresh/route.ts");
const logout = read("apps/web/src/app/api/auth/logout/route.ts");
const session = read("apps/web/src/app/api/auth/session/route.ts");
const checks = [
  ["provider URL is HTTPS except loopback", /parsed\.protocol !== "https:" && parsed\.hostname !== "localhost" && parsed\.hostname !== "127\.0\.0\.1"/.test(auth)],
  ["provider configuration fails closed", /if \(!url \|\| !key\) return null/.test(auth) && /IDENTITY_PROVIDER_NOT_CONFIGURED/.test(auth)],
  ["provider requests are never cached", /cache: "no-store"/.test(auth)],
  ["session cookies are HttpOnly and SameSite=Lax", /httpOnly: true[\s\S]*?sameSite: "lax"/.test(auth)],
  ["refresh cookie lifetime is bounded", /60 \* 60 \* 24 \* 30/.test(auth)],
  ["auth request bodies have a fixed byte cap", /MAX_AUTH_REQUEST_BYTES = 16_384/.test(body) && /total > MAX_AUTH_REQUEST_BYTES/.test(body)],
  ["auth body parser rejects non-JSON and malformed JSON", /JSON_REQUIRED/.test(body) && /INVALID_JSON/.test(body)],
  ["login uses same-origin guard and bounded JSON parser", /isSameOriginRequest\(request\)/.test(login) && /readAuthJson\(request\)/.test(login)],
  ["registration uses same-origin guard and bounded JSON parser", /isSameOriginRequest\(request\)/.test(register) && /readAuthJson\(request\)/.test(register)],
  ["recovery uses same-origin guard and bounded JSON parser", /isSameOriginRequest\(request\)/.test(recovery) && /readAuthJson\(request\)/.test(recovery)],
  ["recovery response does not disclose account existence", /If an account exists for that address/.test(recovery)],
  ["refresh uses same-origin guard and validates token bounds", /isSameOriginRequest\(request\)/.test(refresh) && /refreshToken\.length > 4096/.test(refresh) && /access_token\.length > 16384/.test(refresh)],
  ["logout clears local cookies even if provider logout fails", /catch \{ \/\* Clear local session even if the provider is unavailable\. \*\//.test(logout) && /await clearAuthCookies\(\)/.test(logout)],
  ["session route verifies identity server-side", /getVerifiedAuthUser\(\)/.test(session) && /authConfigured\(\)/.test(session)],
  ["service-role credentials are not used by web auth boundary", !/SUPABASE_SERVICE_ROLE_KEY|service_role/i.test(auth + login + register + recovery + refresh + logout + session)]
];
let failed = false;
for (const [label, passed] of checks) {
  console.log(`${passed ? "PASS" : "FAIL"} ${label}`);
  if (!passed) failed = true;
}
if (failed) process.exitCode = 1;
