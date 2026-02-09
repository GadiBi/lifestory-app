import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const checks = {
    database: false,
    databaseUrl: false,
    authSecret: false,
    error: null as string | null,
    dbUrlPreview: '',
  };

  // Check if DATABASE_URL exists and show preview (hide password)
  const dbUrl = process.env.DATABASE_URL || '';
  checks.databaseUrl = !!dbUrl;
  checks.dbUrlPreview = dbUrl.replace(/:[^:@]+@/, ':***@').substring(0, 80);

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
  }, { status: allGood ? 200 : 500 });
}
