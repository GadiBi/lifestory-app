import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// GET /api/share - Get user's shared stories
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sharedStories = await prisma.sharedStory.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ sharedStories });
  } catch (error) {
    console.error('Get shared stories error:', error);
    return NextResponse.json({ error: 'Failed to get shared stories' }, { status: 500 });
  }
}

// POST /api/share - Create a new shared story
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, isPublic, password, expiresIn, periods } = await request.json();

    // Generate unique share code
    const shareCode = crypto.randomBytes(8).toString('hex');

    // Calculate expiration
    let expiresAt: Date | null = null;
    if (expiresIn) {
      expiresAt = new Date();
      if (expiresIn === '7d') expiresAt.setDate(expiresAt.getDate() + 7);
      else if (expiresIn === '30d') expiresAt.setDate(expiresAt.getDate() + 30);
      else if (expiresIn === '90d') expiresAt.setDate(expiresAt.getDate() + 90);
    }

    // Get user's life events for the selected periods
    const whereClause: { userId: string; period?: { in: string[] } } = { userId: session.user.id };
    if (periods && periods.length > 0) {
      whereClause.period = { in: periods };
    }

    const events = await prisma.lifeEvent.findMany({
      where: whereClause,
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      include: {
        media: {
          select: { url: true, title: true },
        },
      },
    });

    // Get user profile
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    // Build shareable content
    const content = JSON.stringify({
      userName: profile?.fullName || session.user.name,
      events: events.map(e => ({
        title: e.title,
        description: e.description,
        date: e.date,
        period: e.period,
        category: e.category,
        emotions: e.emotions,
        media: e.media,
      })),
    });

    const sharedStory = await prisma.sharedStory.create({
      data: {
        userId: session.user.id,
        shareCode,
        title: title || `${profile?.fullName || session.user.name}'s Life Story`,
        isPublic: isPublic || false,
        password: password || null,
        expiresAt,
        content,
        periodsIncluded: periods ? periods.join(',') : null,
      },
    });

    return NextResponse.json({
      sharedStory,
      shareUrl: `/story/${shareCode}`,
    }, { status: 201 });
  } catch (error) {
    console.error('Create shared story error:', error);
    return NextResponse.json({ error: 'Failed to create shared story' }, { status: 500 });
  }
}

// DELETE /api/share - Delete a shared story
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Share ID required' }, { status: 400 });
    }

    // Verify ownership
    const sharedStory = await prisma.sharedStory.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!sharedStory) {
      return NextResponse.json({ error: 'Shared story not found' }, { status: 404 });
    }

    await prisma.sharedStory.delete({ where: { id } });

    return NextResponse.json({ message: 'Shared story deleted' });
  } catch (error) {
    console.error('Delete shared story error:', error);
    return NextResponse.json({ error: 'Failed to delete shared story' }, { status: 500 });
  }
}
