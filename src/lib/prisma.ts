import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Convert Supabase direct URL to pooler URL for serverless
function getPoolerUrl() {
  const url = process.env.DATABASE_URL || '';

  // If already using pooler, return as-is
  if (url.includes('pooler.supabase.com')) {
    return url;
  }

  // Convert direct URL to pooler URL
  // From: postgresql://postgres:PASS@db.PROJECT.supabase.co:5432/postgres
  // To:   postgresql://postgres.PROJECT:PASS@aws-0-us-east-1.pooler.supabase.com:6543/postgres
  const match = url.match(/postgresql:\/\/postgres:([^@]+)@db\.([^.]+)\.supabase\.co:5432\/postgres/);
  if (match) {
    const [, password, project] = match;
    return `postgresql://postgres.${project}:${password}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
  }

  return url;
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: getPoolerUrl(),
    },
  },
});

globalForPrisma.prisma = prisma;

export default prisma;
