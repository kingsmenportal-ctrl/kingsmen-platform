import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const read = (p) => readFileSync(resolve(process.cwd(), p), "utf8");
const repository = read("apps/api/src/db/truth-vault-repository.ts");
const server = read("apps/api/src/server.ts");
const route = read("apps/web/src/app/api/candidate/support-tickets/route.ts");
const page = read("apps/web/src/app/candidate/support/page.tsx");

// Scope assertions to this method. A repository-wide negative regex can fail
// because unrelated document/application queries legitimately use these fields.
const ticketReader = repository.match(
  /async listSupportTicketsForVerifiedSupabaseUser[\\s\\S]*?(?=\\n  async |\\n}\\n)/
)?.[0] ?? "";
const ticketSelect = ticketReader.match(
  /select([\\s\\S]*?)from public\\.candidate_support_tickets/i
)?.[1] ?? "";

const checks = [
  ["ticket reader method was found", ticketReader.length > 0],
  ["ticket reads bind to verified Supabase Auth UUID", /where ca\\.auth_user_id = \\$1::uuid/.test(ticketReader)],
  ["ticket reads require an active candidate", /c\\.is_active = true/.test(ticketReader)],
  ["ticket reads are candidate-scoped and metadata-only",
    /from public\\.candidate_support_tickets[\\s\\S]*?where candidate_id = \\$1::uuid/.test(ticketReader) &&
    ticketSelect.length > 0 && !/\\b(description|evidence_ref|assigned_to)\\b/i.test(ticketSelect)],
  ["identity binding runs in a transaction with rollback", /listSupportTicketsForVerifiedSupabaseUser[\\s\\S]*?BEGIN[\\s\\S]*?set_config\\('app\\.kingsmen_role', \\$1, true\\)[\\s\\S]*?COMMIT[\\s\\S]*?ROLLBACK/.test(repository)],
  ["internal endpoint is POST-only and authenticated",
    /pathname === "\\/api\\/internal\\/candidate\\/support-tickets"[\\s\\S]*?method !== "POST"[\\s\\S]*?handleInternalCandidateSupportTickets/.test(server) &&
    /handleInternalCandidateSupportTickets[\\s\\S]*?KINGSMEN_WEB_INTERNAL_API_KEY[\\s\\S]*?timingSafeEqual/.test(server)],
  ["web bridge derives identity from server-verified Auth", /getVerifiedAuthUser\\(\\)/.test(route) && /JSON\\.stringify\\(\\{ supabaseUserId: user\\.id \\}\\)/.test(route)],
  ["web bridge enforces HTTPS outside loopback and no-store", /apiUrl\\.protocol !== "https:"/.test(route) && /cache: "no-store"/.test(route)],
  ["candidate UI is read-only and handles loading/errors/empty state",
    /fetch\\("\\/api\\/candidate\\/support-tickets"/.test(page) &&
    /does not create, edit, or close tickets/.test(page) &&
    /role="alert"/.test(page) &&
    /No support tickets are currently linked/.test(page)]
];
let failed = false;
for (const [label, passed] of checks) {
  console.log(`${passed ? "PASS" : "FAIL"} ${label}`);
  if (!passed) failed = true;
}
if (failed) process.exitCode = 1;
