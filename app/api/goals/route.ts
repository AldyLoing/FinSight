import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser } from '@/lib/db-server';
import { GoalInput } from '@/lib/models/goal';
import { simulateGoalProgress } from '@/lib/finance/goals';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const user = await getAuthUser(supabase);

    const { searchParams } = new URL(req.url);
    const withSimulation = searchParams.get('simulation') === 'true';

    const { data: goals, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (withSimulation && goals) {
      const goalsWithSimulation = goals.map((goal) => ({
        ...goal,
        simulation: simulateGoalProgress(goal),
      }));

      return NextResponse.json({ goals: goalsWithSimulation }, { status: 200 });
    }

    return NextResponse.json({ goals }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const user = await getAuthUser(supabase);
    const body: GoalInput = await req.json();

    const { data: goal, error } = await supabase
      .from('goals')
      .insert([
        {
          user_id: user.id,
          name: body.name,
          description: body.description,
          target_amount: body.target_amount,
          current_amount: body.current_amount || 0,
          monthly_contribution: body.monthly_contribution || 0,
          target_date: body.target_date,
          account_id: body.account_id,
          icon: body.icon,
          color: body.color || '#10b981',
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ goal }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
