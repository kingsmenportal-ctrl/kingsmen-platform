import { DocumentPreflightPanel } from "../../../components/candidate/DocumentPreflightPanel";

export const metadata = {
  title: "Document Vault | Kingsmen Portal",
  description: "Review Kingsmen document handling requirements and locally check files before secure upload."
};

export default function CandidateDocumentsPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-3 rounded focus:outline-none focus:ring-2 focus:ring-amber-300">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-amber-200 to-amber-500 text-lg font-black text-slate-950">K</span>
            <span><strong className="block text-sm tracking-[0.18em]">KINGSMEN</strong><span className="mt-1 block text-xs text-slate-300">PRIVATE DOCUMENT VAULT</span></span>
          </a>
          <nav aria-label="Candidate navigation" className="flex flex-wrap items-center gap-4 text-sm text-slate-200">
            <a className="hover:text-amber-200" href="/candidate/dashboard">Dashboard</a>
            <a className="hover:text-amber-200" href="/candidate/workbench">Application workbench</a>
            <a className="hover:text-amber-200" href="/packages/">Packages</a>
          </nav>
        </div>
      </header>

      <section className="bg-slate-950 px-4 pb-10 pt-9 text-white sm:px-6 sm:pb-14 sm:pt-12">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-amber-300">Private candidate workspace</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-5xl">Your documents, handled carefully.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">Review file requirements and check a document locally before any upload flow. Upload acceptance, private storage, document verification and reviewer decisions must be confirmed by authenticated backend evidence; this screen does not claim a file was uploaded or verified.</p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full border border-slate-700 px-3 py-2 text-slate-200">PDF · JPEG · PNG</span>
            <span className="rounded-full border border-slate-700 px-3 py-2 text-slate-200">10 MiB maximum per file</span>
            <span className="rounded-full border border-slate-700 px-3 py-2 text-slate-200">Private access required</span>
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-7xl gap-7 px-4 py-8 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:py-10">
        <aside className="space-y-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-lg text-amber-300">⌑</span>
            <h2 className="mt-4 font-bold">Private storage</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Documents should use private object storage and short-lived signed upload/read links. Public file URLs are not a substitute.</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-lg text-amber-300">✓</span>
            <h2 className="mt-4 font-bold">Human review</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">OCR may assist extraction, but identity and document decisions require authorised human-review rules where applicable.</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-lg text-amber-300">≋</span>
            <h2 className="mt-4 font-bold">Evidence and history</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Status changes require an authenticated actor, evidence, timestamps and audit records. Candidates cannot mark their own files as verified.</p>
          </article>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="font-bold text-slate-950">Keep sensitive files private</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">Do not email identity documents to unofficial addresses or share signed file links publicly. Only use the upload flow once Kingsmen confirms private storage is enabled.</p>
          </div>
        </aside>

        <section className="space-y-5">
          <DocumentPreflightPanel />
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6" aria-labelledby="upload-runtime-boundary">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-amber-800">Upload runtime</p>
            <h2 id="upload-runtime-boundary" className="mt-2 text-xl font-bold text-slate-950">Private upload signing is not yet confirmed.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">The existing document upload URL route is an integration shell and does not return a live signed URL. This page therefore does not send file contents, store local copies, create document records or claim verification. Only the authorised backend can enable the real upload process.</p>
            <a href="/candidate/workbench" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2">Return to application workbench <span aria-hidden="true" className="ml-2">→</span></a>
          </section>
        </section>
      </div>

      <footer className="border-t border-slate-200 bg-white px-4 py-6 text-xs leading-5 text-slate-500 sm:px-6 lg:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:justify-between"><span>© Kingsmen Portal · South Africa</span><span>A browser preflight is not an upload receipt or a verification decision.</span></div></footer>
    </main>
  );
}
