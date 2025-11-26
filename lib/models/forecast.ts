export interface Forecast {
  id: string;
  user_id: string;
  horizon_days: number;
  created_at: string;
  summary: ForecastSummary;
  details: ForecastDetails;
}

export interface ForecastSummary {
  starting_balance: number;
  avg_daily_income: number;
  avg_daily_expense: number;
  avg_daily_net: number;
  horizon_days: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  min_balance: number;
  max_balance: number;
  end_balance: number;
}

export interface ForecastDetails {
  daily_points: Array<{
    date: string;
    predicted_balance: number;
    confidence: number;
  }>;
  scenarios: {
    optimistic: number;
    realistic: number;
    pessimistic: number;
  };
}

export interface ForecastInput {
  horizon_days: number;
}
