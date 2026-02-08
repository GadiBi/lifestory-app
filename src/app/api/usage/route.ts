import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/usage - Get API usage statistics
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all usage records for the user
    const usageRecords = await prisma.apiUsage.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate totals
    const totals = usageRecords.reduce(
      (acc, record) => ({
        inputTokens: acc.inputTokens + record.inputTokens,
        outputTokens: acc.outputTokens + record.outputTokens,
        totalCost: acc.totalCost + record.costUsd,
        requestCount: acc.requestCount + 1,
      }),
      { inputTokens: 0, outputTokens: 0, totalCost: 0, requestCount: 0 }
    );

    // Group by endpoint
    const byEndpoint: Record<string, { requests: number; cost: number; tokens: number }> = {};
    usageRecords.forEach((record) => {
      if (!byEndpoint[record.endpoint]) {
        byEndpoint[record.endpoint] = { requests: 0, cost: 0, tokens: 0 };
      }
      byEndpoint[record.endpoint].requests += 1;
      byEndpoint[record.endpoint].cost += record.costUsd;
      byEndpoint[record.endpoint].tokens += record.inputTokens + record.outputTokens;
    });

    // Get usage by day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentUsage = usageRecords.filter(
      (r) => new Date(r.createdAt) >= thirtyDaysAgo
    );

    const byDay: Record<string, { cost: number; tokens: number; requests: number }> = {};
    recentUsage.forEach((record) => {
      const day = new Date(record.createdAt).toISOString().split('T')[0];
      if (!byDay[day]) {
        byDay[day] = { cost: 0, tokens: 0, requests: 0 };
      }
      byDay[day].cost += record.costUsd;
      byDay[day].tokens += record.inputTokens + record.outputTokens;
      byDay[day].requests += 1;
    });

    // Get recent activity (last 10 requests)
    const recentActivity = usageRecords.slice(0, 10).map((record) => ({
      endpoint: record.endpoint,
      inputTokens: record.inputTokens,
      outputTokens: record.outputTokens,
      cost: record.costUsd,
      createdAt: record.createdAt,
    }));

    return NextResponse.json({
      totals: {
        ...totals,
        totalTokens: totals.inputTokens + totals.outputTokens,
      },
      byEndpoint,
      byDay,
      recentActivity,
    });
  } catch (error) {
    console.error('Usage GET error:', error);
    return NextResponse.json({ error: 'Failed to get usage stats' }, { status: 500 });
  }
}
