'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Stats {
  totalEvents: number;
  periodCounts: Record<string, number>;
  canGenerate: boolean;
}

interface Metadata {
  userName: string;
  totalEvents: number;
  periodsIncluded: string[];
  generatedAt: string;
  style: string;
}

const STYLES = [
  {
    id: 'narrative',
    label: 'Narrative',
    desc: 'Warm, engaging memoir prose — the way a master storyteller would tell your life.',
    accent: 'from-amber-50 to-orange-50',
    border: 'border-amber-200',
    activeBorder: 'border-amber-400',
    activeRing: 'ring-amber-200',
    badge: 'bg-amber-100 text-amber-700',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: 'poetic',
    label: 'Poetic',
    desc: 'Lyrical and emotional — your story told in vivid language that resonates long after reading.',
    accent: 'from-violet-50 to-purple-50',
    border: 'border-violet-200',
    activeBorder: 'border-violet-400',
    activeRing: 'ring-violet-200',
    badge: 'bg-violet-100 text-violet-700',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    id: 'journalistic',
    label: 'Journalistic',
    desc: 'Clear, precise, and factual — a dignified biographical account grounded in the truth.',
    accent: 'from-sky-50 to-blue-50',
    border: 'border-sky-200',
    activeBorder: 'border-sky-400',
    activeRing: 'ring-sky-200',
    badge: 'bg-sky-100 text-sky-700',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    ),
  },
];

