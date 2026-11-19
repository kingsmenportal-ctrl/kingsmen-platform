import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const session = readFileSync("apps/web/src/lib/kingsmen/supabase-session.ts", "utf8");
const login = readFileSync("apps/web/src/app/auth/login/page.tsx", "utf8");
const register = readFileSync("apps/web/src/app/auth/register/page.tsx", "utf8");
const callback = readFileSync("apps/web/src/app/auth/callback/page.tsx", "utf8");
const candidateLogin = readFileSync("apps/web/src/app/candidate/login/page.tsx", "utf8");
const home = readFileSync("apps/web/src/app/page.tsx", "utf8");

assert.ok(session.includes("token?grant_type=password"), "Session helper must sign in through Supabase Auth.");
assert.ok(session.includes("token?grant_type=refresh_token"), "Session helper must refresh expiring access tokens.");
assert.ok(session.includes("signup?redirect_to="), "Registration must use the configured Supabase Auth endpoint and callback.");
assert.ok(session.includes("recover?redirect_to="), "Password reset must return through the auth callback.");
assert.ok(session.includes("window.localStorage.setItem(config.storageKey"), "Session must be stored only under the configured project's storage key.");
assert.ok(!session.includes("SUPABASE_SERVICE_ROLE_KEY"), "Browser auth helper must never include service-role credentials.");
assert.ok(!session.includes("localStorage.getItem('sb-") && !session.includes('localStorage.getItem("sb-'), "Browser auth helper must not scan hard-coded project session keys.");
assert.ok(login.includes("signInKingsmenWithPassword") && login.includes("requestKingsmenPasswordReset"), "Login page must support sign-in and password reset.");
assert.ok(register.includes("registerKingsmenWithPassword"), "Registration page must call Supabase Auth sign-up.");
assert.ok(register.includes("Check your email"), "Registration must explain email confirmation when no session is returned.");
assert.ok(callback.includes("acceptKingsmenSupabaseAuthCallback"), "Auth callback must consume the Supabase email-confirmation link.");
assert.ok(callback.includes("updateKingsmenPassword"), "Auth callback must support password recovery.");
assert.ok(candidateLogin.includes('redirect("/auth/login")'), "Legacy candidate login route must redirect to the canonical auth route.");
assert.ok(home.includes('href="/auth/login"') && home.includes('href="/auth/register"'), "Public home navigation must expose sign-in and registration.");

console.log("Kingsmen candidate authentication entry contract passed.");
