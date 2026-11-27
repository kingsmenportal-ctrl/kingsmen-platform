import CandidateMessagesInbox from "@/components/candidate/CandidateMessagesInbox";

export default function CandidateMessagesPage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-10 text-slate-950 sm:px-6">
      <header>
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-700">Kingsmen communications</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Messages</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Email is the primary tracked channel. The portal inbox is the authenticated status and message-history view. WhatsApp is urgent-only; SMS is an approved fallback only.</p>
      </header>
      <CandidateMessagesInbox />
    </main>
  );
}
