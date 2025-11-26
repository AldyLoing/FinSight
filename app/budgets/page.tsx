'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/db';
import { Navigation } from '@/components/Navigation';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { BarChartComponent } from '@/components/charts/Charts';
import { getExchangeRates, convertCurrency, formatCurrency, SUPPORTED_CURRENCIES } from '@/lib/utils/currency';

interface Budget {
  id: string;
  name: string;
  total_amount: number;
  currency?: string;
  period: string;
  start_date: string;
  end_date?: string;
  spent?: number;
  alert_threshold?: number;
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    currency: 'USD',
    period: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    alert_threshold: '80',
  });

  useEffect(() => {
    checkAuth();
    fetchBudgets();
    loadExchangeRates();
  }, []);

  async function loadExchangeRates() {
    const rates = await getExchangeRates();
    setExchangeRates(rates);
  }

  async function checkAuth() {
    const supabase = createBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = '/auth/login';
    }
  }

  async function fetchBudgets() {
    try {
      const res = await fetch('/api/budgets?status=true');
      if (res.ok) {
        const data = await res.json();
        setBudgets(data.budgets || []);
      }
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setLoading(false);
    }
  }

  function openModal(budget?: Budget) {
    if (budget) {
      setEditingBudget(budget);
      setFormData({
        category: budget.name || '',
        amount: budget.total_amount?.toString() || '0',
        currency: budget.currency || 'USD',
        period: budget.period || 'monthly',
        start_date: budget.start_date?.split('T')[0] || new Date().toISOString().split('T')[0],
        end_date: budget.end_date ? budget.end_date.split('T')[0] : '',
        alert_threshold: budget.alert_threshold?.toString() || '80',
      });
    } else {
      setEditingBudget(null);
      setFormData({
        category: '',
        amount: '',
        currency: 'USD',
        period: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        alert_threshold: '80',
      });
    }
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const amountValue = parseFloat(formData.amount);
    const thresholdValue = parseFloat(formData.alert_threshold) / 100;
    
    if (isNaN(amountValue) || amountValue <= 0) {
      alert('Please enter a valid budget amount');
      return;
    }

    const payload = {
      name: formData.category,
      total_amount: amountValue,
      currency: formData.currency,
      period: formData.period as 'monthly' | 'yearly' | 'weekly' | 'custom',
      start_date: formData.start_date,
      end_date: formData.end_date || undefined,
      alert_threshold: thresholdValue,
      carry_over: true,
    };

    try {
      if (editingBudget) {
        const res = await fetch(`/api/budgets/${editingBudget.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        if (res.ok) {
          await fetchBudgets();
          setIsModalOpen(false);
        } else {
          const errorData = await res.json();
          alert(`Failed to update budget: ${errorData.error || 'Unknown error'}`);
        }
      } else {
        const res = await fetch('/api/budgets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        if (res.ok) {
          await fetchBudgets();
          setIsModalOpen(false);
        } else {
          const errorData = await res.json();
          alert(`Failed to create budget: ${errorData.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error saving budget:', error);
      alert('An unexpected error occurred');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this budget?')) return;
    
    try {
      const res = await fetch(`/api/budgets/${id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        await fetchBudgets();
      }
    } catch (error) {
      console.error('Error deleting budget:', error);
    }
  }

  const chartData = budgets.map(b => ({
    name: b.name,
    value: b.total_amount,
    budget: b.total_amount,
    spent: b.spent || 0,
  }));

  const categories = [
    'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
    'Bills & Utilities', 'Healthcare', 'Education', 'Travel',
    'Groceries', 'Rent', 'Salary', 'Other'
  ];

  const periods = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading budgets...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Budgets</h1>
            <p className="text-gray-600 mt-2">Set and track your spending limits</p>
          </div>
          <div className="flex items-center gap-4">
            <Select
              value={displayCurrency}
              onChange={(e) => setDisplayCurrency(e.target.value)}
              options={SUPPORTED_CURRENCIES.map(c => ({ value: c.code, label: `${c.symbol} ${c.code}` }))}
            />
            <Button onClick={() => openModal()} variant="primary">
              + Add Budget
            </Button>
          </div>
        </div>

        {/* Chart */}
        {budgets.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Budget Overview</CardTitle>
            </CardHeader>
            <BarChartComponent 
              data={chartData} 
              dataKey="spent" 
              title=""
              color="#8b5cf6"
              height={300}
            />
          </Card>
        )}

        {/* Budget Cards */}
        {budgets.length === 0 ? (
          <Card>
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">🎯 No budgets set yet</p>
              <Button onClick={() => openModal()} variant="primary">
                Create Your First Budget
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets.map((budget) => {
              const spent = budget.spent || 0;
              const budgetCurrency = budget.currency || 'USD';
              const convertedAmount = convertCurrency(budget.total_amount, budgetCurrency, displayCurrency, exchangeRates);
              const convertedSpent = convertCurrency(spent, budgetCurrency, displayCurrency, exchangeRates);
              const percentage = budget.total_amount > 0 ? (spent / budget.total_amount) * 100 : 0;
              const isOverBudget = percentage > 100;
              const isNearLimit = percentage > (budget.alert_threshold || 80);
              
              return (
                <Card key={budget.id} hover>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{budget.name}</h3>
                      <Badge 
                        variant={
                          isOverBudget ? 'danger' : 
                          isNearLimit ? 'warning' : 
                          'success'
                        }
                      >
                        {percentage.toFixed(0)}%
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 capitalize">{budget.period}</p>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Spent</span>
                      <span className="font-semibold">
                        {formatCurrency(convertedSpent, displayCurrency)} / {formatCurrency(convertedAmount, displayCurrency)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all ${
                          isOverBudget ? 'bg-red-600' : 
                          isNearLimit ? 'bg-yellow-500' : 
                          'bg-green-600'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="mb-4 text-sm text-gray-600">
                    <p>Remaining: {formatCurrency(Math.max(0, convertedAmount - convertedSpent), displayCurrency)}</p>
                    <p className="text-xs mt-1">
                      {new Date(budget.start_date).toLocaleDateString()} - 
                      {budget.end_date ? new Date(budget.end_date).toLocaleDateString() : ' Ongoing'}
                    </p>
                  </div>

                  {isOverBudget && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800 font-medium">
                        ⚠️ Over budget by {formatCurrency(spent - budget.total_amount, budgetCurrency)}
                      </p>
                    </div>
                  )}

                  {isNearLimit && !isOverBudget && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800 font-medium">
                        ⚠️ Approaching limit
                      </p>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => openModal(budget)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDelete(budget.id)}
                      variant="danger"
                      size="sm"
                      className="flex-1"
                    >
                      Delete
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBudget ? 'Edit Budget' : 'Create New Budget'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={[
              { value: '', label: 'Select category' },
              ...categories.map(cat => ({ value: cat, label: cat }))
            ]}
            required
          />

          <Input
            label="Budget Amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
            placeholder="0.00"
          />

          <Select
            label="Currency"
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            options={SUPPORTED_CURRENCIES.map(c => ({ value: c.code, label: `${c.symbol} ${c.name}` }))}
            required
          />

          <Select
            label="Period"
            value={formData.period}
            onChange={(e) => setFormData({ ...formData, period: e.target.value })}
            options={periods}
            required
          />

          <Input
            label="Start Date"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            required
          />

          <Input
            label="End Date (Optional)"
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            helperText="Leave empty for ongoing budget"
          />

          <Input
            label="Alert Threshold (%)"
            type="number"
            min="1"
            max="100"
            value={formData.alert_threshold}
            onChange={(e) => setFormData({ ...formData, alert_threshold: e.target.value })}
            helperText="Get notified when spending reaches this percentage"
          />

          <div className="flex space-x-3 pt-4">
            <Button type="submit" variant="primary" className="flex-1">
              {editingBudget ? 'Update Budget' : 'Create Budget'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
