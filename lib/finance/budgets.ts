import { Budget, BudgetStatus } from '../models/budget';
import { Transaction, TransactionSplit } from '../models/transaction';
import { getStartOfMonth, getEndOfMonth, addMonthsToDate, formatDate } from '../utils/dates';

export function calculateBudgetStatus(
  budget: Budget,
  transactions: Transaction[],
  splits: TransactionSplit[]
): BudgetStatus {
  const startDate = new Date(budget.start_date);
  const endDate = budget.end_date ? new Date(budget.end_date) : getEndOfMonth(startDate);

  // Calculate spent amount
  let spent = 0;

  if (budget.category_id) {
    // If budget has a category, sum splits for that category
    spent = splits
      .filter(s => s.category_id === budget.category_id)
      .filter(s => {
        const tx = transactions.find(t => t.id === s.transaction_id);
        if (!tx) return false;
        const txDate = new Date(tx.occurred_at);
        return txDate >= startDate && txDate <= endDate;
      })
      .reduce((sum, s) => sum + Math.abs(s.amount), 0);
  } else {
    // If no category, sum all expenses in period
    spent = transactions
      .filter(t => {
        const txDate = new Date(t.occurred_at);
        return txDate >= startDate && txDate <= endDate && t.amount < 0;
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }

  const remaining = budget.total_amount - spent;
  const percentage = (spent / budget.total_amount) * 100;

  let status: BudgetStatus['status'] = 'on_track';
  if (spent > budget.total_amount) {
    status = 'exceeded';
  } else if (budget.alert_threshold && percentage >= budget.alert_threshold * 100) {
    status = 'warning';
  }

  return {
    budget,
    spent,
    remaining,
    percentage,
    status,
  };
}

export function getAdaptiveBudgetSuggestion(
  categoryId: string | null,
  transactions: Transaction[],
  splits: TransactionSplit[],
  lookbackMonths: number = 3
): number {
  const now = new Date();
  const monthlySpending: number[] = [];

  for (let i = 0; i < lookbackMonths; i++) {
    const monthStart = getStartOfMonth(addMonthsToDate(now, -(i + 1)));
    const monthEnd = getEndOfMonth(monthStart);

    let monthSpent = 0;

    if (categoryId) {
      monthSpent = splits
        .filter(s => s.category_id === categoryId)
        .filter(s => {
          const tx = transactions.find(t => t.id === s.transaction_id);
          if (!tx) return false;
          const txDate = new Date(tx.occurred_at);
          return txDate >= monthStart && txDate <= monthEnd;
        })
        .reduce((sum, s) => sum + Math.abs(s.amount), 0);
    } else {
      monthSpent = transactions
        .filter(t => {
          const txDate = new Date(t.occurred_at);
          return txDate >= monthStart && txDate <= monthEnd && t.amount < 0;
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    }

    monthlySpending.push(monthSpent);
  }

  if (monthlySpending.length === 0) return 0;

  // Calculate average and add 10% buffer
  const average = monthlySpending.reduce((sum, val) => sum + val, 0) / monthlySpending.length;
  return Math.round(average * 1.1);
}

export function calculateCarryOver(
  budget: Budget,
  previousPeriodRemaining: number
): number {
  if (!budget.carry_over) return 0;
  return Math.max(0, previousPeriodRemaining);
}

export function getBudgetProgress(
  budgets: Budget[],
  transactions: Transaction[],
  splits: TransactionSplit[]
): BudgetStatus[] {
  return budgets.map(budget => calculateBudgetStatus(budget, transactions, splits));
}

export function detectBudgetViolations(
  budgetStatuses: BudgetStatus[]
): Array<{
  budget: Budget;
  overspent: number;
  severity: 'warning' | 'critical';
}> {
  return budgetStatuses
    .filter(status => status.status === 'exceeded' || status.status === 'warning')
    .map(status => ({
      budget: status.budget,
      overspent: Math.max(0, status.spent - status.budget.total_amount),
      severity: status.status === 'exceeded' ? 'critical' : 'warning',
    }));
}
