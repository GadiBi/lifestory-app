'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ChatMessage from '@/components/ChatMessage';
import PeriodSelector from '@/components/PeriodSelector';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Interview {
  id: string;
  currentPeriod: string;
  status: string;
}

export default function InterviewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [interview, setInterview] = useState<Interview | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [extracting, setExtracting] = useState(false);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize or load existing interview
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }

    initializeInterview();
  }, [session, status, router]);

  async function initializeInterview() {
    try {
      // Try to get existing active interview
      const response = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (data.interview) {
        setInterview(data.interview);
        setMessages(data.messages || []);

        // If no messages, get opening message
        if (!data.messages || data.messages.length === 0) {
          await getOpeningMessage(data.interview.id);
        }
      }
    } catch (error) {
      console.error('Failed to initialize interview:', error);
    } finally {
      setInitializing(false);
    }
  }

  async function getOpeningMessage(interviewId: string) {
    setLoading(true);
    try {
      const response = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewId }),
      });

      const data = await response.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Failed to get opening message:', error);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading || !interview) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Optimistically add user message
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId: interview.id,
          message: userMessage,
        }),
      });

      const data = await response.json();

      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  async function handlePeriodChange(newPeriod: string) {
    if (!interview) return;

    try {
      const response = await fetch('/api/interview/period', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId: interview.id,
          period: newPeriod,
        }),
      });

      const data = await response.json();
      if (data.interview) {
        setInterview(data.interview);
      }
    } catch (error) {
      console.error('Failed to change period:', error);
    }
  }

  async function extractEvents() {
    if (!interview) return;

    setExtracting(true);
    try {
      const response = await fetch('/api/interview/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewId: interview.id }),
      });

      const data = await response.json();
      alert(data.message || `Extracted ${data.events?.length || 0} events`);
    } catch (error) {
      console.error('Failed to extract events:', error);
      alert('Failed to extract events');
    } finally {
      setExtracting(false);
    }
  }

  async function startNewInterview() {
    setInitializing(true);
    setMessages([]);

    try {
      const response = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startNew: true }),
      });

      const data = await response.json();
      if (data.interview) {
        setInterview(data.interview);
        if (data.messages) {
          setMessages(data.messages);
        } else {
          await getOpeningMessage(data.interview.id);
        }
      }
    } catch (error) {
      console.error('Failed to start new interview:', error);
    } finally {
      setInitializing(false);
    }
  }

  if (status === 'loading' || initializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading interview...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3 sm:gap-4">
              <Link href="/dashboard" className="text-slate-600 hover:text-slate-900 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-base sm:text-lg font-semibold text-slate-900">Life Story Interview</h1>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <PeriodSelector
                currentPeriod={interview?.currentPeriod || 'early_childhood'}
                onPeriodChange={handlePeriodChange}
                disabled={loading}
              />
            </div>
          </div>
          {/* Mobile Period Selector */}
          <div className="sm:hidden mt-3">
            <PeriodSelector
              currentPeriod={interview?.currentPeriod || 'early_childhood'}
              onPeriodChange={handlePeriodChange}
              disabled={loading}
            />
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="text-center text-slate-500 py-12">
              Starting your interview session...
            </div>
          ) : (
            messages.map((message, index) => (
              <ChatMessage key={index} role={message.role} content={message.content} />
            ))
          )}
          {loading && (
            <div className="flex justify-start mb-4">
              <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="bg-white border-t border-slate-200 sticky bottom-0 safe-area-bottom">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <form onSubmit={sendMessage} className="flex gap-2 sm:gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Share your memories..."
              disabled={loading}
              className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:opacity-50 text-slate-900 text-base"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="hidden sm:inline">Send</span>
              <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
          <div className="flex justify-between items-center mt-2 sm:mt-3">
            <button
              onClick={startNewInterview}
              disabled={loading}
              className="text-xs sm:text-sm text-slate-500 hover:text-slate-700 py-1"
            >
              New Interview
            </button>
            <button
              onClick={extractEvents}
              disabled={extracting || messages.length < 4}
              className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {extracting ? 'Extracting...' : 'Extract Events'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
