import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const kingsmenRepoRoot = path.resolve(__dirname, "../..");

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  outputFileTracingRoot: kingsmenRepoRoot,
  // Only public Supabase client credentials are inlined into browser code. Never map server secrets here.
  env: {
    KINGSMEN_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL || "",
    KINGSMEN_PUBLIC_SUPABASE_KEY: process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || ""
  },
  experimental: {
    externalDir: true
  }
};

export default nextConfig;
