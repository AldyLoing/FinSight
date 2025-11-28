-- Add budget_id column to transactions table
-- This allows linking transactions to budgets for spent tracking

-- Add the column
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS budget_id UUID REFERENCES budgets(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_budget_id ON transactions(budget_id);

-- Add comment
COMMENT ON COLUMN transactions.budget_id IS 'Links transaction to a budget for tracking spending against budget limits';
