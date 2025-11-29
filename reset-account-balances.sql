-- RESET ACCOUNTS: Set current balance as new initial_balance
-- This will treat current balance as starting point and ignore old transactions

-- Option 1: Keep all transactions but reset initial_balance to current balance
-- This makes current balance the new "starting point"
UPDATE accounts
SET initial_balance = balance;

-- Option 2 (RECOMMENDED): Delete ALL transactions and start fresh
-- Uncomment below if you want to start completely fresh
-- DELETE FROM transactions;

-- After running Option 1 or 2, update all balances
UPDATE accounts
SET balance = initial_balance + COALESCE(
  (SELECT SUM(amount) FROM transactions WHERE account_id = accounts.id), 
  0
);

-- Verify the reset
SELECT 
  name,
  type,
  initial_balance,
  balance,
  (SELECT COUNT(*) FROM transactions WHERE account_id = accounts.id) as tx_count
FROM accounts
ORDER BY name;
