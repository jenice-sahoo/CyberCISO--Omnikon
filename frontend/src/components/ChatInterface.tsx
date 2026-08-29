/* ==========================================================
   MAIN CHAT UI  (this is what renders the 2nd screenshot)
   ========================================================== */

return (
  <div className="min-h-screen bg-[#05040b] text-white">
    {/* Background glows + grid */}
    <div className="pointer-events-none fixed inset-0">
      <div className="absolute left-[30%] top-[-250px] h-[600px] w-[700px] rounded-full bg-violet-700/[0.08] blur-[180px]" />
      <div className="absolute right-[-200px] top-[35%] h-[500px] w-[500px] rounded-full bg-blue-700/[0.05] blur-[170px]" />
    </div>
    <div
      className="pointer-events-none fixed inset-0 opacity-[0.025]"
      style={{
        backgroundImage:
          'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }}
    />

    <div className="relative z-10">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#07060d]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 shadow-lg shadow-violet-500/20">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold">CyberCISO</div>
              <div className="text-[8px] uppercase tracking-[0.18em] text-gray-600">
                AI security advisor
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-violet-400/10 bg-violet-500/[0.06] px-3 py-1.5 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
              <span className="text-[10px] text-violet-300">{businessName}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-gray-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Secure
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="mx-auto max-w-6xl px-5 py-8">
        {/* TITLE + progress */}
        <div className="mb-7">
          <div className="mb-2 flex items-center gap-2 text-[9px] uppercase tracking-[0.25em] text-violet-400/70">
            <Activity className="h-3.5 w-3.5" />
            Adaptive security interview
          </div>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Security assessment
                <span className="text-violet-400">.</span>
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600">
                Tell CyberCISO about your security setup and we&apos;ll build your
                personalized security posture.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-gray-600">
              <BarChart3 className="h-3.5 w-3.5 text-violet-400" />
              {progress}% complete
            </div>
          </div>
        </div>

        {/* Two-column layout (chat left + overview sidebar right) */}
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* LEFT – chat */}
          <div className="flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.02]">
            {/* messages list + input form live here */}
            …
          </div>

          {/* RIGHT – Assessment overview (exactly what you see in the 2nd image) */}
          <aside className="space-y-5">
            {/* Assessment overview card */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-300">
                  Assessment overview
                </span>
                <span className="text-[10px] text-violet-300">{progress}%</span>
              </div>

              {/* progress bar */}
              <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* domain list */}
              <div className="space-y-2">
                {SECURITY_DOMAINS.map((domain) => {
                  const Icon = domain.icon;
                  return (
                    <div
                      key={domain.key}
                      className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-black/10 px-3 py-2.5"
                    >
                      <Icon className="h-3.5 w-3.5 text-violet-400" />
                      <span className="text-[10px] text-gray-500">
                        {domain.label}
                      </span>
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-400/60" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Framework coverage card */}
            <div className="rounded-2xl border border-emerald-400/[0.08] bg-emerald-500/[0.025] p-5">
              <div className="mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-medium text-gray-300">
                  Framework coverage
                </span>
              </div>
              <p className="text-[9px] text-gray-600">Assessment standards</p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-black/10 px-3 py-2">
                  <span className="text-[10px] text-gray-500">NIST CSF 2.0</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-black/10 px-3 py-2">
                  <span className="text-[10px] text-gray-500">CIS Controls v8</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                </div>
              </div>
            </div>

            <Link
              href="/"
              className="flex items-center justify-center gap-2 rounded-xl border border-violet-400/10 bg-violet-500/[0.06] px-4 py-3 text-xs text-violet-300 transition hover:bg-violet-500/[0.1]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Start a new assessment
            </Link>
          </aside>
        </div>
      </main>
    </div>
  </div>
);
