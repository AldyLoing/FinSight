import { Transaction, TransactionSplit } from '../models/transaction';
import { Budget } from '../models/budget';
import { Insight, InsightInput } from '../models/insight';
import { calculateStats, calculateZScore, groupBy, sumBy } from '../utils/stats';
import { getStartOfMonth, addMonthsToDate, formatDate } from '../utils/dates';

export function detectSpendingAnomalies(
  transactions: Transaction[],
  lookbackDays: number = 90
): Insight[] {
  const insights: Insight[] = [];
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);

  const expenses = transactions.filter(
    t => t.amount < 0 && new Date(t.occurred_at) >= cutoffDate
  );

  // Group by merchant
  const byMerchant = groupBy(expenses, 'merchant' as keyof Transaction);

  for (const [merchant, txs] of Object.entries(byMerchant)) {
    if (!merchant || merchant === 'null' || txs.length < 3) continue;

    const amounts = txs.map(t => Math.abs(t.amount));
    const stats = calculateStats(amounts);
    const latest = amounts[amounts.length - 1];
    const zScore = calculateZScore(latest, stats.mean, stats.stdDev);

    if (zScore > 2.5) {
      insights.push({
        id: `anomaly-${Date.now()}-${Math.random()}`,
        user_id: txs[0].user_id,
        type: 'anomaly',
        title: `Unusual spending at ${merchant}`,
        summary: `A recent transaction of ${latest.toFixed(2)} at "${merchant}" is ${zScore.toFixed(1)}x higher than your usual ${stats.mean.toFixed(2)}`,
        details: {
          merchant,
          latest_amount: latest,
          average_amount: stats.mean,
          z_score: zScore,
          transaction_count: txs.length,
        },
        severity: zScore > 3 ? 'warning' : 'info',
        created_at: new Date().toISOString(),
        acknowledged: false,
      });
    }
  }

  return insights;
}

export function detectTrends(
  transactions: Transaction[],
  monthsToAnalyze: number = 3
): Insight[] {
  const insights: Insight[] = [];
  const now = new Date();
  const monthlySpending: Array<{ month: string; amount: number }> = [];

  for (let i = 0; i < monthsToAnalyze; i++) {
    const monthStart = getStartOfMonth(addMonthsToDate(now, -(i + 1)));
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    const monthExpenses = transactions.filter(t => {
      const txDate = new Date(t.occurred_at);
      return t.amount < 0 && txDate >= monthStart && txDate < monthEnd;
    });

    const totalSpent = monthExpenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    monthlySpending.push({
      month: formatDate(monthStart, 'MMM yyyy'),
      amount: totalSpent,
    });
  }

  if (monthlySpending.length >= 2) {
    const latest = monthlySpending[0].amount;
    const oldest = monthlySpending[monthlySpending.length - 1].amount;

    if (oldest > 0) {
      const changePercent = ((latest - oldest) / oldest) * 100;

      if (changePercent > 15) {
        insights.push({
          id: `trend-increase-${Date.now()}`,
          user_id: transactions[0]?.user_id || '',
          type: 'trend',
          title: 'Growing monthly spending',
          summary: `Your spending increased by ${changePercent.toFixed(1)}% over the past ${monthsToAnalyze} months`,
          details: {
            change_percent: changePercent,
            monthly_breakdown: monthlySpending,
            latest_month: monthlySpending[0],
            oldest_month: monthlySpending[monthlySpending.length - 1],
          },
          severity: changePercent > 30 ? 'warning' : 'info',
          created_at: new Date().toISOString(),
          acknowledged: false,
        });
      } else if (changePercent < -15) {
        insights.push({
          id: `trend-decrease-${Date.now()}`,
          user_id: transactions[0]?.user_id || '',
          type: 'trend',
          title: 'Decreasing monthly spending',
          summary: `Great job! Your spending decreased by ${Math.abs(changePercent).toFixed(1)}% over the past ${monthsToAnalyze} months`,
          details: {
            change_percent: changePercent,
            monthly_breakdown: monthlySpending,
          },
          severity: 'positive',
          created_at: new Date().toISOString(),
          acknowledged: false,
        });
      }
    }
  }

  return insights;
}

