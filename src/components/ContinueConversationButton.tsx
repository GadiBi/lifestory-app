'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface LastActiveInterview {
  id: string;
  currentPeriod: string;
  status: string;
  updatedAt: string;
  messageCount: number;
  preview: string;
}

export default function ContinueConversationButton() {
  const [lastActive, setLastActive] = useState<LastActiveInterview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLastActive() {
      try {
        const res = await fetch('/api/interview/last-active');
        const data = await res.json();
        setLastActive(data.interview);
      } catch (error) {
        console.error('Failed to fetch last active:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchLastActive();
  }, []);

  const href = lastActive ? `/interview?id=${lastActive.id}` : '/interview';
  const isDisabled = !loading && !lastActive;

  if (isDisabled) {
    return (
      <div className="block w-full bg-slate-100 border border-slate-200 rounded-2xl p-5 cursor-not-allowed opacity-60">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400">
            <ChatIcon />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-slate-500">Continue</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="block w-full bg-[var(--color-primary)] hover:brightness-110 text-white rounded-2xl p-5 transition group shadow-sm"
      style={{ opacity: 0.85 }}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <ChatIcon />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold">Continue</h3>
        </div>
        <svg className="w-5 h-5 text-white/50 group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

function ChatIcon() {
  return (
    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}
