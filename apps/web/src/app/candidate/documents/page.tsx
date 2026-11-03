export default function CandidateDocumentsPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
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

      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-white shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-300">Candidate workspace</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Your documents, handled carefully.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">The Document Vault is intended for private application-supporting files. Upload, review and status changes must be authenticated and recorded by the backend; this page does not claim that a file has been uploaded or verified.</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full border border-slate-700 px-3 py-2 text-slate-200">PDF · JPEG · PNG</span>
            <span className="rounded-full border border-slate-700 px-3 py-2 text-slate-200">10 MiB maximum per file</span>
            <span className="rounded-full border border-slate-700 px-3 py-2 text-slate-200">Private access required</span>
          </div>
        </div>

        <section className="mt-7 grid gap-4 md:grid-cols-3" aria-label="Document handling principles">
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-lg text-amber-300">⌑</span>
            <h2 className="mt-4 font-bold">Private storage</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Files should use private storage and short-lived signed upload/read links. Public file URLs are not an acceptable substitute.</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-lg text-amber-300">✓</span>
            <h2 className="mt-4 font-bold">Human review</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Automated extraction may assist a review. It must not silently make final identity or document decisions.</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-lg text-amber-300">≋</span>
            <h2 className="mt-4 font-bold">Evidence and history</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Review decisions and status changes require authorised actions, evidence, timestamps and audit records.</p>
          </article>
        </section>

        <section className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-6" aria-labelledby="upload-status">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-800">Upload status</p>
          <h2 id="upload-status" className="mt-2 text-xl font-bold">Secure upload must be connected before files can be accepted.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">This screen currently provides document requirements and safety guidance. It does not submit or retain a file. Do not enter or attach identity documents until the authenticated upload flow confirms that the file is being sent to private storage.</p>
          <a href="/candidate/workbench" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2">Return to application workbench <span aria-hidden="true" className="ml-2">→</span></a>
        </section>

        <footer className="mt-8 border-t border-slate-200 py-5 text-xs leading-5 text-slate-500">Kingsmen Portal · Never share document links publicly. A document is not verified until an authorised review is recorded.</footer>
      </div>
    </main>
  );
}
