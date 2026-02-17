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

// Single fixed prompt for new chat landing
const NEW_CHAT_PROMPT = 'Which memory is on your mind?';

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
  const [showNewChat, setShowNewChat] = useState(false);
  const [liveFeedTitle, setLiveFeedTitle] = useState<string | null>(null);
  const [lastChatTitle, setLastChatTitle] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Audio recording state
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);



  // Generate a dynamic 3-word chat title from user messages
  const generateChatTitle = useCallback((msgs: Message[]) => {
    const userMsgs = msgs.filter(m => m.role === 'user').map(m => m.content);
    if (userMsgs.length === 0) return 'New Chat';
    const combined = userMsgs.join(' ').toLowerCase();
    const patterns: [RegExp, string][] = [
      [/\b(mom|mother|mama|ima)\b/i, 'Memories of Mom'],
      [/\b(dad|father|papa|abba|aba)\b/i, 'Memories of Dad'],
      [/\b(grandm|grandmother|savta)\b/i, 'Stories of Grandma'],
      [/\b(grandpa|grandfather|saba)\b/i, 'Stories of Grandpa'],
      [/\b(school|teacher|class)\b/i, 'My School Days'],
      [/\b(childhood|growing up|kid)\b/i, 'My Childhood Memories'],
      [/\b(wedding|marriage|married)\b/i, 'Our Marriage Story'],
      [/\b(army|military|service)\b/i, 'My Military Service'],
      [/\b(immigrat|moved to|came to)\b/i, 'My Immigration Story'],
      [/\b(cook|food|recipe|kitchen)\b/i, 'Food and Cooking'],
      [/\b(work|job|career|business)\b/i, 'My Career Path'],
      [/\b(travel|trip|vacation)\b/i, 'My Travel Stories'],
      [/\b(friend|friendship)\b/i, 'Friends and Bonds'],
      [/\b(home|house|neighborhood)\b/i, 'My Home Memories'],
      [/\b(birth|born|baby)\b/i, 'Our Family Beginnings'],
    ];
    for (const [pattern, label] of patterns) {
      if (pattern.test(combined)) return label;
    }
    const words = userMsgs[0].split(/\s+/).slice(0, 3).join(' ');
    return words;
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
          if (event.error === 'no-speech') return;
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
      // Show the new chat landing page, don't auto-start
      setMessages([]);
      setShowContinue(false);
      setShowNewChat(true);
      setInitializing(false);
    } else if (resumeId) {
      router.replace('/interview');
      loadInterview(resumeId);
      setInitializing(false);
    } else {
      // Always show the landing page (continue or new chat)
      initializeInterview(false);
    }
  }, [session, status, router, searchParams]);

  async function loadInterview(interviewId: string) {
    setLoading(true);
    setShowContinue(false);
    setShowNewChat(false);
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

  async function initializeInterview(skipContinue = false) {
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
      const response = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (data.interview) {
        setInterview(data.interview);
        // Check if the interview has actual user messages (not just AI opening)
        const hasUserMessages = data.messages?.some((m: Message) => m.role === 'user');
        if (skipContinue) {
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages);
          } else {
            await getOpeningMessage(data.interview.id);
          }
        } else if (hasUserMessages) {
          // Show continue screen — compute the title from messages
          const title = generateChatTitle(data.messages);
          setLastChatTitle(title !== 'New Chat' ? title : null);
          setShowContinue(true);
        } else {
          // No user messages - show new chat landing
          setShowNewChat(true);
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
    sessionStorage.setItem('hasSeenContinue', 'true');
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

  async function handleStartNewChat() {
    setShowNewChat(false);
    setShowContinue(false);
    sessionStorage.setItem('hasSeenContinue', 'true');
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
        if (data.messages) setMessages(data.messages);
        else await getOpeningMessage(data.interview.id);
      }
    } catch (error) {
      console.error('Failed to start new:', error);
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
    // Show new chat landing page instead of immediately starting
    setMessages([]);
    setShowContinue(false);
    setShowNewChat(true);
    setInitializing(false);
  }

  // Detect Hebrew text for RTL
  const isHebrew = (text: string) => /[\u0590-\u05FF]/.test(text);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500">Loading...</span>
        </div>
      </div>
    );
  }

  // Show a subtle loading state while initializing (no full-page jump)
  if (initializing) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6">
            <div className="flex flex-col items-start justify-center py-12 sm:py-20 max-w-md mx-auto">
              <div className="h-6 w-32 bg-slate-100 rounded animate-pulse mb-3" />
              <div className="h-8 w-64 bg-slate-100 rounded animate-pulse mb-10" />
              <div className="h-12 w-48 bg-slate-100 rounded-xl animate-pulse" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Landing pages (Continue or New Chat)
  const showLanding = (showContinue || showNewChat) && messages.length === 0;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Messages area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* Continue Landing Page */}
          {showLanding && showContinue && (
            <div className="flex flex-col items-start justify-center py-12 sm:py-20 max-w-md mx-auto">
              {/* Greeting - no logo */}
              <p className="text-lg font-medium text-slate-600 mb-2">
                Hi {session?.user?.name || 'there'}
              </p>

              {/* Subtitle - same font, bigger size */}
              <p className="text-2xl font-medium text-slate-600 mb-3">
                Let&apos;s continue last chat
              </p>

              {/* Last chat title in primary color */}
              {lastChatTitle && (
                <p className="text-lg font-semibold text-primary mb-8">
                  {lastChatTitle}
                </p>
              )}
              {!lastChatTitle && <div className="mb-8" />}

              {/* Continue last chat button */}
              <button
                onClick={handleContinueChat}
                className="px-10 py-4 bg-primary hover:bg-primary-dark text-white rounded-xl transition font-semibold text-lg mb-6 shadow-sm"
              >
                Continue last chat
              </button>

              {/* "or" divider */}
              <p className="text-sm text-slate-400 mb-6">or</p>

              {/* Quick Actions */}
              <div className="flex flex-col items-start gap-3">
                <Link
                  href="/upload"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Upload a Story
                </Link>
                <Link
                  href="/upload"
                  className="flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Upload Photos
                </Link>
                <Link
                  href="/share"
                  className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Your Story
                </Link>
                <Link
                  href="/share"
                  className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share Memories
                </Link>
              </div>
            </div>
          )}

          {/* New Chat Landing Page */}
          {showLanding && showNewChat && (
            <div className="flex flex-col items-start justify-center py-12 sm:py-20 max-w-lg mx-auto w-full">
              {/* Greeting - no logo */}
              <p className="text-lg font-medium text-slate-600 mb-2">
                Hi {session?.user?.name || 'there'}
              </p>

              {/* Prompt */}
              <p className="text-2xl font-medium text-slate-600 mb-8">
                {NEW_CHAT_PROMPT}
              </p>

              {/* Chat input textarea — replaces the button */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!input.trim()) return;
                  const userMessage = input.trim();
                  setInput('');
                  // Start a new chat and immediately send the first message
                  setShowNewChat(false);
                  sessionStorage.setItem('hasSeenContinue', 'true');
                  setInitializing(true);
                  try {
                    const response = await fetch('/api/interview/chat', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ startNew: true }),
                    });
                    const data = await response.json();
                    if (data.interview) {
                      setInterview(data.interview);
                      setMessages([{ role: 'user', content: userMessage }]);
                      setInitializing(false);
                      setLoading(true);
                      setSaveStatus('saving');
                      const chatRes = await fetch('/api/interview/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ interviewId: data.interview.id, message: userMessage }),
                      });
                      const chatData = await chatRes.json();
                      if (chatData.messages) {
                        setMessages(chatData.messages);
                        setCanUndo(true);
                        setSaveStatus('saved');
                        setTimeout(() => setSaveStatus('idle'), 2000);
                      }
                      setLoading(false);
                    }
                  } catch (error) {
                    console.error('Failed to start chat:', error);
                    setInitializing(false);
                    setLoading(false);
                  }
                }}
                className="w-full mb-6"
              >
                <textarea
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      e.currentTarget.form?.requestSubmit();
                    }
                  }}
                  placeholder="Share your memories..."
                  rows={3}
                  dir={isHebrew(input) ? 'rtl' : undefined}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none text-slate-800 resize-none text-base leading-relaxed"
                  style={{ minHeight: '100px' }}
                />
              </form>

              {/* Upload buttons — same line, small light buttons */}
              <div className="flex items-center gap-3 mb-4">
                <Link
                  href="/upload"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 rounded-full hover:bg-slate-100 transition"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Upload a Story
                </Link>
                <Link
                  href="/upload"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 rounded-full hover:bg-slate-100 transition"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Upload Photos
                </Link>
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <div className="space-y-6">
            {messages.map((msg, i) => {
              const rtl = isHebrew(msg.content);
              return (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 12v3M12 10c-1.5 0-2.5-1-2.5-2.5S10.5 5 12 5s2.5 1 2.5 2.5S13.5 10 12 10z" />
                          </svg>
                        </div>
                        <span className="text-xs font-medium text-slate-500">My Story</span>
                      </div>
                    )}
                    <div className={`px-4 py-3 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-blue-50 text-slate-800 rounded-br-md'
                        : 'text-slate-700'
                    }`}>
                      <p
                        className={`text-[15px] leading-relaxed whitespace-pre-wrap ${rtl ? 'text-right' : ''}`}
                        dir={rtl ? 'rtl' : undefined}
                      >
                        {msg.content}
                      </p>
                      {msg.audioUrl && (
                        <audio src={msg.audioUrl} controls className="mt-2 w-full h-10" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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

      {/* Input - hide when on landing pages */}
      {!showLanding && (
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

            {/* Top row: textarea + send button */}
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

              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-3 bg-primary hover:bg-primary-dark text-white rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>

            {/* Bottom row: mic, record, lang, new ... undo, save */}
            <div className="flex items-center justify-between mt-3 px-1">
              <div className="flex items-center gap-2">
                {/* Voice to text (mic) */}
                <button
                  type="button"
                  onClick={toggleListening}
                  disabled={!speechSupported || isRecordingAudio}
                  title="Voice to text"
                  className={`p-2 rounded-lg transition ${
                    !speechSupported || isRecordingAudio
                      ? 'text-slate-200 cursor-not-allowed'
                      : isListening
                        ? 'bg-red-500 text-white'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>

                {/* Record voice memo */}
                <button
                  type="button"
                  onClick={isRecordingAudio ? stopAudioRecording : startAudioRecording}
                  disabled={isListening}
                  title="Record voice memo"
                  className={`p-2 rounded-lg transition ${
                    isListening
                      ? 'text-slate-200 cursor-not-allowed'
                      : isRecordingAudio
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <svg className="w-4 h-4" fill={isRecordingAudio ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth={2} />
                    {isRecordingAudio ? (
                      <rect x="9" y="9" width="6" height="6" rx="1" />
                    ) : (
                      <circle cx="12" cy="12" r="4" fill="currentColor" />
                    )}
                  </svg>
                </button>

                {/* Hebrew toggle */}
                <button
                  type="button"
                  onClick={() => setVoiceLang(voiceLang === 'he-IL' ? '' : 'he-IL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    voiceLang === 'he-IL'
                      ? 'bg-primary/10 text-primary'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  He
                </button>

                {/* New chat */}
                <button
                  onClick={startNewInterview}
                  className="text-xs text-slate-400 hover:text-primary transition"
                >
                  New
                </button>
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
      )}
    </div>
  );
}
