import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/profile - Get current user's profile
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      profile: user.profile,
    });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/profile - Update current user's profile
export async function PUT(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fullName, birthDate, birthPlace } = await request.json();

    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        fullName,
        birthDate: birthDate ? new Date(birthDate) : null,
        birthPlace,
      },
      create: {
        userId: session.user.id,
        fullName,
        birthDate: birthDate ? new Date(birthDate) : null,
        birthPlace,
      },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Profile PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
