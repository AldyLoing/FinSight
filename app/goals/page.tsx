'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/db';
import { Navigation } from '@/components/Navigation';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { getExchangeRates, convertCurrency, formatCurrency, SUPPORTED_CURRENCIES } from '@/lib/utils/currency';

interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  status: string;
  category?: string;
  notes?: string;
  created_at: string;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [contributeAmount, setContributeAmount] = useState('');
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  
  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    current_amount: '0',
    target_date: '',
    category: '',
    notes: '',
  });

  useEffect(() => {
    checkAuth();
    fetchGoals();
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

  async function fetchGoals() {
    try {
      const res = await fetch('/api/goals');
      if (res.ok) {
        const data = await res.json();
        setGoals(data.goals || []);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  }

  function openModal(goal?: Goal) {
    if (goal) {
      setEditingGoal(goal);
      setFormData({
        name: goal.name || '',
        target_amount: goal.target_amount?.toString() || '0',
        current_amount: goal.current_amount?.toString() || '0',
        target_date: goal.target_date ? goal.target_date.split('T')[0] : '',
        category: goal.category || '',
        notes: goal.notes || '',
      });
    } else {
      setEditingGoal(null);
      setFormData({
        name: '',
        target_amount: '',
        current_amount: '0',
        target_date: '',
        category: '',
        notes: '',
      });
    }
    setIsModalOpen(true);
  }

  function openContributeModal(goal: Goal) {
    setSelectedGoal(goal);
    setContributeAmount('');
    setIsContributeModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const targetAmount = parseFloat(formData.target_amount);
    const currentAmount = parseFloat(formData.current_amount);
    
    if (isNaN(targetAmount) || targetAmount <= 0) {
      alert('Please enter a valid target amount');
      return;
    }
    
    if (isNaN(currentAmount) || currentAmount < 0) {
      alert('Please enter a valid current amount');
      return;
    }

    const payload = {
      name: formData.name,
      description: formData.notes,
      target_amount: targetAmount,
      current_amount: currentAmount,
      target_date: formData.target_date || undefined,
      monthly_contribution: 0,
    };

    try {
      if (editingGoal) {
        const res = await fetch(`/api/goals/${editingGoal.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        if (res.ok) {
          await fetchGoals();
          setIsModalOpen(false);
        } else {
          const errorData = await res.json();
          alert(`Failed to update goal: ${errorData.error || 'Unknown error'}`);
        }
      } else {
        const res = await fetch('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        if (res.ok) {
          await fetchGoals();
          setIsModalOpen(false);
        } else {
          const errorData = await res.json();
          alert(`Failed to create goal: ${errorData.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error saving goal:', error);
      alert('An unexpected error occurred');
    }
  }

  async function handleContribute(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGoal) return;

    try {
      const newAmount = selectedGoal.current_amount + parseFloat(contributeAmount);
      const res = await fetch(`/api/goals/${selectedGoal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_amount: newAmount }),
      });
      
      if (res.ok) {
        await fetchGoals();
        setIsContributeModalOpen(false);
      }
    } catch (error) {
      console.error('Error contributing to goal:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    
    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        await fetchGoals();
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  }

  async function toggleStatus(goal: Goal) {
    const newStatus = goal.status === 'active' ? 'completed' : 'active';
    try {
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (res.ok) {
        await fetchGoals();
      }
    } catch (error) {
      console.error('Error updating goal status:', error);
    }
  }

  const categories = ['Emergency Fund', 'Vacation', 'House', 'Car', 'Education', 'Retirement', 'Investment', 'Other'];

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading goals...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Goals</h1>
            <p className="text-gray-600 mt-2">Track your financial goals and progress</p>
          </div>
          <div className="flex items-center gap-4">
            <Select
              value={displayCurrency}
              onChange={(e) => setDisplayCurrency(e.target.value)}
              options={SUPPORTED_CURRENCIES.map(c => ({ value: c.code, label: `${c.symbol} ${c.code}` }))}
            />
            <Button onClick={() => openModal()} variant="primary">
              + Add Goal
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Goals</p>
                <p className="text-2xl font-bold text-blue-600">{activeGoals.length}</p>
              </div>
              <div className="text-4xl">🎯</div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed Goals</p>
                <p className="text-2xl font-bold text-green-600">{completedGoals.length}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Progress</p>
                <p className="text-2xl font-bold text-purple-600">
                  {goals.length > 0 
                    ? Math.round((goals.reduce((sum, g) => {
                        const current = g.current_amount ?? 0;
                        const target = g.target_amount ?? 1;
                        return sum + (current / target);
                      }, 0) / goals.length) * 100)
                    : 0}%
                </p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </Card>
        </div>

        {/* Active Goals */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Active Goals</h2>
          {activeGoals.length === 0 ? (
            <Card>
              <div className="text-center py-12 text-gray-500">
                <p className="mb-4">🏆 No active goals yet</p>
                <Button onClick={() => openModal()} variant="primary">
                  Set Your First Goal
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeGoals.map((goal) => {
                const convertedCurrent = convertCurrency(goal.current_amount, 'USD', displayCurrency, exchangeRates);
                const convertedTarget = convertCurrency(goal.target_amount, 'USD', displayCurrency, exchangeRates);
                const percentage = (goal.current_amount / goal.target_amount) * 100;
                const remaining = convertedTarget - convertedCurrent;
                const daysLeft = goal.target_date 
                  ? Math.ceil((new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  : null;
                
                return (
                  <Card key={goal.id} hover>
                    <div className="mb-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{goal.name}</h3>
                          {goal.category && (
                            <Badge variant="info" size="sm" className="mt-1">{goal.category}</Badge>
                          )}
                        </div>
                        <Badge variant={percentage >= 100 ? 'success' : 'default'}>
                          {percentage.toFixed(0)}%
                        </Badge>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-semibold">
                          {formatCurrency(convertedCurrent, displayCurrency)} / {formatCurrency(convertedTarget, displayCurrency)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all ${
                            percentage >= 100 ? 'bg-green-600' : 
                            percentage >= 75 ? 'bg-blue-600' : 
                            percentage >= 50 ? 'bg-yellow-500' : 
                            'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="mb-4 space-y-2 text-sm text-gray-600">
                      <p>Remaining: {formatCurrency(remaining, displayCurrency)}</p>
                      {goal.target_date && (
                        <p className={daysLeft && daysLeft < 30 ? 'text-red-600 font-medium' : ''}>
                          {daysLeft && daysLeft > 0 
                            ? `${daysLeft} days left` 
                            : daysLeft === 0 
                            ? 'Due today!' 
                            : 'Overdue'}
                        </p>
                      )}
                      {goal.notes && (
                        <p className="text-xs italic">{goal.notes}</p>
                      )}
                    </div>

                    {percentage >= 100 && (
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800 font-medium">
                          🎉 Goal achieved! Mark as complete?
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => openContributeModal(goal)}
                        variant="primary"
                        size="sm"
                      >
                        + Add Funds
                      </Button>
                      <Button
                        onClick={() => toggleStatus(goal)}
                        variant="success"
                        size="sm"
                      >
                        Complete
                      </Button>
                      <Button
                        onClick={() => openModal(goal)}
                        variant="outline"
                        size="sm"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDelete(goal.id)}
                        variant="danger"
                        size="sm"
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

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Completed Goals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedGoals.map((goal) => {
                const convertedTarget = convertCurrency(goal.target_amount ?? 0, 'USD', displayCurrency, exchangeRates);
                return (
                  <Card key={goal.id} className="opacity-75">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{goal.name}</h3>
                      <Badge variant="success">✓ Completed</Badge>
                    </div>
                    <p className="text-gray-600 mb-4">
                      Target: {formatCurrency(convertedTarget, displayCurrency)}
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => toggleStatus(goal)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        Reactivate
                      </Button>
                      <Button
                        onClick={() => handleDelete(goal.id)}
                        variant="danger"
                        size="sm"
                      >
                        Delete
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Goal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGoal ? 'Edit Goal' : 'Create New Goal'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Goal Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g., Emergency Fund"
          />

          <Input
            label="Target Amount"
            type="number"
            step="0.01"
            value={formData.target_amount}
            onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
            required
            placeholder="0.00"
          />

          <Input
            label="Current Amount"
            type="number"
            step="0.01"
            value={formData.current_amount}
            onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
            required
            placeholder="0.00"
          />

          <Input
            label="Target Date (Optional)"
            type="date"
            value={formData.target_date}
            onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
          />

          <Select
            label="Category (Optional)"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={[
              { value: '', label: 'Select category' },
              ...categories.map(cat => ({ value: cat, label: cat }))
            ]}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Why is this goal important to you?"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button type="submit" variant="primary" className="flex-1">
              {editingGoal ? 'Update Goal' : 'Create Goal'}
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

      {/* Contribute Modal */}
      <Modal
        isOpen={isContributeModalOpen}
        onClose={() => setIsContributeModalOpen(false)}
        title={`Add Funds to ${selectedGoal?.name}`}
        size="sm"
      >
        <form onSubmit={handleContribute} className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-gray-600 mb-1">Current Progress</p>
            <p className="text-xl font-bold text-blue-600">
              ${selectedGoal?.current_amount.toLocaleString()} / ${selectedGoal?.target_amount.toLocaleString()}
            </p>
          </div>

          <Input
            label="Contribution Amount"
            type="number"
            step="0.01"
            value={contributeAmount}
            onChange={(e) => setContributeAmount(e.target.value)}
            required
            placeholder="0.00"
            autoFocus
          />

          <div className="flex space-x-3 pt-4">
            <Button type="submit" variant="primary" className="flex-1">
              Add Funds
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setIsContributeModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
