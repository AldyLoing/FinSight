-- FinSight Database Migration
-- This script adds missing columns to existing tables

-- =============================================
-- ADD MISSING COLUMNS TO ACCOUNTS TABLE
-- =============================================

-- Add institution column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'accounts' AND column_name = 'institution'
  ) THEN
    ALTER TABLE accounts ADD COLUMN institution TEXT;
    RAISE NOTICE '✅ Added institution column to accounts table';
  ELSE
    RAISE NOTICE '⏭️ Column institution already exists in accounts table';
  END IF;
END $$;

-- Add notes column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'accounts' AND column_name = 'notes'
  ) THEN
    ALTER TABLE accounts ADD COLUMN notes TEXT;
    RAISE NOTICE '✅ Added notes column to accounts table';
  ELSE
    RAISE NOTICE '⏭️ Column notes already exists in accounts table';
  END IF;
END $$;

-- Add initial_balance column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'accounts' AND column_name = 'initial_balance'
  ) THEN
    ALTER TABLE accounts ADD COLUMN initial_balance NUMERIC(15, 2) NOT NULL DEFAULT 0;
    RAISE NOTICE '✅ Added initial_balance column to accounts table';
  ELSE
    RAISE NOTICE '⏭️ Column initial_balance already exists in accounts table';
  END IF;
END $$;

-- =============================================
-- ADD MISSING COLUMNS TO TRANSACTIONS TABLE
-- =============================================

-- Add category column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'category'
  ) THEN
    ALTER TABLE transactions ADD COLUMN category TEXT;
    RAISE NOTICE '✅ Added category column to transactions table';
  ELSE
    RAISE NOTICE '⏭️ Column category already exists in transactions table';
  END IF;
END $$;

-- =============================================
-- ADD MISSING COLUMNS TO BUDGETS TABLE
-- =============================================

-- Add currency column to budgets if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'budgets' AND column_name = 'currency'
  ) THEN
    ALTER TABLE budgets ADD COLUMN currency TEXT DEFAULT 'USD';
    RAISE NOTICE '✅ Added currency column to budgets table';
  ELSE
    RAISE NOTICE '⏭️ Column currency already exists in budgets table';
  END IF;
END $$;

-- =============================================
-- VERIFY REQUIRED TABLES EXIST
-- =============================================

-- Check if categories table exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'categories'
  ) THEN
    CREATE TABLE categories (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
      color TEXT,
      icon TEXT,
      is_income BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_categories_user_id ON categories(user_id);
    CREATE INDEX idx_categories_parent_id ON categories(parent_id);
    
    ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own categories" ON categories FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own categories" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own categories" ON categories FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own categories" ON categories FOR DELETE USING (auth.uid() = user_id);
    
    RAISE NOTICE '✅ Created categories table';
  ELSE
    RAISE NOTICE '⏭️ Table categories already exists';
  END IF;
END $$;

-- Check if transaction_splits table exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'transaction_splits'
  ) THEN
    CREATE TABLE transaction_splits (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
      amount NUMERIC(15, 2) NOT NULL,
      note TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_transaction_splits_transaction_id ON transaction_splits(transaction_id);
    CREATE INDEX idx_transaction_splits_category_id ON transaction_splits(category_id);
    
    ALTER TABLE transaction_splits ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own transaction_splits" ON transaction_splits FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own transaction_splits" ON transaction_splits FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own transaction_splits" ON transaction_splits FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own transaction_splits" ON transaction_splits FOR DELETE USING (auth.uid() = user_id);
    
    RAISE NOTICE '✅ Created transaction_splits table';
  ELSE
    RAISE NOTICE '⏭️ Table transaction_splits already exists';
  END IF;
END $$;

-- Check if budget_history table exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'budget_history'
  ) THEN
    CREATE TABLE budget_history (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      allocated NUMERIC(15, 2) NOT NULL,
      spent NUMERIC(15, 2) NOT NULL DEFAULT 0,
      remaining NUMERIC(15, 2) NOT NULL,
      carry_over_from_previous NUMERIC(15, 2) DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_budget_history_budget_id ON budget_history(budget_id);
    CREATE INDEX idx_budget_history_period ON budget_history(period_start, period_end);
    
    ALTER TABLE budget_history ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own budget_history" ON budget_history FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own budget_history" ON budget_history FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    RAISE NOTICE '✅ Created budget_history table';
  ELSE
    RAISE NOTICE '⏭️ Table budget_history already exists';
  END IF;
END $$;

-- Check if forecasts table exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'forecasts'
  ) THEN
    CREATE TABLE forecasts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      forecast_date DATE NOT NULL,
      predicted_balance NUMERIC(15, 2) NOT NULL,
      confidence NUMERIC(3, 2) NOT NULL DEFAULT 0.8,
      scenario TEXT DEFAULT 'realistic' CHECK (scenario IN ('optimistic', 'realistic', 'pessimistic')),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_forecasts_user_id ON forecasts(user_id);
    CREATE INDEX idx_forecasts_date ON forecasts(forecast_date);
    
    ALTER TABLE forecasts ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own forecasts" ON forecasts FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own forecasts" ON forecasts FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can delete own forecasts" ON forecasts FOR DELETE USING (auth.uid() = user_id);
    
    RAISE NOTICE '✅ Created forecasts table';
  ELSE
    RAISE NOTICE '⏭️ Table forecasts already exists';
  END IF;
