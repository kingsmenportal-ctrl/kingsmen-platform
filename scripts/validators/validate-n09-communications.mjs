import fs from "node:fs";
import path from "node:path";
const read=p=>fs.readFileSync(path.join(process.cwd(),p),"utf8");
const migration=read("db/migrations/0063_n09_communications_follow_up.sql");
const candidate=read("apps/web/src/app/api/candidate/communications/route.ts");
const reviewer=read("apps/web/src/app/api/reviewer/communications/route.ts");
const ui=read("apps/web/src/app/candidate/messages/page.tsx");
const checks=[
["communications ledger",migration.includes("candidate_communications")],
["follow-up tasks",migration.includes("candidate_follow_up_tasks")],
["append-only attempts",migration.includes("n09_attempts_no_update")],
["idempotency unique",migration.includes("idempotency_key text NOT NULL UNIQUE")],
["WhatsApp urgent-only database constraint",migration.includes("CHECK(channel <> 'WHATSAPP' OR priority='URGENT')")],
["explicit preference snapshot",migration.includes("consent_snapshot jsonb")],
["bounded retries",migration.includes("attempt_count BETWEEN 0 AND 3")],
["state transition guard",migration.includes("guard_n09_communication_state")],
["candidate session authentication",candidate.includes("requireCandidateSession")],
["candidate-specific history filter",candidate.includes('"eq."+auth.session.candidateId')],
["acknowledgement requires verified delivery",candidate.includes('rows[0].state!=="DELIVERED"')],
["reviewer role authorization",reviewer.includes('requireReviewerSession(auth')||reviewer.includes('requireReviewerSession(request')],
["channel consent gate",reviewer.includes("CHANNEL_PREFERENCES_REQUIRED")],
["deduplication collision handling",reviewer.includes("DUPLICATE_COMMUNICATION")],
["WhatsApp urgent-only API gate",reviewer.includes("WHATSAPP_URGENT_ONLY")],
["SMS backup restriction",reviewer.includes("SMS_BACKUP_ONLY")],
["verified provider delivery event required",reviewer.includes("DELIVERY_RECEIPT_REQUIRED")],
["provider sending explicitly disabled",reviewer.includes("No provider sender is configured")],
["candidate UI distinguishes delivery states",ui.includes("sent does not mean delivered")],
["production readiness not overstated",candidate.includes("productionReady:false")&&reviewer.includes("productionReady:false")]
];
const failed=checks.filter(([,ok])=>!ok);
console.log(JSON.stringify({validator:"N09 Communications & Candidate Follow-up",passed:checks.length-failed.length,total:checks.length,checks:checks.map(([name,ok])=>({name,ok})),productionReady:false},null,2));
if(failed.length)process.exit(1);
