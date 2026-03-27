import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { chat, extractFromLastExchange, type Message, type LifePeriod, type LifeEventSummary, type UsageInfo } from '@/lib/claude';
import { validateStringLength } from '@/lib/validation';

// Helper to save API usage
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

// GET /api/interview/chat - Get list of all interviews
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const interviews = await prisma.interview.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        currentPeriod: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        conversationLog: true,
      },
    });

    // Add message count and topic-based preview, filter out empty chats
    const interviewsWithPreview = interviews.map(interview => {
      let messageCount = 0;
      let preview = '';
      try {
        const messages = JSON.parse(interview.conversationLog || '[]') as { role: string; content: string }[];
        messageCount = messages.length;

        // Generate a meaningful conversation name from user messages
        const userMessages = messages
          .filter((m) => m.role === 'user')
          .map((m) => m.content)
          .slice(0, 5); // Look at first 5 user messages

        if (userMessages.length > 0) {
          const combined = userMessages.join(' ').toLowerCase();

          // Topic keywords to look for (all labels are 3 words)
          const topicPatterns: [RegExp, string][] = [
            [/\b(mom|mother|mama|ima)\b/i, 'Memories of Mom'],
            [/\b(dad|father|papa|abba|aba)\b/i, 'Memories of Dad'],
            [/\b(grandm|grandmother|grandpa|grandfather|savta|saba)\b/i, 'Stories of Grandparents'],
            [/\b(brother|sister|sibling)\b/i, 'My Sibling Stories'],
            [/\b(school|teacher|class|university|college)\b/i, 'My School Days'],
            [/\b(childhood|growing up|kid|young)\b/i, 'My Childhood Memories'],
            [/\b(wedding|marriage|married|wife|husband)\b/i, 'Our Marriage Story'],
            [/\b(army|military|service|soldier)\b/i, 'My Military Service'],
            [/\b(immigrat|moved to|came to|left.*country)\b/i, 'My Immigration Story'],
            [/\b(cook|food|recipe|kitchen|meal)\b/i, 'Food and Cooking'],
            [/\b(work|job|career|office|business)\b/i, 'My Career Path'],
            [/\b(travel|trip|visit|vacation)\b/i, 'My Travel Stories'],
            [/\b(war|conflict|survived)\b/i, 'My Wartime Memories'],
            [/\b(music|song|sing|play|instrument)\b/i, 'My Music Memories'],
            [/\b(sport|game|team|play)\b/i, 'My Sports Memories'],
            [/\b(friend|friendship|best friend)\b/i, 'Friends and Bonds'],
            [/\b(home|house|apartment|neighborhood|street)\b/i, 'My Home Memories'],
            [/\b(birth|born|baby|pregnan)\b/i, 'Our Family Beginnings'],
          ];

          for (const [pattern, label] of topicPatterns) {
            if (pattern.test(combined)) {
              preview = label;
              break;
            }
          }

          // Fallback: first 3 words of first user message
          if (!preview) {
            preview = userMessages[0].split(/\s+/).slice(0, 3).join(' ');
          }
        }
      } catch {
        // ignore
      }
      return {
        id: interview.id,
        currentPeriod: interview.currentPeriod,
        status: interview.status,
        createdAt: interview.createdAt,
        updatedAt: interview.updatedAt,
        messageCount,
        preview,
      };
    });

    // Filter out chats with no user messages (empty chats)
    const nonEmptyInterviews = interviewsWithPreview.filter(i => {
      // Keep chats that have a preview (meaning at least one user message was found)
      return i.preview !== '';
    });

    return NextResponse.json({ interviews: nonEmptyInterviews });
  } catch (error) {
    console.error('Get interviews error:', error);
    return NextResponse.json({ error: 'Failed to get interviews' }, { status: 500 });
  }
}

