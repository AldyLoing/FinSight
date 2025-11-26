import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser } from '@/lib/db-server';
import { DebtInput } from '@/lib/models/debt';
import { compareStrategies } from '@/lib/finance/debts';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const user = await getAuthUser(supabase);

    const { searchParams } = new URL(req.url);
    const withStrategy = searchParams.get('strategy') === 'true';
    const extraPayment = parseFloat(searchParams.get('extra_payment') || '0');

    const { data: debts, error } = await supabase
      .from('debts')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (withStrategy && debts && debts.length > 0) {
      const strategies = compareStrategies(debts, extraPayment);
      return NextResponse.json({ debts, strategies }, { status: 200 });
    }

    return NextResponse.json({ debts }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const user = await getAuthUser(supabase);
    const body: DebtInput = await req.json();

    const { data: debt, error } = await supabase
      .from('debts')
      .insert([
        {
          user_id: user.id,
          name: body.name,
          description: body.description,
          principal: body.principal,
          current_balance: body.current_balance || body.principal,
          interest_rate: body.interest_rate,
          interest_type: body.interest_type || 'simple',
          minimum_payment: body.minimum_payment,
          due_day: body.due_day,
          account_id: body.account_id,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ debt }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
