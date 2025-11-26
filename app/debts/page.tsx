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

interface Debt {
  id: string;
  name: string;
  type: string;
  principal_amount: number;
  current_balance: number;
  interest_rate: number;
  minimum_payment: number;
  due_date?: string;
  creditor?: string;
  notes?: string;
  status: string;
}

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'credit_card',
    principal_amount: '',
    current_balance: '',
    interest_rate: '',
    minimum_payment: '',
    due_date: '',
    creditor: '',
    notes: '',
  });

  useEffect(() => {
    checkAuth();
    fetchDebts();
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

  async function fetchDebts() {
    try {
      const res = await fetch('/api/debts');
      if (res.ok) {
        const data = await res.json();
        setDebts(data.debts || []);
      }
    } catch (error) {
      console.error('Error fetching debts:', error);
    } finally {
      setLoading(false);
    }
  }

  function openModal(debt?: Debt) {
    if (debt) {
      setEditingDebt(debt);
      setFormData({
        name: debt.name || '',
        type: debt.type || 'credit_card',
        principal_amount: debt.principal_amount?.toString() || '0',
        current_balance: debt.current_balance?.toString() || '0',
        interest_rate: debt.interest_rate?.toString() || '0',
        minimum_payment: debt.minimum_payment?.toString() || '0',
        due_date: debt.due_date ? debt.due_date.split('T')[0] : '',
        creditor: debt.creditor || '',
        notes: debt.notes || '',
      });
    } else {
      setEditingDebt(null);
      setFormData({
        name: '',
        type: 'credit_card',
        principal_amount: '',
        current_balance: '',
        interest_rate: '',
        minimum_payment: '',
        due_date: '',
        creditor: '',
        notes: '',
      });
    }
    setIsModalOpen(true);
  }

  function openPaymentModal(debt: Debt) {
    setSelectedDebt(debt);
    setPaymentAmount('');
    setIsPaymentModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const principalValue = parseFloat(formData.principal_amount);
    const balanceValue = parseFloat(formData.current_balance);
    const rateValue = parseFloat(formData.interest_rate);
    const paymentValue = parseFloat(formData.minimum_payment);
    
    if (isNaN(principalValue) || principalValue <= 0) {
      alert('Please enter a valid principal amount');
      return;
    }
    
    if (isNaN(balanceValue) || balanceValue < 0) {
      alert('Please enter a valid current balance');
      return;
    }

    const payload = {
      name: formData.name,
      description: `${formData.type} - ${formData.creditor || 'No creditor'}`,
      principal: principalValue,
      current_balance: balanceValue,
      interest_rate: rateValue,
      interest_type: 'simple' as const,
      minimum_payment: paymentValue,
      due_day: formData.due_date ? new Date(formData.due_date).getDate() : undefined,
    };

    try {
      if (editingDebt) {
        const res = await fetch(`/api/debts/${editingDebt.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        if (res.ok) {
          await fetchDebts();
          setIsModalOpen(false);
        } else {
          const errorData = await res.json();
          alert(`Failed to update debt: ${errorData.error || 'Unknown error'}`);
        }
      } else {
        const res = await fetch('/api/debts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        if (res.ok) {
          await fetchDebts();
          setIsModalOpen(false);
        } else {
          const errorData = await res.json();
          alert(`Failed to create debt: ${errorData.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error saving debt:', error);
      alert('An unexpected error occurred');
    }
  }

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDebt) return;

    try {
      const newBalance = Math.max(0, selectedDebt.current_balance - parseFloat(paymentAmount));
      const newStatus = newBalance === 0 ? 'paid_off' : 'active';
      
      const res = await fetch(`/api/debts/${selectedDebt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          current_balance: newBalance,
          status: newStatus 
        }),
      });
      
      if (res.ok) {
        await fetchDebts();
        setIsPaymentModalOpen(false);
      }
    } catch (error) {
      console.error('Error recording payment:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this debt?')) return;
    
    try {
      const res = await fetch(`/api/debts/${id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        await fetchDebts();
      }
    } catch (error) {
      console.error('Error deleting debt:', error);
    }
  }

  const debtTypes = [
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'personal_loan', label: 'Personal Loan' },
    { value: 'student_loan', label: 'Student Loan' },
    { value: 'mortgage', label: 'Mortgage' },
    { value: 'auto_loan', label: 'Auto Loan' },
    { value: 'medical', label: 'Medical' },
    { value: 'other', label: 'Other' },
  ];

  const activeDebts = debts.filter(d => d.status === 'active');
  const paidOffDebts = debts.filter(d => d.status === 'paid_off');
  
  const totalDebt = convertCurrency(
    activeDebts.reduce((sum, d) => sum + d.current_balance, 0),
    'USD',
    displayCurrency,
    exchangeRates
  );
  const totalPrincipal = activeDebts.reduce((sum, d) => sum + d.principal_amount, 0);
  const avgInterestRate = activeDebts.length > 0 
    ? activeDebts.reduce((sum, d) => sum + d.interest_rate, 0) / activeDebts.length 
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading debts...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Debts</h1>
            <p className="text-gray-600 mt-2">Manage and track your debts</p>
          </div>
          <div className="flex items-center gap-4">
            <Select
              value={displayCurrency}
              onChange={(e) => setDisplayCurrency(e.target.value)}
              options={SUPPORTED_CURRENCIES.map(c => ({ value: c.code, label: `${c.symbol} ${c.code}` }))}
            />
            <Button onClick={() => openModal()} variant="primary">
              + Add Debt
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
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

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Debts</p>
                <p className="text-2xl font-bold text-orange-600">{activeDebts.length}</p>
              </div>
              <div className="text-4xl">📋</div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg Interest</p>
                <p className="text-2xl font-bold text-purple-600">{avgInterestRate.toFixed(2)}%</p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Paid Off</p>
                <p className="text-2xl font-bold text-green-600">{paidOffDebts.length}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </Card>
        </div>

        {/* Active Debts */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Active Debts</h2>
          {activeDebts.length === 0 ? (
            <Card>
              <div className="text-center py-12 text-gray-500">
                <p className="mb-4">🎉 No active debts!</p>
                <p className="text-sm">You&apos;re debt-free or haven&apos;t added any debts yet.</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeDebts.map((debt) => {
                const convertedBalance = convertCurrency(debt.current_balance, 'USD', displayCurrency, exchangeRates);
                const convertedPrincipal = convertCurrency(debt.principal_amount, 'USD', displayCurrency, exchangeRates);
                const convertedMinPayment = convertCurrency(debt.minimum_payment, 'USD', displayCurrency, exchangeRates);
                const percentage = ((debt.principal_amount - debt.current_balance) / debt.principal_amount) * 100;
                const monthsToPayOff = debt.minimum_payment > 0 
                  ? Math.ceil(debt.current_balance / debt.minimum_payment)
                  : 0;
                
                return (
                  <Card key={debt.id} hover>
                    <div className="mb-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{debt.name}</h3>
                          <Badge variant="danger" size="sm" className="mt-1">{debt.type.replace('_', ' ')}</Badge>
                        </div>
                        <Badge variant="warning">{debt.interest_rate}% APR</Badge>
                      </div>
                      {debt.creditor && (
                        <p className="text-sm text-gray-600">{debt.creditor}</p>
                      )}
                    </div>

                    <div className="mb-4 space-y-3">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Current Balance</p>
                        <p className="text-2xl font-bold text-red-600">
                          {formatCurrency(convertedBalance, displayCurrency)}
                        </p>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Original Amount</span>
                        <span className="font-semibold">{formatCurrency(convertedPrincipal, displayCurrency)}</span>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-green-600 transition-all"
                          style={{ width: `${Math.max(percentage, 0)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600">
                        {percentage.toFixed(0)}% paid off
                      </p>

                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Minimum Payment</span>
                          <span className="font-semibold">{formatCurrency(convertedMinPayment, displayCurrency)}</span>
                        </div>
                        {debt.due_date && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Next Due</span>
                            <span className="font-semibold">{new Date(debt.due_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        {monthsToPayOff > 0 && (
                          <p className="text-xs text-gray-600 mt-2">
                            ~{monthsToPayOff} months to pay off at minimum
                          </p>
                        )}
                      </div>
                    </div>

                    {debt.notes && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">{debt.notes}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => openPaymentModal(debt)}
                        variant="success"
                        size="sm"
                      >
                        Make Payment
                      </Button>
                      <Button
                        onClick={() => openModal(debt)}
                        variant="outline"
                        size="sm"
                      >
                        Edit
                      </Button>
                    </div>
                    <Button
                      onClick={() => handleDelete(debt.id)}
                      variant="danger"
                      size="sm"
                      className="w-full mt-2"
                    >
                      Delete
                    </Button>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Paid Off Debts */}
        {paidOffDebts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Paid Off Debts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paidOffDebts.map((debt) => {
                const convertedPrincipal = convertCurrency(debt.principal_amount ?? 0, 'USD', displayCurrency, exchangeRates);
                return (
                  <Card key={debt.id} className="opacity-75">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{debt.name}</h3>
                        <Badge variant="success" size="sm" className="mt-1">Paid Off</Badge>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4">
                      Original Amount: {formatCurrency(convertedPrincipal, displayCurrency)}
                    </p>
                    <Button
                      onClick={() => handleDelete(debt.id)}
                      variant="danger"
                      size="sm"
                      className="w-full"
                    >
                      Delete
                    </Button>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Debt Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDebt ? 'Edit Debt' : 'Add New Debt'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Debt Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g., Chase Credit Card"
          />

          <Select
            label="Debt Type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            options={debtTypes}
            required
          />

          <Input
            label="Original Principal Amount"
            type="number"
            step="0.01"
            value={formData.principal_amount}
            onChange={(e) => setFormData({ ...formData, principal_amount: e.target.value })}
            required
            placeholder="0.00"
          />

          <Input
            label="Current Balance"
            type="number"
            step="0.01"
            value={formData.current_balance}
            onChange={(e) => setFormData({ ...formData, current_balance: e.target.value })}
            required
            placeholder="0.00"
          />

          <Input
            label="Interest Rate (%)"
            type="number"
            step="0.01"
            value={formData.interest_rate}
            onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
            required
            placeholder="0.00"
          />

          <Input
            label="Minimum Payment"
            type="number"
            step="0.01"
            value={formData.minimum_payment}
            onChange={(e) => setFormData({ ...formData, minimum_payment: e.target.value })}
            required
            placeholder="0.00"
          />

          <Input
            label="Next Due Date (Optional)"
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
          />

          <Input
            label="Creditor (Optional)"
            value={formData.creditor}
            onChange={(e) => setFormData({ ...formData, creditor: e.target.value })}
            placeholder="e.g., Chase Bank"
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
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button type="submit" variant="primary" className="flex-1">
              {editingDebt ? 'Update Debt' : 'Add Debt'}
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

      {/* Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Make Payment: ${selectedDebt?.name}`}
        size="sm"
      >
        <form onSubmit={handlePayment} className="space-y-4">
          <div className="bg-red-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-gray-600 mb-1">Current Balance</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(
                convertCurrency(selectedDebt?.current_balance ?? 0, 'USD', displayCurrency, exchangeRates),
                displayCurrency
              )}
            </p>
            <p className="text-xs text-gray-600 mt-2">
              Minimum Payment: {formatCurrency(
                convertCurrency(selectedDebt?.minimum_payment ?? 0, 'USD', displayCurrency, exchangeRates),
                displayCurrency
              )}
            </p>
          </div>

          <Input
            label="Payment Amount"
            type="number"
            step="0.01"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            required
            placeholder="0.00"
            autoFocus
          />

          <div className="flex space-x-3 pt-4">
            <Button type="submit" variant="success" className="flex-1">
              Record Payment
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setIsPaymentModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
