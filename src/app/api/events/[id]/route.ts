import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateStringLength } from '@/lib/validation';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/events/[id] - Get a single event
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const event = await prisma.lifeEvent.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Event GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/events/[id] - Update an event
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { title, description, date, endDate, period, category, emotions } = await request.json();

    // Verify ownership
    const existingEvent = await prisma.lifeEvent.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (title !== undefined) {
      const titleError = validateStringLength(title, 'title', 200);
      if (titleError) return NextResponse.json({ error: titleError }, { status: 400 });
    }
    if (description !== undefined) {
      const descError = validateStringLength(description, 'description', 10000);
      if (descError) return NextResponse.json({ error: descError }, { status: 400 });
    }

    const event = await prisma.lifeEvent.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(date !== undefined && { date: date ? new Date(date) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(period !== undefined && { period }),
        ...(category !== undefined && { category }),
        ...(emotions !== undefined && { emotions }),
      },
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Event PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/events/[id] - Delete an event
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const existingEvent = await prisma.lifeEvent.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    await prisma.lifeEvent.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Event DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