END $$;

-- Check if notifications table exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'notifications'
  ) THEN
    CREATE TABLE notifications (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      data JSONB DEFAULT '{}'::jsonb,
      read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_notifications_user_id ON notifications(user_id);
    CREATE INDEX idx_notifications_read ON notifications(read);
    CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
    
    ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own notifications" ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);
    
    RAISE NOTICE '✅ Created notifications table';
  ELSE
    RAISE NOTICE '⏭️ Table notifications already exists';
  END IF;
END $$;

-- Check if rules table exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'rules'
  ) THEN
    CREATE TABLE rules (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      trigger_type TEXT NOT NULL,
      trigger_config JSONB NOT NULL,
      action_type TEXT NOT NULL,
      action_config JSONB NOT NULL,
      enabled BOOLEAN DEFAULT TRUE,
      last_executed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_rules_user_id ON rules(user_id);
    CREATE INDEX idx_rules_enabled ON rules(enabled);
    
    ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own rules" ON rules FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own rules" ON rules FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own rules" ON rules FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own rules" ON rules FOR DELETE USING (auth.uid() = user_id);
    
    RAISE NOTICE '✅ Created rules table';
  ELSE
    RAISE NOTICE '⏭️ Table rules already exists';
  END IF;
END $$;

-- =============================================
-- CREATE DEFAULT CATEGORIES FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION create_default_categories(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Check if user already has categories
  IF NOT EXISTS (SELECT 1 FROM categories WHERE user_id = p_user_id) THEN
    -- Income categories
    INSERT INTO categories (user_id, name, is_income, icon, color) VALUES
      (p_user_id, 'Salary', true, '💼', '#10b981'),
      (p_user_id, 'Business', true, '🏢', '#059669'),
      (p_user_id, 'Investment', true, '📈', '#34d399'),
      (p_user_id, 'Other Income', true, '💰', '#6ee7b7');

    -- Expense categories
    INSERT INTO categories (user_id, name, is_income, icon, color) VALUES
      (p_user_id, 'Food & Dining', false, '🍔', '#ef4444'),
      (p_user_id, 'Transportation', false, '🚗', '#f59e0b'),
      (p_user_id, 'Shopping', false, '🛍️', '#ec4899'),
      (p_user_id, 'Entertainment', false, '🎮', '#8b5cf6'),
      (p_user_id, 'Bills & Utilities', false, '📄', '#6366f1'),
      (p_user_id, 'Healthcare', false, '🏥', '#14b8a6'),
      (p_user_id, 'Education', false, '📚', '#3b82f6'),
      (p_user_id, 'Home & Living', false, '🏠', '#a855f7'),
      (p_user_id, 'Travel', false, '✈️', '#06b6d4'),
      (p_user_id, 'Other Expenses', false, '📦', '#64748b');
    
    RAISE NOTICE '✅ Created default categories for user %', p_user_id;
  ELSE
    RAISE NOTICE '⏭️ User % already has categories', p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- SUMMARY
-- =============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Changes applied:';
  RAISE NOTICE '  • Added institution column to accounts';
  RAISE NOTICE '  • Added notes column to accounts';
  RAISE NOTICE '  • Added initial_balance column to accounts';
  RAISE NOTICE '  • Added category column to transactions';
  RAISE NOTICE '  • Verified all required tables exist';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Next steps:';
  RAISE NOTICE '1. Test adding an account with institution and notes';
  RAISE NOTICE '2. Run this to create default categories:';
  RAISE NOTICE '   SELECT create_default_categories(auth.uid());';
  RAISE NOTICE '';
END $$;
