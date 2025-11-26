import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser } from '@/lib/db-server';
import { TransactionUpdate } from '@/lib/models/transaction';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    const user = await getAuthUser(supabase);

    const { data: transaction, error } = await supabase
      .from('transactions')
      .select('*, transaction_splits(*)')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;

    return NextResponse.json({ transaction }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    const user = await getAuthUser(supabase);
    const body: TransactionUpdate = await req.json();

    const { data: transaction, error } = await supabase
      .from('transactions')
      .update(body)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ transaction }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    const user = await getAuthUser(supabase);
    const body: TransactionUpdate = await req.json();

    // Get old transaction to reverse its effect on account balance
    const { data: oldTransaction } = await supabase
      .from('transactions')
      .select('account_id, amount')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    // Update transaction
    const { data: transaction, error } = await supabase
      .from('transactions')
      .update(body)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    // Update account balance if amount or account changed
    if (oldTransaction && (body.amount !== undefined || body.account_id !== undefined)) {
      // Reverse old transaction effect
      if (oldTransaction.account_id) {
        const { data: oldAccount } = await supabase
          .from('accounts')
          .select('balance')
          .eq('id', oldTransaction.account_id)
          .single();
        
        if (oldAccount) {
          await supabase
            .from('accounts')
            .update({ balance: (oldAccount.balance || 0) - oldTransaction.amount })
            .eq('id', oldTransaction.account_id);
        }
      }

      // Apply new transaction effect
      const newAccountId = body.account_id || oldTransaction.account_id;
      const newAmount = body.amount ?? oldTransaction.amount;
      
      const { data: newAccount } = await supabase
        .from('accounts')
        .select('balance')
        .eq('id', newAccountId)
        .single();
      
      if (newAccount) {
        await supabase
          .from('accounts')
          .update({ balance: (newAccount.balance || 0) + newAmount })
          .eq('id', newAccountId);
      }
    }

    return NextResponse.json({ transaction }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    const user = await getAuthUser(supabase);

    // Get transaction to reverse its effect on account balance
    const { data: transaction } = await supabase
      .from('transactions')
      .select('account_id, amount')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    // Delete transaction
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) throw error;

    // Reverse transaction effect on account balance
    if (transaction && transaction.account_id) {
      const { data: account } = await supabase
        .from('accounts')
        .select('balance')
        .eq('id', transaction.account_id)
        .single();
      
      if (account) {
        await supabase
          .from('accounts')
          .update({ balance: (account.balance || 0) - transaction.amount })
          .eq('id', transaction.account_id);
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
