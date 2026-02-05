import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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

export interface ConversationContext {
  userName: string;
  currentPeriod: LifePeriod;
  previousMessages: Message[];
  extractedEventsCount: number;
}

// System prompt for the biographer persona
function buildSystemPrompt(context: ConversationContext): string {
  const periodInfo = LIFE_PERIODS.find(p => p.id === context.currentPeriod);

  return `You are a warm, empathetic, and skilled biographer helping ${context.userName} document their life story. Your role is to conduct a thoughtful interview that helps them recall and articulate meaningful memories.

CURRENT FOCUS: ${periodInfo?.label || context.currentPeriod}
${periodInfo?.description || ''}

INTERVIEW GUIDELINES:
1. Ask ONE thoughtful question at a time - don't overwhelm with multiple questions
2. Listen actively and follow up on interesting details they share
3. Be genuinely curious and encouraging
4. Help them explore emotions and significance of events
5. Gently probe for sensory details (what did you see, hear, feel?)
6. Acknowledge their feelings and validate their experiences
7. If they seem hesitant, reassure them there are no wrong answers
8. Occasionally summarize what you've learned to show you're listening

QUESTION TYPES TO USE:
- Open-ended: "What do you remember about...?"
- Follow-up: "You mentioned X - can you tell me more about that?"
- Sensory: "What did that feel/sound/look like?"
- Emotional: "How did that make you feel at the time?"
- Significance: "Why do you think that memory has stayed with you?"

IMPORTANT:
- Keep responses conversational and warm, not clinical
- Don't lecture or give advice unless asked
- If they want to skip a topic, respect that gracefully
- Help them see the value and meaning in their ordinary experiences
- Remember: every life has stories worth telling

${context.extractedEventsCount > 0 ? `\nYou've already helped document ${context.extractedEventsCount} life events in this session. Keep building on what they've shared.` : ''}

Begin by warmly greeting them and asking your first question about their ${periodInfo?.label || 'experiences'}.`;
}

// Main function to chat with Claude
export async function chat(
  userMessage: string,
  context: ConversationContext
): Promise<{ response: string; messages: Message[] }> {
  const systemPrompt = buildSystemPrompt(context);

  // Build messages array for Claude
  const messages = [
    ...context.previousMessages,
    { role: 'user' as const, content: userMessage },
  ];

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
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

  return {
    response: assistantMessage,
    messages: updatedMessages,
  };
}

// Function to extract life events from conversation
export async function extractLifeEvents(
  conversationHistory: Message[],
  userName: string
): Promise<Array<{
  title: string;
  description: string;
  period?: string;
  category?: string;
  emotions?: string;
  approximateDate?: string;
}>> {
  const conversationText = conversationHistory
    .map(m => `${m.role === 'user' ? userName : 'Interviewer'}: ${m.content}`)
    .join('\n\n');

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
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

  try {
    // Extract JSON from response (handle potential markdown code blocks)
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch {
    console.error('Failed to parse event extraction response:', responseText);
    return [];
  }
}

// Function to start a new interview with an opening message
export async function getOpeningMessage(context: ConversationContext): Promise<string> {
  const systemPrompt = buildSystemPrompt(context);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: 'Please begin the interview with a warm greeting and your first question.',
      },
    ],
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}

export default anthropic;
