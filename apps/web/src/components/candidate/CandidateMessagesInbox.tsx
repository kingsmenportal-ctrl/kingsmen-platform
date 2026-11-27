"use client";

import { useEffect, useState } from "react";
import { getCandidateSessionState } from "@/lib/candidate-session";

type PortalMessage = { portal_message_ref: string; title: string; body: string; message_type: string; created_at: string; read_at: string | null };
type Preferences = {
  transactional_email_enabled: boolean;
  marketing_email_enabled: boolean;
  sms_fallback_enabled: boolean;
  whatsapp_urgent_enabled: boolean;
  suppressed_at: string | null;
  suppression_reason: string | null;
};

const defaults: Preferences = {
  transactional_email_enabled: true,
  marketing_email_enabled: false,
  sms_fallback_enabled: false,
  whatsapp_urgent_enabled: false,
  suppressed_at: null,
  suppression_reason: null
};

export default function CandidateMessagesInbox() {
  const [messages, setMessages] = useState<PortalMessage[]>([]);
  const [preferences, setPreferences] = useState<Preferences>(defaults);
  const [loading, setLoading] = useState(true);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [error, setError] = useState("");
  const [preferenceNotice, setPreferenceNotice] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      const session = getCandidateSessionState();
      if (session.status !== "ready") {
        if (active) { setError("Sign in with your verified candidate account to view messages and communication preferences."); setLoading(false); }
        return;
      }
      const headers = { apikey: session.anonKey, Authorization: "Bearer " + session.token };
      try {
        const [messagesResponse, preferencesResponse] = await Promise.all([
          fetch(session.url + "/rest/v1/candidate_portal_messages?select=portal_message_ref,title,body,message_type,created_at,read_at&visible_to_candidate=eq.true&order=created_at.desc&limit=50", { headers, cache: "no-store" }),
          fetch(session.url + "/rest/v1/rpc/get_candidate_communication_preferences", {
            method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: "{}", cache: "no-store"
          })
        ]);
        if (!messagesResponse.ok) throw new Error(messagesResponse.status === 401 || messagesResponse.status === 403 ? "Your account is not authorised to view these messages." : "Messages are temporarily unavailable.");
        const messageResult = await messagesResponse.json() as PortalMessage[];
        if (active) setMessages(Array.isArray(messageResult) ? messageResult : []);
        if (preferencesResponse.ok) {
          const result = await preferencesResponse.json() as Partial<Preferences>;
          if (active) setPreferences({ ...defaults, ...result });
        } else if (active) {
          setPreferenceNotice("Communication preferences could not be loaded. Retry after the finance/security update is available.");
        }
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "Messages are temporarily unavailable.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  async function savePreferences(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingPreferences(true);
    setPreferenceNotice("");
    setError("");
    const session = getCandidateSessionState();
    if (session.status !== "ready") {
      setError("Sign in again before saving communication preferences.");
      setSavingPreferences(false);
      return;
    }
    try {
      const response = await fetch(session.url + "/rest/v1/rpc/update_candidate_communication_preferences", {
        method: "POST",
        headers: { apikey: session.anonKey, Authorization: "Bearer " + session.token, "Content-Type": "application/json" },
        body: JSON.stringify({
          p_transactional_email_enabled: preferences.transactional_email_enabled,
          p_marketing_email_enabled: preferences.marketing_email_enabled,
          p_sms_fallback_enabled: preferences.sms_fallback_enabled,
          p_whatsapp_urgent_enabled: preferences.whatsapp_urgent_enabled
        }),
        cache: "no-store"
      });
      const result = await response.json().catch(() => ({})) as { preferences?: Preferences; code?: string };
      if (!response.ok) {
        if (result.code === "EMAIL_PROVIDER_SUPPRESSED") throw new Error("This email address is suppressed after a provider bounce or complaint. Contact support to resolve the suppression before re-enabling email.");
        throw new Error("Communication preferences were not saved. Verify your account and retry.");
      }
      if (result.preferences) setPreferences({ ...defaults, ...result.preferences });
      setPreferenceNotice("Your communication preferences were saved and audited. Provider delivery remains a separate status.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Communication preferences were not saved.");
    } finally {
      setSavingPreferences(false);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" aria-labelledby="candidate-message-history">
      <h2 id="candidate-message-history" className="text-xl font-bold">Your portal message history</h2>
      <p className="mt-2 text-sm text-slate-600">Messages are shown only when persisted to your authenticated portal inbox. Queued email is not reported as delivered here.</p>
      {loading ? <p className="mt-4 text-sm text-slate-600">Loading messages…</p> : null}
      {error ? <p role="alert" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">{error}</p> : null}
      {!loading && !error && messages.length === 0 ? <p className="mt-4 text-sm text-slate-600">No portal messages are available.</p> : null}
      <ul className="mt-4 space-y-3">{messages.map(message => (
        <li key={message.portal_message_ref} className="rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold">{message.title}</h3><span className="text-xs text-slate-500">{new Date(message.created_at).toLocaleString("en-ZA")}</span></div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{message.body}</p>
          <p className="mt-2 text-xs text-slate-500">{message.message_type.replaceAll("_", " ")} · {message.read_at ? "Read" : "Unread"}</p>
        </li>
      ))}</ul>

      <form onSubmit={savePreferences} className="mt-7 border-t border-slate-200 pt-5" aria-labelledby="communication-preferences">
        <h2 id="communication-preferences" className="text-lg font-bold">Communication preferences</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">Preferences are stored against your verified candidate identity. Turning off email keeps status available in the portal; it does not change applications, payments or decisions.</p>
        {preferences.suppressed_at ? <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">Email is provider-suppressed ({preferences.suppression_reason || "provider event"}). Contact support to resolve this; this setting cannot bypass a bounce or complaint.</p> : null}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 text-sm">
            <input type="checkbox" checked={preferences.transactional_email_enabled} disabled={Boolean(preferences.suppressed_at)} onChange={e => setPreferences(p => ({ ...p, transactional_email_enabled: e.target.checked }))} className="mt-1" />
            <span><strong className="block">Transactional email</strong><span className="mt-1 block text-slate-600">Document, payment and application updates.</span></span>
          </label>
          <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 text-sm">
            <input type="checkbox" checked={preferences.marketing_email_enabled} onChange={e => setPreferences(p => ({ ...p, marketing_email_enabled: e.target.checked }))} className="mt-1" />
            <span><strong className="block">Optional updates</strong><span className="mt-1 block text-slate-600">Non-essential product or service announcements.</span></span>
          </label>
          <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 text-sm">
            <input type="checkbox" checked={preferences.sms_fallback_enabled} onChange={e => setPreferences(p => ({ ...p, sms_fallback_enabled: e.target.checked }))} className="mt-1" />
            <span><strong className="block">SMS fallback</strong><span className="mt-1 block text-slate-600">Only for approved fallback cases; production SMS remains disabled.</span></span>
          </label>
          <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 text-sm">
            <input type="checkbox" checked={preferences.whatsapp_urgent_enabled} onChange={e => setPreferences(p => ({ ...p, whatsapp_urgent_enabled: e.target.checked }))} className="mt-1" />
            <span><strong className="block">Urgent WhatsApp preference</strong><span className="mt-1 block text-slate-600">Preference only; every use remains urgent-only and human-approved.</span></span>
          </label>
        </div>
        <button type="submit" disabled={savingPreferences || loading} className="mt-4 rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{savingPreferences ? "Saving…" : "Save communication preferences"}</button>
        {preferenceNotice ? <p role="status" className="mt-3 text-sm text-emerald-800">{preferenceNotice}</p> : null}
      </form>
    </section>
  );
}
