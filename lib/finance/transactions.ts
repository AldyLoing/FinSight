import { Transaction, TransactionSplit } from '../models/transaction';
import { Category } from '../models/category';
import { formatDate, getStartOfMonth, getEndOfMonth, addMonthsToDate } from '../utils/dates';

export function calculateSplitTotal(splits: TransactionSplit[]): number {
  return splits.reduce((total, split) => total + split.amount, 0);
}

export function validateSplits(transactionAmount: number, splits: TransactionSplit[]): {
  valid: boolean;
  difference: number;
} {
  const splitTotal = calculateSplitTotal(splits);
  const difference = Math.abs(Math.abs(transactionAmount) - Math.abs(splitTotal));
  
  return {
    valid: difference < 0.01, // tolerance of 1 cent
    difference,
  };
}

export function categorizeTransaction(
  transaction: Transaction,
  categories: Category[],
  autoCategorizationRules?: Map<string, string>
): string | null {
  if (!transaction.merchant) return null;

  // Check auto-categorization rules
  const merchantLower = transaction.merchant.toLowerCase();
  if (autoCategorizationRules) {
    for (const [pattern, categoryId] of autoCategorizationRules) {
      if (merchantLower.includes(pattern.toLowerCase())) {
        return categoryId;
      }
    }
  }

  return null;
}

export function getRecurringTransactionSchedule(
  recurringRule: string,
  startDate: Date,
  count: number = 12
): Date[] {
  // Simple monthly recurrence implementation
  // In production, use rrule library for full RFC 5545 support
  const dates: Date[] = [];
  
  if (recurringRule === 'FREQ=MONTHLY') {
    for (let i = 0; i < count; i++) {
      dates.push(addMonthsToDate(startDate, i));
    }
  } else if (recurringRule.startsWith('FREQ=MONTHLY;INTERVAL=')) {
    const interval = parseInt(recurringRule.split('INTERVAL=')[1]);
    for (let i = 0; i < count; i++) {
      dates.push(addMonthsToDate(startDate, i * interval));
    }
  }

  return dates;
}

export function getTransactionsByPeriod(
  transactions: Transaction[],
  startDate: Date,
  endDate: Date
): Transaction[] {
  return transactions.filter(t => {
    const txDate = new Date(t.occurred_at);
    return txDate >= startDate && txDate <= endDate;
  });
}

export function calculateCashflow(transactions: Transaction[], period: 'month' | 'year' = 'month'): {
  income: number;
  expenses: number;
  net: number;
  transactions: {
    income: Transaction[];
    expenses: Transaction[];
  };
} {
  const income = transactions.filter(t => t.amount > 0);
  const expenses = transactions.filter(t => t.amount < 0);

  return {
    income: income.reduce((sum, t) => sum + t.amount, 0),
    expenses: Math.abs(expenses.reduce((sum, t) => sum + t.amount, 0)),
    net: transactions.reduce((sum, t) => sum + t.amount, 0),
    transactions: {
      income,
      expenses,
    },
  };
}

export function getTransactionTrends(
  transactions: Transaction[],
  months: number = 6
): Array<{
  month: string;
  income: number;
  expenses: number;
  net: number;
}> {
  const trends: Array<{ month: string; income: number; expenses: number; net: number }> = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const monthStart = getStartOfMonth(addMonthsToDate(now, -i));
    const monthEnd = getEndOfMonth(monthStart);
    const monthTxs = getTransactionsByPeriod(transactions, monthStart, monthEnd);
    const cashflow = calculateCashflow(monthTxs);

    trends.push({
      month: formatDate(monthStart, 'MMM yyyy'),
      income: cashflow.income,
      expenses: cashflow.expenses,
      net: cashflow.net,
    });
  }

  return trends;
}
