import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/interview/last-active - Get the last interview with user messages
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find all interviews ordered by most recently updated
    const interviews = await prisma.interview.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        currentPeriod: true,
        status: true,
        updatedAt: true,
        conversationLog: true,
      },
    });

    // Find the first interview that has user messages
    for (const interview of interviews) {
      try {
        const messages = JSON.parse(interview.conversationLog || '[]');
        const hasUserMessages = messages.some((m: { role: string }) => m.role === 'user');

        if (hasUserMessages) {
          // Build a short summary from the last few messages
          const recentMessages = messages.slice(-4);
          const preview = recentMessages
            .map((m: { role: string; content: string }) => {
              const prefix = m.role === 'user' ? 'You' : 'AI';
              const text = m.content.substring(0, 60).replace(/\n/g, ' ').trim();
              return `${prefix}: ${text}${m.content.length > 60 ? '...' : ''}`;
            })
            .join(' · ');

          return NextResponse.json({
            interview: {
              id: interview.id,
              currentPeriod: interview.currentPeriod,
              status: interview.status,
              updatedAt: interview.updatedAt,
              messageCount: messages.length,
              preview,
            },
          });
        }
      } catch {
        // Skip interviews with invalid conversation logs
        continue;
      }
    }

    // No interview with user messages found
    return NextResponse.json({ interview: null });
  } catch (error) {
    console.error('Get last active interview error:', error);
    return NextResponse.json({ error: 'Failed to get last active interview' }, { status: 500 });
  }
}