export default function LifeScriptPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [lifeScript, setLifeScript] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [selectedStyle, setSelectedStyle] = useState('narrative');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) { router.push('/login'); return; }
    fetchStats();
  }, [session, status, router]);

  async function fetchStats() {
    try {
      const response = await fetch('/api/life-script');
      if (response.ok) setStats(await response.json());
    } catch {
      // non-critical
    } finally {
      setLoading(false);
    }
  }

  async function generateLifeScript() {
    setGenerating(true);
    setError(null);
    try {
      const response = await fetch('/api/life-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ style: selectedStyle }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error || 'Failed to generate'); return; }
      setLifeScript(data.lifeScript);
      setMetadata(data.metadata);
    } catch {
      setError('Failed to generate. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  function copyToClipboard() {
    if (!lifeScript) return;
    navigator.clipboard.writeText(lifeScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadText() {
    if (!lifeScript || !metadata) return;
    const divider = '═'.repeat(60);
    const content = `${divider}\n\n                    THE LIFE STORY OF\n                  ${metadata.userName.toUpperCase()}\n\n${divider}\n\nGenerated: ${new Date(metadata.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\nBased on ${metadata.totalEvents} life events\nStyle: ${metadata.style}\n\n${divider}\n\n${lifeScript}\n\n${divider}\n\nPreserved with Besties · Every life has a story worth telling\n\n${divider}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metadata.userName.replace(/\s+/g, '_')}_Life_Story.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadPDF() {
    if (!lifeScript || !metadata) return;
    const printContent = `<!DOCTYPE html><html><head><title>${metadata.userName}'s Life Story</title><style>@page{size:A4;margin:2.5cm 2cm}*{box-sizing:border-box}body{font-family:'Palatino Linotype','Book Antiqua',Palatino,Georgia,serif;max-width:100%;margin:0;padding:0;line-height:1.9;color:#2d3748;font-size:12pt;background:#fff}.title-page{height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;page-break-after:always;padding:2cm}.title-page h1{font-size:32pt;font-weight:normal;letter-spacing:2px;text-transform:uppercase;margin-bottom:.5cm;color:#1a202c;page-break-before:auto;margin-top:0}.title-page .subtitle{font-size:16pt;font-style:italic;color:#718096;margin-bottom:2cm}.title-page .ornament{font-size:24pt;color:#cbd5e0;margin:1cm 0}.title-page .meta{font-size:10pt;color:#a0aec0;position:absolute;bottom:3cm}h1{font-size:24pt;font-weight:normal;text-align:center;margin:2cm 0 1cm;color:#1a202c;page-break-before:always;letter-spacing:1px}h1:first-of-type{page-break-before:auto}h1::before{content:'❧';display:block;font-size:18pt;color:#cbd5e0;margin-bottom:.5cm}h2{font-size:14pt;font-weight:bold;font-style:italic;color:#4a5568;margin:1.5cm 0 .5cm;border-bottom:1px solid #e2e8f0;padding-bottom:.3cm}p{margin:0 0 .5cm;text-align:justify;text-indent:1cm;hyphens:auto}p:first-of-type{text-indent:0}blockquote{margin:1cm 1.5cm;padding:.5cm 1cm;border-left:3px solid #cbd5e0;font-style:italic;color:#4a5568}.footer{margin-top:3cm;padding-top:1cm;border-top:1px solid #e2e8f0;text-align:center;font-size:10pt;color:#a0aec0}</style></head><body><div class="title-page"><div class="ornament">☙ ❧</div><h1>${metadata.userName}</h1><div class="subtitle">A Life Story</div><div class="ornament">◆</div><div class="meta">Based on ${metadata.totalEvents} documented memories<br/>Generated on ${new Date(metadata.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div></div><div class="content">${lifeScript.split('\n').map(p => { if (p.startsWith('# ')) return `<h1>${p.replace('# ', '')}</h1>`; if (p.startsWith('## ')) return `<h2>${p.replace('## ', '')}</h2>`; if (p.startsWith('> ')) return `<blockquote>${p.replace('> ', '')}</blockquote>`; if (p.trim()) return `<p>${p}</p>`; return ''; }).join('')}</div><div class="footer"><p>❦</p><p>This story was lovingly preserved with Besties</p></div></body></html>`;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => setTimeout(() => printWindow.print(), 500);
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  /* ── READING VIEW ── */
  if (lifeScript && metadata) {
    const styleLabel = STYLES.find(s => s.id === metadata.style)?.label || metadata.style;

    return (
      <div className="min-h-screen bg-[#F8F6F0]">
        {/* Sticky toolbar */}
        <div className="sticky top-14 z-20 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-500 min-w-0">
              <svg className="w-4 h-4 text-primary shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="font-semibold text-slate-900 truncate">{metadata.userName}</span>
              <span className="text-slate-300 hidden sm:block">·</span>
              <span className="hidden sm:block">{metadata.totalEvents} events</span>
              <span className="text-slate-300 hidden sm:block">·</span>
              <span className="hidden sm:block">{styleLabel}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                title="Copy text"
              >
                {copied ? (
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                )}
                <span className="hidden sm:block">{copied ? 'Copied!' : 'Copy'}</span>
              </button>

              <button
                onClick={downloadText}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                title="Download .txt"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:block">TXT</span>
              </button>

              <button
                onClick={downloadPDF}
                className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PDF
              </button>
            </div>
          </div>
        </div>

        {/* Book/paper content */}
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            {/* Book header */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 px-8 sm:px-16 py-12 sm:py-20 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 left-8 text-white text-6xl select-none">❝</div>
                <div className="absolute bottom-4 right-8 text-white text-6xl select-none rotate-180">❝</div>
              </div>
              <p className="text-slate-400 text-xs tracking-[0.3em] uppercase mb-6">A Life Story</p>
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">{metadata.userName}</h1>
              <div className="w-16 h-px bg-slate-600 mx-auto my-6" />
              <p className="text-slate-400 text-sm">
                {metadata.totalEvents} memories · {styleLabel} style
                <br />
                <span className="text-slate-500 text-xs mt-1 block">
                  {new Date(metadata.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </p>
            </div>

            {/* Story content */}
            <div className="px-6 sm:px-14 lg:px-20 py-10 sm:py-14">
              <article className="text-slate-800 leading-[1.85] text-[1.05rem] font-[system-ui]">
                {lifeScript.split('\n').map((line, i) => {
                  if (line.startsWith('# ')) {
                    return (
                      <h2 key={i} className="text-2xl sm:text-3xl font-bold text-slate-900 mt-14 mb-6 first:mt-0 text-center tracking-tight">
                        <span className="block text-primary/40 text-sm font-normal tracking-[0.2em] uppercase mb-2">Chapter</span>
                        {line.replace('# ', '')}
                      </h2>
                    );
                  }
                  if (line.startsWith('## ')) {
                    return (
                      <h3 key={i} className="text-xl font-semibold text-slate-800 mt-10 mb-4 tracking-tight">
                        {line.replace('## ', '')}
                      </h3>
                    );
                  }
                  if (line.startsWith('> ')) {
                    return (
                      <blockquote key={i} className="border-l-[3px] border-primary/30 pl-5 my-6 italic text-slate-600 text-lg leading-relaxed">
                        {line.replace('> ', '')}
                      </blockquote>
                    );
                  }
                  if (line.trim() === '') return <div key={i} className="h-4" />;
                  return (
                    <p key={i} className="mb-5 text-justify hyphens-auto">
                      {line}
                    </p>
                  );
                })}
              </article>

              {/* End ornament */}
              <div className="text-center mt-16 mb-4">
                <div className="w-24 h-px bg-slate-200 mx-auto mb-6" />
                <p className="text-slate-400 text-sm italic">Preserved with Besties · Every life has a story worth telling</p>
              </div>
            </div>
          </div>

          {/* Bottom actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <button
              onClick={() => { setLifeScript(null); setMetadata(null); }}
              className="flex items-center gap-2 px-6 py-3 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl transition font-medium text-sm shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Generate new version
            </button>
            <Link
              href="/share"
              className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl transition font-medium text-sm shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share with family
            </Link>
          </div>
        </main>
      </div>
    );
  }

  /* ── SETUP VIEW ── */
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">

        {/* Hero header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-violet-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/25">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-slate-900 mb-3">
            Your Life Script
          </h1>
          <p className="text-slate-500 leading-relaxed max-w-md mx-auto">
            Transform your memories into a beautifully written biography — ready to share, print, or keep forever.
          </p>
        </div>

        {/* Stats card */}
        {stats && (
          <div className={`rounded-2xl border p-5 mb-8 flex items-center justify-between gap-4 ${
            stats.canGenerate
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-amber-50 border-amber-200'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 font-black text-2xl ${
                stats.canGenerate ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {stats.totalEvents}
              </div>
              <div>
                <p className={`font-semibold text-sm ${stats.canGenerate ? 'text-emerald-900' : 'text-amber-900'}`}>
                  {stats.totalEvents === 1 ? '1 life event' : `${stats.totalEvents} life events`} recorded
                </p>
                <p className={`text-xs mt-0.5 ${stats.canGenerate ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {stats.canGenerate ? 'Ready to become your story' : 'Add at least 3 to generate'}
                </p>
              </div>
            </div>
            <div className={`shrink-0 flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full ${
              stats.canGenerate ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {stats.canGenerate ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Ready
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Need {3 - stats.totalEvents} more
                </>
              )}
            </div>
          </div>
        )}

        {/* Writing style */}
        <div className="mb-8">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-4">Choose your writing style</p>
          <div className="space-y-3">
            {STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStyle(s.id)}
                className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200 bg-white hover:shadow-md ${
                  selectedStyle === s.id
                    ? `${s.activeBorder} ring-4 ${s.activeRing} shadow-sm`
                    : `${s.border} hover:border-slate-300`
                }`}
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.accent} border ${s.border} flex items-center justify-center shrink-0 ${
                  selectedStyle === s.id ? s.badge.split(' ')[1] : 'text-slate-500'
                }`}>
                  {s.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-slate-900 text-sm">{s.label}</span>
                    {selectedStyle === s.id && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.badge}`}>Selected</span>
                    )}
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed">{s.desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                  selectedStyle === s.id ? `${s.activeBorder} bg-primary` : 'border-slate-300'
                }`}>
                  {selectedStyle === s.id && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Generate button */}
        <button
          onClick={generateLifeScript}
          disabled={generating || !stats?.canGenerate}
          className="w-full py-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold rounded-2xl transition-all shadow-lg hover:shadow-xl disabled:shadow-none flex items-center justify-center gap-3 text-base"
        >
          {generating ? (
            <>
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Writing your story...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Generate Life Script
            </>
          )}
        </button>

        {!stats?.canGenerate && (
          <p className="text-center text-sm text-slate-400 mt-4">
            <Link href="/interview?new=true&context=lifestory" className="text-primary hover:underline font-medium">
              Start a conversation
            </Link>{' '}
            to add more memories to your story
          </p>
        )}
      </main>
    </div>
  );
}
