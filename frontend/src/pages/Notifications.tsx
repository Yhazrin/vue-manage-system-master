import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from "@/components/Header";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteUserNotification,
  UserNotification
} from '@/services/userNotificationService';

// 定义通知类型标签组件
const NotificationTypeBadge = ({ type }: { type?: string }) => {
  switch (type) {
    case 'booking':
      return <span className="px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs rounded-full">预约</span>;
    case 'message':
      return <span className="px-2 py-0.5 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs rounded-full">消息</span>;
    case 'system':
      return <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs rounded-full">系统</span>;
    default:
      return <span className="px-2 py-0.5 bg-theme-background text-theme-text/70 text-xs rounded-full">通知</span>;
  }
};

// 定义通知项组件
function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onDelete 
}: { 
  notification: UserNotification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    
    // 根据通知类型导航到相应页面
    if (notification.type === 'booking' && notification.relatedId) {
      navigate(`/booking/${notification.relatedId}`);
    } else if (notification.type === 'message') {
      navigate('/messages');
    } else if (notification.type === 'promotion') {
      navigate('/promotions');
    }
  };
  
  return (
    <div className={cn(
      "flex items-start p-4 border-b border-theme-border hover:bg-theme-background transition-colors cursor-pointer",
      !notification.read ? "bg-theme-primary/5" : ""
    )}>
      <div className="mr-4 mt-0.5">
        {notification.type === 'booking' && <i className="fa-solid fa-calendar-check text-theme-primary" />}
        {notification.type === 'message' && <i className="fa-solid fa-comment text-theme-primary" />}
        {notification.type === 'system' && <i className="fa-solid fa-bell text-theme-primary" />}
        {notification.type === 'promotion' && <i className="fa-solid fa-tag text-theme-primary" />}
        {!notification.type && <i className="fa-solid fa-bell text-theme-text/60" />}
      </div>
      
      <div className="flex-1 min-w-0" onClick={handleClick}>
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-theme-text text-sm">{notification.title}</h3>
          <span className="text-xs text-theme-text/60">{notification.createdAt}</span>
        </div>
        <p className="text-sm text-theme-text/80 mt-1">{notification.message}</p>
        <div className="mt-2 flex items-center gap-2">
          <NotificationTypeBadge type={notification.type} />
          {!notification.read && (
            <span className="text-xs text-theme-primary">新</span>
          )}
        </div>
      </div>
      
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onDelete(notification.id);
        }}
        className="text-theme-text/40 hover:text-red-500 dark:hover:text-red-400 transition-colors"
      >
        <i className="fa-solid fa-trash-alt text-sm"></i>
      </button>
    </div>
  );
}

export default function Notifications() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'booking' | 'message' | 'system' | 'promotion'>('all');
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // 获取通知列表
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUserNotifications({ 
        type: activeFilter === 'all' ? undefined : activeFilter 
      });
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('获取通知失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 标记通知为已读
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('已标记为已读');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('标记失败，请重试');
    }
  };

  // 删除通知
  const handleDelete = async (notificationId: string) => {
    try {
      await deleteUserNotification(notificationId);
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      toast.success('通知已删除');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('删除失败，请重试');
    }
  };

  // 标记所有通知为已读
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success('所有通知已标记为已读');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('操作失败，请重试');
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [activeFilter]);
  
  // 根据筛选条件过滤通知
  const filteredNotifications = notifications;
  
  return (
    <div className="bg-theme-background min-h-screen text-theme-text">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-theme-text">通知中心</h1>
          <button 
            onClick={() => navigate('/lobby')}
            className="py-1.5 px-3 bg-theme-primary text-white text-sm font-medium rounded-lg hover:bg-theme-primary/90 transition-colors"
          >
            <i className="fa-solid fa-arrow-left mr-1"></i> 返回大厅
          </button>
        </div>
        
        <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border overflow-hidden">
          {/* 通知头部 */}
          <div className="p-4 border-b border-theme-border flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-theme-text">通知</h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-theme-primary/10 text-theme-primary text-xs rounded-full">
                  {unreadCount}条未读
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex bg-theme-background rounded-lg p-1">
                <button 
                  onClick={() => setActiveFilter('all')}
                  className={cn(
                    "px-3 py-1 text-xs rounded-md",
                    activeFilter === 'all' ? "bg-theme-surface text-theme-primary shadow-sm" : "text-theme-text/70"
                  )}
                >
                  全部
                </button>
                <button 
                  onClick={() => setActiveFilter('booking')}
                  className={cn(
                    "px-3 py-1 text-xs rounded-md",
                    activeFilter === 'booking' ? "bg-theme-surface text-theme-primary shadow-sm" : "text-theme-text/70"
                  )}
                >
                  订单
                </button>
                <button 
                  onClick={() => setActiveFilter('message')}
                  className={cn(
                    "px-3 py-1 text-xs rounded-md",
                    activeFilter === 'message' ? "bg-theme-surface text-theme-primary shadow-sm" : "text-theme-text/70"
                  )}
                >
                  消息
                </button>
                <button 
                  onClick={() => setActiveFilter('system')}
                  className={cn(
                    "px-3 py-1 text-xs rounded-md",
                    activeFilter === 'system' ? "bg-theme-surface text-theme-primary shadow-sm" : "text-theme-text/70"
                  )}
                >
                  系统
                </button>
              </div>
              
              <button 
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
                className="text-xs text-theme-primary hover:text-theme-primary/80 disabled:text-theme-text/40"
              >
                全部标为已读
              </button>
            </div>
          </div>
          
          {/* 加载状态 */}
          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary"></div>
            </div>
          )}

          {/* 错误状态 */}
          {error && (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">{error}</p>
              <button 
                onClick={fetchNotifications}
                className="px-4 py-2 bg-theme-primary text-white rounded-lg hover:bg-theme-primary/90 transition-colors"
              >
                重试
              </button>
            </div>
          )}
          
          {/* 通知列表 */}
          {!loading && !error && (
            <div className="divide-y divide-theme-border">
              {filteredNotifications.length > 0 ? (
                filteredNotifications
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map(notification => (
                    <NotificationItem 
                      key={notification.id} 
                      notification={notification}
                      onMarkAsRead={handleMarkAsRead}
                      onDelete={handleDelete}
                    />
                  ))
              ) : (
                <div className="text-center py-12 text-theme-text/60">
                  <i className="fa-solid fa-inbox text-3xl mb-3 block"></i>
                  <h3 className="text-lg font-medium mb-1 text-theme-text">暂无通知</h3>
                  <p className="text-sm">这里将显示您的所有通知</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}