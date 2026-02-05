import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/interview/[id] - Get a specific interview
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const interview = await prisma.interview.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        extractedEvents: true,
      },
    });

    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    return NextResponse.json({ interview });
  } catch (error) {
    console.error('Interview GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/interview/[id] - Update interview (conversation log, period, status)
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { conversationLog, currentPeriod, status } = await request.json();

    // Verify ownership
    const existingInterview = await prisma.interview.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingInterview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    const interview = await prisma.interview.update({
      where: { id },
      data: {
        ...(conversationLog !== undefined && {
          conversationLog: typeof conversationLog === 'string'
            ? conversationLog
            : JSON.stringify(conversationLog)
        }),
        ...(currentPeriod !== undefined && { currentPeriod }),
        ...(status !== undefined && { status }),
      },
    });

    return NextResponse.json({ interview });
  } catch (error) {
    console.error('Interview PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/interview/[id] - Delete an interview
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const existingInterview = await prisma.interview.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingInterview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    // Delete associated events first, then the interview
    await prisma.lifeEvent.deleteMany({
      where: { interviewId: id },
    });

    await prisma.interview.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Interview deleted successfully' });
  } catch (error) {
    console.error('Interview DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
