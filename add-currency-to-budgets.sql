-- Add currency column to budgets table
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Update existing budgets to have USD as default currency
UPDATE budgets SET currency = 'USD' WHERE currency IS NULL;

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'budgets' AND column_name = 'currency';
