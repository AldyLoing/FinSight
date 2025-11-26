import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser } from '@/lib/db-server';
import { AccountInput, AccountUpdate } from '@/lib/models/account';

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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const user = await getAuthUser(supabase);
    const body: AccountInput = await req.json();

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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
