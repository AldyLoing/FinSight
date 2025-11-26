-- Function: Update account balance after transaction changes
create or replace function public.update_account_balance()
returns trigger as $$
declare
  account_balance numeric(18,2);
begin
  -- Calculate sum of all transactions for this account
  select coalesce(sum(amount), 0) 
  into account_balance
  from public.transactions 
  where account_id = coalesce(new.account_id, old.account_id)
    and user_id = coalesce(new.user_id, old.user_id);
  
  -- Update account balance
  update public.accounts 
  set balance = account_balance, 
      updated_at = now()
  where id = coalesce(new.account_id, old.account_id);
  
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

-- Trigger: After transaction insert/update
create trigger trigger_update_account_balance_insert_update
  after insert or update on public.transactions
  for each row
  execute function public.update_account_balance();

-- Trigger: After transaction delete
create trigger trigger_update_account_balance_delete
  after delete on public.transactions
  for each row
  execute function public.update_account_balance();

-- Function: Create mirror transaction for transfers
create or replace function public.create_transfer_mirror()
returns trigger as $$
begin
  -- Only create mirror if this is a transfer and doesn't already have a mirror
  if new.is_transfer and new.transfer_account_id is not null and new.transfer_transaction_id is null then
    insert into public.transactions (
      user_id,
      account_id,
      amount,
      currency,
      description,
      merchant,
      is_transfer,
      transfer_account_id,
      transfer_transaction_id,
      occurred_at
    ) values (
      new.user_id,
      new.transfer_account_id,
      -new.amount,
      new.currency,
      coalesce(new.description, 'Transfer'),
      new.merchant,
      true,
      new.account_id,
      new.id,
      new.occurred_at
    );
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger: Create mirror transaction for transfers
create trigger trigger_create_transfer_mirror
  after insert on public.transactions
  for each row
  when (new.is_transfer is true and new.transfer_account_id is not null)
  execute function public.create_transfer_mirror();

-- Function: Update timestamps
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add update triggers for all tables with updated_at
create trigger trigger_update_accounts_timestamp
  before update on public.accounts
  for each row
  execute function public.update_updated_at_column();

create trigger trigger_update_categories_timestamp
  before update on public.categories
  for each row
  execute function public.update_updated_at_column();

create trigger trigger_update_transactions_timestamp
  before update on public.transactions
  for each row
  execute function public.update_updated_at_column();

create trigger trigger_update_budgets_timestamp
  before update on public.budgets
  for each row
  execute function public.update_updated_at_column();

create trigger trigger_update_goals_timestamp
  before update on public.goals
  for each row
  execute function public.update_updated_at_column();

create trigger trigger_update_debts_timestamp
  before update on public.debts
  for each row
  execute function public.update_updated_at_column();

create trigger trigger_update_rules_timestamp
  before update on public.rules
  for each row
  execute function public.update_updated_at_column();

create trigger trigger_update_user_preferences_timestamp
  before update on public.user_preferences
  for each row
  execute function public.update_updated_at_column();

-- Function: Generate recurring transactions (called by cron)
create or replace function public.process_recurring_transactions()
returns void as $$
declare
  recurring_tx record;
  next_occurrence timestamptz;
begin
  -- Find all recurring transaction templates
  for recurring_tx in 
    select * from public.transactions 
    where recurring_rule is not null 
      and recurring_parent_id is null
  loop
    -- Simple monthly recurrence check (you should use rrule library in production)
    next_occurrence := recurring_tx.occurred_at + interval '1 month';
    
    -- Check if we need to create a new occurrence
    if next_occurrence <= now() then
      -- Check if occurrence already exists
      if not exists (
        select 1 from public.transactions
        where recurring_parent_id = recurring_tx.id
          and occurred_at::date = next_occurrence::date
      ) then
        -- Create new occurrence
        insert into public.transactions (
          user_id,
          account_id,
          amount,
          currency,
          description,
          merchant,
          is_transfer,
          transfer_account_id,
          occurred_at,
          recurring_parent_id
        ) values (
          recurring_tx.user_id,
          recurring_tx.account_id,
          recurring_tx.amount,
          recurring_tx.currency,
          recurring_tx.description,
          recurring_tx.merchant,
          recurring_tx.is_transfer,
          recurring_tx.transfer_account_id,
          next_occurrence,
          recurring_tx.id
        );
      end if;
    end if;
  end loop;
end;
$$ language plpgsql security definer;

-- Function: Clean up old insights and forecasts
create or replace function public.cleanup_old_data()
returns void as $$
begin
  -- Delete acknowledged insights older than 90 days
  delete from public.insights
  where acknowledged = true
    and acknowledged_at < now() - interval '90 days';
  
  -- Delete expired insights
  delete from public.insights
  where expires_at is not null
    and expires_at < now();
  
  -- Keep only last 30 forecasts per user
  delete from public.forecasts
  where id in (
    select id from (
      select id, row_number() over (partition by user_id order by created_at desc) as rn
      from public.forecasts
    ) sub
    where rn > 30
  );
  
  -- Delete read notifications older than 30 days
  delete from public.notifications
  where read = true
    and read_at < now() - interval '30 days';
end;
$$ language plpgsql security definer;
