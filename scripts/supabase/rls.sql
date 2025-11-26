-- Enable Row Level Security for all tables
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_splits enable row level security;
alter table public.budgets enable row level security;
alter table public.budget_history enable row level security;
alter table public.goals enable row level security;
alter table public.debts enable row level security;
alter table public.insights enable row level security;
alter table public.forecasts enable row level security;
alter table public.rules enable row level security;
alter table public.notifications enable row level security;
alter table public.user_preferences enable row level security;

-- ACCOUNTS POLICIES
create policy "Users can view own accounts"
  on public.accounts for select
  using (auth.uid() = user_id);

create policy "Users can insert own accounts"
  on public.accounts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own accounts"
  on public.accounts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own accounts"
  on public.accounts for delete
  using (auth.uid() = user_id);

-- CATEGORIES POLICIES
create policy "Users can view own categories"
  on public.categories for select
  using (auth.uid() = user_id);

create policy "Users can insert own categories"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update own categories"
  on public.categories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own categories"
  on public.categories for delete
  using (auth.uid() = user_id);

-- TRANSACTIONS POLICIES
create policy "Users can view own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own transactions"
  on public.transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- TRANSACTION SPLITS POLICIES
create policy "Users can view own transaction splits"
  on public.transaction_splits for select
  using (auth.uid() = user_id);

create policy "Users can insert own transaction splits"
  on public.transaction_splits for insert
  with check (auth.uid() = user_id);

create policy "Users can update own transaction splits"
  on public.transaction_splits for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own transaction splits"
  on public.transaction_splits for delete
  using (auth.uid() = user_id);

-- BUDGETS POLICIES
create policy "Users can view own budgets"
  on public.budgets for select
  using (auth.uid() = user_id);

create policy "Users can insert own budgets"
  on public.budgets for insert
  with check (auth.uid() = user_id);

create policy "Users can update own budgets"
  on public.budgets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own budgets"
  on public.budgets for delete
  using (auth.uid() = user_id);

-- BUDGET HISTORY POLICIES
create policy "Users can view own budget history"
  on public.budget_history for select
  using (auth.uid() = user_id);

create policy "Users can insert own budget history"
  on public.budget_history for insert
  with check (auth.uid() = user_id);

-- GOALS POLICIES
create policy "Users can view own goals"
  on public.goals for select
  using (auth.uid() = user_id);

create policy "Users can insert own goals"
  on public.goals for insert
  with check (auth.uid() = user_id);

create policy "Users can update own goals"
  on public.goals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own goals"
  on public.goals for delete
  using (auth.uid() = user_id);

-- DEBTS POLICIES
create policy "Users can view own debts"
  on public.debts for select
  using (auth.uid() = user_id);

create policy "Users can insert own debts"
  on public.debts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own debts"
  on public.debts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own debts"
  on public.debts for delete
  using (auth.uid() = user_id);

-- INSIGHTS POLICIES
create policy "Users can view own insights"
  on public.insights for select
  using (auth.uid() = user_id);

create policy "Users can insert own insights"
  on public.insights for insert
  with check (auth.uid() = user_id);

create policy "Users can update own insights"
  on public.insights for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own insights"
  on public.insights for delete
  using (auth.uid() = user_id);

-- FORECASTS POLICIES
create policy "Users can view own forecasts"
  on public.forecasts for select
  using (auth.uid() = user_id);

create policy "Users can insert own forecasts"
  on public.forecasts for insert
  with check (auth.uid() = user_id);

-- RULES POLICIES
create policy "Users can view own rules"
  on public.rules for select
  using (auth.uid() = user_id);

create policy "Users can insert own rules"
  on public.rules for insert
  with check (auth.uid() = user_id);

create policy "Users can update own rules"
  on public.rules for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own rules"
  on public.rules for delete
  using (auth.uid() = user_id);

-- NOTIFICATIONS POLICIES
create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can insert own notifications"
  on public.notifications for insert
  with check (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- USER PREFERENCES POLICIES
create policy "Users can view own preferences"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert own preferences"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update own preferences"
  on public.user_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
