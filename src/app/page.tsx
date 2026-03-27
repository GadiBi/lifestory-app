import Link from 'next/link';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect('/welcome');

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100/80">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">Besties</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">Features</a>
            <a href="#how" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">How it works</a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="hidden sm:block text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-4 py-2 rounded-full hover:bg-slate-100">
              Sign in
            </Link>
            <Link href="/signup" className="text-sm font-semibold px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full transition-all shadow-sm hover:shadow-md">
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="pt-28 sm:pt-36 pb-16 sm:pb-28 px-5 sm:px-8 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-primary/8 to-transparent rounded-full blur-3xl -z-10" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-violet-400/6 rounded-full blur-3xl -z-10" />

        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto mb-14 sm:mb-20">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-sm font-medium text-primary mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              AI-powered life story platform
            </div>

            {/* Headline */}
            <h1 className="text-[clamp(2.8rem,8vw,6rem)] font-black tracking-tighter text-slate-900 leading-[1.0] mb-6 sm:mb-8">
              Your memories
              <br />
              <span className="bg-gradient-to-r from-primary via-violet-500 to-primary bg-[length:200%_auto] bg-clip-text text-transparent">
                deserve to live
              </span>
              <br />
              forever.
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto mb-10 font-normal">
              Talk to an AI biographer that listens, remembers, and transforms your conversations
              into a beautiful life story — preserved for the people who matter most.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-10">
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white text-base font-semibold rounded-full transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Start your story — it&apos;s free
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 text-base font-semibold rounded-full border border-slate-200 hover:border-slate-300 transition-all"
              >
                Continue my story
              </Link>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-8 text-sm text-slate-400">
              {['Free to start', 'No credit card required', '100% private & secure'].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Product Preview */}
          <div className="relative max-w-4xl mx-auto px-2 sm:px-0">
            {/* Glow under card */}
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/15 via-violet-400/15 to-primary/15 rounded-[2.5rem] blur-2xl -z-10" />

            {/* Chat window */}
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
              {/* Window chrome */}
              <div className="bg-slate-50/80 px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                  </div>
                  <span className="text-xs font-medium text-slate-400 ml-1">Bestie AI · Early Childhood</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-medium text-emerald-600">Online</span>
                </div>
              </div>

              {/* Messages */}
              <div className="p-5 sm:p-8 space-y-4 bg-gradient-to-b from-slate-50/40 to-white">
                {/* AI */}
                <div className="flex gap-3 items-end">
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm mb-0.5">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-slate-100 max-w-sm">
                    <p className="text-sm text-slate-700 leading-relaxed">Tell me about your earliest childhood memory. Where did you grow up, and what made that time feel magical?</p>
                  </div>
                </div>

                {/* User */}
                <div className="flex gap-3 items-end justify-end">
                  <div className="bg-primary/10 rounded-2xl rounded-br-md px-4 py-3 max-w-sm sm:max-w-md">
                    <p className="text-sm text-primary leading-relaxed font-medium">I grew up in Haifa, on the Carmel mountain. We had a small garden and my grandmother made fresh challah every Friday. The smell still takes me back instantly...</p>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0 text-xs font-bold text-slate-500 mb-0.5">Y</div>
                </div>

                {/* AI reply + memory card */}
                <div className="flex gap-3 items-end">
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm mb-0.5">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="space-y-2 max-w-sm sm:max-w-md">
                    <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-slate-100">
                      <p className="text-sm text-slate-700 leading-relaxed">That sounds so beautifully rooted — the Carmel mountain, the garden, the ritual of Friday challah. Your grandmother sounds like she was the warmth at the center of everything. ✨</p>
                    </div>
                    {/* Memory saved indicator */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl px-4 py-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-amber-700">Memory saved to your timeline</p>
                        <p className="text-xs text-amber-600/80 mt-0.5">Growing up in Haifa · Early Childhood · 1970s</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating timeline card */}
            <div className="absolute -right-3 sm:-right-14 top-[15%] bg-white rounded-2xl shadow-xl border border-slate-100 p-4 w-44 animate-float hidden sm:block">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Timeline</p>
              <div className="space-y-2.5">
                {[
                  { dot: 'bg-pink-400', label: 'Born in Tel Aviv', year: '1965' },
                  { dot: 'bg-amber-400', label: 'Childhood, Haifa', year: '1970' },
                  { dot: 'bg-emerald-400', label: 'First day of school', year: '1972' },
                ].map((item) => (
                  <div key={item.year} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.dot} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-slate-700 truncate">{item.label}</p>
                      <p className="text-[10px] text-slate-400">{item.year}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating stats card */}
            <div className="absolute -left-3 sm:-left-14 bottom-[15%] bg-white rounded-2xl shadow-xl border border-slate-100 p-4 animate-float-delayed hidden sm:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">47 memories</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">extracted & saved</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BENTO FEATURES ──────────────────────────────────────────────────── */}
      <section id="features" className="py-24 sm:py-32 px-5 sm:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14 sm:mb-20">
            <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-3">Features</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tighter text-slate-900 mb-5">
              Everything your story needs
            </h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
              A complete platform for capturing, organizing, and sharing a lifetime of memories.
            </p>
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* CARD: AI Chat — spans 2 cols */}
            <div className="sm:col-span-2 bg-gradient-to-br from-primary/8 via-violet-50/60 to-white rounded-3xl p-8 sm:p-10 border border-primary/12 hover:shadow-xl transition-all duration-500 group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/6 to-transparent rounded-full translate-x-20 -translate-y-20" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-slate-900 mb-3">AI that truly listens</h3>
                <p className="text-slate-600 leading-relaxed mb-6 max-w-md">
                  Our AI biographer asks thoughtful, contextual questions and remembers everything. Each conversation builds on the last, going deeper into your story.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Remembers context', 'Asks follow-ups', 'Speaks your language', 'Available 24/7'].map((tag) => (
                    <span key={tag} className="px-3 py-1.5 bg-white/70 rounded-full text-xs font-medium text-slate-600 border border-slate-200/60 shadow-sm">{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* CARD: Timeline */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 rounded-3xl p-8 border border-amber-100 hover:shadow-xl transition-all duration-500 group">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-3">Your life in a timeline</h3>
              <p className="text-slate-600 leading-relaxed text-sm mb-6">Every memory is automatically organized chronologically — from your earliest days to today.</p>
              <div className="space-y-2.5">
                {[
                  { color: 'bg-pink-400', label: 'Early Childhood', pct: 32 },
                  { color: 'bg-amber-400', label: 'Teenage Years', pct: 56 },
                  { color: 'bg-emerald-400', label: 'Young Adult', pct: 84 },
                  { color: 'bg-blue-400', label: 'Middle Years', pct: 44 },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full ${item.color} shrink-0`} />
                    <div className="flex-1 h-1.5 bg-white/60 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} opacity-70 rounded-full`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CARD: Share */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/60 rounded-3xl p-8 border border-emerald-100 hover:shadow-xl transition-all duration-500 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-3">Share with loved ones</h3>
              <p className="text-slate-600 leading-relaxed text-sm mb-6">Create a private shareable link so your family can read your story — with optional password protection and expiry dates.</p>
              <div className="flex -space-x-2.5">
                {[
                  { letter: 'D', bg: 'bg-rose-400' },
                  { letter: 'M', bg: 'bg-violet-400' },
                  { letter: 'A', bg: 'bg-amber-400' },
                  { letter: 'R', bg: 'bg-emerald-400' },
                  { letter: 'S', bg: 'bg-sky-400' },
                ].map((av) => (
                  <div key={av.letter} className={`w-9 h-9 rounded-full ${av.bg} border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                    {av.letter}
                  </div>
                ))}
                <div className="w-9 h-9 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-slate-500 text-xs font-semibold">+</div>
              </div>
            </div>

            {/* CARD: Life Script */}
            <div className="bg-gradient-to-br from-violet-50 to-purple-50/60 rounded-3xl p-8 border border-violet-100 hover:shadow-xl transition-all duration-500 group">
              <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-3">Generate your Life Script</h3>
              <p className="text-slate-600 leading-relaxed text-sm mb-6">Turn your timeline into a beautifully written biography. Export as PDF, print, or share online with family.</p>
              <div className="space-y-1.5">
                <div className="h-2 bg-violet-200/70 rounded-full w-4/5" />
                <div className="h-2 bg-violet-100/80 rounded-full w-full" />
                <div className="h-2 bg-violet-100/80 rounded-full w-11/12" />
                <div className="h-2 bg-violet-200/70 rounded-full w-3/4 mt-3" />
                <div className="h-2 bg-violet-100/80 rounded-full w-full" />
                <div className="h-2 bg-violet-100/80 rounded-full w-4/5" />
              </div>
            </div>

            {/* CARD: Languages — spans 2 cols on large */}
            <div className="sm:col-span-2 lg:col-span-1 bg-gradient-to-br from-sky-50 to-blue-50/60 rounded-3xl p-8 border border-sky-100 hover:shadow-xl transition-all duration-500 group">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
              <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-3">Tell it in your language</h3>
              <p className="text-slate-600 leading-relaxed text-sm mb-5">Hebrew, English, Russian, Arabic, or 13 more. Your story belongs in the words you dream in.</p>
              <div className="flex flex-wrap gap-1.5">
                {['עברית', 'English', 'Русский', 'العربية', '中文', 'Español', 'Français', '+11'].map((lang) => (
                  <span key={lang} className="px-2.5 py-1 bg-white/80 rounded-lg text-xs font-medium text-slate-700 border border-slate-200/60 shadow-sm">{lang}</span>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <section id="how" className="py-24 sm:py-32 px-5 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 sm:mb-20">
            <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-3">Process</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tighter text-slate-900 mb-5">
              Simple as a conversation
            </h2>
            <p className="text-lg text-slate-500 max-w-md mx-auto">Three steps. No writing skills needed. Just talk.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-10 sm:gap-8 relative">
            {/* Connector line */}
            <div className="hidden sm:block absolute top-10 left-[25%] right-[25%] h-px bg-gradient-to-r from-slate-200 via-primary/30 to-slate-200" />

            {[
              {
                num: '01',
                gradient: 'from-primary/15 to-primary/5',
                iconColor: 'text-primary',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                ),
                title: 'Just talk',
                desc: 'Have a natural conversation with your AI biographer. Share stories, moments, emotions. No structure — just speak freely.',
              },
              {
                num: '02',
                gradient: 'from-amber-100 to-amber-50',
                iconColor: 'text-amber-600',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                ),
                title: 'AI organizes it',
                desc: 'Your biographer automatically identifies and extracts life events, building out a rich, chronological timeline of your life.',
              },
              {
                num: '03',
                gradient: 'from-violet-100 to-violet-50',
                iconColor: 'text-violet-600',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                ),
                title: 'Your legacy, forever',
                desc: 'Generate a beautiful written biography. Share it with family, export as PDF, or keep it private — your story, your rules.',
              },
            ].map((step) => (
              <div key={step.num} className="flex flex-col items-center text-center group">
                <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mb-6 shadow-sm group-hover:shadow-md group-hover:-translate-y-1 transition-all duration-300 ${step.iconColor}`}>
                  {step.icon}
                </div>
                <span className="text-xs font-black text-slate-300 tracking-widest uppercase mb-2">{step.num}</span>
                <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">{step.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm max-w-xs">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIAL ─────────────────────────────────────────────────────── */}
      <section className="py-24 sm:py-32 px-5 sm:px-8 bg-slate-900 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="flex justify-center gap-0.5 mb-8">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>

          <blockquote className="text-2xl sm:text-3xl lg:text-[2.5rem] font-bold text-white leading-tight tracking-tight mb-12">
            &ldquo;I thought my life was ordinary. Bestie helped me see that I had lived through extraordinary times — and it captured every story I thought I had forgotten.&rdquo;
          </blockquote>

          <div className="flex items-center justify-center gap-4">
            <div className="w-13 h-13 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-white font-bold text-xl w-14 h-14">M</div>
            <div className="text-left">
              <p className="text-white font-semibold">Miriam, 72</p>
              <p className="text-slate-400 text-sm">Grandmother of 7 · Tel Aviv, Israel</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────────────────── */}
      <section className="py-24 sm:py-32 px-5 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-br from-slate-50 via-primary/5 to-violet-50 rounded-3xl p-10 sm:p-20 border border-slate-100 overflow-hidden text-center">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-primary/10 to-transparent rounded-full -translate-y-36 translate-x-36 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-gradient-to-tr from-violet-100/60 to-transparent rounded-full translate-y-28 -translate-x-28 pointer-events-none" />

            <div className="relative z-10">
              <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-5">Start today</p>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-slate-900 mb-6">
                Your story won&apos;t
                <br />
                tell itself.
              </h2>
              <p className="text-lg text-slate-500 mb-10 max-w-lg mx-auto leading-relaxed">
                Every day that passes is a memory that could fade. Start your first conversation today — it takes less than two minutes.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2.5 px-10 py-5 bg-slate-900 hover:bg-slate-800 text-white text-lg font-semibold rounded-full transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
              >
                Start your story — it&apos;s free
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <p className="text-sm text-slate-400 mt-5">No credit card · Private & secure · Cancel anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 py-10 px-5 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
              </svg>
            </div>
            <span className="font-bold text-slate-900 text-sm">Besties.co.il</span>
          </div>

          <p className="text-sm text-slate-400 text-center">© 2025 Besties · Your memories, beautifully preserved.</p>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Private &amp; Secure · Powered by Claude AI
          </div>
        </div>
      </footer>

    </div>
  );
}
