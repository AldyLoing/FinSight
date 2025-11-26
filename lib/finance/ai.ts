import { Transaction } from '../models/transaction';
import { Insight } from '../models/insight';

// Summarize and anonymize financial data for AI consumption
export function summarizeForAI(
  transactions: Transaction[],
  insights: Insight[]
): {
  metrics: {
    income: number;
    expenses: number;
    net: number;
    transaction_count: number;
  };
  patterns: {
    avg_transaction_size: number;
    largest_expense: number;
    most_common_category: string;
  };
  insights_summary: Array<{
    type: string;
    title: string;
    severity: string;
  }>;
} {
  // Calculate aggregated metrics (no PII)
  const income = transactions.filter(t => t.amount > 0);
  const expenses = transactions.filter(t => t.amount < 0);

  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = Math.abs(expenses.reduce((sum, t) => sum + t.amount, 0));

  const expenseAmounts = expenses.map(t => Math.abs(t.amount));
  const avgTransactionSize = expenseAmounts.length > 0
    ? expenseAmounts.reduce((sum, a) => sum + a, 0) / expenseAmounts.length
    : 0;

  const largestExpense = expenseAmounts.length > 0 ? Math.max(...expenseAmounts) : 0;

  return {
    metrics: {
      income: Math.round(totalIncome * 100) / 100,
      expenses: Math.round(totalExpenses * 100) / 100,
      net: Math.round((totalIncome - totalExpenses) * 100) / 100,
      transaction_count: transactions.length,
    },
    patterns: {
      avg_transaction_size: Math.round(avgTransactionSize * 100) / 100,
      largest_expense: Math.round(largestExpense * 100) / 100,
      most_common_category: 'anonymized',
    },
    insights_summary: insights.slice(0, 5).map(i => ({
      type: i.type,
      title: i.title,
      severity: i.severity,
    })),
  };
}

// Generate AI prompt for financial insights
export function generateAIPrompt(context: ReturnType<typeof summarizeForAI>): string {
  return `You are a Personal Finance Analyst who explains insights clearly, calmly, and without judgment.

Context (anonymized financial data):
- Income: $${context.metrics.income}
- Expenses: $${context.metrics.expenses}
- Net: $${context.metrics.net}
- Transactions analyzed: ${context.metrics.transaction_count}
- Average transaction size: $${context.patterns.avg_transaction_size}
- Largest single expense: $${context.patterns.largest_expense}

Recent Insights Detected:
${context.insights_summary.map((i, idx) => `${idx + 1}. [${i.severity.toUpperCase()}] ${i.title}`).join('\n')}

Task:
Analyze this financial data and provide:

1. Top 3 most important insights with:
   - Clear 2-3 sentence explanation
   - Why it matters to short-term cashflow or long-term goals
   - 2 actionable steps with estimated impact and difficulty level

2. If any risks detected (negative net, high expenses, etc.):
   - Root cause analysis (3 bullet points)
   - 3 prioritized actions (Immediate, Short-term 1-3mo, Long-term 3+mo)

3. A concise 2-3 sentence summary with top recommended next action

Rules:
- Never shame the user
- Use concise, calm, factual language
- Provide actionable advice with estimated impacts when possible
- Be transparent about uncertainty
- Prioritize recommendations by impact and feasibility

Return a JSON response with this structure:
{
  "insights": [
    {
      "title": "string",
      "explanation": "string",
      "why_it_matters": "string",
      "actions": [
        {"action": "string", "estimated_impact": "string", "difficulty": "low|medium|high"}
      ]
    }
  ],
  "risks": [
    {
      "risk": "string",
      "cause": ["string", "string", "string"],
      "actions": [
        {"priority": "immediate|short_term|long_term", "action": "string", "impact": "string"}
      ]
    }
  ],
  "summary": "string",
  "top_recommendation": "string"
}`;
}

// Call OpenRouter API
export async function callOpenRouter(prompt: string): Promise<any> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'FinSight Personal Finance',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-sonnet',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in OpenRouter response');
    }

    // Try to parse as JSON, fallback to plain text
    try {
      return JSON.parse(content);
    } catch {
      return { raw_response: content };
    }
  } catch (error) {
    console.error('OpenRouter API error:', error);
    throw error;
  }
}

// Main function to get AI insights
export async function getAIInsights(
  transactions: Transaction[],
  insights: Insight[]
): Promise<any> {
  const context = summarizeForAI(transactions, insights);
  const prompt = generateAIPrompt(context);
  return await callOpenRouter(prompt);
}
