import { Transaction } from '../models/transaction';
import { Account } from '../models/account';
import { Forecast, ForecastSummary, ForecastDetails } from '../models/forecast';
import { calculateStats } from '../utils/stats';
import { addDaysToDate, formatDate } from '../utils/dates';

export function forecastCashflow(
  transactions: Transaction[],
  accounts: Account[],
  horizonDays: number = 90
): Omit<Forecast, 'id' | 'user_id' | 'created_at'> {
  // Calculate historical averages
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);

  const recentTransactions = transactions.filter(
    t => new Date(t.occurred_at) >= cutoffDate
  );

  const income = recentTransactions.filter(t => t.amount > 0);
  const expenses = recentTransactions.filter(t => t.amount < 0);

  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = Math.abs(expenses.reduce((sum, t) => sum + t.amount, 0));

  const avgDailyIncome = totalIncome / 90;
  const avgDailyExpense = totalExpenses / 90;
  const avgDailyNet = avgDailyIncome - avgDailyExpense;

  // Calculate current balance
  const currentBalance = accounts
    .filter(a => !a.archived && !a.hidden)
    .reduce((sum, a) => sum + a.balance, 0);

  // Generate forecast points
  const dailyPoints: ForecastDetails['daily_points'] = [];
  let balance = currentBalance;
  let minBalance = currentBalance;
  let maxBalance = currentBalance;

  for (let day = 1; day <= horizonDays; day++) {
    balance += avgDailyNet;
    const date = addDaysToDate(new Date(), day);
    
    // Add some variance for confidence (simplified)
    const confidence = Math.max(0.5, 1 - (day / horizonDays) * 0.5);

    dailyPoints.push({
      date: formatDate(date, 'yyyy-MM-dd'),
      predicted_balance: Math.round(balance * 100) / 100,
      confidence,
    });

    minBalance = Math.min(minBalance, balance);
    maxBalance = Math.max(maxBalance, balance);
  }

  const endBalance = dailyPoints[dailyPoints.length - 1].predicted_balance;

  // Determine risk level
  let riskLevel: ForecastSummary['risk_level'];
  if (minBalance < 0) {
    riskLevel = 'critical';
  } else if (minBalance < currentBalance * 0.1) {
    riskLevel = 'high';
  } else if (minBalance < currentBalance * 0.3) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'low';
  }

  // Generate scenarios
  const optimisticNet = avgDailyNet * 1.2;
  const pessimisticNet = avgDailyNet * 0.8;

  const summary: ForecastSummary = {
    starting_balance: currentBalance,
    avg_daily_income: Math.round(avgDailyIncome * 100) / 100,
    avg_daily_expense: Math.round(avgDailyExpense * 100) / 100,
    avg_daily_net: Math.round(avgDailyNet * 100) / 100,
    horizon_days: horizonDays,
    risk_level: riskLevel,
    min_balance: Math.round(minBalance * 100) / 100,
    max_balance: Math.round(maxBalance * 100) / 100,
    end_balance: Math.round(endBalance * 100) / 100,
  };

  const details: ForecastDetails = {
    daily_points: dailyPoints,
    scenarios: {
      optimistic: Math.round((currentBalance + optimisticNet * horizonDays) * 100) / 100,
      realistic: endBalance,
      pessimistic: Math.round((currentBalance + pessimisticNet * horizonDays) * 100) / 100,
    },
  };

  return {
    horizon_days: horizonDays,
    summary,
    details,
  };
}

export function predictEndOfMonthBalance(
  transactions: Transaction[],
  accounts: Account[]
): {
  predicted_balance: number;
  confidence: number;
  days_remaining: number;
} {
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysRemaining = Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const forecast = forecastCashflow(transactions, accounts, daysRemaining);
  const predictedBalance = forecast.summary.end_balance;
  
  // Confidence decreases with days remaining
  const confidence = Math.max(0.6, 1 - (daysRemaining / 30) * 0.4);

  return {
    predicted_balance: predictedBalance,
    confidence,
    days_remaining: daysRemaining,
  };
}
