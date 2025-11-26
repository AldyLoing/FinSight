-- Add budget_id column to transactions table
-- This allows linking transactions to budgets for spent tracking

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'budget_id'
  ) THEN
    ALTER TABLE transactions 
    ADD COLUMN budget_id UUID REFERENCES budgets(id) ON DELETE SET NULL;
    
    RAISE NOTICE '✅ Added budget_id column to transactions table';
  ELSE
    RAISE NOTICE '⏭️ Column budget_id already exists in transactions table';
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_budget_id ON transactions(budget_id);

COMMENT ON COLUMN transactions.budget_id IS 'Links transaction to a budget for tracking spending against budget limits';
