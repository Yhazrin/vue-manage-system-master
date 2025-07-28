import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useApi } from '@/hooks/useApi';
import {
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  deleteUserNotification,
  UserNotification,
} from '@/services/userNotificationService';

// 使用从服务中导入的通知类型
export type { UserNotification as Notification };

// Get notification icon based on type
const getNotificationIcon = (notification: UserNotification) => {
  switch (notification.type) {
    case 'booking':
      return <i className="fa-solid fa-calendar-check text-green-500"></i>;
    case 'message':
      return <i className="fa-solid fa-comment text-blue-500"></i>;
    case 'system':
      return <i className="fa-solid fa-bell text-purple-500"></i>;
    case 'promotion':
      return <i className="fa-solid fa-tag text-orange-500"></i>;
    default:
      return <i className="fa-solid fa-bell text-gray-500"></i>;
  }
};

// Notification item component
function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: {
  notification: UserNotification;
  onMarkAsRead: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const navigate = useNavigate();
  

  
  // Handle notification click
  const handleClick = async () => {
    if (!notification.read) {
      await onMarkAsRead(notification.id);
    }

    // Navigate to related page based on notification type
    if (notification.type === 'booking' && notification.relatedId) {
      navigate(`/booking/${notification.relatedId}`);
    } else if (notification.type === 'message' && notification.relatedId) {
      navigate('/notifications');
    } else if (notification.type === 'promotion') {
      navigate('/promotions');
    } else {
      navigate('/notifications');
    }
  };
  
  return (
    <div 
      className={cn(
        "flex items-start p-3 hover:bg-gray-50 cursor-pointer transition-colors",
        !notification.read ? "bg-purple-50" : ""
      )}
      onClick={handleClick}
    >
         <div className="mr-3 mt-0.5">{getNotificationIcon(notification)}</div>
         <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <h4 className="font-medium text-gray-900 text-sm">{notification.title}</h4>
          <button 
            onClick={async (e) => {
              e.stopPropagation();
              await onDelete(notification.id);
            }}
            className="text-gray-400 hover:text-gray-600 ml-2"
          >
            <i className="fa-solid fa-times text-xs"></i>
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notification.message}</p>
        <p className="text-xs text-gray-400 mt-1">{notification.createdAt}</p>
      </div>
      {!notification.read && (
        <div className="ml-2 mt-0.5 w-2 h-2 bg-purple-600 rounded-full"></div>
      )}
    </div>
  );
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  // 使用useApi hook来管理API调用状态
  const { loading, error, execute: fetchNotifications } = useApi<{
    notifications: UserNotification[];
    total: number;
    unreadCount: number;
  }>();
  
  // 使用Set来跟踪已显示的通知ID，防止重复
  const [displayedNotificationIds, setDisplayedNotificationIds] = useState<Set<string>>(() => new Set());
  
  // Fetch notifications on component mount
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const result = await fetchNotifications(() => getUserNotifications());
        if (result) {
          setNotifications(result.notifications);
          setUnreadCount(result.unreadCount);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        toast.error('获取通知失败');
      }
    };
    
    loadNotifications();
    
    // Set up polling for new notifications
    const interval = setInterval(loadNotifications, 30000);
    
    return () => clearInterval(interval);
  }, [fetchNotifications]);
  
  // Show toast for new notifications only
  useEffect(() => {
    if (!Array.isArray(notifications) || notifications.length === 0) return;
    
    // 筛选出尚未显示的新通知
    const newNotifications = notifications.filter(
      (n) => !n.read && !displayedNotificationIds.has(n.id)
    );

    if (newNotifications.length > 0) {
      newNotifications.forEach((notification) => {
        toast.info(notification.title, {
          description: notification.message,
          position: 'bottom-right',
          duration: 5000,
          icon: getNotificationIcon(notification),
        });
      });

      // 更新已显示通知ID集合
      setDisplayedNotificationIds((prev) => {
        const newSet = new Set(prev);
        newNotifications.forEach(n => newSet.add(n.id));
        return newSet;
      });
    }
  }, [notifications, displayedNotificationIds]);
  
  // 标记所有为已读
  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    
    const previousNotifications = [...notifications];
    const previousUnreadCount = unreadCount;
    
    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      await markAllNotificationsAsRead();
      toast.success('所有通知已标记为已读');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      toast.error('操作失败，请稍后重试');
      // Revert UI on failure
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
    }
  };
  
  const handleMarkAsRead = async (id: string) => {
    const originalNotifications = [...notifications];
    const originalUnreadCount = unreadCount;
    
    // Optimistic UI update
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    
    // Update unread count if the notification was unread
    const notification = notifications.find(n => n.id === id);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    try {
      await markNotificationAsRead(id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error('标记已读失败');
      setNotifications(originalNotifications);
      setUnreadCount(originalUnreadCount);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    const originalNotifications = [...notifications];
    const originalUnreadCount = unreadCount;
    
    // Find the notification to check if it was unread
    const notification = notifications.find(n => n.id === id);
    const wasUnread = notification && !notification.read;
    
    // Optimistic UI update
    setNotifications(prev => prev.filter(n => n.id !== id));
    
    // Update unread count if the deleted notification was unread
    if (wasUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    try {
      await deleteUserNotification(id);
      toast.success('通知已删除');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('删除失败');
      setNotifications(originalNotifications);
      setUnreadCount(originalUnreadCount);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
      <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors relative"
        aria-label="Notifications"
      >
        <i className="fa-solid fa-bell"></i>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-purple-600 text-white text-xs rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-100 z-20 animate-in fade-in slide-in-from-top-5 duration-150">
          <div className="p-3 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 text-sm">通知中心</h3>
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="text-xs text-purple-600 hover:text-purple-700 disabled:text-gray-400"
            >
              全部标为已读
            </button>
          </div>
          
           <div className="max-h-80 overflow-y-auto">
             {loading ? (
               <div className="text-center py-8 text-gray-500 text-sm">
                 <i className="fa-solid fa-circle-notch fa-spin text-2xl mb-2 block"></i>
                 加载中...
               </div>
             ) : Array.isArray(notifications) && notifications.length > 0 ? (
               notifications
                 .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                 .map(notification => (
                   <NotificationItem 
                    key={notification.id} 
                    notification={notification} 
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDeleteNotification}
                  />
                 ))
             ) : (
               <div className="text-center py-8 text-gray-500 text-sm">
                 <i className="fa-solid fa-bell-slash text-2xl mb-2 block"></i>
                 暂无通知
               </div>
             )}
           </div>
          
           <div className="p-3 border-t border-gray-100">
             <button 
               onClick={() => navigate('/notifications')}
               className="block text-center text-sm text-purple-600 hover:text-purple-700 font-medium"
             >
               查看全部通知
             </button>
          </div>
        </div>
      )}
    </div>
  );
}