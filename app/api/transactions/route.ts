import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser } from '@/lib/db-server';
import { TransactionInput, TransactionUpdate } from '@/lib/models/transaction';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const user = await getAuthUser(supabase);

    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('account_id');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const limit = parseInt(searchParams.get('limit') || '100');

    let query = supabase
      .from('transactions')
      .select('*, accounts!transactions_account_id_fkey(name)')
      .eq('user_id', user.id)
      .order('occurred_at', { ascending: false })
      .limit(limit);

    if (accountId) {
      query = query.eq('account_id', accountId);
    }

    if (from) {
      query = query.gte('occurred_at', from);
    }

    if (to) {
      query = query.lte('occurred_at', to);
    }

    const { data: rawTransactions, error } = await query;

    if (error) throw error;

    // Map to frontend format
    const transactions = (rawTransactions || []).map((tx: any) => ({
      id: tx.id,
      date: tx.occurred_at,
      description: tx.description,
      amount: tx.amount,
      type: tx.amount >= 0 ? 'income' : 'expense',
      category: tx.category || null,
      account_id: tx.account_id,
      account_name: tx.accounts?.name || 'Unknown',
      notes: tx.notes,
      merchant: tx.merchant,
      currency: tx.currency,
      occurred_at: tx.occurred_at,
      created_at: tx.created_at,
    }));

    return NextResponse.json({ transactions }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const user = await getAuthUser(supabase);
    const body: TransactionInput = await req.json();

    // Insert transaction
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: user.id,
          account_id: body.account_id,
          amount: body.amount,
          currency: body.currency || 'USD',
          description: body.description,
          category: body.category,
          merchant: body.merchant,
          notes: body.notes,
          budget_id: body.budget_id,
          occurred_at: body.occurred_at || new Date().toISOString(),
          is_transfer: body.is_transfer || false,
          transfer_account_id: body.transfer_account_id,
          recurring_rule: body.recurring_rule,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Update account balance
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', body.account_id)
      .single();

    if (accountError) {
      console.error('Error fetching account:', accountError);
    } else if (account) {
      const newBalance = (account.balance || 0) + body.amount;
      const { error: updateError } = await supabase
        .from('accounts')
        .update({ balance: newBalance })
        .eq('id', body.account_id);
      
      if (updateError) {
        console.error('Error updating account balance:', updateError);
      }
    }

    // Insert splits if provided
    if (body.splits && body.splits.length > 0) {
      const splits = body.splits.map((split) => ({
        transaction_id: transaction.id,
        user_id: user.id,
        category_id: split.category_id,
        amount: split.amount,
        note: split.note,
      }));

      const { error: splitsError } = await supabase
        .from('transaction_splits')
        .insert(splits);

      if (splitsError) throw splitsError;
    }

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
