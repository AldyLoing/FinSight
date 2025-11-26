import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser } from '@/lib/db-server';
import { getAIInsights, summarizeForAI } from '@/lib/finance/ai';

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const user = await getAuthUser(supabase);

    const body = await req.json();

    // If custom prompt provided
    if (body.prompt) {
      const { callOpenRouter } = await import('@/lib/finance/ai');
      const response = await callOpenRouter(body.prompt);
      return NextResponse.json({ response }, { status: 200 });
    }

    // Otherwise, generate insights from user's data
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('occurred_at', { ascending: false })
      .limit(500);

    const { data: insights } = await supabase
      .from('insights')
      .select('*')
      .eq('user_id', user.id)
      .eq('acknowledged', false)
      .order('created_at', { ascending: false })
      .limit(10);

    const aiResponse = await getAIInsights(transactions || [], insights || []);

    return NextResponse.json({ response: aiResponse }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