export function detectCategoryOveruse(
  transactions: Transaction[],
  splits: TransactionSplit[],
  monthsToAnalyze: number = 3
): Insight[] {
  const insights: Insight[] = [];
  const now = new Date();
  const monthStart = getStartOfMonth(addMonthsToDate(now, -monthsToAnalyze));

  const recentSplits = splits.filter(s => {
    const tx = transactions.find(t => t.id === s.transaction_id);
    return tx && new Date(tx.occurred_at) >= monthStart;
  });

  const byCategory = groupBy(recentSplits, 'category_id' as keyof TransactionSplit);

  for (const [categoryId, categorySplits] of Object.entries(byCategory)) {
    if (!categoryId || categoryId === 'null') continue;

    const totalSpent = categorySplits.reduce((sum, s) => sum + Math.abs(s.amount), 0);
    const avgPerMonth = totalSpent / monthsToAnalyze;

    if (avgPerMonth > 500) {
      insights.push({
        id: `category-${categoryId}-${Date.now()}`,
        user_id: transactions[0]?.user_id || '',
        type: 'recommendation',
        title: `High spending in category`,
        summary: `You're spending an average of ${avgPerMonth.toFixed(2)} per month in this category`,
        details: {
          category_id: categoryId,
          total_spent: totalSpent,
          avg_per_month: avgPerMonth,
          transaction_count: categorySplits.length,
        },
        severity: 'info',
        created_at: new Date().toISOString(),
        acknowledged: false,
      });
    }
  }

  return insights;
}

export function detectBudgetRisks(
  budgets: Budget[],
  transactions: Transaction[],
  splits: TransactionSplit[]
): Insight[] {
  const insights: Insight[] = [];

  // This would use budget calculation logic from budgets.ts
  // For now, simplified version
  for (const budget of budgets) {
    const startDate = new Date(budget.start_date);
    const endDate = budget.end_date ? new Date(budget.end_date) : getStartOfMonth(addMonthsToDate(startDate, 1));

    let spent = 0;
    if (budget.category_id) {
      spent = splits
        .filter(s => s.category_id === budget.category_id)
        .reduce((sum, s) => Math.abs(s.amount), 0);
    } else {
      spent = transactions
        .filter(t => {
          const txDate = new Date(t.occurred_at);
          return t.amount < 0 && txDate >= startDate && txDate <= endDate;
        })
        .reduce((sum, t) => Math.abs(t.amount), 0);
    }

    const percentage = (spent / budget.total_amount) * 100;

    if (spent > budget.total_amount) {
      insights.push({
        id: `budget-exceeded-${budget.id}`,
        user_id: budget.user_id,
        type: 'budget',
        title: `Budget exceeded: ${budget.name}`,
        summary: `You've spent ${spent.toFixed(2)} of ${budget.total_amount.toFixed(2)} (${percentage.toFixed(0)}%)`,
        details: {
          budget_id: budget.id,
          budget_name: budget.name,
          allocated: budget.total_amount,
          spent,
          overspent: spent - budget.total_amount,
        },
        severity: 'critical',
        created_at: new Date().toISOString(),
        acknowledged: false,
      });
    } else if (budget.alert_threshold && percentage >= budget.alert_threshold * 100) {
      insights.push({
        id: `budget-warning-${budget.id}`,
        user_id: budget.user_id,
        type: 'budget',
        title: `Budget alert: ${budget.name}`,
        summary: `You've used ${percentage.toFixed(0)}% of your budget for ${budget.name}`,
        details: {
          budget_id: budget.id,
          budget_name: budget.name,
          allocated: budget.total_amount,
          spent,
          remaining: budget.total_amount - spent,
        },
        severity: 'warning',
        created_at: new Date().toISOString(),
        acknowledged: false,
      });
    }
  }

  return insights;
}

export function runLocalInsights(
  transactions: Transaction[],
  budgets: Budget[],
  splits: TransactionSplit[] = []
): Insight[] {
  const insights: Insight[] = [];

  // Run all detection algorithms
  insights.push(...detectSpendingAnomalies(transactions));
  insights.push(...detectTrends(transactions));
  insights.push(...detectCategoryOveruse(transactions, splits));
  insights.push(...detectBudgetRisks(budgets, transactions, splits));

  return insights;
}
