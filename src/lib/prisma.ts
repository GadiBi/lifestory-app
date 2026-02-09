import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Add connection parameters for Supabase if not present
function getDatabaseUrl() {
  let url = process.env.DATABASE_URL || '';

  // For Supabase, add pgbouncer=true if not already present
  if (url.includes('supabase.co') && !url.includes('pgbouncer=')) {
    url += url.includes('?') ? '&pgbouncer=true' : '?pgbouncer=true';
  }

  return url;
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
});

// Cache globally to prevent multiple instances
globalForPrisma.prisma = prisma;

export default prisma;
