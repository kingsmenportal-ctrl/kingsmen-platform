import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const kingsmenRepoRoot = path.resolve(__dirname, "../..");

// The Netlify site currently defines SUPABASE_URL/SUPABASE_ANON_KEY at build time.
// Expose only the public project URL and anon/publishable key to the browser so the
// candidate session and feed can initialize when NEXT_PUBLIC_* aliases are absent.
// Never map SUPABASE_SERVICE_ROLE_KEY into Next.js env or a browser bundle.
function firstConfigured(...values) {
  return values.find(value => typeof value === "string" && value.trim().length > 0)?.trim();
}

const publicSupabaseUrl = firstConfigured(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_URL
);
const publicSupabaseAnonKey = firstConfigured(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  process.env.SUPABASE_ANON_KEY,
  process.env.SUPABASE_PUBLISHABLE_KEY
);

function safePublicSupabaseUrl(value) {
  if (!value) return undefined;
  try {
    const parsed = new URL(value);
    if (parsed.protocol === "https:" || parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      return parsed.toString().replace(/\/+$/, "");
    }
  } catch {}
  return undefined;
}

const publicBuildEnv = {};
const safeSupabaseUrl = safePublicSupabaseUrl(publicSupabaseUrl);
if (safeSupabaseUrl) publicBuildEnv.NEXT_PUBLIC_SUPABASE_URL = safeSupabaseUrl;
if (publicSupabaseAnonKey) publicBuildEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY = publicSupabaseAnonKey;

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  outputFileTracingRoot: kingsmenRepoRoot,
  env: publicBuildEnv,
  experimental: {
    externalDir: true
  }
};

export default nextConfig;
