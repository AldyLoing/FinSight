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

    // Note: Account balance is automatically updated by database trigger
    // No manual balance update needed here

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

    // Note: Account balance is automatically updated by database trigger
    // No manual balance update needed here

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
