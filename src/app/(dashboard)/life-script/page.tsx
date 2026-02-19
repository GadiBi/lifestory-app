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
  { id: 'narrative', label: 'Narrative', desc: 'Warm, engaging memoir style', icon: '📖' },
  { id: 'poetic', label: 'Poetic', desc: 'Lyrical with metaphors', icon: '🌸' },
  { id: 'journalistic', label: 'Journalistic', desc: 'Clear, factual style', icon: '📰' },
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

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) { router.push('/login'); return; }
    fetchStats();
  }, [session, status, router]);

  async function fetchStats() {
    try {
      const response = await fetch('/api/life-script');
      setStats(await response.json());
    } catch (err) {
      console.error('Failed to fetch stats:', err);
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
      if (!response.ok) { setError(data.error || 'Failed'); return; }
      setLifeScript(data.lifeScript);
      setMetadata(data.metadata);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to generate. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  function downloadPDF() {
    if (!lifeScript || !metadata) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${metadata.userName}'s Life Story</title>
        <style>
          @page {
            size: A4;
            margin: 2.5cm 2cm;
          }

          * {
            box-sizing: border-box;
          }

          body {
            font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, Georgia, serif;
            max-width: 100%;
            margin: 0;
            padding: 0;
            line-height: 1.9;
            color: #2d3748;
            font-size: 12pt;
            background: #fff;
          }

          /* Title Page */
          .title-page {
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            page-break-after: always;
            padding: 2cm;
          }

          .title-page h1 {
            font-size: 32pt;
            font-weight: normal;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 0.5cm;
            color: #1a202c;
          }

          .title-page .subtitle {
            font-size: 16pt;
            font-style: italic;
            color: #718096;
            margin-bottom: 2cm;
          }

          .title-page .author {
            font-size: 18pt;
            color: #4a5568;
            margin-bottom: 0.5cm;
          }

          .title-page .ornament {
            font-size: 24pt;
            color: #cbd5e0;
            margin: 1cm 0;
          }

          .title-page .meta {
            font-size: 10pt;
            color: #a0aec0;
            position: absolute;
            bottom: 3cm;
          }

          /* Content */
          .content {
            padding: 0;
          }

          /* Chapter Headers */
          h1 {
            font-size: 24pt;
            font-weight: normal;
            text-align: center;
            margin: 2cm 0 1cm;
            color: #1a202c;
            page-break-before: always;
            letter-spacing: 1px;
          }

          h1:first-of-type {
            page-break-before: auto;
          }

          h1::before {
            content: '❧';
            display: block;
            font-size: 18pt;
            color: #cbd5e0;
            margin-bottom: 0.5cm;
          }

          h2 {
            font-size: 14pt;
            font-weight: bold;
            font-style: italic;
            color: #4a5568;
            margin: 1.5cm 0 0.5cm;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 0.3cm;
          }

          /* Paragraphs */
          p {
            margin: 0 0 0.5cm;
            text-align: justify;
            text-indent: 1cm;
            hyphens: auto;
          }

          p:first-of-type {
            text-indent: 0;
          }

          p:first-of-type::first-letter {
            font-size: 3em;
            float: left;
            line-height: 0.8;
            padding-right: 0.1em;
            color: #4a5568;
            font-weight: bold;
          }

          /* Quotes */
          blockquote {
            margin: 1cm 1.5cm;
            padding: 0.5cm 1cm;
            border-left: 3px solid #cbd5e0;
            font-style: italic;
            color: #4a5568;
          }

          /* Footer */
          .footer {
            margin-top: 3cm;
            padding-top: 1cm;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 10pt;
            color: #a0aec0;
          }

          .footer .ornament {
            font-size: 14pt;
            color: #cbd5e0;
            margin-bottom: 0.5cm;
          }

          /* Print optimizations */
          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            .title-page {
              height: auto;
              min-height: 100vh;
            }
          }
        </style>
      </head>
      <body>
        <!-- Title Page -->
        <div class="title-page">
          <div class="ornament">☙ ❧</div>
          <h1 style="page-break-before: auto; margin-top: 0;">${metadata.userName}</h1>
          <div class="subtitle">A Life Story</div>
          <div class="ornament">◆</div>
          <div class="meta">
            Based on ${metadata.totalEvents} documented memories<br/>
            Generated on ${new Date(metadata.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        <!-- Content -->
        <div class="content">
          ${lifeScript.split('\n').map(p => {
            if (p.startsWith('# ')) return `<h1>${p.replace('# ', '')}</h1>`;
            if (p.startsWith('## ')) return `<h2>${p.replace('## ', '')}</h2>`;
            if (p.startsWith('> ')) return `<blockquote>${p.replace('> ', '')}</blockquote>`;
            if (p.trim()) return `<p>${p}</p>`;
            return '';
          }).join('')}
        </div>

        <!-- Footer -->
        <div class="footer">
          <div class="ornament">❦</div>
          <p>This story was lovingly preserved with My Story</p>
          <p>Every life has a story worth telling</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        setTimeout(() => printWindow.print(), 500);
      };
    }
  }

  function downloadText() {
    if (!lifeScript || !metadata) return;

    const divider = '═'.repeat(60);
    const content = `
${divider}

                    THE LIFE STORY OF
                  ${metadata.userName.toUpperCase()}

${divider}

Generated: ${new Date(metadata.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
Based on ${metadata.totalEvents} life events
Style: ${metadata.style}

${divider}

${lifeScript}

${divider}

This story was preserved with My Story
Every life has a story worth telling

${divider}
`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metadata.userName.replace(/\s+/g, '_')}_Life_Story.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyToClipboard() {
    if (lifeScript) {
      navigator.clipboard.writeText(lifeScript);
      alert('Copied to clipboard!');
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

  return (
    <div className="min-h-screen bg-white">
      {lifeScript && (
        <div className="bg-white border-b border-slate-100 sticky top-14 z-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex justify-end items-center gap-2">
            <button onClick={copyToClipboard} className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition" title="Copy">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            </button>
            <button onClick={downloadText} className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition" title="Download TXT">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            <button onClick={downloadPDF} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition font-medium">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden sm:inline">Download PDF</span>
            </button>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {!lifeScript ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2
                className="text-2xl font-bold mb-2"
                style={{
                  background: 'linear-gradient(90deg, #f472b6, #fb923c, #fbbf24, #34d399, #60a5fa, #a78bfa)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >Generate Your Life Script</h2>
              <p className="text-slate-500">Transform your memories into a beautifully written biography</p>
            </div>

            {stats && (
              <div className="bg-slate-50 rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-slate-200">
                    <span className="text-2xl font-bold text-primary">{stats.totalEvents}</span>
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">Life Events</div>
                    <div className="text-sm text-slate-500">Ready to become your story</div>
                  </div>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${stats.canGenerate ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {stats.canGenerate ? '✓ Ready to generate' : 'Need 3+ events'}
                </span>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-3">Choose Your Writing Style</label>
              <div className="grid gap-3">
                {STYLES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStyle(s.id)}
                    className={`flex items-center gap-4 p-4 rounded-xl border text-left transition ${
                      selectedStyle === s.id
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-2xl">{s.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">{s.label}</div>
                      <div className="text-sm text-slate-500">{s.desc}</div>
                    </div>
                    {selectedStyle === s.id && (
                      <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-3">
                <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <button
              onClick={generateLifeScript}
              disabled={generating || !stats?.canGenerate}
              className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Writing your story...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Generate Life Script
                </>
              )}
            </button>

            {!stats?.canGenerate && (
              <p className="text-center text-sm text-slate-500 mt-4">
                <Link href="/interview?new=true&context=lifestory" className="text-primary hover:underline">Start a conversation</Link> to add more memories to your story
              </p>
            )}
          </div>
        ) : (
          <div>
            {metadata && (
              <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-4 sm:p-5 mb-6">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                  <span className="flex items-center gap-2 text-primary">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {metadata.userName}
                  </span>
                  <span className="flex items-center gap-2 text-primary">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {metadata.totalEvents} events
                  </span>
                  <span className="flex items-center gap-2 text-primary">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    {STYLES.find(s => s.id === metadata.style)?.label || metadata.style}
                  </span>
                  <span className="flex items-center gap-2 text-primary">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(metadata.generatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-sm">
              <article className="prose prose-slate prose-lg max-w-none">
                {lifeScript.split('\n').map((p, i) => {
                  if (p.startsWith('# ')) {
                    return (
                      <h1 key={i} className="text-3xl font-bold text-slate-900 mt-12 mb-6 first:mt-0 text-center border-b border-slate-200 pb-4">
                        {p.replace('# ', '')}
                      </h1>
                    );
                  }
                  if (p.startsWith('## ')) {
                    return (
                      <h2 key={i} className="text-xl font-semibold text-slate-800 mt-8 mb-4 italic">
                        {p.replace('## ', '')}
                      </h2>
                    );
                  }
                  if (p.startsWith('> ')) {
                    return (
                      <blockquote key={i} className="border-l-4 border-primary/30 pl-4 italic text-slate-600 my-6">
                        {p.replace('> ', '')}
                      </blockquote>
                    );
                  }
                  if (p.trim() === '') return <br key={i} />;
                  return (
                    <p key={i} className="text-slate-700 leading-relaxed mb-4 text-justify">
                      {p}
                    </p>
                  );
                })}
              </article>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
              <button
                onClick={() => { setLifeScript(null); setMetadata(null); }}
                className="flex items-center gap-2 px-6 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Generate New Version
              </button>
              <Link
                href="/share"
                className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share Your Story
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
