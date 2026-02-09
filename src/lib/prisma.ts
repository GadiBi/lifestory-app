import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDatabaseUrl() {
  let url = process.env.DATABASE_URL || '';

  // Add SSL and connection params if not present
  if (url && !url.includes('sslmode=')) {
    url += url.includes('?') ? '&' : '?';
    url += 'sslmode=require&connect_timeout=30';
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

globalForPrisma.prisma = prisma;

export default prisma;
