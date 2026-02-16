import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET /api/story/[code] - Get a shared story by code
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const sharedStory = await prisma.sharedStory.findUnique({
      where: { shareCode: code },
      include: {
        user: {
          select: {
            username: true,
            profile: {
              select: { fullName: true },
            },
          },
        },
      },
    });

    if (!sharedStory) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Check if expired
    if (sharedStory.expiresAt && new Date() > sharedStory.expiresAt) {
      return NextResponse.json({ error: 'This shared story has expired' }, { status: 410 });
    }

    // Check if password protected
    if (sharedStory.password) {
      const { searchParams } = new URL(request.url);
      const providedPassword = searchParams.get('password');

      if (!providedPassword) {
        return NextResponse.json({
          error: 'Password required',
          passwordProtected: true,
          title: sharedStory.title,
        }, { status: 401 });
      }

      if (!(await bcrypt.compare(providedPassword, sharedStory.password))) {
        return NextResponse.json({
          error: 'Invalid password',
          passwordProtected: true,
          title: sharedStory.title,
        }, { status: 401 });
      }
    }

    // Update view count
    await prisma.sharedStory.update({
      where: { id: sharedStory.id },
      data: {
        viewCount: { increment: 1 },
        lastViewedAt: new Date(),
      },
    });

    // Parse content
    let content;
    try {
      content = JSON.parse(sharedStory.content || '{}');
    } catch {
      content = { events: [] };
    }

    return NextResponse.json({
      title: sharedStory.title,
      userName: content.userName || sharedStory.user.profile?.fullName || sharedStory.user.username,
      events: content.events || [],
      createdAt: sharedStory.createdAt,
    });
  } catch (error) {
    console.error('Get shared story error:', error);
    return NextResponse.json({ error: 'Failed to get story' }, { status: 500 });
  }
}
