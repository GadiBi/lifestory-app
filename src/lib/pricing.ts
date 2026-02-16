// Claude Sonnet pricing (per 1M tokens)
export const PRICING = {
  'claude-sonnet-4-20250514': {
    input: 3.00,  // $3 per 1M input tokens
    output: 15.00, // $15 per 1M output tokens
  },
};

// Calculate cost in USD
export function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = PRICING[model as keyof typeof PRICING] || PRICING['claude-sonnet-4-20250514'];
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}
