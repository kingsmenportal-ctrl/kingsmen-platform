"use client";

import { useEffect, useState } from "react";

type Ticket = {
  ticketRef: string; category: string; priority: string; status: string;
  title: string; createdAt: string; updatedAt: string; closedAt: string | null;
};
type TicketState = { loading: boolean; error: string | null; tickets: Ticket[] };

export default function CandidateSupportPage() {
  const [state, setState] = useState<TicketState>({ loading: true, error: null, tickets: [] });

  async function refreshTickets() {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const response = await fetch("/api/candidate/support-tickets", { cache: "no-store" });
      const payload = await response.json().catch(() => ({})) as { ok?: boolean; tickets?: Ticket[]; error?: string };
      if (!response.ok || payload.ok !== true || !Array.isArray(payload.tickets)) {
        setState({ loading: false, error: payload.error ?? "Support ticket status is unavailable right now.", tickets: [] });
        return;
      }
      setState({ loading: false, error: null, tickets: payload.tickets });
    } catch {
      setState({ loading: false, error: "Support tickets could not be loaded. Please try again.", tickets: [] });
    }
  }

  useEffect(() => { void refreshTickets(); }, []);

  return (
    <main>
      <h1>Kingsmen Support Centre</h1>
      <p>Use this page for help requests, manual assistance, deadline risk, portal blockers, and tribunal escalations.</p>

      <section aria-labelledby="support-tickets-heading">
        <h2 id="support-tickets-heading">Your support tickets</h2>
        <p>Ticket status is read from the portal. This page does not create, edit, or close tickets.</p>
        <button type="button" onClick={() => void refreshTickets()} disabled={state.loading}>
          {state.loading ? "Refreshing…" : "Refresh tickets"}
        </button>
        {state.loading && <p role="status">Loading your support tickets…</p>}
        {state.error && <p role="alert">{state.error}</p>}
        {!state.loading && !state.error && state.tickets.length === 0 && <p>No support tickets are currently linked to your account.</p>}
        {state.tickets.length > 0 && (
          <div className="overflow-x-auto">
            <table>
              <thead><tr><th scope="col">Reference</th><th scope="col">Title</th><th scope="col">Category</th><th scope="col">Priority</th><th scope="col">Status</th><th scope="col">Last updated</th></tr></thead>
              <tbody>
                {state.tickets.map((ticket) => (
                  <tr key={ticket.ticketRef}>
                    <td>{ticket.ticketRef}</td><td>{ticket.title}</td><td>{ticket.category}</td>
                    <td>{ticket.priority}</td><td>{ticket.status}</td>
                    <td>{new Date(ticket.updatedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-label="Support Boundary">
        <article>
          <h2>Help Requests</h2>
          <p>Routine support is email-first and copied into the portal. Ticket creation and replies are not connected on this page.</p>
        </article>
        <article>
          <h2>Manual Assistance</h2>
          <p>Portal blockers, CAPTCHA/OTP, portal down, and source uncertainty trigger manual assistance or MAP fallback.</p>
        </article>
        <article>
          <h2>Tribunal Intake</h2>
          <p>Disputes require audit, evidence, and founder/operator review.</p>
        </article>
      </section>
    </main>
  );
}
