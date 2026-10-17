"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getKingsmenSession, signOutKingsmen } from "../../../lib/supabase-browser-auth";

type Row = Record<string, unknown> & { id: string };
type Queue = { ok: boolean; error?: string; notifications: Row[]; deliveryAttempts: Row[]; deadLetters: Row[]; integrationDeadLetters: Row[]; pendingApprovals: Row[]; pendingPolicyExceptions: Row[]; recentAudit: Row[]; generatedAt?: string };
const panel: React.CSSProperties = { marginTop: 18, padding: 16, border: "1px solid #39445e", borderRadius: 12, background: "#0b1222" };
const card: React.CSSProperties = { padding: 12, border: "1px solid #39445e", borderRadius: 8, overflowWrap: "anywhere" };
const field: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: 10, borderRadius: 8, border: "1px solid #39445e", background: "#0f172a", color: "#fff" };
const str = (row: Row, key: string) => row[key] == null || row[key] === "" ? "—" : String(row[key]);

export default function FounderOperationsPage() {
  const [queue, setQueue] = useState<Queue>({ ok: true, notifications: [], deliveryAttempts: [], deadLetters: [], integrationDeadLetters: [], pendingApprovals: [], pendingPolicyExceptions: [], recentAudit: [] });
  const [notes, setNotes] = useState<Record<string,string>>({});
  const [notice, setNotice] = useState("Loading operations queues…");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    const session = await getKingsmenSession();
    if (!session) { setNotice("Sign in with an authorised founder/operator account to view operations queues."); return; }
    const response = await fetch("/api/founder/operations", { headers: { authorization: `Bearer ${session.access_token}` }, cache: "no-store" });
    const data = await response.json() as Queue;
    if (!response.ok || !data.ok) throw new Error(data.error || "Operations queues could not be loaded.");
    setQueue(data); setNotice("");
  }, []);
  useEffect(() => { void load().catch(e => setNotice(e instanceof Error ? e.message : "Operations queues could not be loaded.")); }, [load]);

  async function act(action: string, id: string, decision?: string) {
    const key = `${action}:${id}`;
    const note = notes[key]?.trim() || "";
    if (note.length < 8) { setNotice("Enter a reason of at least eight characters before changing queue state."); return; }
    setBusy(key); setNotice("");
    try {
      const session = await getKingsmenSession();
      if (!session) throw new Error("Sign in again before making an operations change.");
      const payload = action === "REQUEUE_NOTIFICATION"
        ? { action, notificationId: id, notes: note }
        : { action, deadLetterId: id, decision, notes: note };
      const response = await fetch("/api/founder/operations", { method: "POST", headers: { authorization: `Bearer ${session.access_token}`, "content-type": "application/json" }, body: JSON.stringify(payload), cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Operations action failed.");
      setNotice(result.message || "Operations action committed and audited."); await load();
    } catch (e) { setNotice(e instanceof Error ? e.message : "Operations action failed."); }
    finally { setBusy(""); }
  }

  const noteField = (key: string, placeholder: string) => <label style={label}>Operator rationale<textarea rows={2} maxLength={2000} style={field} value={notes[key] || ""} onChange={e => setNotes(current => ({ ...current, [key]: e.target.value }))} placeholder={placeholder} /></label>;

  return <main style={{ maxWidth: 1150, margin: "0 auto", padding: 24, color: "#f4f6ff", fontFamily: "system-ui, sans-serif" }}>
    <p><Link href="/workspace">← Operations workspace</Link> · <Link href="/founder/finance">Finance exceptions</Link> · <Link href="/founder/identity-link-queue">Identity review</Link></p>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}><h1>Founder operations and exception handling</h1><button onClick={async () => { await signOutKingsmen(); window.location.assign("/auth/login"); }}>Sign out</button></div>
    <p>Queue state comes from persisted outboxes and exception tables. Requeueing does not claim delivery; provider acknowledgements and delivery attempts remain the source of truth. Approval and policy exception items are visible here but must use their dedicated approval workflows.</p>
    {notice && <p role="status" style={{ padding: 12, background: "#172554", borderRadius: 8 }}>{notice}</p>}
    {queue.generatedAt && <small>Snapshot {new Date(queue.generatedAt).toLocaleString()}</small>}

    <section style={panel}><h2>Notification outbox ({queue.notifications.length})</h2>{queue.notifications.length === 0 && !notice && <p>No queued, failed, or stale-sending notifications in this snapshot.</p>}<div style={grid}>{queue.notifications.map(row => { const key = `REQUEUE_NOTIFICATION:${row.id}`; return <article key={row.id} style={card}><strong>{str(row,"notification_ref")} · {str(row,"status")}</strong><p>{str(row,"template_key")} · {str(row,"channel")} · {str(row,"urgency")}</p><p>{str(row,"subject")}</p><p>Candidate ref {str(row,"candidate_ref")} · Application {str(row,"application_ref")}</p><p>Scheduled {str(row,"scheduled_for")} · Failed {str(row,"failed_at")}</p>{row.last_error && <p>Last error: {str(row,"last_error")}</p>}<small>Idempotency key: {str(row,"idempotency_key")}</small>{noteField(key,"Why is retry appropriate? Confirm provider status first.")}<button disabled={busy===key} onClick={() => void act("REQUEUE_NOTIFICATION",row.id)}>{busy===key ? "Requeueing…" : "Requeue notification"}</button></article>; })}</div></section>

    <section style={panel}><h2>Dead-letter queue ({queue.deadLetters.length})</h2>{queue.deadLetters.length === 0 && !notice && <p>No open dead-letter records.</p>}<div style={grid}>{queue.deadLetters.map(row => { const resolveKey = `RESOLVE_DEAD_LETTER:${row.id}`; const ignoreKey = `IGNORE_DEAD_LETTER:${row.id}`; return <article key={row.id} style={card}><strong>{str(row,"source")} · {str(row,"status")}</strong><p>{str(row,"error_code")}: {str(row,"error_message")}</p><p>Correlation {str(row,"correlation_id")} · Retries {str(row,"retry_count")}</p><small>{str(row,"created_at")}</small>{noteField(resolveKey,"Explain the fix and evidence for resolution.")}<div style={actions}><button disabled={busy===resolveKey} onClick={() => void act("RESOLVE_DEAD_LETTER",row.id,"RESOLVED")}>Resolve</button><button disabled={busy===ignoreKey} onClick={() => void act("IGNORE_DEAD_LETTER",row.id,"IGNORED")}>Ignore with rationale</button></div></article>; })}</div></section>

    <section style={panel}><h2>Integration dead letters ({queue.integrationDeadLetters.length})</h2>{queue.integrationDeadLetters.length ? <div style={grid}>{queue.integrationDeadLetters.map(row => <article key={row.id} style={card}><strong>{str(row,"dlq_ref")} · {str(row,"severity")} · {str(row,"status")}</strong><p>{str(row,"connector_key")} · {str(row,"source_type")} · {str(row,"source_ref")}</p><p>{str(row,"cause")}: {str(row,"reason")}</p><p>Fix path: {str(row,"fix_path")}</p></article>)}</div> : <p>No integration dead letters in the current snapshot.</p>}</section>

    <section style={panel}><h2>Pending control-plane approvals ({queue.pendingApprovals.length})</h2>{queue.pendingApprovals.length ? <div style={grid}>{queue.pendingApprovals.map(row => <article key={row.id} style={card}><strong>{str(row,"approval_ref")} · {str(row,"risk_level")}</strong><p>{str(row,"approval_type")} · {str(row,"target_type")} {str(row,"target_ref")}</p><p>{str(row,"summary")}</p><small>Requested {str(row,"created_at")} · Operator {str(row,"requested_by_operator_ref")}</small></article>)}</div> : <p>No pending approval rows visible in this snapshot.</p>}</section>

    <section style={panel}><h2>Policy exceptions awaiting review ({queue.pendingPolicyExceptions.length})</h2>{queue.pendingPolicyExceptions.length ? <div style={grid}>{queue.pendingPolicyExceptions.map(row => <article key={row.id} style={card}><strong>{str(row,"exception_ref")} · {str(row,"exception_status")}</strong><p>Policy {str(row,"policy_ref")} · Expires {str(row,"expiry_at")}</p><p>{str(row,"exception_reason")}</p></article>)}</div> : <p>No pending policy exception rows visible.</p>}</section>

    <section style={panel}><h2>Recent founder operations audit ({queue.recentAudit.length})</h2>{queue.recentAudit.length ? <div style={grid}>{queue.recentAudit.map(row => <article key={row.id} style={card}><strong>{str(row,"action_key")} · {str(row,"severity")}</strong><p>{str(row,"audit_message")}</p><p>Target {str(row,"target_ref")} · Actor {str(row,"actor_ref")}</p><small>{str(row,"created_at")} · {str(row,"audit_ref")}</small></article>)}</div> : <p>No founder operations audit rows yet.</p>}</section>
  </main>;
}
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 10 };
const label: React.CSSProperties = { display: "grid", gap: 6, margin: "10px 0" };
const actions: React.CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 };
