import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { chat, getOpeningMessage, type Message, type LifePeriod, type LifeEventSummary, type UsageInfo } from '@/lib/claude';

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

    // Add message count and topic-based preview to each interview
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
          // Combine user messages and extract key topics
          const combined = userMessages.join(' ').toLowerCase();

          // Try to find proper nouns, places, people names from original text
          const originalCombined = userMessages.join(' ');
          const properNouns = originalCombined.match(/\b[A-Z][a-z]{2,}\b/g) || [];
          const uniqueProperNouns = [...new Set(properNouns)].filter(
            n => !['The', 'And', 'But', 'For', 'Not', 'You', 'She', 'His', 'Her', 'Was', 'Are', 'They', 'This', 'That', 'Would', 'Could', 'Should', 'Have', 'Been', 'When', 'What', 'How', 'Who', 'Why', 'Where'].includes(n)
          );

          // Topic keywords to look for
          const topicPatterns: [RegExp, string][] = [
            [/\b(mom|mother|mama|ima)\b/i, 'Mom'],
            [/\b(dad|father|papa|abba|aba)\b/i, 'Dad'],
            [/\b(grandm|grandmother|grandpa|grandfather|savta|saba)\b/i, 'Grandparents'],
            [/\b(brother|sister|sibling)\b/i, 'Siblings'],
            [/\b(school|teacher|class|university|college)\b/i, 'School days'],
            [/\b(childhood|growing up|kid|young)\b/i, 'Childhood'],
            [/\b(wedding|marriage|married|wife|husband)\b/i, 'Marriage'],
            [/\b(army|military|service|soldier)\b/i, 'Military service'],
            [/\b(immigrat|moved to|came to|left.*country)\b/i, 'Immigration'],
            [/\b(cook|food|recipe|kitchen|meal)\b/i, 'Food & cooking'],
            [/\b(work|job|career|office|business)\b/i, 'Career'],
            [/\b(travel|trip|visit|vacation)\b/i, 'Travel'],
            [/\b(war|conflict|survived)\b/i, 'Wartime'],
            [/\b(music|song|sing|play|instrument)\b/i, 'Music'],
            [/\b(sport|game|team|play)\b/i, 'Sports'],
            [/\b(friend|friendship|best friend)\b/i, 'Friendships'],
            [/\b(home|house|apartment|neighborhood|street)\b/i, 'Home'],
            [/\b(birth|born|baby|pregnan)\b/i, 'Family beginnings'],
          ];

          const matchedTopics: string[] = [];
          for (const [pattern, label] of topicPatterns) {
            if (pattern.test(combined)) {
              matchedTopics.push(label);
            }
          }

          // Build the preview name
          if (uniqueProperNouns.length > 0 && matchedTopics.length > 0) {
            // Combine a proper noun with a topic: "Mom - Growing up in Tel Aviv"
            const place = uniqueProperNouns.find(n => n.length > 3) || uniqueProperNouns[0];
            preview = `${matchedTopics[0]} - ${place}`;
          } else if (matchedTopics.length > 0) {
            preview = matchedTopics.slice(0, 2).join(' & ');
          } else if (uniqueProperNouns.length > 0) {
            preview = `Stories about ${uniqueProperNouns.slice(0, 2).join(' & ')}`;
          } else {
            // Fallback: use first user message truncated
            preview = userMessages[0].substring(0, 40) + (userMessages[0].length > 40 ? '...' : '');
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

    return NextResponse.json({ interviews: interviewsWithPreview });
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

    // Load ALL life events from ALL interviews for this user
    const allLifeEventsRaw = await prisma.lifeEvent.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'asc' },
    });

    // Convert to summary format for Claude
    const allLifeEvents: LifeEventSummary[] = allLifeEventsRaw.map(event => ({
      title: event.title,
      description: event.description,
      period: event.period,
      category: event.category,
      emotions: event.emotions,
    }));

    // Load ALL other interviews to create conversation summaries
    const otherInterviews = await prisma.interview.findMany({
      where: {
        userId: session.user.id,
        id: { not: interview.id }, // Exclude current interview
      },
      orderBy: { createdAt: 'asc' },
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
            .slice(0, 10) // Max 10 messages per conversation
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

    if (!message && previousMessages.length === 0) {
      // Starting fresh - get opening message
      const openingResult = await getOpeningMessage(context);
      response = openingResult.message;
      updatedMessages = [{ role: 'assistant', content: response }];
      // Save usage
      await saveUsage(session.user.id, openingResult.usage, 'opening');
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
