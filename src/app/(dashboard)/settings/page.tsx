'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme, setTheme, colors, fonts, resetTheme } = useTheme();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
    }
  }, [session, status, router]);

  if (status === 'loading') {
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
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pt-16 space-y-8">
        {/* Quick Actions */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-3">
            <Link
              href="/upload"
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-blue-100 bg-blue-50/30 hover:bg-blue-50 hover:shadow-sm transition"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-blue-500 bg-blue-100/70">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-slate-600">Upload a Story</span>
            </Link>
            <Link
              href="/upload"
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-amber-100 bg-amber-50/30 hover:bg-amber-50 hover:shadow-sm transition"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-amber-500 bg-amber-100/70">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-slate-600">Upload Pictures</span>
            </Link>
            <Link
              href="/share"
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-emerald-100 bg-emerald-50/30 hover:bg-emerald-50 hover:shadow-sm transition"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-emerald-500 bg-emerald-100/70">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-slate-600">Download & Share</span>
            </Link>
          </div>
        </section>
        {/* Theme Colors */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Theme Color</h2>
            <p className="text-sm text-slate-500">Choose your preferred accent color</p>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {colors.map((c) => (
              <button
                key={c.id}
                onClick={() => setTheme({ primaryColor: c.color })}
                className={`relative w-full aspect-square rounded-xl transition-all ${
                  theme.primaryColor === c.color
                    ? 'ring-2 ring-offset-2 ring-slate-900 scale-110'
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c.color }}
                title={c.label}
              >
                {theme.primaryColor === c.color && (
                  <svg className="absolute inset-0 m-auto w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          <p className="text-xs text-slate-400 mt-4">
            Current: {colors.find(c => c.color === theme.primaryColor)?.label || 'Custom'}
          </p>
        </section>

        {/* Font Family */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Font Style</h2>
            <p className="text-sm text-slate-500">Choose your preferred font for the app</p>
          </div>

          <div className="space-y-3">
            {fonts.map((f) => (
              <button
                key={f.id}
                onClick={() => setTheme({ fontFamily: f.id })}
                className={`w-full p-4 rounded-xl border text-left transition ${
                  theme.fontFamily === f.id
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-900" style={{ fontFamily: f.value }}>
                      {f.label}
                    </div>
                    <div className="text-sm text-slate-500 mt-1" style={{ fontFamily: f.value }}>
                      The quick brown fox jumps over the lazy dog
                    </div>
                  </div>
                  {theme.fontFamily === f.id && (
                    <svg className="w-5 h-5 text-primary shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Preview */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Preview</h2>
            <p className="text-sm text-slate-500">See how your changes look</p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: theme.primaryColor }}>
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22v-8" />
                  <path d="M9 22c0-2 1-3 3-3s3 1 3 3" />
                  <path d="M12 14c-4 0-7-3-7-7 0-2.5 1.5-4.5 4-5.5.5 2 2 3 3 3s2.5-1 3-3c2.5 1 4 3 4 5.5 0 4-3 7-7 7z" />
                </svg>
              </div>
              <span className="font-bold text-slate-900">Live Story</span>
            </div>

            <div className="space-y-2">
              <button
                className="w-full py-2 text-white rounded-lg font-medium"
                style={{ backgroundColor: theme.primaryColor }}
              >
                Primary Button
              </button>
              <button
                className="w-full py-2 rounded-lg font-medium border"
                style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}
              >
                Secondary Button
              </button>
            </div>

            <p className="text-sm text-slate-600">
              This is how your text will appear throughout the app. Your memories deserve a beautiful presentation.
            </p>
          </div>
        </section>

        {/* Quick Links */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">More Settings</h2>
          <div className="space-y-2">
            <Link
              href="/profile"
              className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-slate-700">Edit Profile</span>
              </div>
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/profile/security"
              className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-slate-700">Security & Password</span>
              </div>
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>

        {/* Reset Button */}
        <div className="text-center">
          <button
            onClick={resetTheme}
            className="text-sm text-slate-500 hover:text-slate-700 transition"
          >
            Reset to default theme
          </button>
        </div>
      </main>
    </div>
  );
}
