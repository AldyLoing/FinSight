import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser } from '@/lib/db-server';
import { getAIInsights } from '@/lib/finance/ai';
import { handleApiError } from '@/lib/api';
import { enforceRateLimit } from '@/lib/rate-limit';

// Generates AI insights from the authenticated user's own data only.
// Free-form prompts are intentionally not accepted, so this endpoint cannot
// be used as a general-purpose LLM proxy.
export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const user = await getAuthUser(supabase);

    enforceRateLimit(`ai:${user.id}`, 5, 60 * 60 * 1000);

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
  } catch (error) {
    return handleApiError(error);
  }
}
