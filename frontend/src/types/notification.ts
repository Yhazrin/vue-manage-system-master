export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  category: 'system' | 'order' | 'payment' | 'promotion';
  actionUrl?: string;
  actionText?: string;
  priority: 'low' | 'medium' | 'high';
  expiresAt?: string;
  metadata?: Record<string, any>;
}