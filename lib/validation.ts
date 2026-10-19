import { z } from 'zod';

const uuid = z.string().uuid();
const money = z.number().finite();
const positiveMoney = z.number().finite().nonnegative();
const currency = z.string().trim().min(3).max(3).toUpperCase();
const isoDate = z.string().trim().min(1).refine((v) => !Number.isNaN(Date.parse(v)), {
  message: 'Invalid date',
});
const shortText = z.string().trim().max(200);
const longText = z.string().trim().max(2000);

// ---------- Accounts ----------
export const accountTypeSchema = z.enum([
  'cash', 'bank', 'credit', 'ewallet', 'loan', 'investment', 'other',
]);

export const accountInputSchema = z.object({
  name: shortText.min(1),
  type: accountTypeSchema,
  currency: currency.optional(),
  initial_balance: money.optional(),
  balance: money.optional(),
  institution: shortText.nullish(),
  notes: longText.nullish(),
  icon: z.string().max(50).nullish(),
  color: z.string().max(20).nullish(),
  hidden: z.boolean().optional(),
});

export const accountUpdateSchema = accountInputSchema.partial().extend({
  archived: z.boolean().optional(),
});

// ---------- Transactions ----------
const splitSchema = z.object({
  category_id: uuid.nullish(),
  amount: money,
  note: shortText.nullish(),
});

export const transactionInputSchema = z.object({
  account_id: uuid,
  amount: money,
  currency: currency.optional(),
  description: shortText.nullish(),
  category: shortText.nullish(),
  merchant: shortText.nullish(),
  notes: longText.nullish(),
  budget_id: uuid.nullish(),
  occurred_at: isoDate.optional(),
  is_transfer: z.boolean().optional(),
  transfer_account_id: uuid.nullish(),
  recurring_rule: z.string().max(500).nullish(),
  splits: z.array(splitSchema).max(50).optional(),
});

export const transactionUpdateSchema = z.object({
  account_id: uuid.optional(),
  amount: money.optional(),
  currency: currency.optional(),
  description: shortText.nullish(),
  category: shortText.nullish(),
  merchant: shortText.nullish(),
  notes: longText.nullish(),
  budget_id: uuid.nullish(),
  occurred_at: isoDate.optional(),
  reconciled: z.boolean().optional(),
});

export const transactionQuerySchema = z.object({
  account_id: uuid.optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
});

// ---------- Budgets ----------
export const budgetInputSchema = z.object({
  name: shortText.min(1),
  category_id: uuid.nullish(),
  start_date: isoDate,
  end_date: isoDate.nullish(),
  period: z.enum(['monthly', 'yearly', 'weekly', 'custom']).optional(),
  carry_over: z.boolean().optional(),
  total_amount: positiveMoney,
  alert_threshold: z.number().min(0).max(1).optional(),
  currency: currency.optional(),
});

export const budgetUpdateSchema = budgetInputSchema.partial();

// ---------- Goals ----------
export const goalInputSchema = z.object({
  name: shortText.min(1),
  description: longText.nullish(),
  target_amount: positiveMoney,
  current_amount: positiveMoney.optional(),
  monthly_contribution: positiveMoney.optional(),
  target_date: isoDate.nullish(),
  account_id: uuid.nullish(),
  icon: z.string().max(50).nullish(),
  color: z.string().max(20).optional(),
});

export const goalUpdateSchema = goalInputSchema.partial().extend({
  status: z.enum(['active', 'completed', 'paused', 'cancelled']).optional(),
});

// ---------- Debts ----------
export const debtInputSchema = z.object({
  name: shortText.min(1),
  type: shortText.nullish(),
  description: longText.nullish(),
  currency: currency.optional(),
  principal: positiveMoney,
  current_balance: positiveMoney.optional(),
  interest_rate: z.number().finite().min(0).max(1000),
  interest_type: z.enum(['simple', 'compound']).optional(),
  minimum_payment: positiveMoney,
  due_day: z.number().int().min(1).max(31).nullish(),
  account_id: uuid.nullish(),
});

export const debtUpdateSchema = debtInputSchema.partial().extend({
  status: z.enum(['active', 'paid_off', 'frozen']).optional(),
});

export const debtQuerySchema = z.object({
  strategy: z.enum(['true', 'false']).optional(),
  extra_payment: z.coerce.number().finite().min(0).default(0),
});

// ---------- Forecast ----------
export const forecastInputSchema = z.object({
  horizon_days: z.number().int().min(7).max(365).optional(),
  days: z.number().int().min(7).max(365).optional(),
});

