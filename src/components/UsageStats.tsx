'use client';

import { useState, useEffect } from 'react';

interface UsageData {
  totals: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    totalCost: number;
    requestCount: number;
  };
  byEndpoint: Record<string, { requests: number; cost: number; tokens: number }>;
  recentActivity: Array<{
    endpoint: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
    createdAt: string;
  }>;
}

const ENDPOINT_LABELS: Record<string, string> = {
  chat: 'Conversations',
  opening: 'Interview Starts',
  extract: 'Event Extraction',
  'life-script': 'Life Script Generation',
};

export default function UsageStats() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/usage');
      if (!response.ok) throw new Error('Failed to fetch usage');
      const data = await response.json();
      setUsage(data);
    } catch (err) {
      setError('Failed to load usage statistics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-warm-cream-dark rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-deep-plum/10 rounded w-1/3 mb-4"></div>
        <div className="h-20 bg-deep-plum/10 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-warm-cream-dark rounded-2xl p-6">
        <p className="text-accent-rust">{error}</p>
      </div>
    );
  }

  if (!usage) return null;

  const formatCost = (cost: number) => {
    if (cost < 0.01) return `$${cost.toFixed(4)}`;
    return `$${cost.toFixed(2)}`;
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(2)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toString();
  };

  return (
    <div className="bg-warm-cream-dark rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-soft-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        API Usage
      </h3>

      {/* Total Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-warm-cream rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-soft-purple">
            {formatCost(usage.totals.totalCost)}
          </div>
          <div className="text-sm text-text-muted">Total Cost</div>
        </div>
        <div className="bg-warm-cream rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-deep-plum">
            {formatTokens(usage.totals.totalTokens)}
          </div>
          <div className="text-sm text-text-muted">Tokens Used</div>
        </div>
        <div className="bg-warm-cream rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-warm-mauve">
            {usage.totals.requestCount}
          </div>
          <div className="text-sm text-text-muted">API Calls</div>
        </div>
      </div>

      {/* Usage by Endpoint */}
      {Object.keys(usage.byEndpoint).length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-text-secondary mb-3">By Feature</h4>
          <div className="space-y-2">
            {Object.entries(usage.byEndpoint).map(([endpoint, data]) => (
              <div
                key={endpoint}
                className="flex items-center justify-between bg-warm-cream rounded-lg p-3"
              >
                <div>
                  <span className="text-text-primary font-medium">
                    {ENDPOINT_LABELS[endpoint] || endpoint}
                  </span>
                  <span className="text-text-muted text-sm ml-2">
                    ({data.requests} calls)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-soft-purple font-medium">
                    {formatCost(data.cost)}
                  </span>
                  <span className="text-text-muted text-sm ml-2">
                    {formatTokens(data.tokens)} tokens
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {usage.recentActivity.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-text-secondary mb-3">Recent Activity</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {usage.recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-sm bg-warm-cream rounded-lg p-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-text-primary">
                    {ENDPOINT_LABELS[activity.endpoint] || activity.endpoint}
                  </span>
                  <span className="text-text-muted text-xs">
                    {new Date(activity.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <span className="text-soft-purple">
                  {formatCost(activity.cost)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {usage.totals.requestCount === 0 && (
        <p className="text-text-muted text-center py-4">
          No API usage recorded yet. Start an interview to begin tracking.
        </p>
      )}
    </div>
  );
}
