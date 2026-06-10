export function SmartMobileIntakePanel() {
  const questions = [
    ["Full names", "Confirm extracted value"],
    ["ID number", "Confirm extracted value"],
    ["Phone", "Missing field"],
    ["Highest grade", "Low confidence from document"]
  ];

  return (
    <section className="rounded-3xl border border-white/10 bg-white p-5 text-slate-950">
      <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Smart form</p>
      <h2 className="mt-2 text-2xl font-black">No retyping what is already in the CV</h2>
      <div className="mt-5 divide-y divide-slate-200 rounded-2xl border border-slate-200">
        {questions.map(([field, reason]) => (
          <div key={field} className="flex items-center justify-between p-3">
            <span className="font-semibold">{field}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs">{reason}</span>
          </div>
        ))}
      </div>
    </section>
  );
}