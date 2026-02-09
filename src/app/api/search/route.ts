import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/search - Search across events and conversations
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all'; // all, events, conversations
    const period = searchParams.get('period') || '';
    const category = searchParams.get('category') || '';

    if (!query.trim()) {
      return NextResponse.json({ events: [], conversations: [] });
    }

    const searchTerm = query.toLowerCase();

    // Search life events
    let events: Array<{
      id: string;
      title: string;
      description: string;
      period: string | null;
      category: string | null;
      emotions: string | null;
      date: Date | null;
      createdAt: Date;
    }> = [];

    if (type === 'all' || type === 'events') {
      const whereEvents: {
        userId: string;
        period?: string;
        category?: string;
        OR: Array<{ title: { contains: string; mode: 'insensitive' } } | { description: { contains: string; mode: 'insensitive' } } | { emotions: { contains: string; mode: 'insensitive' } }>;
      } = {
        userId: session.user.id,
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { emotions: { contains: searchTerm, mode: 'insensitive' } },
        ],
      };

      if (period) {
        whereEvents.period = period;
      }
      if (category) {
        whereEvents.category = category;
      }

      events = await prisma.lifeEvent.findMany({
        where: whereEvents,
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    }

    // Search conversations
    let conversations: Array<{
      id: string;
      currentPeriod: string;
      updatedAt: Date;
      matchingMessages: Array<{ role: string; content: string; preview: string }>;
    }> = [];

    if (type === 'all' || type === 'conversations') {
      const interviews = await prisma.interview.findMany({
        where: { userId: session.user.id },
        orderBy: { updatedAt: 'desc' },
      });

      // Search through conversation logs
      for (const interview of interviews) {
        try {
          const messages = JSON.parse(interview.conversationLog || '[]') as Array<{ role: string; content: string }>;
          const matchingMessages = messages
            .filter(m => m.content.toLowerCase().includes(searchTerm))
            .map(m => ({
              role: m.role,
              content: m.content,
              preview: getHighlightedPreview(m.content, searchTerm),
            }));

          if (matchingMessages.length > 0) {
            conversations.push({
              id: interview.id,
              currentPeriod: interview.currentPeriod,
              updatedAt: interview.updatedAt,
              matchingMessages: matchingMessages.slice(0, 3), // Limit to 3 matches per conversation
            });
          }
        } catch {
          // Skip invalid conversation logs
        }
      }
    }

    return NextResponse.json({
      events,
      conversations,
      totalEvents: events.length,
      totalConversations: conversations.length,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}

// Helper to get preview with highlighted search term
function getHighlightedPreview(content: string, searchTerm: string): string {
  const lowerContent = content.toLowerCase();
  const index = lowerContent.indexOf(searchTerm);

  if (index === -1) return content.substring(0, 150) + '...';

  const start = Math.max(0, index - 50);
  const end = Math.min(content.length, index + searchTerm.length + 100);

  let preview = '';
  if (start > 0) preview += '...';
  preview += content.substring(start, end);
  if (end < content.length) preview += '...';

  return preview;
}
