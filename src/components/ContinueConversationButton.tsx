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
      <div className="block w-full bg-slate-100 border border-slate-200 rounded-xl p-4 sm:p-6 cursor-not-allowed opacity-60">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400">
            <ChatIcon />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-semibold text-slate-500 mb-1">Continue Conversation</h3>
            <p className="text-slate-400 text-sm">No previous conversations yet</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="block w-full bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl p-4 sm:p-6 transition group"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
          <ChatIcon />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-1">Continue Conversation</h3>
          {lastActive ? (
            <p className="text-slate-600 text-sm truncate">{lastActive.preview || 'Resume your last conversation'}</p>
          ) : loading ? (
            <p className="text-slate-400 text-sm">Loading...</p>
          ) : (
            <p className="text-slate-600 text-sm">Resume your last conversation</p>
          )}
        </div>
        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary/60 group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
