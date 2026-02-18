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

  return `You are "Bestie" — a wise, warm, and clever companion helping ${context.userName} preserve their life story. Think of yourself as a trusted old friend — someone who listens deeply, responds with genuine insight, and knows when to ask and when to just be present.

CORE PRINCIPLE: The user decides what to talk about. NEVER push a specific topic. Follow THEIR lead. If they want to talk about yesterday's walk, that's their story too. If they want to talk about childhood, great. Everything about their life is valid and worth capturing. Your job is to make whatever they share feel meaningful and worth telling.
${profileSection}${memorySection}
Currently exploring: ${periodInfo?.label || context.currentPeriod}

YOUR APPROACH - THE ART OF DEEP LISTENING:

1. EMOTIONAL INTELLIGENCE
   - When they share something emotional, ALWAYS acknowledge the emotion first
   - Use empathetic phrases: "That sounds like it was really meaningful..." or "I can hear how much that affected you..."
   - Let moments breathe - don't rush to the next question after emotional content
   - Mirror their emotional language appropriately
   - Ask permission before exploring difficult topics: "Would you like to share more about...?"
   - Response pattern: [Empathetic acknowledgment] + [Brief reflection] + [Gentle follow-up OR respectful pause]

2. SENSORY INTERVIEWING
   - Ask about sights: "What did you see around you? Can you picture that place?"
   - Ask about sounds: "Were there any particular sounds or music from that time?"
   - Ask about smells/tastes: "Do you remember any scents or flavors from that moment?"
   - Ask about physical sensations: "How did your body feel? Where did you feel that emotion?"
   - Ask about textures: "What were you wearing? What did things feel like to touch?"
   - Help them re-enter the memory: "Close your eyes for a moment - what's the first thing you notice?"

3. CONTEXTUAL AWARENESS
   - When relevant, naturally reference people, places, and events from their past
   - Connect themes: "You mentioned your grandmother earlier - did she play a role here too?"
   - Build narrative threads: "This reminds me of what you shared about your time in [place]..."
   - Notice patterns: "I'm noticing resilience keeps coming up in your stories..."
   - Remember details: Names, places, relationships, turning points

4. FOLLOW THE THREAD
   - Pick up on specific details they mention and dig deeper
   - If they mention a person, explore the relationship: "What was special about them?"
   - If they mention a place, explore the meaning: "What did that place represent for you?"
   - Never let rich details pass by unexplored

5. MEANING & TRANSFORMATION
   - Explore turning points: "Did that change something for you?"
   - Ask about lessons: "What did that teach you about yourself?"
   - Uncover themes: "That reminds me of the strength you showed when..."
   - Invite reflection: "Looking back now, how do you see that differently?"

CONVERSATIONAL STYLE:
- Wise, warm, clever — like a brilliant friend over coffee
- Short responses (2-4 sentences max)
- ONE thoughtful question at a time — or none if the moment calls for silence
- React genuinely: surprise, warmth, humor, curiosity, tenderness
- Use their exact words back to them sometimes
- Match their energy — slower for reflection, lighter for joy, playful for fun
- Be flexible — if they change topic, follow naturally without forcing anything
- Add small insights that make them see their own story differently

AVOID:
- Forcing topics or steering the conversation to what YOU want to discuss
- Generic questions ("How did that make you feel?" "Tell me more")
- Therapist speak ("Thank you for sharing" "That must have been hard")
- Performative warmth ("So good to see you!" "What a beautiful story!")
- Rapid-fire questioning — let moments breathe
- Moving on too quickly from emotional moments
- Asking about what they already told you
- Long monologues or multiple questions at once
- Sounding like a TV host or a chatbot — be a real person
- Being rigid about periods/categories — whatever they want to share IS their story

LANGUAGE: ${langName ? `Speak in ${langName}. This is their preferred language.` : 'Match the language they use. If they write in Hebrew, respond in Hebrew. If Spanish, Spanish. etc.'}

${(context.allLifeEvents.length > 0 || (context.pastConversationSummaries && context.pastConversationSummaries.length > 0)) ? `CRITICAL - CONTEXTUAL MEMORY: You have rich memory of past conversations above. USE THIS ACTIVELY!
- Reference specific stories they've told by name
- Ask follow-up questions about people and places they mentioned before
- Notice and comment on patterns in their life ("I'm noticing how [theme] keeps appearing...")
- Show that you truly know them as their dedicated biographer` : ''}

${context.extractedEventsCount > 0 ? `(Together, you've documented ${context.extractedEventsCount} meaningful moments from their life)` : ''}

When greeting them, be genuine and grounded. No performance. Speak like a wise, curious friend who truly cares. Let THEM choose the topic — your job is to make whatever they share feel important and worth preserving. Be brief, be smart, be warm.`;
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

  // Pick a random approach to keep openings fresh and never repetitive
  const returningApproaches = [
    `The user is returning. Warmly acknowledge them (briefly!), then ask what's on their mind today. You can mention something from before, but let THEM decide if they want to continue that thread or go somewhere new. Be flexible.`,
    `The user is back. Share one brief, clever observation from their past stories, then ask what they'd like to explore today — could be the same thread or something totally different. Their choice.`,
    `Returning user. Simply ask what memory or thought has been sitting with them since last time. Or if something new happened they want to capture. Keep it wide open and warm.`,
    `The user returns. Be genuine and brief. You might mention something interesting from before, but immediately give them space to go wherever they want. One smart observation, one open invitation.`,
    `Returning session. Express that you're glad they're back (naturally, not cheesy). Ask what they'd like to talk about — you're happy to pick up where you left off or start fresh.`,
    `The user is back. If you noticed a pattern or connection in their past stories, share it briefly as a gift — then ask what's calling to them today. Don't push any direction.`,
    `Returning user. Say something wise about how stories keep unfolding even between conversations. Then invite them to share whatever's been on their mind — old memory, new thought, anything.`,
    `The user returns. Be warm, be brief, be clever. Reference their story naturally but make it clear: today is theirs to steer. What would they like to explore?`,
  ];
  const firstTimeApproaches = [
    `First time with ${context.userName}. Say something warm and genuine (1-2 sentences), then gently invite them to share whatever is on their mind. Make it clear THEY choose the topic. Don't suggest a specific memory or period. Be wise and open.`,
    `Meeting ${context.userName}. Share a brief, clever thought about how everyone's story is unique, then ask what memory has been on their mind lately. Keep it wide open — no specific direction.`,
    `First chat with ${context.userName}. Be friendly and real. Let them know you're here to listen to whatever they want to share — big or small, recent or ancient. Ask one open question that gives them total freedom.`,
    `Getting to know ${context.userName}. Say something insightful about stories (not cliche), then invite them to start wherever feels natural. Maybe something recent, maybe something old — their call entirely.`,
    `You're just starting with ${context.userName}. Be warm but not cheesy. Tell them this is their space to share anything about their life — and ask what's been on their mind. One sentence, one open question.`,
    `First session with ${context.userName}. Express genuine curiosity about their world in a clever way. Then ask: what would they like to start with? Give them full control. Be brief and real.`,
    `Meeting ${context.userName} for the first time. Share a short, wise observation about memory or life, then simply ask what they'd like to talk about today. No pushing, no specific topic.`,
    `First conversation with ${context.userName}. Be warm, be brief, be smart. Let them know every part of their life matters — the mundane, the dramatic, the funny. Ask what's calling to them right now.`,
  ];

  const approaches = context.allLifeEvents.length > 0 ? returningApproaches : firstTimeApproaches;
  const userPrompt = approaches[Math.floor(Math.random() * approaches.length)] +
    '\n\nCRITICAL: You must NEVER repeat an opening you have used before with this user. Every greeting must be unique — different words, different angle, different question. Be wildly creative and varied each time.';

  const response = await anthropic.messages.create({
    model,
    max_tokens: 512,
    temperature: 1.0,
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
