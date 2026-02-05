import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { chat, getOpeningMessage, type Message, type LifePeriod } from '@/lib/claude';

// POST /api/interview/chat - Send a message and get AI response
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { interviewId, message, startNew } = await request.json();

    // Get user info for personalization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userName = user.profile?.fullName || user.username;

    // Get or create interview
    let interview;
    if (interviewId) {
      interview = await prisma.interview.findFirst({
        where: {
          id: interviewId,
          userId: session.user.id,
        },
        include: {
          _count: { select: { extractedEvents: true } },
        },
      });

      if (!interview) {
        return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
      }
    } else if (startNew) {
      // Create a new interview
      interview = await prisma.interview.create({
        data: {
          userId: session.user.id,
          currentPeriod: 'early_childhood',
          conversationLog: '[]',
          status: 'active',
        },
        include: {
          _count: { select: { extractedEvents: true } },
        },
      });
    } else {
      // Get active interview or create one
      interview = await prisma.interview.findFirst({
        where: {
          userId: session.user.id,
          status: 'active',
        },
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: { select: { extractedEvents: true } },
        },
      });

      if (!interview) {
        interview = await prisma.interview.create({
          data: {
            userId: session.user.id,
            currentPeriod: 'early_childhood',
            conversationLog: '[]',
            status: 'active',
          },
          include: {
            _count: { select: { extractedEvents: true } },
          },
        });
      }
    }

    // Parse existing conversation
    let previousMessages: Message[] = [];
    try {
      previousMessages = JSON.parse(interview.conversationLog || '[]');
    } catch {
      previousMessages = [];
    }

    const context = {
      userName,
      currentPeriod: interview.currentPeriod as LifePeriod,
      previousMessages,
      extractedEventsCount: interview._count.extractedEvents,
    };

    let response: string;
    let updatedMessages: Message[];

    if (!message && previousMessages.length === 0) {
      // Starting fresh - get opening message
      response = await getOpeningMessage(context);
      updatedMessages = [{ role: 'assistant', content: response }];
    } else if (message) {
      // Continue conversation
      const result = await chat(message, context);
      response = result.response;
      updatedMessages = result.messages;
    } else {
      // No message and has history - just return current state
      return NextResponse.json({
        interview: {
          id: interview.id,
          currentPeriod: interview.currentPeriod,
          status: interview.status,
        },
        messages: previousMessages,
      });
    }

    // Update interview with new conversation
    await prisma.interview.update({
      where: { id: interview.id },
      data: {
        conversationLog: JSON.stringify(updatedMessages),
      },
    });

    return NextResponse.json({
      interview: {
        id: interview.id,
        currentPeriod: interview.currentPeriod,
        status: interview.status,
      },
      response,
      messages: updatedMessages,
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
