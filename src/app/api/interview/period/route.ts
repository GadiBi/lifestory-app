import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { LIFE_PERIODS, type LifePeriod } from '@/lib/claude';

// GET /api/interview/period - Get available life periods
export async function GET() {
  return NextResponse.json({ periods: LIFE_PERIODS });
}

// PUT /api/interview/period - Change current interview period
export async function PUT(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { interviewId, period } = await request.json();

    if (!interviewId || !period) {
      return NextResponse.json(
        { error: 'Interview ID and period required' },
        { status: 400 }
      );
    }

    // Validate period
    const validPeriod = LIFE_PERIODS.find(p => p.id === period);
    if (!validPeriod) {
      return NextResponse.json(
        { error: 'Invalid period' },
        { status: 400 }
      );
    }

    // Verify ownership and update
    const interview = await prisma.interview.findFirst({
      where: {
        id: interviewId,
        userId: session.user.id,
      },
    });

    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    const updated = await prisma.interview.update({
      where: { id: interviewId },
      data: { currentPeriod: period as LifePeriod },
    });

    return NextResponse.json({
      interview: {
        id: updated.id,
        currentPeriod: updated.currentPeriod,
        status: updated.status,
      },
      periodInfo: validPeriod,
    });
  } catch (error) {
    console.error('Period update error:', error);
    return NextResponse.json(
      { error: 'Failed to update period' },
      { status: 500 }
    );
  }
}
