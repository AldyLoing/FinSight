import { createServiceClient } from '../db-server';
import { runLocalInsights } from './insights';

// Main automation runner (called by cron)
export async function runRecurringJobs() {
  const supabase = createServiceClient();

  try {
    // 1. Process recurring transactions
    await processRecurringTransactions(supabase);

    // 2. Generate insights for all users
    await generateInsightsForAllUsers(supabase);

    // 3. Clean up old data
    await cleanupOldData(supabase);

    console.log('Recurring jobs completed successfully');
  } catch (error) {
    console.error('Error running recurring jobs:', error);
    throw error;
  }
}

async function processRecurringTransactions(supabase: any) {
  // Call the database function to process recurring transactions
  const { error } = await supabase.rpc('process_recurring_transactions');
  
  if (error) {
    console.error('Error processing recurring transactions:', error);
    throw error;
  }
}

async function generateInsightsForAllUsers(supabase: any) {
  // Get all users with transactions
  const { data: users, error: usersError } = await supabase
    .from('transactions')
    .select('user_id')
    .limit(1000);

  if (usersError) {
    console.error('Error fetching users:', usersError);
    return;
  }

  const uniqueUserIds = [...new Set(users.map((u: any) => u.user_id))];

  for (const userId of uniqueUserIds) {
    try {
      // Fetch user's transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('occurred_at', { ascending: false })
        .limit(1000);

      // Fetch user's budgets
      const { data: budgets } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId);

      // Fetch user's splits
      const { data: splits } = await supabase
        .from('transaction_splits')
        .select('*')
        .eq('user_id', userId);

      // Generate insights
      const insights = runLocalInsights(
        transactions || [],
        budgets || [],
        splits || []
      );

      // Insert new insights (skip duplicates based on title)
      for (const insight of insights) {
        // Check if similar insight exists in last 7 days
        const { data: existing } = await supabase
          .from('insights')
          .select('id')
          .eq('user_id', userId)
          .eq('title', insight.title)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .single();

        if (!existing) {
          await supabase.from('insights').insert([insight]);
        }
      }
    } catch (error) {
      console.error(`Error generating insights for user ${userId}:`, error);
    }
  }
}

async function cleanupOldData(supabase: any) {
  // Call the database function to cleanup old data
  const { error } = await supabase.rpc('cleanup_old_data');
  
  if (error) {
    console.error('Error cleaning up old data:', error);
  }
}

// Execute automation rules
export async function executeRule(ruleId: string, triggeredBy: any) {
  const supabase = createServiceClient();

  const { data: rule, error } = await supabase
    .from('rules')
    .select('*')
    .eq('id', ruleId)
    .single();

  if (error || !rule || !rule.active) {
    return;
  }

  // Execute action based on rule type
  switch (rule.action.type) {
    case 'create_notification':
      await supabase.from('notifications').insert([{
        user_id: rule.user_id,
        title: rule.action.params.title,
        body: rule.action.params.body,
        type: rule.action.params.type || 'info',
      }]);
      break;

    case 'categorize_transaction':
      if (triggeredBy.transaction_id) {
        await supabase.from('transaction_splits').insert([{
          transaction_id: triggeredBy.transaction_id,
          user_id: rule.user_id,
          category_id: rule.action.params.category_id,
          amount: triggeredBy.amount,
        }]);
      }
      break;

    default:
      console.log(`Unknown action type: ${rule.action.type}`);
  }

  // Update last executed timestamp
  await supabase
    .from('rules')
    .update({ last_executed_at: new Date().toISOString() })
    .eq('id', ruleId);
}
