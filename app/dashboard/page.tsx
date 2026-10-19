'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/db';
import { Navigation } from '@/components/Navigation';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { PieChartComponent } from '@/components/charts/Charts';
import { getExchangeRates, convertCurrency, formatCurrency, SUPPORTED_CURRENCIES } from '@/lib/utils/currency';
import Link from 'next/link';

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
}

interface Insight {
  id: string;
  type: string;
  title: string;
  summary: string;
  severity: string;
}

interface Debt {
  id: string;
  name: string;
  type: string;
  description?: string;
  currency?: string;
  principal: number;
  current_balance: number;
  minimum_payment: number;
  due_day?: number;
  status: string;
}

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [displayCurrency, setDisplayCurrency] = useState<string>('IDR');

  useEffect(() => {
    loadDashboardData();
    loadExchangeRates();
  }, []);

  async function loadExchangeRates() {
    const rates = await getExchangeRates();
    setExchangeRates(rates);
  }

  async function loadDashboardData() {
    try {
      const supabase = createBrowserClient();
      
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        window.location.href = '/auth/login';
        return;
      }

      // Fetch all data in parallel
      const [accountsRes, transactionsRes, budgetsRes, goalsRes, insightsRes, debtsRes] = await Promise.all([
        fetch('/api/accounts'),
        fetch('/api/transactions?limit=5'),
        fetch('/api/budgets?status=true'),
        fetch('/api/goals'),
        fetch('/api/insights?acknowledged=false'),
        fetch('/api/debts')
      ]);

      if (accountsRes.ok) {
        const data = await accountsRes.json();
        setAccounts(data.accounts || []);
      }

      if (transactionsRes.ok) {
        const data = await transactionsRes.json();
        setTransactions(data.transactions || []);
      }

      if (budgetsRes.ok) {
        const data = await budgetsRes.json();
        setBudgets(data.budgets || []);
      }

      if (goalsRes.ok) {
        const data = await goalsRes.json();
        setGoals(data.goals || []);
      }

      if (insightsRes.ok) {
        const data = await insightsRes.json();
        setInsights(data.insights || []);
      }

      if (debtsRes.ok) {
        const data = await debtsRes.json();
        setDebts(data.debts || []);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  const totalBalance = accounts.reduce((sum, acc) => {
    const converted = convertCurrency(acc.balance, acc.currency || 'IDR', displayCurrency, exchangeRates);
    return sum + converted;
  }, 0);

  const totalAssets = accounts
    .filter(acc => acc.type !== 'credit' && acc.type !== 'loan')
    .reduce((sum, acc) => {
      const converted = convertCurrency(acc.balance, acc.currency || 'IDR', displayCurrency, exchangeRates);
      return sum + (converted > 0 ? converted : 0);
    }, 0);

  const totalLiabilities = accounts
    .filter(acc => acc.type === 'credit' || acc.type === 'loan')
    .reduce((sum, acc) => {
      const converted = convertCurrency(Math.abs(acc.balance), acc.currency || 'IDR', displayCurrency, exchangeRates);
      return sum + converted;
    }, 0);

  const activeDebts = debts.filter(d => d.status === 'active');

  const totalDebt = activeDebts.reduce(
    (sum, d) =>
      sum + convertCurrency(d.current_balance, d.currency || 'USD', displayCurrency, exchangeRates),
    0
  );

  const netWorth = totalAssets - totalLiabilities - totalDebt;

  function startOfToday(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function nextDueDate(dueDay: number): Date {
    const today = startOfToday();
    let d = new Date(today.getFullYear(), today.getMonth(), dueDay);
    if (d < today) {
      d = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
    }
    return d;
  }

  const upcomingPayments = activeDebts
    .filter(d => d.due_day != null)
    .map(d => {
      const date = nextDueDate(d.due_day as number);
      const daysLeft = Math.round((date.getTime() - startOfToday().getTime()) / 86400000);
      return { debt: d, date, daysLeft };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  function formatDateShort(d: Date): string {
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function daysUntil(date: Date): number {
    return Math.max(Math.ceil((date.getTime() - startOfToday().getTime()) / 86400000), 1);
  }

  const debtPayoffs = activeDebts.map((debt) => {
    const srcCurrency = debt.currency || 'USD';
    const balance = convertCurrency(debt.current_balance, srcCurrency, displayCurrency, exchangeRates);
    const minPayment = convertCurrency(debt.minimum_payment, srcCurrency, displayCurrency, exchangeRates);
    const nextPayment = Math.min(balance, minPayment);
    if (debt.due_day == null) {
      return { debt, nextPayment, perDay: null as number | null, nextDate: null as Date | null };
    }
    const nextDate = nextDueDate(debt.due_day);
    const days = daysUntil(nextDate);
    return { debt, nextPayment, perDay: Math.ceil(nextPayment / days), nextDate };
  });

  const sumNextPayments = debtPayoffs.reduce((sum, p) => sum + p.nextPayment, 0);

  const nearestPayoffDate = debtPayoffs.reduce<Date | null>(
    (acc, p) => (p.nextDate && (!acc || p.nextDate < acc) ? p.nextDate : acc),
    null
  );

  const nearestDays = nearestPayoffDate ? daysUntil(nearestPayoffDate) : 0;
  const netDailyNeeded = nearestDays > 0
    ? Math.max(Math.ceil((sumNextPayments - totalAssets) / nearestDays), 0)
    : 0;

  // Calculate transaction net (income - expenses)
  const transactionNet = transactions.reduce((sum, tx) => {
    const txCurrency = tx.currency || 'USD';
    const converted = convertCurrency(Math.abs(tx.amount || 0), txCurrency, displayCurrency, exchangeRates);
    return sum + (tx.amount >= 0 ? converted : -converted);
  }, 0);

  // Chart data
  const accountsChartData = accounts.map(acc => ({
    name: acc.name,
    value: Math.abs(convertCurrency(acc.balance, acc.currency || 'IDR', displayCurrency, exchangeRates)),
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your financial data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome back! Here&apos;s your financial overview.</p>
          </div>
          <Select
            value={displayCurrency}
            onChange={(e) => setDisplayCurrency(e.target.value)}
            options={SUPPORTED_CURRENCIES.map(c => ({ value: c.code, label: `${c.symbol} ${c.code}` }))}
          />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card hover>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Net Worth</p>
                <p className={`text-2xl font-bold ${netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(netWorth, displayCurrency)}
                </p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </Card>

          <Card hover>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Assets</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(totalAssets, displayCurrency)}
                </p>
              </div>
              <div className="text-4xl">📈</div>
            </div>
          </Card>

          <Card hover>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Debt</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalDebt, displayCurrency)}
                </p>
              </div>
              <div className="text-4xl">💳</div>
            </div>
          </Card>

          <Card hover>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Transaction Net</p>
                <p className={`text-2xl font-bold ${transactionNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(transactionNet, displayCurrency)}
                </p>
              </div>
              <div className="text-4xl">💸</div>
            </div>
          </Card>
        </div>

        {/* Debts Section */}
        {activeDebts.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Active Debts */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Active Debts</CardTitle>
                  <Link href="/debts">
                    <Button variant="outline" size="sm">View All</Button>
                  </Link>
                </div>
              </CardHeader>
              <div className="space-y-3">
                {debtPayoffs.map(({ debt, perDay, nextDate }) => {
                  const srcCurrency = debt.currency || 'USD';
                  const balance = convertCurrency(debt.current_balance, srcCurrency, displayCurrency, exchangeRates);
                  const minPayment = convertCurrency(debt.minimum_payment, srcCurrency, displayCurrency, exchangeRates);
                  const percentage = debt.principal > 0
                    ? ((debt.principal - debt.current_balance) / debt.principal) * 100
                    : 0;
                  return (
                    <div key={debt.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-gray-900">{debt.name}</p>
                        <p className="font-semibold text-red-600">{formatCurrency(balance, displayCurrency)}</p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>
                          Cicilan {formatCurrency(minPayment, displayCurrency)}/bln
                          {debt.due_day != null && ` · tgl ${debt.due_day}`}
                        </span>
                        <span>{percentage.toFixed(0)}% lunas</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-blue-600 transition-all"
                          style={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }}
                        />
                      </div>
                      {perDay != null && nextDate && (
                        <p className="text-xs text-blue-600 mt-1">
                          ≈ {formatCurrency(perDay, displayCurrency)}/hari · siap tgl {formatDateShort(nextDate)}
                        </p>
                      )}
                    </div>
                  );
                })}
                <div className="pt-3 border-t border-gray-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-semibold text-red-600">{formatCurrency(totalDebt, displayCurrency)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Setelah kas ({formatCurrency(totalAssets, displayCurrency)})
                    </span>
                    <span className="text-sm font-semibold text-blue-600">
                      {totalAssets >= sumNextPayments
                        ? 'tertutup kas'
                        : `≈ ${formatCurrency(netDailyNeeded, displayCurrency)}/hari${
                            nearestPayoffDate ? ` · tagihan terdekat ${formatDateShort(nearestPayoffDate)}` : ''
                          }`}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Upcoming Payments */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Payments</CardTitle>
              </CardHeader>
              <div className="space-y-3">
                {upcomingPayments.map(({ debt, date, daysLeft }) => {
                  const srcCurrency = debt.currency || 'USD';
                  const amountDue = convertCurrency(debt.minimum_payment, srcCurrency, displayCurrency, exchangeRates);
                  return (
                    <div key={debt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div>
                        <p className="font-medium text-gray-900">{debt.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatDateShort(date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(amountDue, displayCurrency)}</p>
                        <Badge
                          variant={daysLeft <= 7 ? 'danger' : daysLeft <= 14 ? 'warning' : 'info'}
                          size="sm"
                          className="mt-1"
                        >
                          {daysLeft === 0 ? 'today' : `in ${daysLeft} days`}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* Charts & Activity Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Accounts Distribution</CardTitle>
            </CardHeader>
            {accountsChartData.length > 0 ? (
              <PieChartComponent data={accountsChartData} title="" />
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p className="mb-4">📊 No accounts yet</p>
                <Link href="/accounts">
                  <Button variant="primary" size="sm">Add Your First Account</Button>
                </Link>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Transactions</CardTitle>
                <Link href="/transactions">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="mb-4">📝 No transactions yet</p>
                <Link href="/transactions">
                  <Button variant="primary" size="sm">Add Transaction</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.slice(0, 5).map((tx: any) => {
                  const txCurrency = tx.currency || 'USD';
                  const convertedAmount = convertCurrency(Math.abs(tx.amount || 0), txCurrency, displayCurrency, exchangeRates);
                  
                  return (
                    <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          tx.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {tx.type === 'income' ? '↓' : '↑'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{tx.description}</p>
                          <p className="text-sm text-gray-500">{new Date(tx.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className={`font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(convertedAmount, displayCurrency)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Insights & Budgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* AI Insights */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>AI Insights & Alerts</CardTitle>
                <Link href="/insights">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            {insights.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>💡 No new insights. Check back later!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {insights.slice(0, 4).map((insight) => (
                  <div key={insight.id} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant={insight.severity === 'high' ? 'danger' : insight.severity === 'medium' ? 'warning' : 'info'}>
                        {insight.type}
                      </Badge>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">{insight.title}</h4>
                    <p className="text-sm text-gray-600">{insight.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Budget Progress */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Budget Progress</CardTitle>
                <Link href="/budgets">
                  <Button variant="outline" size="sm">Manage Budgets</Button>
                </Link>
              </div>
            </CardHeader>
            {budgets.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="mb-4">🎯 No budgets set yet</p>
                <Link href="/budgets">
                  <Button variant="primary" size="sm">Create Budget</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {budgets.slice(0, 4).map((budget: any) => {
                  const spent = budget.spent || 0;
                  const total = budget.total_amount || budget.amount || 0;
                  const budgetCurrency = budget.currency || 'USD';
                  const convertedSpent = convertCurrency(spent, budgetCurrency, displayCurrency, exchangeRates);
                  const convertedTotal = convertCurrency(total, budgetCurrency, displayCurrency, exchangeRates);
                  const percentage = total > 0 ? (spent / total) * 100 : 0;
                  return (
                    <div key={budget.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{budget.name || budget.category}</h4>
                        <Badge variant={percentage > 90 ? 'danger' : percentage > 70 ? 'warning' : 'success'}>
                          {percentage.toFixed(0)}%
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            percentage > 90 ? 'bg-red-600' : percentage > 70 ? 'bg-yellow-500' : 'bg-green-600'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(convertedSpent, displayCurrency)} of {formatCurrency(convertedTotal, displayCurrency)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/transactions">
              <div className="p-6 text-center bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                <div className="text-3xl mb-2">📝</div>
                <p className="font-medium text-gray-900">Add Transaction</p>
              </div>
            </Link>
            <Link href="/accounts">
              <div className="p-6 text-center bg-green-50 rounded-lg hover:bg-green-100 transition-colors cursor-pointer">
                <div className="text-3xl mb-2">💰</div>
                <p className="font-medium text-gray-900">Manage Accounts</p>
              </div>
            </Link>
            <Link href="/budgets">
              <div className="p-6 text-center bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer">
                <div className="text-3xl mb-2">🎯</div>
                <p className="font-medium text-gray-900">Set Budget</p>
              </div>
            </Link>
            <Link href="/goals">
              <div className="p-6 text-center bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors cursor-pointer">
                <div className="text-3xl mb-2">🏆</div>
                <p className="font-medium text-gray-900">Track Goals</p>
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
