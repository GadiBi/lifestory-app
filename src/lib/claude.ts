import Anthropic from '@anthropic-ai/sdk';
import { calculateCost } from '@/lib/pricing';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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

  return `You are "Bestie" — a friendly companion helping ${context.userName} capture their life memories. You're like a curious friend having a casual conversation.
${profileSection}${memorySection}

RULES:
- Keep responses SHORT: 1-2 sentences max. Then ONE simple question.
- Be warm but direct. No philosophy, no poetry, no deep reflections.
- Don't analyze or interpret what they say. Just ask the next natural question.
- Follow their lead. They pick the topic, you ask follow-up questions.
- If they mention a person, ask about them. If they mention a place, ask what happened there.
- Use their words, not fancy language. Talk like a normal person.
- Never say "Thank you for sharing", "That must have been...", "What a beautiful...", or any therapist/TV host phrases.
- ONE question per response. Never two. Never zero (unless they're clearly done).
- If they mention something from a past conversation, reference it naturally.

${langName ? `LANGUAGE: Speak in ${langName}.` : 'Match the language they use.'}

${(context.allLifeEvents.length > 0 || (context.pastConversationSummaries && context.pastConversationSummaries.length > 0)) ? `You remember past conversations (see above). Reference them naturally when relevant.` : ''}`;
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
    max_tokens: 300,
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
    approximateEndDate?: string;
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
- approximateDate: Start date/year mentioned or inferred (can be vague like "summer 1995" or "early teens")
- approximateEndDate: End date/year if this event spans a period (e.g. "worked there for 5 years" → endDate is start+5yr). Leave null for one-time events.

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

// Opening messages are now hardcoded per context — no API call needed
export function getHardcodedOpening(userName: string, chatContext?: string): string {
  switch (chatContext) {
    case 'timeline':
      return `Hi ${userName},\nWhich life period would you like to add?`;
    case 'memories':
      return `Hi ${userName},\nWhich memory would you like to explore?`;
    case 'relations':
      return `Hi ${userName},\nWho would you like to tell me about?`;
    case 'lifestory':
      return `Hi ${userName},\nWhich chapter of your life should we capture?`;
    default:
      return `Hi ${userName},\nWhich memory would you like to share?`;
  }
}

// Lightweight extraction from the last user+assistant exchange only
export async function extractFromLastExchange(
  userMsg: string,
  assistantMsg: string,
  userName: string,
): Promise<{
  events: Array<{
    title: string;
    description: string;
    period?: string;
    category?: string;
    emotions?: string;
    approximateDate?: string;
    approximateEndDate?: string;
  }>;
  usage: UsageInfo;
}> {
  const model = 'claude-sonnet-4-20250514';

  const response = await anthropic.messages.create({
    model,
    max_tokens: 1024,
    system: `Extract life events from this conversation exchange. Return a JSON array. Each event needs: title (5-10 words), description (1-2 sentences), period (early_childhood/childhood/teenage/young_adult/middle_adult/later_adult), category (family/education/career/relationship/achievement/challenge/milestone/travel/health/other), emotions, approximateDate (start date if mentioned), approximateEndDate (end date if this spans a period, e.g. "worked there 3 years" → add endDate; null for one-time events). Only extract clearly described events. If none found, return [].`,
    messages: [
      {
        role: 'user',
        content: `${userName}: ${userMsg}\n\nBestie: ${assistantMsg}\n\nReturn ONLY a valid JSON array.`,
      },
    ],
  });

  const responseText = response.content[0].type === 'text' ? response.content[0].text : '[]';
  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;
  const costUsd = calculateCost(model, inputTokens, outputTokens);
  const usage: UsageInfo = { inputTokens, outputTokens, model, costUsd };

  try {
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return { events: JSON.parse(jsonMatch[0]), usage };
    }
    return { events: [], usage };
  } catch {
    return { events: [], usage };
  }
}

export default anthropic;
