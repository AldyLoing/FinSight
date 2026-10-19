import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser } from '@/lib/db-server';
import { handleApiError, parseBody } from '@/lib/api';
import { accountInputSchema } from '@/lib/validation';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const user = await getAuthUser(supabase);

    const { data: accounts, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ accounts }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const user = await getAuthUser(supabase);
    const body = await parseBody(req, accountInputSchema);

    const { data: account, error } = await supabase
      .from('accounts')
      .insert([
        {
          user_id: user.id,
          name: body.name,
          type: body.type,
          currency: body.currency || 'USD',
          initial_balance: body.initial_balance || body.balance || 0,
          balance: body.balance || body.initial_balance || 0,
          institution: body.institution,
          notes: body.notes,
          icon: body.icon,
          color: body.color,
          hidden: body.hidden || false,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
