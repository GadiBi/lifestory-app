import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { password } = await request.json();

    // Validate input
    if (!password) {
      return NextResponse.json(
        { error: 'Password is required to delete account' },
        { status: 400 }
      );
    }

    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 400 }
      );
    }

    // Delete all user data (cascading delete via Prisma relations)
    // Order matters for foreign key constraints if not using cascading
    await prisma.$transaction([
      // Delete API usage records
      prisma.apiUsage.deleteMany({ where: { userId: user.id } }),
      // Delete life events (this should cascade from interviews if set up, but explicit is safer)
      prisma.lifeEvent.deleteMany({ where: { userId: user.id } }),
      // Delete interviews
      prisma.interview.deleteMany({ where: { userId: user.id } }),
      // Delete profile
      prisma.profile.deleteMany({ where: { userId: user.id } }),
      // Delete user
      prisma.user.delete({ where: { id: user.id } }),
    ]);

    return NextResponse.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
