import { Goal, GoalSimulation } from '../models/goal';
import { addMonthsToDate, getMonthsBetween, formatDate } from '../utils/dates';

export function calculateGoalProgress(goal: Goal): {
  percentage: number;
  remaining: number;
  isCompleted: boolean;
} {
  const percentage = (goal.current_amount / goal.target_amount) * 100;
  const remaining = goal.target_amount - goal.current_amount;
  const isCompleted = goal.current_amount >= goal.target_amount;

  return {
    percentage: Math.min(100, percentage),
    remaining: Math.max(0, remaining),
    isCompleted,
  };
}

export function simulateGoalProgress(goal: Goal): GoalSimulation {
  const remaining = goal.target_amount - goal.current_amount;
  
  if (remaining <= 0) {
    return {
      goal,
      months_to_target: 0,
      estimated_completion: new Date().toISOString().split('T')[0],
      monthly_progress: [],
      is_achievable: true,
    };
  }

  if (goal.monthly_contribution <= 0) {
    return {
      goal,
      months_to_target: null,
      estimated_completion: null,
      monthly_progress: [],
      is_achievable: false,
    };
  }

  const monthsNeeded = Math.ceil(remaining / goal.monthly_contribution);
  const monthly_progress: GoalSimulation['monthly_progress'] = [];
  
  let balance = goal.current_amount;
  const now = new Date();

  for (let month = 1; month <= monthsNeeded; month++) {
    balance += goal.monthly_contribution;
    const date = addMonthsToDate(now, month);
    
    monthly_progress.push({
      month,
      balance: Math.min(balance, goal.target_amount),
      date: formatDate(date, 'yyyy-MM-dd'),
    });

    if (balance >= goal.target_amount) break;
  }

  const estimatedCompletion = addMonthsToDate(now, monthsNeeded);
  const targetDate = goal.target_date ? new Date(goal.target_date) : null;
  const isAchievable = !targetDate || estimatedCompletion <= targetDate;

  return {
    goal,
    months_to_target: monthsNeeded,
    estimated_completion: formatDate(estimatedCompletion, 'yyyy-MM-dd'),
    monthly_progress,
    is_achievable: isAchievable,
  };
}

export function calculateRequiredMonthlySavings(
  currentAmount: number,
  targetAmount: number,
  targetDate: Date | string
): number {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const monthsUntilTarget = getMonthsBetween(new Date(), target);
  
  if (monthsUntilTarget <= 0) return Infinity;

  const remaining = targetAmount - currentAmount;
  return Math.max(0, remaining / monthsUntilTarget);
}

export function getGoalRecommendations(goal: Goal): Array<{
  type: 'increase_contribution' | 'extend_deadline' | 'reduce_target';
  title: string;
  description: string;
  new_value: number | string;
}> {
  const recommendations: Array<any> = [];
  const simulation = simulateGoalProgress(goal);

  if (!simulation.is_achievable && goal.target_date) {
    // Recommendation 1: Increase monthly contribution
    const requiredContribution = calculateRequiredMonthlySavings(
      goal.current_amount,
      goal.target_amount,
      goal.target_date
    );

    recommendations.push({
      type: 'increase_contribution',
      title: 'Increase Monthly Savings',
      description: `To reach your goal by ${formatDate(goal.target_date, 'MMM dd, yyyy')}, increase monthly contribution to ${requiredContribution.toFixed(2)}`,
      new_value: Math.round(requiredContribution),
    });

    // Recommendation 2: Extend deadline
    if (simulation.estimated_completion) {
      recommendations.push({
        type: 'extend_deadline',
        title: 'Extend Target Date',
        description: `Keep current contribution and extend target date to ${formatDate(simulation.estimated_completion, 'MMM dd, yyyy')}`,
        new_value: simulation.estimated_completion,
      });
    }
  }

  return recommendations;
}
