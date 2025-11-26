import { Transaction } from '../models/transaction';
import { Account } from '../models/account';

export function calculateNetWorth(accounts: Account[]): number {
  return accounts
    .filter(a => !a.archived && !a.hidden)
    .reduce((total, account) => {
      // Assets are positive, liabilities (loans, credit) are negative contributions
      if (account.type === 'loan' || account.type === 'credit') {
        return total - Math.abs(account.balance);
      }
      return total + account.balance;
    }, 0);
}

export function calculateTotalAssets(accounts: Account[]): number {
  return accounts
    .filter(a => !a.archived && !a.hidden)
    .filter(a => !['loan', 'credit'].includes(a.type))
    .reduce((total, account) => total + Math.max(0, account.balance), 0);
}

export function calculateTotalLiabilities(accounts: Account[]): number {
  return accounts
    .filter(a => !a.archived && !a.hidden)
    .filter(a => ['loan', 'credit'].includes(a.type))
    .reduce((total, account) => total + Math.abs(account.balance), 0);
}

export function getAccountBalance(transactions: Transaction[], accountId: string): number {
  return transactions
    .filter(t => t.account_id === accountId)
    .reduce((balance, t) => balance + t.amount, 0);
}

export function reconcileAccount(transactions: Transaction[], expectedBalance: number): {
  calculated: number;
  expected: number;
  difference: number;
  needsReconciliation: boolean;
} {
  const calculated = transactions.reduce((sum, t) => sum + t.amount, 0);
  const difference = Math.abs(calculated - expectedBalance);
  
  return {
    calculated,
    expected: expectedBalance,
    difference,
    needsReconciliation: difference > 0.01, // tolerance of 1 cent
  };
}
