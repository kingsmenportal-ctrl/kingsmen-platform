import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const auth = read("apps/web/src/lib/auth/supabase-rest.ts");
const body = read("apps/web/src/lib/auth/request-body.ts");
const tokens = read("apps/web/src/lib/auth/token-bounds.ts");
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
  ["provider requests have an eight-second timeout", /AbortSignal\.timeout\(8_000\)/.test(auth)],
  ["access and refresh cookies are length-bounded before storage", /accessToken\.length > 16_384/.test(auth) && /refreshToken\.length > 4_096/.test(auth)],
  ["stored session tokens are length-bounded before provider use", /access\.length > 16_384/.test(auth) && /refresh\.length > 4_096/.test(auth)],
  ["session cookies are HttpOnly and SameSite=Lax", /httpOnly: true[\s\S]*?sameSite: "lax"/.test(auth)],
  ["refresh cookie lifetime is bounded", /60 \* 60 \* 24 \* 30/.test(auth)],
  ["auth request bodies have a fixed byte cap", /MAX_AUTH_REQUEST_BYTES = 16_384/.test(body) && /total > MAX_AUTH_REQUEST_BYTES/.test(body)],
  ["auth body parser rejects non-JSON and malformed JSON", /JSON_REQUIRED/.test(body) && /INVALID_JSON/.test(body)],
  ["login uses same-origin guard and bounded JSON parser", /isSameOriginRequest\(request\)/.test(login) && /readAuthJson\(request\)/.test(login)],
  ["registration uses same-origin guard and bounded JSON parser", /isSameOriginRequest\(request\)/.test(register) && /readAuthJson\(request\)/.test(register)],
  ["login validates provider token pair before setting cookies", /hasValidAuthTokenPair\(payload\)/.test(login)],
  ["registration validates any returned token pair before setting cookies", /hasValidAuthTokenPair\(payload\)/.test(register) && /AUTH_PROVIDER_RESPONSE_INVALID/.test(register)],
  ["provider access and refresh token lengths are bounded", /MAX_AUTH_ACCESS_TOKEN_CHARS = 16_384/.test(tokens) && /MAX_AUTH_REFRESH_TOKEN_CHARS = 4_096/.test(tokens) && /MIN_AUTH_TOKEN_CHARS = 16/.test(tokens)],
  ["recovery uses same-origin guard and bounded JSON parser", /isSameOriginRequest\(request\)/.test(recovery) && /readAuthJson\(request\)/.test(recovery)],
  ["recovery response does not disclose account existence", /If an account exists for that address/.test(recovery)],
  ["refresh uses same-origin guard and shared token-pair validation", /isSameOriginRequest\(request\)/.test(refresh) && /hasValidAuthTokenPair\(payload\)/.test(refresh)],
  ["login validates provider token pair before setting cookies", /hasValidAuthTokenPair\(payload\)/.test(login) && /setAuthCookies\(payload\.access_token, payload\.refresh_token/.test(login)],
  ["registration validates partial or invalid token pair before setting cookies", /hasValidAuthTokenPair\(payload\)/.test(register) && /AUTH_PROVIDER_RESPONSE_INVALID/.test(register)],
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
