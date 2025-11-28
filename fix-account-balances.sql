-- Fix account balances that are incorrect
-- This will recalculate balance based on initial_balance + sum of all transactions

-- Step 1: Reset all account balances to initial_balance
UPDATE accounts
SET balance = initial_balance;

-- Step 2: Add all transaction amounts to each account
-- This query calculates the correct balance for each account
WITH transaction_totals AS (
  SELECT 
    account_id,
    SUM(amount) as total_transactions
  FROM transactions
  GROUP BY account_id
)
UPDATE accounts
SET balance = accounts.initial_balance + COALESCE(transaction_totals.total_transactions, 0)
FROM transaction_totals
WHERE accounts.id = transaction_totals.account_id;

-- Verify the results
SELECT 
  id,
  name,
  initial_balance,
  balance,
  (balance - initial_balance) as net_transactions
FROM accounts
ORDER BY name;
