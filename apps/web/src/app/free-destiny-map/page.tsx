import { FreeDestinyMapApiForm } from "../../components/kingsmen/FreeDestinyMapApiForm";

const corePathways = [
  ["01", "Higher Education", "Universities, Universities of Technology and CAO programme choices."],
  ["02", "TVET", "Vocational and technical learning, including public college routes."],
  ["03", "SETA programmes & learnerships", "Skills programmes, learnerships and workplace learning."],
  ["04", "Internships", "Work experience and structured early-career opportunities."],
  ["05", "Apprenticeships", "Trade routes and practical occupational training."],
  ["06", "Employment", "Vacancy discovery, CV preparation and employer application routes."]
] as const;

export const metadata = {
  title: "Free Destiny Map | Kingsmen Portal",
  description: "Start a South African education, training or employment route map with Kingsmen."
};

export default function FreeDestinyMapPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-3 rounded focus:outline-none focus:ring-2 focus:ring-amber-300">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-amber-200 to-amber-500 text-lg font-black text-slate-950">K</span>
            <span><strong className="block text-sm tracking-[0.18em]">KINGSMEN</strong><span className="mt-1 block text-xs text-slate-300">FREE DESTINY MAP</span></span>
          </a>
          <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-4 text-sm text-slate-200">
            <a className="hover:text-amber-200" href="/">Home</a>
            <a className="hover:text-amber-200" href="/packages/">Packages</a>
            <a className="hover:text-amber-200" href="/candidate/dashboard">Candidate dashboard</a>
          </nav>
        </div>
      </header>

      <section className="bg-slate-950 px-4 pb-12 pt-10 text-white sm:px-6 sm:pb-16 sm:pt-14">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-amber-300">South Africa · Free starting point</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">Map the next step. Keep every pathway open.</h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">Describe your current stage, route interests and support needs. Kingsmen can use that intent to plan the next steps across education, skills, work and related support.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#intake" className="inline-flex min-h-11 items-center rounded-xl bg-amber-300 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-slate-950">Start the map <span aria-hidden="true" className="ml-2">↓</span></a>
              <a href="/packages/" className="inline-flex min-h-11 items-center rounded-xl border border-slate-600 px-5 py-3 text-sm font-semibold text-white hover:border-amber-300 hover:text-amber-200">Compare service plans</a>
            </div>
            <p className="mt-5 max-w-2xl text-xs leading-5 text-slate-400">The Free Destiny Map is for route discovery. It does not create a paid order or submit an official application, and it does not guarantee an admission, bursary, placement or job.</p>
          </div>
          <aside className="rounded-3xl border border-slate-700 bg-slate-900/70 p-5 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">The Kingsmen route map</p>
            <h2 className="mt-3 text-2xl font-bold">Six core pathways</h2>
            <div className="mt-4 divide-y divide-slate-700">
              {corePathways.map(([number, title, description]) => (
                <div key={number} className="flex gap-4 py-4">
                  <span className="pt-1 text-xs font-black text-amber-300">{number}</span>
                  <div><h3 className="font-semibold text-white">{title}</h3><p className="mt-1 text-sm leading-5 text-slate-400">{description}</p></div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-start lg:py-14">
        <aside className="space-y-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-700">Before you begin</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight">Start with intent, not paperwork.</h2>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold">You will not need payment details</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">The map is a separate R0 starting point. Paid service plans affect application volume and managed-route capacity—not access to the six pathways.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold">Keep sensitive documents out of this form</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Do not enter official ID/passport numbers, account passwords, card data or document contents. Use the authenticated Document Vault only when its secure upload connection is confirmed.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold">Verify before applying</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Directory listings and candidate interests are not proof that an opportunity is open. Deadline, eligibility and provider receipt require their own evidence.</p>
          </div>
        </aside>
        <FreeDestinyMapApiForm />
      </section>

      <footer className="border-t border-slate-200 bg-white px-4 py-6 text-xs leading-5 text-slate-500 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:justify-between"><span>© Kingsmen Portal · South Africa</span><span>Public route mapping only · No official application submitted</span></div>
      </footer>
    </main>
  );
}
