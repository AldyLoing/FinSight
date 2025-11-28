-- COMPLETE FIX FOR ALL ISSUES
-- Run this in Supabase SQL Editor

-- PART 1: Fix the database trigger to include initial_balance
CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_account_id UUID;
  v_initial_balance NUMERIC(18,2);
  v_transactions_sum NUMERIC(18,2);
BEGIN
  -- Get the account_id from NEW or OLD record
  v_account_id := COALESCE(NEW.account_id, OLD.account_id);
  
  -- Get initial_balance for this account
  SELECT initial_balance INTO v_initial_balance
  FROM public.accounts
  WHERE id = v_account_id;
  
  -- Calculate sum of all transactions for this account
  SELECT COALESCE(SUM(amount), 0) 
  INTO v_transactions_sum
  FROM public.transactions 
  WHERE account_id = v_account_id;
  
  -- Update account balance = initial_balance + sum of transactions
  UPDATE public.accounts 
  SET balance = v_initial_balance + v_transactions_sum,
      updated_at = NOW()
  WHERE id = v_account_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PART 2: Add budget_id column to transactions if not exists
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS budget_id UUID REFERENCES budgets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_budget_id ON transactions(budget_id);

-- PART 3: Recalculate all account balances with the new trigger logic
UPDATE accounts
SET balance = initial_balance + COALESCE(
  (SELECT SUM(amount) 
   FROM transactions 
   WHERE account_id = accounts.id), 
  0
);

-- PART 4: Verify the fix worked
SELECT 
  name,
  type,
  currency,
  initial_balance,
  balance,
  (balance - initial_balance) as transaction_total,
  (SELECT COUNT(*) FROM transactions WHERE account_id = accounts.id) as transaction_count
FROM accounts
ORDER BY name;
