export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body?: string;
  type: 'info' | 'warning' | 'success' | 'error';
  metadata?: Record<string, any>;
  read: boolean;
  read_at?: string | null;
  created_at: string;
}

export interface NotificationInput {
  user_id: string;
  title: string;
  body?: string;
  type?: Notification['type'];
  metadata?: Record<string, any>;
}
