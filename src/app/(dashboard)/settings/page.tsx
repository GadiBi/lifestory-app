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
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
              <p className="text-sm text-slate-500">Customize your experience</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-8">
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
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 19.5v-15A2.5 2.5 0 016.5 2H12v10l-2-1.5L8 12V2" />
                  <path d="M20 19.5v-15A2.5 2.5 0 0017.5 2H12v10l2-1.5 2 1.5V2" />
                </svg>
              </div>
              <span className="font-bold text-slate-900">LifeStory</span>
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