// POST /api/interview/chat - Send a message and get AI response
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { interviewId, message, startNew, saveOpening, chatContext } = await request.json();

    // Validate message length
    if (message) {
      const msgError = validateStringLength(message, 'message', 5000);
      if (msgError) return NextResponse.json({ error: msgError }, { status: 400 });
    }

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

      // If loading a specific interview, make it active and pause others
      if (interview.status !== 'active') {
        await prisma.interview.updateMany({
          where: {
            userId: session.user.id,
            status: 'active',
          },
          data: {
            status: 'paused',
          },
        });

        // Update and refetch to ensure we have latest data
        interview = await prisma.interview.update({
          where: { id: interviewId },
          data: { status: 'active' },
          include: {
            _count: { select: { extractedEvents: true } },
          },
        });
      }
    } else if (startNew) {
      // Check if there's an active interview with no user messages
      const activeInterview = await prisma.interview.findFirst({
        where: {
          userId: session.user.id,
          status: 'active',
        },
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: { select: { extractedEvents: true } },
        },
      });

      if (activeInterview) {
        // Check if it has any user messages
        let hasUserMessages = false;
        try {
          const msgs = JSON.parse(activeInterview.conversationLog || '[]') as Message[];
          hasUserMessages = msgs.some(m => m.role === 'user');
        } catch {
          hasUserMessages = false;
        }

        if (!hasUserMessages) {
          // Use this empty conversation instead of creating a new one
          interview = activeInterview;
        } else {
          // Has user messages, create a new one
          await prisma.interview.updateMany({
            where: {
              userId: session.user.id,
              status: 'active',
            },
            data: {
              status: 'paused',
            },
          });

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
      } else {
        // No active interview, create one
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
      const rawLog = interview.conversationLog || '[]';
      console.log('Raw conversationLog length:', rawLog.length, 'chars');
      previousMessages = JSON.parse(rawLog);
      console.log('Parsed messages:', previousMessages.length);
    } catch (e) {
      console.error('Failed to parse conversationLog:', e);
      previousMessages = [];
    }

    // Load recent life events for this user (limited for performance)
    const allLifeEventsRaw = await prisma.lifeEvent.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Convert to summary format for Claude
    const allLifeEvents: LifeEventSummary[] = allLifeEventsRaw.map(event => ({
      title: event.title,
      description: event.description,
      period: event.period,
      category: event.category,
      emotions: event.emotions,
    }));

    // Load recent other interviews to create conversation summaries (limited for performance)
    const otherInterviews = await prisma.interview.findMany({
      where: {
        userId: session.user.id,
        id: { not: interview.id },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: { conversationLog: true },
    });

    // Create summaries from past conversations
    const pastConversationSummaries: string[] = [];
    for (const pastInterview of otherInterviews) {
      try {
        const pastMessages = JSON.parse(pastInterview.conversationLog || '[]') as Message[];
        if (pastMessages.length > 0) {
          // Create a meaningful summary including key exchanges
          const summary = pastMessages
            .map(m => `${m.role === 'user' ? userName : 'You'}: ${m.content.substring(0, 150)}${m.content.length > 150 ? '...' : ''}`)
            .slice(0, 6) // Max 6 messages per conversation
            .join('\n');
          if (summary) {
            pastConversationSummaries.push(summary);
          }
        }
      } catch {
        // Skip invalid conversation logs
      }
    }

    const context = {
      userName,
      currentPeriod: interview.currentPeriod as LifePeriod,
      previousMessages,
      extractedEventsCount: interview._count.extractedEvents,
      allLifeEvents,
      pastConversationSummaries,
      birthDate: user.profile?.birthDate,
      birthPlace: user.profile?.birthPlace,
      language: user.profile?.language,
    };

    let response: string;
    let updatedMessages: Message[];

    if (saveOpening && interviewId) {
      // Client-side hardcoded opening — just save it to the conversation log
      updatedMessages = [{ role: 'assistant' as const, content: saveOpening }];
      await prisma.interview.update({
        where: { id: interview.id },
        data: { conversationLog: JSON.stringify(updatedMessages) },
      });
      return NextResponse.json({
        interview: { id: interview.id, currentPeriod: interview.currentPeriod, status: interview.status },
        messages: updatedMessages,
      });
    } else if (!message && previousMessages.length === 0) {
      // Starting fresh with no message — return empty (opening is handled client-side now)
      return NextResponse.json({
        interview: { id: interview.id, currentPeriod: interview.currentPeriod, status: interview.status },
        messages: [],
      });
    } else if (message) {
      // Continue conversation
      const result = await chat(message, context);
      response = result.response;
      updatedMessages = result.messages;
      // Save usage
      await saveUsage(session.user.id, result.usage, 'chat');
    } else {
      // No message provided - return current state with existing messages
      console.log('Returning existing conversation with', previousMessages.length, 'messages');
      return NextResponse.json({
        interview: {
          id: interview.id,
          currentPeriod: interview.currentPeriod,
          status: interview.status,
        },
        messages: previousMessages,
        messageCount: previousMessages.length,
      });
    }

    // Update interview with new conversation
    await prisma.interview.update({
      where: { id: interview.id },
      data: {
        conversationLog: JSON.stringify(updatedMessages),
      },
    });

    // Auto-extract life events from the last exchange (fire and forget — don't block response)
    if (message && response) {
      extractFromLastExchange(message, response, userName)
        .then(async (result) => {
          if (result.events.length > 0) {
            for (const event of result.events) {
              try {
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
              } catch (e) {
                console.error('Failed to save extracted event:', e);
              }
            }
            // Save extraction usage
            await saveUsage(session.user.id, result.usage, 'auto-extract');
          }
        })
        .catch((err) => console.error('Auto-extraction failed:', err));
    }

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

// Helper to parse vague dates
function tryParseDate(dateStr: string): Date | null {
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
    // Try year-only
    const yearMatch = dateStr.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) return new Date(parseInt(yearMatch[0]), 0, 1);
    return null;
  } catch {
    return null;
  }
}
