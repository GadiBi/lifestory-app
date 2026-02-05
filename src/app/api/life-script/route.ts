import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const LIFE_PERIODS_ORDER = [
  'early_childhood',
  'childhood',
  'teenage',
  'young_adult',
  'middle_adult',
  'later_adult',
];

const PERIOD_LABELS: Record<string, string> = {
  early_childhood: 'Early Childhood',
  childhood: 'Childhood',
  teenage: 'Teenage Years',
  young_adult: 'Young Adulthood',
  middle_adult: 'Middle Adulthood',
  later_adult: 'Later Adulthood',
};

// POST /api/life-script - Generate a life script from all events
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { style = 'narrative' } = await request.json();

    // Get user profile
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all life events
    const events = await prisma.lifeEvent.findMany({
      where: { userId: session.user.id },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    });

    if (events.length === 0) {
      return NextResponse.json(
        { error: 'No life events found. Complete some interviews first.' },
        { status: 400 }
      );
    }

    // Organize events by period
    const eventsByPeriod = LIFE_PERIODS_ORDER.map((periodId) => ({
      period: periodId,
      label: PERIOD_LABELS[periodId],
      events: events.filter((e) => e.period === periodId),
    })).filter((group) => group.events.length > 0);

    // Format events for the prompt
    const eventsText = eventsByPeriod
      .map((group) => {
        const periodEvents = group.events
          .map((e) => {
            let eventText = `- ${e.title}: ${e.description}`;
            if (e.date) {
              eventText += ` (${new Date(e.date).getFullYear()})`;
            }
            if (e.emotions) {
              eventText += ` [Emotions: ${e.emotions}]`;
            }
            return eventText;
          })
          .join('\n');
        return `## ${group.label}\n${periodEvents}`;
      })
      .join('\n\n');

    const userName = user.profile?.fullName || user.username;
    const birthInfo = user.profile?.birthDate
      ? `Born: ${new Date(user.profile.birthDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
      : '';
    const birthPlace = user.profile?.birthPlace ? `in ${user.profile.birthPlace}` : '';

    // Generate the life script using Claude
    const systemPrompt = `You are a skilled biographer and narrative writer. Your task is to transform a collection of life events into a beautifully written, cohesive life story.

Writing Guidelines:
- Write in third person, referring to the subject by name
- Create smooth transitions between life periods
- Weave individual events into a flowing narrative
- Highlight themes, growth, and character development
- Include sensory details and emotional depth where appropriate
- Maintain a warm, respectful, and celebratory tone
- The biography should feel personal and meaningful
- Format with clear section headings for each life period

Style: ${style === 'poetic' ? 'Use lyrical, evocative language with metaphors and imagery' : style === 'journalistic' ? 'Use clear, factual prose with a documentary feel' : 'Use warm, engaging narrative prose suitable for a memoir'}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Please write a life story biography for ${userName}. ${birthInfo} ${birthPlace}

Here are the documented life events organized by period:

${eventsText}

Create a cohesive, beautifully written biography that brings these moments to life. Include a brief introduction and conclusion that reflects on the journey as a whole.`,
        },
      ],
    });

    const lifeScript =
      response.content[0].type === 'text' ? response.content[0].text : '';

    return NextResponse.json({
      lifeScript,
      metadata: {
        userName,
        totalEvents: events.length,
        periodsIncluded: eventsByPeriod.map((g) => g.label),
        generatedAt: new Date().toISOString(),
        style,
      },
    });
  } catch (error) {
    console.error('Life script generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate life script' },
      { status: 500 }
    );
  }
}

// GET /api/life-script - Get stats about available content
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const events = await prisma.lifeEvent.findMany({
      where: { userId: session.user.id },
      select: { period: true },
    });

    const periodCounts: Record<string, number> = {};
    events.forEach((e) => {
      const period = e.period || 'unknown';
      periodCounts[period] = (periodCounts[period] || 0) + 1;
    });

    return NextResponse.json({
      totalEvents: events.length,
      periodCounts,
      canGenerate: events.length >= 3,
    });
  } catch (error) {
    console.error('Life script stats error:', error);
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 });
  }
}
