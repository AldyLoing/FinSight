-- EMERGENCY FIX: Disable automatic trigger and fix balances manually
-- Run this IMMEDIATELY in Supabase SQL Editor

-- Step 1: DROP the problematic triggers
DROP TRIGGER IF EXISTS trigger_update_account_balance_insert_update ON public.transactions;
DROP TRIGGER IF EXISTS trigger_update_account_balance_delete ON public.transactions;

-- Step 2: Drop the old function
DROP FUNCTION IF EXISTS public.update_account_balance();

-- Step 3: Create NEW CORRECT function that includes initial_balance
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

-- Step 4: Recreate triggers with NEW function
CREATE TRIGGER trigger_update_account_balance_insert_update
  AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_account_balance();

CREATE TRIGGER trigger_update_account_balance_delete
  AFTER DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_account_balance();

-- Step 5: Recalculate ALL account balances correctly
UPDATE accounts
SET balance = initial_balance + COALESCE(
  (SELECT SUM(amount) 
   FROM transactions 
   WHERE account_id = accounts.id), 
  0
);

-- Step 6: Verify the fix
SELECT 
  name,
  type,
  currency,
  initial_balance,
  balance,
  (balance - initial_balance) as net_transactions,
  (SELECT COUNT(*) FROM transactions WHERE account_id = accounts.id) as tx_count
FROM accounts
ORDER BY name;
