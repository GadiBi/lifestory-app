import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { extractLifeEvents, type Message, type UsageInfo } from '@/lib/claude';

async function saveUsage(userId: string, usage: UsageInfo, endpoint: string) {
  await prisma.apiUsage.create({
    data: {
      userId,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      model: usage.model,
      endpoint,
      costUsd: usage.costUsd,
    },
  });
}

function tryParseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const direct = new Date(dateStr);
  if (!isNaN(direct.getTime())) return direct;
  const yearMatch = dateStr.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) return new Date(`${yearMatch[0]}-01-01`);
  return null;
}

// POST /api/interview/extract-all - Extract events from ALL past conversations
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { profile: true },
    });
    const userName = user?.profile?.fullName || user?.username || 'User';

    // Get all interviews that have NO extracted events yet
    const interviews = await prisma.interview.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        _count: { select: { extractedEvents: true } },
      },
    });

    const unextracted = interviews.filter(i => i._count.extractedEvents === 0);
    let totalEvents = 0;

    for (const interview of unextracted) {
      let messages: Message[] = [];
      try {
        messages = JSON.parse(interview.conversationLog || '[]');
      } catch {
        continue;
      }

      // Need at least 2 messages (1 user + 1 assistant)
      const hasUserMsg = messages.some(m => m.role === 'user');
      if (messages.length < 2 || !hasUserMsg) continue;

      try {
        const { events: extractedEvents, usage } = await extractLifeEvents(messages, userName);
        await saveUsage(session.user.id, usage, 'extract-all');

        for (const event of extractedEvents) {
          await prisma.lifeEvent.create({
            data: {
              userId: session.user.id,
              interviewId: interview.id,
              title: event.title,
              description: event.description || '',
              period: event.period || interview.currentPeriod,
              category: event.category || null,
              emotions: event.emotions || null,
              date: event.approximateDate ? tryParseDate(event.approximateDate) : null,
              endDate: event.approximateEndDate ? tryParseDate(event.approximateEndDate) : null,
            },
          });
          totalEvents++;
        }
      } catch (err) {
        console.error(`Failed to extract from interview ${interview.id}:`, err);
      }
    }

    return NextResponse.json({
      message: `Extracted ${totalEvents} events from ${unextracted.length} conversations`,
      totalEvents,
      conversationsProcessed: unextracted.length,
    });
  } catch (error) {
    console.error('Extract-all error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
