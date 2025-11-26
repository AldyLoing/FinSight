export interface Rule {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  trigger: RuleTrigger;
  action: RuleAction;
  active: boolean;
  last_executed_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface RuleTrigger {
  type: 'transaction_created' | 'budget_exceeded' | 'balance_threshold' | 'scheduled';
  conditions: Record<string, any>;
}

export interface RuleAction {
  type: 'create_notification' | 'categorize_transaction' | 'create_budget' | 'send_email';
  params: Record<string, any>;
}

export interface RuleInput {
  name: string;
  description?: string;
  trigger: RuleTrigger;
  action: RuleAction;
  active?: boolean;
}
