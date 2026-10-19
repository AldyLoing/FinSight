import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser } from '@/lib/db-server';
import { handleApiError, parseBody, parseQuery } from '@/lib/api';
import { debtInputSchema, debtQuerySchema } from '@/lib/validation';
import { compareStrategies } from '@/lib/finance/debts';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const user = await getAuthUser(supabase);

    const query = parseQuery(req, debtQuerySchema);
    const withStrategy = query.strategy === 'true';
    const extraPayment = query.extra_payment;

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
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const user = await getAuthUser(supabase);
    const body = await parseBody(req, debtInputSchema);

    const { data: debt, error } = await supabase
      .from('debts')
      .insert([
        {
          user_id: user.id,
          name: body.name,
          type: body.type || 'other',
          description: body.description,
          currency: (body.currency || 'USD').toUpperCase(),
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
  } catch (error) {
    return handleApiError(error);
  }
}
