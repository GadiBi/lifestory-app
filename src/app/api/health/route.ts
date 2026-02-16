import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    await prisma.$connect();
    await prisma.user.count();
    return NextResponse.json({ status: 'healthy' });
  } catch {
    return NextResponse.json({ status: 'unhealthy' }, { status: 500 });
  }
}
