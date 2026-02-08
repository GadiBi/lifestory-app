'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Interview {
  id: string;
  currentPeriod: string;
  status: string;
}

interface PastInterview {
  id: string;
  currentPeriod: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  preview: string;
}

const LIFE_PERIODS = [
  { id: 'early_childhood', label: 'Early Childhood (0-5)' },
  { id: 'childhood', label: 'Childhood (6-12)' },
  { id: 'teenage', label: 'Teenage (13-19)' },
  { id: 'young_adult', label: 'Young Adult (20-35)' },
  { id: 'middle_adult', label: 'Middle Adult (36-55)' },
  { id: 'later_adult', label: 'Later Adult (56+)' },
];

export default function InterviewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [interview, setInterview] = useState<Interview | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const [canUndo, setCanUndo] = useState(true);
  const [pastInterviews, setPastInterviews] = useState<PastInterview[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [autoSend, setAutoSend] = useState(false);
  const [voiceLang, setVoiceLang] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const languages = [
    { code: '', label: 'Auto' },
    { code: 'en-US', label: 'English' },
    { code: 'es-ES', label: 'Spanish' },
    { code: 'fr-FR', label: 'French' },
    { code: 'de-DE', label: 'German' },
    { code: 'he-IL', label: 'Hebrew' },
    { code: 'ru-RU', label: 'Russian' },
    { code: 'zh-CN', label: 'Chinese' },
    { code: 'ja-JP', label: 'Japanese' },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = (event) => {
          let fullTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            fullTranscript += event.results[i][0].transcript;
          }
          setInput(fullTranscript);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
      }
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    // Check query params
    const startNew = searchParams.get('new') === 'true';
    const openHistory = searchParams.get('history') === 'true';

    if (openHistory) {
      router.replace('/interview');
      setShowHistory(true);
      initializeInterview();
    } else if (startNew) {
      router.replace('/interview');
      startNewInterview();
    } else {
      initializeInterview();
    }
  }, [session, status, router, searchParams]);

  async function loadPastInterviews() {
    try {
      const res = await fetch('/api/interview/chat');
      if (res.ok) {
        const data = await res.json();
        setPastInterviews(data.interviews || []);
      }
    } catch (error) {
      console.error('Failed to load past interviews:', error);
    }
  }

  async function loadInterview(interviewId: string) {
    setLoading(true);
    setShowHistory(false);
    try {
      const response = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewId }),
      });
      const data = await response.json();
      if (data.interview) {
        setInterview(data.interview);
        setMessages(Array.isArray(data.messages) ? data.messages : []);
      }
    } catch (error) {
      console.error('Failed to load interview:', error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteInterview(interviewId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('Delete this conversation?')) return;
    try {
      const response = await fetch(`/api/interview/${interviewId}`, { method: 'DELETE' });
      if (response.ok) {
        setPastInterviews(prev => prev.filter(p => p.id !== interviewId));
        if (interview?.id === interviewId) await startNewInterview();
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  }

  async function initializeInterview() {
    try {
      const profileRes = await fetch('/api/profile');
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        if (profileData.profile?.language) {
          const langMap: Record<string, string> = {
            en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE',
            he: 'he-IL', ru: 'ru-RU', zh: 'zh-CN', ja: 'ja-JP',
          };
          setVoiceLang(langMap[profileData.profile.language] || '');
        }
      }
      await loadPastInterviews();
      const response = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (data.interview) {
        setInterview(data.interview);
        setMessages(data.messages || []);
        if (!data.messages || data.messages.length === 0) {
          await getOpeningMessage(data.interview.id);
        }
      }
    } catch (error) {
      console.error('Failed to initialize:', error);
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
      if (data.messages) setMessages(data.messages);
    } catch (error) {
      console.error('Failed to get opening:', error);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!input.trim() || loading || !interview) return;
    const userMessage = input.trim();
    setInput('');
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    try {
      const response = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewId: interview.id, message: userMessage }),
      });
      const data = await response.json();
      if (data.messages) {
        setMessages(data.messages);
        setCanUndo(true);
      }
    } catch (error) {
      console.error('Failed to send:', error);
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  function toggleListening() {
    if (!recognitionRef.current) {
      alert('Speech recognition not supported. Try Chrome.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      if (autoSend && input.trim()) setTimeout(() => sendMessage(), 100);
    } else {
      setInput('');
      recognitionRef.current.lang = voiceLang || navigator.language || 'en-US';
      recognitionRef.current.start();
      setIsListening(true);
    }
  }

  async function handlePeriodChange(newPeriod: string) {
    if (!interview) return;
    try {
      const response = await fetch('/api/interview/period', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewId: interview.id, period: newPeriod }),
      });
      const data = await response.json();
      if (data.interview) setInterview(data.interview);
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
      console.error('Failed to extract:', error);
    } finally {
      setExtracting(false);
    }
  }

  async function undoLastMessage() {
    if (!interview || messages.length < 1 || !canUndo) return;
    setUndoing(true);
    try {
      const response = await fetch('/api/interview/message', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewId: interview.id }),
      });
      const data = await response.json();
      if (response.ok && data.messages) {
        setMessages(data.messages);
        setCanUndo(false);
      }
    } catch (error) {
      console.error('Failed to undo:', error);
    } finally {
      setUndoing(false);
    }
  }

  async function startNewInterview() {
    setInitializing(true);
    setMessages([]);
    setShowHistory(false);
    try {
      const response = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startNew: true }),
      });
      const data = await response.json();
      if (data.interview) {
        setInterview(data.interview);
        if (data.messages) setMessages(data.messages);
        else await getOpeningMessage(data.interview.id);
        await loadPastInterviews();
      }
    } catch (error) {
      console.error('Failed to start new:', error);
    } finally {
      setInitializing(false);
    }
  }

  if (status === 'loading' || initializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-600">Loading conversation...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-lg font-semibold text-slate-900">Conversation</h1>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2 rounded-lg transition ${showHistory ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-slate-100'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
          <select
            value={interview?.currentPeriod || 'early_childhood'}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-700"
          >
            {LIFE_PERIODS.map(p => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
      </header>

      {/* History Panel */}
      {showHistory && (
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium text-slate-900">Past Conversations</h3>
              <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {pastInterviews.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">No past conversations</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {pastInterviews.map((pi) => (
                  <div
                    key={pi.id}
                    onClick={() => loadInterview(pi.id)}
                    className={`p-3 rounded-lg cursor-pointer transition ${
                      interview?.id === pi.id ? 'bg-primary/5 border border-primary/20' : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-slate-700 truncate">{pi.preview || 'New conversation'}</p>
                        <p className="text-xs text-slate-500">{new Date(pi.updatedAt).toLocaleDateString()} · {pi.messageCount} msgs</p>
                      </div>
                      <button
                        onClick={(e) => deleteInterview(pi.id, e)}
                        className="p-1 text-slate-400 hover:text-red-500"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-md'
                  : 'bg-white border border-slate-200 text-slate-700 rounded-bl-md'
              }`}>
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <footer className="bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {isListening && (
            <div className="mb-3 flex items-center justify-center gap-2 py-2 px-4 bg-red-50 rounded-lg">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm text-red-600">Listening...</span>
            </div>
          )}
          <form onSubmit={sendMessage} className="flex gap-2">
            <button
              type="button"
              onClick={toggleListening}
              className={`p-3 rounded-xl transition ${isListening ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Share your memories..."
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-slate-900"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl transition disabled:opacity-50"
            >
              Send
            </button>
          </form>
          <div className="flex justify-between items-center mt-3 text-sm">
            <div className="flex items-center gap-3">
              <button onClick={startNewInterview} className="text-slate-500 hover:text-primary">+ New</button>
              <select
                value={voiceLang}
                onChange={(e) => setVoiceLang(e.target.value)}
                className="text-slate-500 bg-transparent border-none text-sm"
              >
                {languages.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
              <label className="flex items-center gap-1 text-slate-500 cursor-pointer">
                <input type="checkbox" checked={autoSend} onChange={(e) => setAutoSend(e.target.checked)} className="w-4 h-4" />
                Auto-send
              </label>
            </div>
            <div className="flex items-center gap-2">
              {messages.length >= 1 && canUndo && (
                <button
                  onClick={undoLastMessage}
                  disabled={undoing || loading}
                  className="px-3 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  {undoing ? 'Undoing...' : 'Undo Last'}
                </button>
              )}
              <button
                onClick={extractEvents}
                disabled={extracting || messages.length < 4}
                className="px-4 py-2 bg-success text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {extracting ? 'Saving...' : 'Save Events'}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
