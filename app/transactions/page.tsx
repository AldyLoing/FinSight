'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/db';
import { Navigation } from '@/components/Navigation';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { getExchangeRates, convertCurrency, formatCurrency, SUPPORTED_CURRENCIES } from '@/lib/utils/currency';

interface Transaction {
  id: string;
  date?: string;
  description?: string;
  amount?: number;
  currency?: string;
  type: 'income' | 'expense' | 'transfer';
  category?: string;
  account_id: string;
  account_name?: string;
  notes?: string;
}

interface Account {
  id: string;
  name: string;
  currency?: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [displayCurrency, setDisplayCurrency] = useState<string>('IDR');
  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    account: 'all',
    startDate: '',
    endDate: '',
    search: '',
  });
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5), // HH:MM format
    description: '',
    amount: '',
    type: 'expense',
    category: '',
    account_id: '',
    budget_id: '',
    currency: 'IDR',
    notes: '',
  });

  useEffect(() => {
    checkAuth();
    fetchData();
    loadExchangeRates();
  }, []);

  useEffect(() => {
    console.log('isModalOpen changed:', isModalOpen);
  }, [isModalOpen]);

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

  async function fetchData() {
    try {
      const [txRes, accRes, budgetRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/accounts'),
        fetch('/api/budgets'),
      ]);

      if (txRes.ok) {
        const data = await txRes.json();
        console.log('Fetched transactions:', data.transactions);
        setTransactions(data.transactions || []);
      } else {
        console.error('Failed to fetch transactions:', await txRes.text());
      }

      if (accRes.ok) {
        const data = await accRes.json();
        setAccounts(data.accounts || []);
      } else {
        console.error('Failed to fetch accounts:', await accRes.text());
      }

      if (budgetRes.ok) {
        const data = await budgetRes.json();
        setBudgets(data.budgets || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  function openModal(transaction?: Transaction) {
    console.log('openModal called', { transaction, accounts });
    if (transaction) {
      setEditingTransaction(transaction);
      const txDate = transaction.date ? new Date(transaction.date) : new Date();
      setFormData({
        date: transaction.date ? transaction.date.split('T')[0] : new Date().toISOString().split('T')[0],
        time: txDate.toTimeString().slice(0, 5),
        description: transaction.description || '',
        amount: Math.abs(transaction.amount || 0).toString(),
        type: transaction.type || 'expense',
        category: transaction.category || '',
        account_id: transaction.account_id || '',
        budget_id: '',
        currency: transaction.currency || 'IDR',
        notes: transaction.notes || '',
      });
    } else {
      setEditingTransaction(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        description: '',
        amount: '',
        type: 'expense',
        category: '',
        account_id: accounts[0]?.id || '',
        budget_id: '',
        currency: accounts[0]?.currency || 'IDR',
        notes: '',
      });
    }
    console.log('Setting isModalOpen to true');
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const amountValue = parseFloat(formData.amount);
    if (isNaN(amountValue)) {
      alert('Please enter a valid amount');
      return;
    }

    const payload = {
      account_id: formData.account_id,
      amount: formData.type === 'expense' ? -Math.abs(amountValue) : Math.abs(amountValue),
      currency: formData.currency,
      description: formData.description,
      category: formData.category || null,
      budget_id: formData.budget_id || null,
      notes: formData.notes,
      occurred_at: new Date(`${formData.date}T${formData.time}:00`).toISOString(),
    };

    try {
      if (editingTransaction) {
        const res = await fetch(`/api/transactions/${editingTransaction.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        if (res.ok) {
          await fetchData();
          setIsModalOpen(false);
        } else {
          const errorData = await res.json();
          alert(`Failed to update transaction: ${errorData.error || 'Unknown error'}`);
        }
      } else {
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        if (res.ok) {
          await fetchData();
          setIsModalOpen(false);
        } else {
          const errorData = await res.json();
          alert(`Failed to create transaction: ${errorData.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  }

  const filteredTransactions = transactions.filter(tx => {
    if (filters.type !== 'all' && tx.type !== filters.type) return false;
    if (filters.account !== 'all' && tx.account_id !== filters.account) return false;
    if (filters.category !== 'all' && tx.category !== filters.category) return false;
    if (filters.search && !(tx.description || '').toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.startDate && (tx.date || '') < filters.startDate) return false;
    if (filters.endDate && (tx.date || '') > filters.endDate) return false;
    return true;
  });

  const totalIncome = filteredTransactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => {
      const amount = tx.amount || 0;
      const txCurrency = tx.currency || 'IDR';
      const converted = convertCurrency(amount, txCurrency, displayCurrency, exchangeRates);
      return sum + converted;
    }, 0);
    
  const totalExpenses = filteredTransactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => {
      const amount = Math.abs(tx.amount || 0);
      const txCurrency = tx.currency || 'IDR';
      const converted = convertCurrency(amount, txCurrency, displayCurrency, exchangeRates);
      return sum + converted;
    }, 0);

  const transactionTypes = [
    { value: 'income', label: 'Income' },
    { value: 'expense', label: 'Expense' },
    { value: 'transfer', label: 'Transfer' },
  ];

  const categories = [
    'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
    'Bills & Utilities', 'Healthcare', 'Education', 'Travel',
    'Groceries', 'Rent', 'Salary', 'Freelance', 'Investment', 'Other'
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading transactions...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
            <p className="text-gray-600 mt-2">Track your income and expenses</p>
          </div>
          <div className="flex items-center space-x-4">
            <Select
              value={displayCurrency}
              onChange={(e) => setDisplayCurrency(e.target.value)}
              options={SUPPORTED_CURRENCIES.map(c => ({ value: c.code, label: `${c.symbol} ${c.code}` }))}
            />
            <Button 
              onClick={() => {
                console.log('Button clicked, accounts:', accounts);
                if (accounts.length === 0) {
                  alert('Please create an account first before adding transactions.');
                  window.location.href = '/accounts';
                  return;
                }
                openModal();
              }} 
              variant="primary"
            >
              + Add Transaction
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Income</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalIncome, displayCurrency)}
                </p>
              </div>
              <div className="text-4xl">📈</div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalExpenses, displayCurrency)}
                </p>
              </div>
              <div className="text-4xl">📉</div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Net</p>
                <p className={`text-2xl font-bold ${(totalIncome - totalExpenses) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totalIncome - totalExpenses, displayCurrency)}
                </p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              placeholder="Search..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
            
            <Select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              options={[
                { value: 'all', label: 'All Types' },
                ...transactionTypes
              ]}
            />

            <Select
              value={filters.account}
              onChange={(e) => setFilters({ ...filters, account: e.target.value })}
              options={[
                { value: 'all', label: 'All Accounts' },
                ...accounts.map(acc => ({ value: acc.id, label: acc.name }))
              ]}
            />

            <Input
              type="date"
              placeholder="Start Date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />

            <Input
              type="date"
              placeholder="End Date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Transactions ({filteredTransactions.length})</CardTitle>
          </CardHeader>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">📝 No transactions yet</p>
              <Button onClick={() => openModal()} variant="primary">
                Add Your First Transaction
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-gray-600">
                      {tx.date ? (
                        <>
                          <div>{new Date(tx.date).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-400">
                            {new Date(tx.date).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit',
                              hour12: false 
                            })}
                          </div>
                        </>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900">{tx.description || 'No description'}</div>
                      {tx.notes && (
                        <div className="text-sm text-gray-500 mt-1">{tx.notes}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {tx.category ? (
                        <Badge variant="info">{tx.category}</Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {tx.account_name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          tx.type === 'income' ? 'success' : 
                          tx.type === 'expense' ? 'danger' : 
                          'default'
                        }
                      >
                        {tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className={`font-semibold ${
                          tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(Math.abs(tx.amount || 0), tx.currency || 'IDR')}
                        </span>
                        {tx.currency && tx.currency !== displayCurrency && (
                          <div className="text-sm text-gray-500">
                            ≈ {formatCurrency(
                              convertCurrency(Math.abs(tx.amount || 0), tx.currency, displayCurrency, exchangeRates),
                              displayCurrency
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        onClick={() => openModal(tx)}
                        variant="outline"
                        size="sm"
                        className="mr-2"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDelete(tx.id)}
                        variant="danger"
                        size="sm"
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
            
            <Input
              label="Time"
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              required
            />
          </div>

          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            placeholder="e.g., Grocery shopping"
          />

          <Input
            label="Amount"
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
            options={SUPPORTED_CURRENCIES.map(c => ({ value: c.code, label: `${c.symbol} ${c.code} - ${c.name}` }))}
            required
          />

          <Select
            label="Type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            options={transactionTypes}
            required
          />

          <Select
            label="Account"
            value={formData.account_id}
            onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
            options={accounts.map(acc => ({ value: acc.id, label: acc.name }))}
            required
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

          {formData.type === 'expense' && (
            <Select
              label="Budget (Optional)"
              value={formData.budget_id}
              onChange={(e) => setFormData({ ...formData, budget_id: e.target.value })}
              options={[
                { value: '', label: 'No budget' },
                ...budgets.map(budget => ({ 
                  value: budget.id, 
                  label: `${budget.name || budget.category} - ${formatCurrency(budget.total_amount || budget.amount || 0, budget.currency || 'USD')}` 
                }))
              ]}
            />
          )}

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
              {editingTransaction ? 'Update Transaction' : 'Add Transaction'}
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
