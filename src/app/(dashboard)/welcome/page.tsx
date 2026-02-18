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
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28">
        <div className="flex flex-col items-start max-w-md mx-auto">
          {/* Line 1: Hi Username */}
          <p className="text-base text-slate-600 mb-1">
            Hi {userName}
          </p>

          {/* Line 2: Let's add (rainbow, bigger) */}
          {/* Line 3: more memories! (rainbow, bigger) */}
          <p
            className="text-xl sm:text-2xl font-bold mb-4"
            style={RAINBOW_STYLE}
          >
            Let&apos;s add<br />more memories!
          </p>

          {/* Line 4: Resume previous chats */}
          {recentChats.length > 0 && (
            <>
              <p className="text-base text-slate-600 mb-2">
                Resume previous chats
              </p>

              {/* Chat list — up to 4, each on new line */}
              <div className="flex flex-col gap-1.5 mb-4 w-full">
                {recentChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => router.push(`/interview?id=${chat.id}`)}
                    className="text-left text-base text-primary hover:text-primary-dark transition truncate"
                  >
                    {chat.title}
                  </button>
                ))}
              </div>

              {/* Or */}
              <p className="text-base text-slate-600 mb-2">Or</p>
            </>
          )}

          {/* Start a new chat */}
          <button
            onClick={() => router.push('/interview?new=true')}
            className="text-base text-primary hover:text-primary-dark transition"
          >
            Start a new chat
          </button>
        </div>
      </main>
    </div>
  );
}
