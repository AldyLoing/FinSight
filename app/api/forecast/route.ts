import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser } from '@/lib/db-server';
import { forecastCashflow } from '@/lib/finance/forecast';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const user = await getAuthUser(supabase);

    const { data: forecasts, error } = await supabase
      .from('forecasts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return NextResponse.json({ forecasts }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const user = await getAuthUser(supabase);

    const body = await req.json();
    const horizonDays = body.horizon_days || 90;

    // Fetch transactions and accounts
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('occurred_at', { ascending: true });

    const { data: accounts } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id);

    // Generate forecast
    const forecast = forecastCashflow(
      transactions || [],
      accounts || [],
      horizonDays
    );

    // Save forecast
    const { data: savedForecast, error } = await supabase
      .from('forecasts')
      .insert([
        {
          user_id: user.id,
          horizon_days: horizonDays,
          summary: forecast.summary,
          details: forecast.details,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ forecast: savedForecast }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
