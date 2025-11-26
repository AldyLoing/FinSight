import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser } from '@/lib/db-server';
import { BudgetInput } from '@/lib/models/budget';
import { calculateBudgetStatus } from '@/lib/finance/budgets';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const user = await getAuthUser(supabase);

    const { searchParams } = new URL(req.url);
    const withStatus = searchParams.get('status') === 'true';

    const { data: budgets, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate spent for each budget
    if (budgets) {
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id);

      const budgetsWithSpent = budgets.map((budget) => {
        const startDate = new Date(budget.start_date);
        const endDate = budget.end_date ? new Date(budget.end_date) : new Date();
        
        // Calculate spent amount for this budget based on category match and budget_id link
        const spent = (transactions || [])
          .filter(tx => {
            const txDate = new Date(tx.occurred_at || tx.date);
            const isInPeriod = txDate >= startDate && txDate <= endDate;
            const isExpense = (tx.amount || 0) < 0;
            const matchesBudget = tx.budget_id === budget.id;
            return isInPeriod && isExpense && matchesBudget;
          })
          .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);

        return {
          ...budget,
          spent,
        };
      });

      return NextResponse.json({ budgets: budgetsWithSpent }, { status: 200 });
    }

    return NextResponse.json({ budgets }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const user = await getAuthUser(supabase);
    const body: BudgetInput = await req.json();

    const { data: budget, error } = await supabase
      .from('budgets')
      .insert([
        {
          user_id: user.id,
          name: body.name,
          category_id: body.category_id,
          start_date: body.start_date,
          end_date: body.end_date,
          period: body.period || 'monthly',
          carry_over: body.carry_over !== undefined ? body.carry_over : true,
          total_amount: body.total_amount,
          alert_threshold: body.alert_threshold || 0.8,
          currency: body.currency || 'USD',
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ budget }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
