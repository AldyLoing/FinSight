export interface UserPreferences {
  user_id: string;
  currency: string;
  timezone: string;
  date_format: string;
  first_day_of_week: number;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications_enabled: boolean;
  ai_insights_enabled: boolean;
  created_at: string;
  updated_at?: string;
}

export interface UserPreferencesUpdate {
  currency?: string;
  timezone?: string;
  date_format?: string;
  first_day_of_week?: number;
  theme?: UserPreferences['theme'];
  language?: string;
  notifications_enabled?: boolean;
  ai_insights_enabled?: boolean;
}
