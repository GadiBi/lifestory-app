import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface PersonInfo {
  name: string;
  relationship: string;
  mentions: { type: 'event' | 'conversation'; id: string; title: string }[];
}

// POST /api/people - Manually add a person
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, relationship } = await request.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const person = await prisma.person.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        relationship: relationship || 'Person',
      },
    });

    return NextResponse.json({ person }, { status: 201 });
  } catch (error) {
    console.error('People POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/people - Return manually added people from the database
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const manualPeople = await prisma.person.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    const people: PersonInfo[] = manualPeople.map(mp => ({
      name: mp.name,
      relationship: mp.relationship,
      mentions: [],
    }));

    return NextResponse.json({ people });
  } catch (error) {
    console.error('People GET error:', error);
    return NextResponse.json({ error: 'Failed to get people' }, { status: 500 });
  }
}
