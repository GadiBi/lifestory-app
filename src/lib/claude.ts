import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Claude Sonnet pricing (per 1M tokens)
const PRICING = {
  'claude-sonnet-4-20250514': {
    input: 3.00,  // $3 per 1M input tokens
    output: 15.00, // $15 per 1M output tokens
  },
};

// Calculate cost in USD
function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = PRICING[model as keyof typeof PRICING] || PRICING['claude-sonnet-4-20250514'];
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}

// Usage tracking info
export interface UsageInfo {
  inputTokens: number;
  outputTokens: number;
  model: string;
  costUsd: number;
}

// Life periods for structured interviewing
export const LIFE_PERIODS = [
  { id: 'early_childhood', label: 'Early Childhood (0-5)', description: 'First memories, family dynamics, early experiences' },
  { id: 'childhood', label: 'Childhood (6-12)', description: 'School years, friendships, hobbies, family life' },
  { id: 'teenage', label: 'Teenage Years (13-19)', description: 'Adolescence, high school, identity formation' },
  { id: 'young_adult', label: 'Young Adulthood (20-35)', description: 'Career beginnings, relationships, major decisions' },
  { id: 'middle_adult', label: 'Middle Adulthood (36-55)', description: 'Career growth, family, life changes' },
  { id: 'later_adult', label: 'Later Adulthood (56+)', description: 'Wisdom, reflection, legacy' },
] as const;

export type LifePeriod = typeof LIFE_PERIODS[number]['id'];

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface LifeEventSummary {
  title: string;
  description: string;
  period?: string | null;
  category?: string | null;
  emotions?: string | null;
}

export interface ConversationContext {
  userName: string;
  currentPeriod: LifePeriod;
  previousMessages: Message[];
  extractedEventsCount: number;
  // All life events from all past interviews
  allLifeEvents: LifeEventSummary[];
  // Summaries from all past conversations
  pastConversationSummaries: string[];
  // User profile info
  birthDate?: Date | null;
  birthPlace?: string | null;
  language?: string | null;
}

// Language names for system prompt
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  ar: 'Arabic',
  he: 'Hebrew',
  hi: 'Hindi',
  pl: 'Polish',
  nl: 'Dutch',
  tr: 'Turkish',
  uk: 'Ukrainian',
};

