import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

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
        return <i className="fa-solid fa-shopping-cart text-purple-600"></i>;
      case 'message':
        return <i className="fa-solid fa-message text-blue-600"></i>;
      case 'system':
        return <i className="fa-solid fa-bell text-orange-600"></i>;
      default:
        return <i className="fa-solid fa-info-circle text-gray-600"></i>;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm z-50 animate-slide-in-right">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 mb-1">
            {notification.title}
          </h4>
          <p className="text-sm text-gray-600 mb-2">
            {notification.message}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {notification.timestamp.toLocaleTimeString()}
            </span>
            <div className="flex gap-2">
              {onAction && (
                <button
                  onClick={onAction}
                  className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                >
                  查看
                </button>
              )}
              <button
                onClick={onClose}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
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