import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { extractLifeEvents, type Message } from '@/lib/claude';

// POST /api/interview/extract - Extract life events from interview conversation
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { interviewId } = await request.json();

    if (!interviewId) {
      return NextResponse.json({ error: 'Interview ID required' }, { status: 400 });
    }

    // Get interview with user info
    const interview = await prisma.interview.findFirst({
      where: {
        id: interviewId,
        userId: session.user.id,
      },
    });

    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    // Get user name for extraction context
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { profile: true },
    });

    const userName = user?.profile?.fullName || user?.username || 'User';

    // Parse conversation history
    let messages: Message[] = [];
    try {
      messages = JSON.parse(interview.conversationLog || '[]');
    } catch {
      return NextResponse.json({ error: 'Invalid conversation data' }, { status: 400 });
    }

    if (messages.length < 2) {
      return NextResponse.json({
        message: 'Not enough conversation to extract events',
        events: [],
      });
    }

    // Extract events using Claude
    const extractedEvents = await extractLifeEvents(messages, userName);

    // Save extracted events to database
    const savedEvents = [];
    for (const event of extractedEvents) {
      const savedEvent = await prisma.lifeEvent.create({
        data: {
          userId: session.user.id,
          interviewId: interview.id,
          title: event.title,
          description: event.description,
          period: event.period || interview.currentPeriod,
          category: event.category,
          emotions: event.emotions,
          date: event.approximateDate ? tryParseDate(event.approximateDate) : null,
        },
      });
      savedEvents.push(savedEvent);
    }

    return NextResponse.json({
      message: `Extracted ${savedEvents.length} life events`,
      events: savedEvents,
    });
  } catch (error) {
    console.error('Extract error:', error);
    return NextResponse.json(
      { error: 'Failed to extract events' },
      { status: 500 }
    );
  }
}

// Helper function to try parsing various date formats
function tryParseDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  // Try direct parse
  const direct = new Date(dateStr);
  if (!isNaN(direct.getTime())) {
    return direct;
  }

  // Try to extract year
  const yearMatch = dateStr.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    return new Date(`${yearMatch[0]}-01-01`);
  }

  return null;
}
