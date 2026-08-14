export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center px-6 py-16">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300">
            Personal Finance, Simplified
          </span>

          <h1 className="mt-6 text-5xl font-bold tracking-tight sm:text-7xl">
            Take control of your money.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
            Finora helps you track income, expenses, budgets, savings goals,
            and recurring payments in one simple dashboard.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="/login"
              className="rounded-xl bg-white px-6 py-3 font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Get Started
            </a>

            <a
              href="#features"
              className="rounded-xl border border-slate-700 px-6 py-3 font-semibold text-white transition hover:bg-slate-900"
            >
              Explore Features
            </a>
          </div>
        </div>
      </div>

      <section id="features" className="border-t border-slate-800">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-20 md:grid-cols-3">
          {[
            {
              title: "Track spending",
              text: "Record income and expenses and understand where your money goes.",
            },
            {
              title: "Set budgets",
              text: "Create monthly budgets and keep an eye on your spending.",
            },
            {
              title: "Reach your goals",
              text: "Track savings targets and see your progress over time.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
            >
              <h2 className="text-xl font-semibold">{feature.title}</h2>
              <p className="mt-3 leading-7 text-slate-400">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}