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

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  institution?: string;
  notes?: string;
  created_at: string;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [displayCurrency, setDisplayCurrency] = useState('IDR');
  const [formData, setFormData] = useState({
    name: '',
    type: 'bank',
    balance: '',
    currency: 'IDR',
    institution: '',
    notes: '',
  });

  useEffect(() => {
    checkAuth();
    fetchAccounts();
    loadExchangeRates();
  }, []);

  async function loadExchangeRates() {
    const rates = await getExchangeRates('USD');
    setExchangeRates(rates);
  }

  async function checkAuth() {
    const supabase = createBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = '/auth/login';
    }
  }

  async function fetchAccounts() {
    try {
      const res = await fetch('/api/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  }

  function openModal(account?: Account) {
    if (account) {
      setEditingAccount(account);
      setFormData({
        name: account.name || '',
        type: account.type || 'bank',
        balance: account.balance?.toString() || '0',
        currency: account.currency || 'USD',
        institution: account.institution || '',
        notes: account.notes || '',
      });
    } else {
      setEditingAccount(null);
      setFormData({
        name: '',
        type: 'bank',
        balance: '',
        currency: 'USD',
        institution: '',
        notes: '',
      });
    }
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const balanceValue = parseFloat(formData.balance);
    
    const payload = {
      name: formData.name,
      type: formData.type,
      currency: formData.currency,
      institution: formData.institution,
      notes: formData.notes,
      initial_balance: balanceValue,
      balance: balanceValue,
    };

    try {
      if (editingAccount) {
        // Update
        const res = await fetch(`/api/accounts/${editingAccount.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        if (res.ok) {
          await fetchAccounts();
          setIsModalOpen(false);
        } else {
          const error = await res.json();
          alert(`Error: ${error.error || 'Failed to update account'}`);
        }
      } else {
        // Create
        const res = await fetch('/api/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        if (res.ok) {
          await fetchAccounts();
          setIsModalOpen(false);
        } else {
          const error = await res.json();
          alert(`Error: ${error.error || 'Failed to create account'}`);
        }
      }
    } catch (error) {
      console.error('Error saving account:', error);
      alert('An error occurred while saving the account');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this account?')) return;
    
    try {
      const res = await fetch(`/api/accounts/${id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        await fetchAccounts();
      }
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  }

  const totalBalance = accounts.reduce((sum, acc) => {
    if (Object.keys(exchangeRates).length === 0) return sum + acc.balance;
    const convertedAmount = convertCurrency(acc.balance, acc.currency, displayCurrency, exchangeRates);
    return sum + convertedAmount;
  }, 0);
  
  const totalAssets = accounts
    .filter(acc => acc.type !== 'liability' && acc.type !== 'loan')
    .reduce((sum, acc) => {
      if (Object.keys(exchangeRates).length === 0) return sum + acc.balance;
      const convertedAmount = convertCurrency(acc.balance, acc.currency, displayCurrency, exchangeRates);
      return sum + convertedAmount;
    }, 0);
    
  const totalLiabilities = accounts
    .filter(acc => acc.type === 'liability' || acc.type === 'loan' || acc.type === 'credit')
    .reduce((sum, acc) => {
      if (Object.keys(exchangeRates).length === 0) return sum + Math.abs(acc.balance);
      const convertedAmount = convertCurrency(Math.abs(acc.balance), acc.currency, displayCurrency, exchangeRates);
      return sum + convertedAmount;
    }, 0);

  const accountTypes = [
    { value: 'bank', label: 'Bank Account' },
    { value: 'cash', label: 'Cash' },
    { value: 'credit', label: 'Credit Card' },
    { value: 'ewallet', label: 'E-Wallet' },
    { value: 'investment', label: 'Investment' },
    { value: 'loan', label: 'Loan' },
    { value: 'other', label: 'Other' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading accounts...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Accounts</h1>
            <p className="text-gray-600 mt-2">Manage your financial accounts</p>
          </div>
          <div className="flex items-center gap-4">
            <Select
              label=""
              value={displayCurrency}
              onChange={(e) => setDisplayCurrency(e.target.value)}
              options={SUPPORTED_CURRENCIES.map(c => ({ value: c.code, label: `${c.symbol} ${c.code}` }))}
              className="w-32"
            />
            <Button onClick={() => openModal()} variant="primary">
              + Add Account
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Balance</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(totalBalance, displayCurrency)}
                </p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Assets</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalAssets, displayCurrency)}
                </p>
              </div>
              <div className="text-4xl">📈</div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Liabilities</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalLiabilities, displayCurrency)}
                </p>
              </div>
              <div className="text-4xl">💳</div>
            </div>
          </Card>
        </div>

        {/* Accounts Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Accounts</CardTitle>
          </CardHeader>
          {accounts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">📊 No accounts yet</p>
              <Button onClick={() => openModal()} variant="primary">
                Add Your First Account
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      <div className="font-medium text-gray-900">{account.name}</div>
                      {account.notes && (
                        <div className="text-sm text-gray-500 mt-1">{account.notes}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={account.type === 'liability' ? 'danger' : 'success'}>
                        {account.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {account.institution || '-'}
                    </TableCell>
                    <TableCell>
                      <div className={`font-semibold ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(account.balance, account.currency)}
                      </div>
                      {account.currency !== displayCurrency && Object.keys(exchangeRates).length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          ≈ {formatCurrency(
                            convertCurrency(account.balance, account.currency, displayCurrency, exchangeRates),
                            displayCurrency
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{account.currency}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        onClick={() => openModal(account)}
                        variant="outline"
                        size="sm"
                        className="mr-2"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDelete(account.id)}
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
        title={editingAccount ? 'Edit Account' : 'Add New Account'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Account Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g., Chase Checking"
          />

          <Select
            label="Account Type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            options={accountTypes}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Current Balance"
              type="number"
              step="0.01"
              value={formData.balance}
              onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
              required
              placeholder="0.00"
            />

            <Select
              label="Currency"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              options={SUPPORTED_CURRENCIES.map(c => ({ 
                value: c.code, 
                label: `${c.symbol} ${c.name}` 
              }))}
              required
            />
          </div>

          {/* Real-time conversion display */}
          {formData.balance && formData.currency && Object.keys(exchangeRates).length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-900 mb-2">💱 Currency Conversions</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {SUPPORTED_CURRENCIES
                  .filter(c => c.code !== formData.currency)
                  .slice(0, 4)
                  .map(currency => (
                    <div key={currency.code} className="text-gray-700">
                      <span className="font-semibold">{currency.code}:</span>{' '}
                      {formatCurrency(
                        convertCurrency(
                          parseFloat(formData.balance) || 0,
                          formData.currency,
                          currency.code,
                          exchangeRates
                        ),
                        currency.code
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          <Input
            label="Institution (Optional)"
            value={formData.institution}
            onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
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
              {editingAccount ? 'Update Account' : 'Add Account'}
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
