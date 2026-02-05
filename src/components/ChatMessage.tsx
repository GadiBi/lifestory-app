'use client';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-md'
            : 'bg-slate-100 text-slate-900 rounded-bl-md'
        }`}
      >
        {!isUser && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-slate-500">LifeStory Agent</span>
          </div>
        )}
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
      </div>
    </div>
  );
}
