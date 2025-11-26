-- Enable required extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- CATEGORIES
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  parent_id uuid references public.categories(id) on delete set null,
  color text default '#6b7280',
  icon text,
  is_income boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_categories_user_id on public.categories(user_id);
create index idx_categories_parent_id on public.categories(parent_id);

-- ACCOUNTS
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('cash', 'bank', 'credit', 'ewallet', 'loan', 'investment', 'other')),
  currency text not null default 'USD',
  balance numeric(18,2) not null default 0,
  initial_balance numeric(18,2) not null default 0,
  hidden boolean default false,
  archived boolean default false,
  icon text,
  color text default '#3b82f6',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_accounts_user_id on public.accounts(user_id);
create index idx_accounts_type on public.accounts(type);

-- TRANSACTIONS
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete restrict,
  amount numeric(18,2) not null,
  currency text not null default 'USD',
  description text,
  merchant text,
  notes text,
  is_transfer boolean default false,
  transfer_account_id uuid references public.accounts(id) on delete set null,
  transfer_transaction_id uuid references public.transactions(id) on delete set null,
  occurred_at timestamptz not null default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  reconciled boolean default false,
  recurring_rule text,
  recurring_parent_id uuid references public.transactions(id) on delete set null,
  metadata jsonb default '{}'::jsonb
);

create index idx_transactions_user_id on public.transactions(user_id);
create index idx_transactions_account_id on public.transactions(account_id);
create index idx_transactions_occurred_at on public.transactions(occurred_at desc);
create index idx_transactions_merchant on public.transactions(merchant);
create index idx_transactions_recurring_parent on public.transactions(recurring_parent_id);

-- TRANSACTION SPLITS (for categorizing transactions)
create table public.transaction_splits (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  amount numeric(18,2) not null,
  note text,
  created_at timestamptz default now()
);

create index idx_transaction_splits_transaction_id on public.transaction_splits(transaction_id);
create index idx_transaction_splits_user_id on public.transaction_splits(user_id);
create index idx_transaction_splits_category_id on public.transaction_splits(category_id);

-- BUDGETS
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category_id uuid references public.categories(id) on delete set null,
  start_date date not null,
  end_date date,
  period text not null default 'monthly' check (period in ('monthly', 'yearly', 'weekly', 'custom')),
  carry_over boolean default true,
  total_amount numeric(18,2) not null,
  alert_threshold numeric(5,2) default 0.80,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_budgets_user_id on public.budgets(user_id);
create index idx_budgets_category_id on public.budgets(category_id);
create index idx_budgets_dates on public.budgets(start_date, end_date);

-- BUDGET HISTORY (snapshots for historical tracking)
create table public.budget_history (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.budgets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  allocated numeric(18,2) not null,
  spent numeric(18,2) not null,
  remaining numeric(18,2) not null,
  carry_over_from_previous numeric(18,2) default 0,
  created_at timestamptz default now()
);

create index idx_budget_history_budget_id on public.budget_history(budget_id);
create index idx_budget_history_user_id on public.budget_history(user_id);
create index idx_budget_history_period on public.budget_history(period_start, period_end);

-- GOALS (savings/financial goals)
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  target_amount numeric(18,2) not null,
  current_amount numeric(18,2) not null default 0,
  monthly_contribution numeric(18,2) not null default 0,
  target_date date,
  account_id uuid references public.accounts(id) on delete set null,
  icon text,
  color text default '#10b981',
  status text default 'active' check (status in ('active', 'completed', 'paused', 'cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_goals_user_id on public.goals(user_id);
create index idx_goals_status on public.goals(status);
create index idx_goals_target_date on public.goals(target_date);

-- DEBTS
create table public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  principal numeric(18,2) not null,
  current_balance numeric(18,2) not null,
  interest_rate numeric(5,4) not null,
  interest_type text default 'simple' check (interest_type in ('simple', 'compound')),
  minimum_payment numeric(18,2) not null,
  due_day int check (due_day >= 1 and due_day <= 31),
  account_id uuid references public.accounts(id) on delete set null,
  status text default 'active' check (status in ('active', 'paid_off', 'frozen')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_debts_user_id on public.debts(user_id);
create index idx_debts_status on public.debts(status);
create index idx_debts_due_day on public.debts(due_day);

-- INSIGHTS (AI and rule-based insights)
create table public.insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('anomaly', 'trend', 'budget', 'goal', 'debt', 'risk', 'opportunity', 'recommendation')),
  title text not null,
  summary text not null,
  details jsonb default '{}'::jsonb,
  severity text default 'info' check (severity in ('info', 'warning', 'critical', 'positive')),
  created_at timestamptz default now(),
  acknowledged boolean default false,
  acknowledged_at timestamptz,
  expires_at timestamptz
);

create index idx_insights_user_id on public.insights(user_id);
create index idx_insights_type on public.insights(type);
create index idx_insights_severity on public.insights(severity);
create index idx_insights_acknowledged on public.insights(acknowledged);
create index idx_insights_created_at on public.insights(created_at desc);

-- FORECASTS
create table public.forecasts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  horizon_days int not null,
  created_at timestamptz default now(),
  summary jsonb default '{}'::jsonb,
  details jsonb default '{}'::jsonb
);

create index idx_forecasts_user_id on public.forecasts(user_id);
create index idx_forecasts_created_at on public.forecasts(created_at desc);

-- RULES (automation rules)
create table public.rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  trigger jsonb not null,
  action jsonb not null,
  active boolean default true,
  last_executed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_rules_user_id on public.rules(user_id);
create index idx_rules_active on public.rules(active);

-- NOTIFICATIONS
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  type text default 'info' check (type in ('info', 'warning', 'success', 'error')),
  metadata jsonb default '{}'::jsonb,
  read boolean default false,
  read_at timestamptz,
  created_at timestamptz default now()
);

create index idx_notifications_user_id on public.notifications(user_id);
create index idx_notifications_read on public.notifications(read);
create index idx_notifications_created_at on public.notifications(created_at desc);

-- USER PREFERENCES
create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  currency text default 'USD',
  timezone text default 'UTC',
  date_format text default 'YYYY-MM-DD',
  first_day_of_week int default 1 check (first_day_of_week >= 0 and first_day_of_week <= 6),
  theme text default 'light' check (theme in ('light', 'dark', 'auto')),
  language text default 'en',
  notifications_enabled boolean default true,
  ai_insights_enabled boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
