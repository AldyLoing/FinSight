export interface Insight {
  id: string;
  user_id: string;
  type: 'anomaly' | 'trend' | 'budget' | 'goal' | 'debt' | 'risk' | 'opportunity' | 'recommendation';
  title: string;
  summary: string;
  details: Record<string, any>;
  severity: 'info' | 'warning' | 'critical' | 'positive';
  created_at: string;
  acknowledged: boolean;
  acknowledged_at?: string | null;
  expires_at?: string | null;
}

export interface InsightInput {
  user_id: string;
  type: Insight['type'];
  title: string;
  summary: string;
  details?: Record<string, any>;
  severity?: Insight['severity'];
  expires_at?: string;
}

export interface InsightWithActions extends Insight {
  actions?: Array<{
    action: string;
    estimated_impact: string;
    difficulty: 'low' | 'medium' | 'high';
  }>;
}
