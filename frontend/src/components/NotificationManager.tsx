import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNotificationAutoRefresh } from '@/hooks/useAutoRefresh';

interface Notification {
  id: string;
  type: 'order' | 'message' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any;
}

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
  onAction?: () => void;
}

// 通知弹窗组件
const NotificationToast: React.FC<NotificationToastProps> = ({ 
  notification, 
  onClose, 
  onAction 
}) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'order':
        return <i className="fa-solid fa-shopping-cart text-theme-primary"></i>;
      case 'message':
        return <i className="fa-solid fa-message text-blue-500"></i>;
      case 'system':
        return <i className="fa-solid fa-bell text-orange-500"></i>;
      default:
        return <i className="fa-solid fa-info-circle text-theme-text/70"></i>;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-theme-surface rounded-lg shadow-lg border border-theme-border p-4 min-w-96 max-w-lg z-50 animate-slide-in-right">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-theme-text mb-1">
                {notification.title}
              </h4>
              <p className="text-sm text-theme-text/70 line-clamp-2">
                {notification.message}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-theme-text/50">
                {notification.timestamp.toLocaleTimeString()}
              </span>
              {onAction && (
                <button
                  onClick={onAction}
                  className="text-xs px-3 py-1 bg-theme-primary text-white rounded hover:bg-theme-primary/90 transition-colors"
                >
                  查看
                </button>
              )}
              <button
                onClick={onClose}
                className="text-xs px-3 py-1 bg-theme-background text-theme-text/70 rounded hover:bg-theme-border transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 通知管理器
class NotificationManager {
  private static instance: NotificationManager;
  private notifications: Notification[] = [];
  private listeners: ((notifications: Notification[]) => void)[] = [];

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): void {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };

    this.notifications.unshift(newNotification);
    this.notifyListeners();

    // 显示toast通知
    toast.custom((t) => (
      <NotificationToast
        notification={newNotification}
        onClose={() => toast.dismiss(t)}
        onAction={() => {
          toast.dismiss(t);
          // 这里可以添加跳转到订单页面的逻辑
          if (notification.type === 'order') {
            window.location.href = '/player/orders';
          }
        }}
      />
    ), {
      duration: 5000,
      position: 'bottom-right'
    });
  }

  markAsRead(id: string): void {
    this.notifications = this.notifications.map(notification =>
      notification.id === id ? { ...notification, read: true } : notification
    );
    this.notifyListeners();
  }

  getNotifications(): Notification[] {
    return this.notifications;
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.notifications));
  }
}

// Hook for using notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const manager = NotificationManager.getInstance();

  useEffect(() => {
    const unsubscribe = manager.subscribe(setNotifications);
    setNotifications(manager.getNotifications());
    return unsubscribe;
  }, [manager]);

  return {
    notifications,
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => 
      manager.addNotification(notification),
    markAsRead: (id: string) => manager.markAsRead(id),
    unreadCount: manager.getUnreadCount()
  };
};

export default NotificationManager;
export type { Notification };