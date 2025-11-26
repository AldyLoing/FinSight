import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser } from '@/lib/db-server';
import { runLocalInsights } from '@/lib/finance/insights';
import { getAIInsights } from '@/lib/finance/ai';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const user = await getAuthUser(supabase);

    const { searchParams } = new URL(req.url);
    const acknowledged = searchParams.get('acknowledged');

    let query = supabase
      .from('insights')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (acknowledged !== null) {
      query = query.eq('acknowledged', acknowledged === 'true');
    }

    const { data: insights, error } = await query;

    if (error) throw error;

    return NextResponse.json({ insights }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const user = await getAuthUser(supabase);

    const { searchParams } = new URL(req.url);
    const useAI = searchParams.get('ai') === 'true';

    // Fetch user's financial data
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('occurred_at', { ascending: false })
      .limit(1000);

    const { data: budgets } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id);

    const { data: splits } = await supabase
      .from('transaction_splits')
      .select('*')
      .eq('user_id', user.id);

    // Generate local insights
    const insights = runLocalInsights(
      transactions || [],
      budgets || [],
      splits || []
    );

    // Persist insights
    const insightRecords = insights.map((insight) => ({
      user_id: user.id,
      type: insight.type,
      title: insight.title,
      summary: insight.summary,
      details: insight.details,
      severity: insight.severity,
    }));

    const { data: savedInsights, error: insertError } = await supabase
      .from('insights')
      .insert(insightRecords)
      .select();

    if (insertError) throw insertError;

    // Optionally get AI explanation
    let aiResponse = null;
    if (useAI) {
      try {
        aiResponse = await getAIInsights(transactions || [], insights);
      } catch (aiError) {
        console.error('AI insights error:', aiError);
      }
    }

    return NextResponse.json(
      {
        insights: savedInsights,
        ai: aiResponse,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
