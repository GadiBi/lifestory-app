import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const checks = {
    database: false,
    databaseUrl: false,
    authSecret: false,
    error: null as string | null,
  };

  // Check if DATABASE_URL exists
  checks.databaseUrl = !!process.env.DATABASE_URL;

  // Check if AUTH_SECRET exists
  checks.authSecret = !!process.env.AUTH_SECRET;

  // Test database connection
  try {
    await prisma.$connect();
    await prisma.user.count();
    checks.database = true;
  } catch (error) {
    checks.error = error instanceof Error ? error.message : 'Unknown database error';
  }

  const allGood = checks.database && checks.databaseUrl && checks.authSecret;

  return NextResponse.json({
    status: allGood ? 'healthy' : 'unhealthy',
    checks,
    env: {
      hasDbUrl: checks.databaseUrl,
      hasAuthSecret: checks.authSecret,
      nodeEnv: process.env.NODE_ENV,
    }
  }, { status: allGood ? 200 : 500 });
}
