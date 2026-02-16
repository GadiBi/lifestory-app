import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateStringLength } from '@/lib/validation';

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

    const { username, fullName, birthDate, birthPlace, language } = await request.json();

    // Validate input lengths
    if (username) {
      const err = validateStringLength(username, 'username', 50);
      if (err) return NextResponse.json({ error: err }, { status: 400 });
    }
    if (fullName) {
      const err = validateStringLength(fullName, 'fullName', 100);
      if (err) return NextResponse.json({ error: err }, { status: 400 });
    }
    if (birthPlace) {
      const err = validateStringLength(birthPlace, 'birthPlace', 200);
      if (err) return NextResponse.json({ error: err }, { status: 400 });
    }

    // Check if username is being changed and if it's already taken
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: username,
          NOT: { id: session.user.id },
        },
      });

      if (existingUser) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
      }

      // Update username
      await prisma.user.update({
        where: { id: session.user.id },
        data: { username },
      });
    }

    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        fullName,
        birthDate: birthDate ? new Date(birthDate) : null,
        birthPlace,
        language: language || 'en',
      },
      create: {
        userId: session.user.id,
        fullName,
        birthDate: birthDate ? new Date(birthDate) : null,
        birthPlace,
        language: language || 'en',
      },
    });

    return NextResponse.json({ profile, username });
  } catch (error) {
    console.error('Profile PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
