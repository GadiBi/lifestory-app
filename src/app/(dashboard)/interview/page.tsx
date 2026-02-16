'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  audioUrl?: string;
}

interface Interview {
  id: string;
  currentPeriod: string;
  status: string;
}

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
  const [canUndo, setCanUndo] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [showContinue, setShowContinue] = useState(false);
  const [liveFeedTitle, setLiveFeedTitle] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Audio recording state
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const languages = [
    { code: '', label: 'Auto' },
    { code: 'en-US', label: 'EN' },
    { code: 'es-ES', label: 'ES' },
    { code: 'fr-FR', label: 'FR' },
    { code: 'de-DE', label: 'DE' },
    { code: 'he-IL', label: 'HE' },
    { code: 'ru-RU', label: 'RU' },
    { code: 'zh-CN', label: 'ZH' },
    { code: 'ja-JP', label: 'JA' },
  ];

  // Generate a dynamic chat title from user messages
  const generateChatTitle = useCallback((msgs: Message[]) => {
    const userMsgs = msgs.filter(m => m.role === 'user').map(m => m.content);
    if (userMsgs.length === 0) return null;
    const combined = userMsgs.join(' ').toLowerCase();
    const patterns: [RegExp, string][] = [
      [/\b(mom|mother|mama|ima)\b/i, 'Memories of Mom'],
      [/\b(dad|father|papa|abba|aba)\b/i, 'Memories of Dad'],
      [/\b(grandm|grandmother|savta)\b/i, 'Grandma stories'],
      [/\b(grandpa|grandfather|saba)\b/i, 'Grandpa stories'],
      [/\b(school|teacher|class)\b/i, 'School days'],
      [/\b(childhood|growing up|kid)\b/i, 'Childhood memories'],
      [/\b(wedding|marriage|married)\b/i, 'Marriage'],
      [/\b(army|military|service)\b/i, 'Military service'],
      [/\b(immigrat|moved to|came to)\b/i, 'Immigration story'],
      [/\b(cook|food|recipe|kitchen)\b/i, 'Food & cooking'],
      [/\b(work|job|career|business)\b/i, 'Career memories'],
      [/\b(travel|trip|vacation)\b/i, 'Travel stories'],
      [/\b(friend|friendship)\b/i, 'Friendships'],
      [/\b(home|house|neighborhood)\b/i, 'Home memories'],
      [/\b(birth|born|baby)\b/i, 'Family beginnings'],
    ];
    for (const [pattern, label] of patterns) {
      if (pattern.test(combined)) return label;
    }
    // Fallback: first user message truncated
    return userMsgs[0].substring(0, 30) + (userMsgs[0].length > 30 ? '...' : '');
  }, []);

  // Update the header chat title when messages change
  useEffect(() => {
    const title = generateChatTitle(messages);
    setLiveFeedTitle(title);
    const setChatTitle = (window as unknown as Record<string, unknown>).__setChatTitle as ((t: string | null) => void) | undefined;
    if (setChatTitle) setChatTitle(title);
  }, [messages, generateChatTitle]);

  // Clear chat title on unmount
  useEffect(() => {
    return () => {
      const setChatTitle = (window as unknown as Record<string, unknown>).__setChatTitle as ((t: string | null) => void) | undefined;
      if (setChatTitle) setChatTitle(null);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Track accumulated transcript across recognition restarts
  const accumulatedTranscriptRef = useRef('');
  const isListeningRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.onresult = (event) => {
          let interimTranscript = '';
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          if (finalTranscript) {
            accumulatedTranscriptRef.current += finalTranscript;
          }
          setInput(accumulatedTranscriptRef.current + interimTranscript);
          setSpeechError(null);
        };
        recognition.onerror = (event) => {
          if (event.error === 'no-speech') {
            return;
          }
          setIsListening(false);
          switch (event.error) {
            case 'not-allowed':
              setSpeechError('Microphone access denied. Please allow microphone in your browser settings.');
              break;
            case 'audio-capture':
              setSpeechError('No microphone found.');
              break;
            case 'network':
              setSpeechError('Network error - speech recognition requires an internet connection.');
              break;
            case 'aborted':
              break;
            default:
              setSpeechError('Speech error. Try again.');
          }
        };
        recognition.onend = () => {
          if (recognitionRef.current && isListeningRef.current) {
            try {
              recognition.start();
            } catch {
              setIsListening(false);
            }
          }
        };
        recognitionRef.current = recognition;
      } else {
        setSpeechSupported(false);
      }
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    const startNew = searchParams.get('new') === 'true';
    const resumeId = searchParams.get('id');

    if (startNew) {
      router.replace('/interview');
      startNewInterview();
    } else if (resumeId) {
      router.replace('/interview');
      loadInterview(resumeId);
      setInitializing(false);
    } else {
      initializeInterview();
    }
  }, [session, status, router, searchParams]);

  async function loadInterview(interviewId: string) {
    setLoading(true);
    setShowContinue(false);
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
      // Get or create interview but don't load messages yet (privacy)
      const response = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (data.interview) {
        setInterview(data.interview);
        // Show continue button instead of auto-loading messages
        if (data.messages && data.messages.length > 0) {
          setShowContinue(true);
        } else {
          // New interview with no messages - get opening message
          await getOpeningMessage(data.interview.id);
        }
      }
    } catch (error) {
      console.error('Failed to initialize:', error);
    } finally {
      setInitializing(false);
    }
  }

  async function handleContinueChat() {
    if (!interview) return;
    setShowContinue(false);
    setLoading(true);
    try {
      const response = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewId: interview.id }),
      });
      const data = await response.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
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
    setSaveStatus('saving');
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
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    } catch (error) {
      console.error('Failed to send:', error);
      setMessages(prev => prev.slice(0, -1));
      setSaveStatus('idle');
    } finally {
      setLoading(false);
    }
  }

  function toggleListening() {
    setSpeechError(null);
    if (!speechSupported || !recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      accumulatedTranscriptRef.current = '';
      setInput('');
      recognitionRef.current.lang = voiceLang || navigator.language || 'en-US';
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setSpeechError('Failed to start. Try again.');
        setIsListening(false);
      }
    }
  }

  async function startAudioRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecordingAudio(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(d => d + 1);
      }, 1000);
    } catch {
      setSpeechError('Microphone access denied.');
    }
  }

  function stopAudioRecording() {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  }

  function cancelAudioRecording() {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
    }
    setIsRecordingAudio(false);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingDuration(0);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
  }

  async function sendAudioMessage() {
    if (!audioBlob || !interview) return;

    setLoading(true);
    setSaveStatus('saving');

    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'voice-memo.webm');
      formData.append('title', 'Voice Memo');

      const uploadRes = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json().catch(() => ({}));
        const errorMsg = errorData?.error || 'Upload failed';
        if (errorMsg.includes('not configured') || uploadRes.status === 503) {
          setSpeechError('Voice memo storage is not configured. Please use voice-to-text (mic button) instead.');
        } else {
          setSpeechError(`Failed to upload voice memo: ${errorMsg}`);
        }
        setLoading(false);
        setSaveStatus('idle');
        return;
      }
      const { media } = await uploadRes.json();

      const userMessage: Message = {
        role: 'user',
        content: '🎤 Voice memo',
        audioUrl: media.url,
      };
      setMessages(prev => [...prev, userMessage]);

      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingDuration(0);

      const res = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId: interview.id,
          message: '[User sent a voice memo - please acknowledge and continue the conversation naturally]',
        }),
      });

      if (!res.ok) throw new Error('Failed to send');
      const data = await res.json();

      if (data.messages) {
        setMessages(data.messages);
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Send audio error:', error);
      setSpeechError('Failed to send voice memo.');
    } finally {
      setLoading(false);
    }
  }

  function formatDuration(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    setUndoing(true);
    try {
      let response = await fetch('/api/interview/message', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewId: interview.id }),
      });
      let data = await response.json();
      if (response.ok && data.messages) {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg?.role === 'assistant' && data.messages.length > 0) {
          response = await fetch('/api/interview/message', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ interviewId: interview.id }),
          });
          data = await response.json();
        }
        if (data.messages) {
          setMessages(data.messages);
        }
      }
      if (lastUserMsg) {
        setInput(lastUserMsg.content);
      }
      setCanUndo(false);
    } catch (error) {
      console.error('Failed to undo:', error);
    } finally {
      setUndoing(false);
    }
  }

  async function startNewInterview() {
    setInitializing(true);
    setMessages([]);
    setShowContinue(false);
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
      }
    } catch (error) {
      console.error('Failed to start new:', error);
    } finally {
      setInitializing(false);
    }
  }

  if (status === 'loading' || initializing) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Live Feed Title - dynamic topic bar */}
      {liveFeedTitle && messages.length > 0 && !showContinue && (
        <div className="bg-slate-50 border-b border-slate-100 px-4 py-2">
          <div className="max-w-3xl mx-auto">
            <p className="text-sm text-slate-500 font-medium truncate">{liveFeedTitle}</p>
          </div>
        </div>
      )}

      {/* Messages area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* Continue Landing Page */}
          {showContinue && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 sm:py-20">
              {/* Logo icon */}
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-8">
                <svg className="w-9 h-9 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22v-8" />
                  <path d="M9 22c0-2 1-3 3-3s3 1 3 3" />
                  <path d="M12 14c-4 0-7-3-7-7 0-2.5 1.5-4.5 4-5.5.5 2 2 3 3 3s2.5-1 3-3c2.5 1 4 3 4 5.5 0 4-3 7-7 7z" />
                </svg>
              </div>

              {/* Greeting */}
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 text-center">
                Hi {session?.user?.name || 'there'}
              </h1>
              <p className="text-lg text-slate-500 mb-8 text-center max-w-md">
                Let&apos;s continue chat and build your life story
              </p>

              {/* Continue Chat button */}
              <button
                onClick={handleContinueChat}
                className="px-8 py-3.5 bg-primary hover:bg-primary-dark text-white rounded-xl transition font-semibold text-lg flex items-center gap-2 mb-10 shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                </svg>
                Continue Chat
              </button>

              {/* Quick Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg">
                <Link
                  href="/upload"
                  className="flex items-center gap-3 p-4 rounded-2xl border border-blue-100 bg-blue-50/50 hover:bg-blue-50 transition group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-slate-700">Upload a Story</span>
                </Link>

                <Link
                  href="/upload"
                  className="flex items-center gap-3 p-4 rounded-2xl border border-amber-100 bg-amber-50/50 hover:bg-amber-50 transition group"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-slate-700">Upload Pictures</span>
                </Link>

                <Link
                  href="/share"
                  className="flex items-center gap-3 p-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 transition group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-slate-700">Download & Share</span>
                </Link>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 12v3M12 10c-1.5 0-2.5-1-2.5-2.5S10.5 5 12 5s2.5 1 2.5 2.5S13.5 10 12 10z" />
                        </svg>
                      </div>
                      <span className="text-xs font-medium text-slate-500">Live Story</span>
                    </div>
                  )}
                  <div className={`px-4 py-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-blue-50 text-slate-800 rounded-br-md'
                      : 'text-slate-700'
                  }`}>
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    {msg.audioUrl && (
                      <audio src={msg.audioUrl} controls className="mt-2 w-full h-10" />
                    )}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 12v3M12 10c-1.5 0-2.5-1-2.5-2.5S10.5 5 12 5s2.5 1 2.5 2.5S13.5 10 12 10z" />
                    </svg>
                  </div>
                </div>
                <div className="px-4 py-3 ml-9">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      {/* Input */}
      <footer className="bg-white border-t border-slate-100 pb-safe">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          {speechError && (
            <div className="mb-3 flex items-center justify-center gap-2 py-2 px-3 bg-amber-50 rounded-lg text-sm text-amber-700">
              <span>{speechError}</span>
              <button onClick={() => setSpeechError(null)} className="text-amber-500 hover:text-amber-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          {isListening && (
            <div className="mb-3 flex items-center justify-center gap-2 py-2 px-3 bg-red-50 rounded-lg">
              <div className="relative">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                <div className="absolute inset-0 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping opacity-50" />
              </div>
              <span className="text-sm text-red-600">Listening...</span>
            </div>
          )}
          {isRecordingAudio && (
            <div className="mb-3 flex items-center justify-center gap-3 py-2 px-4 bg-red-50 rounded-lg">
              <div className="relative">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              </div>
              <span className="text-sm font-medium text-red-600">Recording {formatDuration(recordingDuration)}</span>
              <button
                type="button"
                onClick={stopAudioRecording}
                className="px-3 py-1 bg-red-500 text-white text-xs rounded-full hover:bg-red-600 transition"
              >
                Stop
              </button>
              <button
                type="button"
                onClick={cancelAudioRecording}
                className="px-3 py-1 bg-slate-200 text-slate-600 text-xs rounded-full hover:bg-slate-300 transition"
              >
                Cancel
              </button>
            </div>
          )}
          {audioUrl && !isRecordingAudio && (
            <div className="mb-3 flex items-center gap-3 py-2 px-4 bg-slate-50 rounded-lg">
              <audio src={audioUrl} controls className="h-10 flex-1" />
              <button
                type="button"
                onClick={sendAudioMessage}
                disabled={loading}
                className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition disabled:opacity-50"
              >
                Send
              </button>
              <button
                type="button"
                onClick={cancelAudioRecording}
                className="p-2 text-slate-400 hover:text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          {saveStatus !== 'idle' && (
            <div className="mb-2 flex items-center justify-center gap-2 text-xs text-slate-400">
              {saveStatus === 'saving' ? (
                <>
                  <div className="w-3 h-3 border border-slate-300 border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-600">Saved</span>
                </>
              )}
            </div>
          )}

          <form onSubmit={sendMessage} className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Share your memories..."
                rows={1}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none text-slate-800 resize-none text-[15px] leading-relaxed"
                style={{ minHeight: '48px', maxHeight: '150px' }}
              />
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleListening}
                disabled={!speechSupported || isRecordingAudio}
                title="Voice to text"
                className={`p-3 rounded-xl transition ${
                  !speechSupported || isRecordingAudio
                    ? 'text-slate-200 cursor-not-allowed'
                    : isListening
                      ? 'bg-red-500 text-white'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>

              <button
                type="button"
                onClick={isRecordingAudio ? stopAudioRecording : startAudioRecording}
                disabled={isListening}
                title="Record voice memo"
                className={`p-3 rounded-xl transition ${
                  isListening
                    ? 'text-slate-200 cursor-not-allowed'
                    : isRecordingAudio
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                <svg className="w-5 h-5" fill={isRecordingAudio ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth={2} />
                  {isRecordingAudio ? (
                    <rect x="9" y="9" width="6" height="6" rx="1" />
                  ) : (
                    <circle cx="12" cy="12" r="4" fill="currentColor" />
                  )}
                </svg>
              </button>

              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-3 bg-primary hover:bg-primary-dark text-white rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>

          <div className="flex items-center justify-between mt-3 px-1">
            <div className="flex items-center gap-3">
              <button
                onClick={startNewInterview}
                className="text-xs text-slate-400 hover:text-primary flex items-center gap-1 transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New
              </button>
              <select
                value={voiceLang}
                onChange={(e) => setVoiceLang(e.target.value)}
                className="text-xs text-slate-400 bg-transparent border-none focus:ring-0 cursor-pointer hover:text-slate-600"
              >
                {languages.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              {messages.length >= 1 && canUndo && (
                <button
                  onClick={undoLastMessage}
                  disabled={undoing || loading}
                  className="text-xs text-slate-400 hover:text-slate-600 disabled:opacity-50 flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  <span>{undoing ? '...' : 'Edit last'}</span>
                </button>
              )}
              <button
                onClick={extractEvents}
                disabled={extracting || messages.length < 4}
                className="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-full font-medium disabled:opacity-40 hover:bg-primary/20 transition"
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