// System prompt for the biographer persona
function buildSystemPrompt(context: ConversationContext): string {
  const periodInfo = LIFE_PERIODS.find(p => p.id === context.currentPeriod);
  const langName = context.language ? LANGUAGE_NAMES[context.language] || context.language : null;

  // Build memory from past conversations
  let memorySection = '';

  // Add past conversation summaries
  if (context.pastConversationSummaries && context.pastConversationSummaries.length > 0) {
    memorySection = `\n\nYOUR MEMORY FROM PAST CONVERSATIONS WITH ${context.userName.toUpperCase()}:\n`;
    memorySection += `You've had ${context.pastConversationSummaries.length} previous conversation(s). Here's what was discussed:\n\n`;
    context.pastConversationSummaries.forEach((summary, index) => {
      memorySection += `Conversation ${index + 1}:\n${summary}\n\n`;
    });
  }

  // Add extracted life events
  if (context.allLifeEvents.length > 0) {
    const eventsByPeriod: Record<string, LifeEventSummary[]> = {};
    context.allLifeEvents.forEach(event => {
      const period = event.period || 'unknown';
      if (!eventsByPeriod[period]) eventsByPeriod[period] = [];
      eventsByPeriod[period].push(event);
    });

    memorySection += `\nKEY LIFE EVENTS YOU'VE DOCUMENTED:\n`;
    for (const [period, events] of Object.entries(eventsByPeriod)) {
      const periodLabel = LIFE_PERIODS.find(p => p.id === period)?.label || period;
      memorySection += `${periodLabel}:\n`;
      events.forEach(event => {
        memorySection += `- ${event.title}: ${event.description}`;
        if (event.emotions) memorySection += ` (${event.emotions})`;
        memorySection += '\n';
      });
    }
  }

  // User profile info
  let profileSection = '';
  if (context.birthDate || context.birthPlace) {
    profileSection = '\n\nABOUT THEM:\n';
    if (context.birthDate) {
      profileSection += `- Born: ${context.birthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n`;
    }
    if (context.birthPlace) {
      profileSection += `- From: ${context.birthPlace}\n`;
    }
  }

  return `You are a deeply empathetic storyteller and biographer, helping ${context.userName} uncover and preserve their life story. You're like a trusted friend who has a gift for drawing out meaningful stories - warm, genuinely curious, and emotionally intelligent.
${profileSection}${memorySection}
Currently exploring: ${periodInfo?.label || context.currentPeriod}

YOUR APPROACH - THE ART OF DEEP LISTENING:

1. EMOTIONAL ATTUNEMENT
   - Notice emotional undertones in what they share
   - When they mention a person, ask about the relationship dynamics
   - When they describe an event, explore how it shaped them
   - Gently probe: "What was going through your mind when...?"

2. FOLLOW THE THREAD
   - Pick up on specific details they mention and dig deeper
   - If they mention a sibling, ask about their bond
   - If they mention a place, ask what it meant to them
   - Connect current stories to things they've shared before

3. SENSORY RICHNESS
   - Ask about sights, sounds, smells that stick with them
   - "Can you picture yourself back there? What do you see?"
   - "What did that moment feel like in your body?"

4. MEANING & TRANSFORMATION
   - Explore turning points: "Did that change something for you?"
   - Ask about lessons: "What did that teach you about yourself?"
   - Uncover themes: "That reminds me of the resilience you showed when..."

CONVERSATIONAL STYLE:
- Warm, natural, like coffee with an old friend
- Short responses (2-4 sentences max)
- ONE thoughtful question at a time
- React genuinely: surprise, laughter, tenderness
- Use their exact words back to them sometimes

SOPHISTICATED FOLLOW-UPS (use these patterns):
- "You mentioned [specific detail] - I'm curious about..."
- "It sounds like [person] really meant something to you. What was special about them?"
- "That's fascinating - what do you think drew you to that?"
- "There's something in your voice when you talk about... Tell me more?"
- "If you could go back to that moment and give yourself advice, what would it be?"

NEVER DO:
- Generic questions ("How did that make you feel?")
- Therapist speak ("Thank you for sharing")
- Ask about what they already told you
- Long monologues
- Repeat question patterns

LANGUAGE: ${langName ? `Speak in ${langName}. This is their preferred language.` : 'Match the language they use. If they write in Hebrew, respond in Hebrew. If Spanish, Spanish. etc.'}

${(context.allLifeEvents.length > 0 || (context.pastConversationSummaries && context.pastConversationSummaries.length > 0)) ? `CRITICAL: You have rich memory of past conversations above. Use this! Reference specific stories they've told, ask follow-up questions about people and places they mentioned, notice patterns in their life. You are their biographer - show that you truly know them.` : ''}

${context.extractedEventsCount > 0 ? `(Together, you've documented ${context.extractedEventsCount} meaningful moments from their life)` : ''}

Begin by warmly greeting them and asking a thoughtful, specific question about their ${periodInfo?.label || 'life journey'}.`;
}

// Main function to chat with Claude
export async function chat(
  userMessage: string,
  context: ConversationContext
): Promise<{ response: string; messages: Message[]; usage: UsageInfo }> {
  const systemPrompt = buildSystemPrompt(context);
  const model = 'claude-sonnet-4-20250514';

  // Build messages array for Claude
  const messages = [
    ...context.previousMessages,
    { role: 'user' as const, content: userMessage },
  ];

  const response = await anthropic.messages.create({
    model,
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
  });

  const assistantMessage = response.content[0].type === 'text'
    ? response.content[0].text
    : '';

  const updatedMessages: Message[] = [
    ...messages,
    { role: 'assistant', content: assistantMessage },
  ];

  // Track usage
  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;
  const costUsd = calculateCost(model, inputTokens, outputTokens);

  return {
    response: assistantMessage,
    messages: updatedMessages,
    usage: {
      inputTokens,
      outputTokens,
      model,
      costUsd,
    },
  };
}

// Function to extract life events from conversation
export async function extractLifeEvents(
  conversationHistory: Message[],
  userName: string
): Promise<{
  events: Array<{
    title: string;
    description: string;
    period?: string;
    category?: string;
    emotions?: string;
    approximateDate?: string;
  }>;
  usage: UsageInfo;
}> {
  const model = 'claude-sonnet-4-20250514';
  const conversationText = conversationHistory
    .map(m => `${m.role === 'user' ? userName : 'Interviewer'}: ${m.content}`)
    .join('\n\n');

  const response = await anthropic.messages.create({
    model,
    max_tokens: 2048,
    system: `You are an expert at analyzing interview transcripts and extracting discrete life events.

Your task is to identify specific life events, memories, or experiences mentioned in the conversation.
For each event, extract:
- title: A brief, descriptive title (5-10 words)
- description: A rich description of the event (2-4 sentences)
- period: The life period (early_childhood, childhood, teenage, young_adult, middle_adult, later_adult)
- category: One of: family, education, career, relationship, achievement, challenge, milestone, travel, health, other
- emotions: Key emotions associated with this event
- approximateDate: Any date/year mentioned or inferred (can be vague like "summer 1995" or "early teens")

Only extract events that are clearly described with enough detail. Skip vague mentions.
Return a JSON array of events. If no clear events found, return an empty array.`,
    messages: [
      {
        role: 'user',
        content: `Please analyze this interview transcript and extract any life events mentioned:\n\n${conversationText}\n\nReturn ONLY a valid JSON array, no other text.`,
      },
    ],
  });

  const responseText = response.content[0].type === 'text' ? response.content[0].text : '[]';

  // Track usage
  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;
  const costUsd = calculateCost(model, inputTokens, outputTokens);

  const usage: UsageInfo = {
    inputTokens,
    outputTokens,
    model,
    costUsd,
  };

  try {
    // Extract JSON from response (handle potential markdown code blocks)
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return { events: JSON.parse(jsonMatch[0]), usage };
    }
    return { events: [], usage };
  } catch {
    console.error('Failed to parse event extraction response:', responseText);
    return { events: [], usage };
  }
}

// Function to start a new interview with an opening message
export async function getOpeningMessage(context: ConversationContext): Promise<{ message: string; usage: UsageInfo }> {
  const model = 'claude-sonnet-4-20250514';
  const systemPrompt = buildSystemPrompt(context);

  // If user has previous events, acknowledge their return
  const userPrompt = context.allLifeEvents.length > 0
    ? 'The user is returning for another session. Welcome them back warmly, briefly reference something you remember about them from past conversations, and ask a thoughtful question to continue exploring their life story.'
    : 'Please begin the interview with a warm greeting and your first question.';

  const response = await anthropic.messages.create({
    model,
    max_tokens: 512,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  });

  const message = response.content[0].type === 'text' ? response.content[0].text : '';

  // Track usage
  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;
  const costUsd = calculateCost(model, inputTokens, outputTokens);

  return {
    message,
    usage: {
      inputTokens,
      outputTokens,
      model,
      costUsd,
    },
  };
}

export default anthropic;
