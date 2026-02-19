'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface RecentChat {
  id: string;
  title: string;
}

const RAINBOW_STYLE = {
  background: 'linear-gradient(90deg, #f472b6, #fb923c, #fbbf24, #34d399, #60a5fa, #a78bfa)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
} as const;

export default function WelcomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [recentChats, setRecentChats] = useState<RecentChat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    fetchRecentChats();
  }, [session, status, router]);

  async function fetchRecentChats() {
    try {
      const res = await fetch('/api/interview/chat');
      if (res.ok) {
        const data = await res.json();
        const chats = (data.interviews || [])
          .filter((c: { messageCount: number }) => c.messageCount > 0)
          .slice(0, 4)
          .map((c: { id: string; preview: string }) => ({
            id: c.id,
            title: c.preview || 'Untitled chat',
          }));
        setRecentChats(chats);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const userName = session?.user?.name || 'there';

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 sm:pt-8">
        <div className="flex flex-col items-start max-w-md mx-auto">
          {/* Line 1: Hi Username */}
          <p className="text-xl text-slate-600 mb-1">
            Hi {userName}
          </p>

          {/* Line 2-3: Let's add / more memories! (rainbow, bigger) */}
          <p
            className="text-3xl sm:text-4xl font-bold mb-5"
            style={RAINBOW_STYLE}
          >
            Let&apos;s add<br />more memories!
          </p>

          {/* Continue previous chats */}
          {recentChats.length > 0 && (
            <>
              <p className="text-xl text-slate-600 mb-3">
                Continue previous chats
              </p>

              {/* Chat list — up to 4, no icons, consistent size */}
              <div className="flex flex-col gap-2 mb-4 w-full" style={{ maxWidth: '280px' }}>
                {recentChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => router.push(`/interview?id=${chat.id}`)}
                    className="px-5 py-3 text-base text-primary bg-primary/5 border border-primary/15 rounded-full hover:bg-primary/10 transition truncate text-center"
                  >
                    {chat.title}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Action buttons — a bit longer than chat titles, same size as each other */}
          <div className="flex flex-col gap-2" style={{ maxWidth: '320px', width: '100%' }}>
            <button
              onClick={() => router.push('/interview?new=true')}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-base text-primary bg-primary/5 border border-primary/15 rounded-full hover:bg-primary/10 transition w-full"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Start a new chat
            </button>

            <button
              onClick={() => router.push('/timeline-edit')}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-base text-primary bg-primary/5 border border-primary/15 rounded-full hover:bg-primary/10 transition w-full"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Edit your Timeline
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
