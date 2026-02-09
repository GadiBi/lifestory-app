import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/events - List all events for current user
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period');
    const category = searchParams.get('category');

    const events = await prisma.lifeEvent.findMany({
      where: {
        userId: session.user.id,
        ...(period && { period }),
        ...(category && { category }),
      },
      orderBy: [
        { date: 'asc' },
        { createdAt: 'asc' },
      ],
      include: {
        media: {
          select: {
            id: true,
            url: true,
            title: true,
            width: true,
            height: true,
          },
        },
      },
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Events GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/events - Create a new life event
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, date, period, category, emotions, interviewId } = await request.json();

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    const event = await prisma.lifeEvent.create({
      data: {
        userId: session.user.id,
        title,
        description,
        date: date ? new Date(date) : null,
        period,
        category,
        emotions,
        interviewId,
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('Events POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
