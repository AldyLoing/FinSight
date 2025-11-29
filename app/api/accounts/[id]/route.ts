import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser } from '@/lib/db-server';
import { AccountUpdate } from '@/lib/models/account';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    const user = await getAuthUser(supabase);

    const { data: account, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;

    return NextResponse.json({ account }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    const user = await getAuthUser(supabase);
    const body: AccountUpdate = await req.json();

    // Build update payload with proper field mapping
    const updateData: any = {
      name: body.name,
      type: body.type,
      currency: body.currency,
    };

    // Add optional fields if provided
    if (body.balance !== undefined) {
      updateData.balance = body.balance;
      // IMPORTANT: When manually editing balance, also update initial_balance
      // This makes the new balance the "starting point" for future transactions
      updateData.initial_balance = body.balance;
    }
    if (body.initial_balance !== undefined) {
      updateData.initial_balance = body.initial_balance;
    }
    if (body.institution !== undefined) {
      updateData.institution = body.institution;
    }
    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }
    if (body.icon !== undefined) {
      updateData.icon = body.icon;
    }
    if (body.color !== undefined) {
      updateData.color = body.color;
    }
    if (body.hidden !== undefined) {
      updateData.hidden = body.hidden;
    }

    const { data: account, error } = await supabase
      .from('accounts')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ account }, { status: 200 });
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

    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
