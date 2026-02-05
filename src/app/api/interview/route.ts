import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/interview - Get active interview or list all interviews
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    if (activeOnly) {
      // Get the most recent active interview
      const interview = await prisma.interview.findFirst({
        where: {
          userId: session.user.id,
          status: 'active',
        },
        orderBy: { updatedAt: 'desc' },
        include: {
          extractedEvents: true,
        },
      });

      return NextResponse.json({ interview });
    }

    // List all interviews
    const interviews = await prisma.interview.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { extractedEvents: true },
        },
      },
    });

    return NextResponse.json({ interviews });
  } catch (error) {
    console.error('Interview GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/interview - Start a new interview session
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPeriod = 'early_childhood' } = await request.json();

    // Get user profile for personalization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { profile: true },
    });

    // Create initial conversation log
    const initialConversation = JSON.stringify([
      {
        role: 'system',
        content: `You are a warm, empathetic biographer helping ${user?.profile?.fullName || user?.username} document their life story.
        Current focus: ${currentPeriod.replace('_', ' ')}.
        Ask thoughtful questions that encourage reflection and storytelling.
        Be patient, supportive, and genuinely interested in their experiences.`,
      },
    ]);

    const interview = await prisma.interview.create({
      data: {
        userId: session.user.id,
        currentPeriod,
        conversationLog: initialConversation,
        status: 'active',
      },
    });

    return NextResponse.json({ interview }, { status: 201 });
  } catch (error) {
    console.error('Interview POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
