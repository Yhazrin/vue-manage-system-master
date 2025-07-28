// 用户通知相关的API服务

// 用户通知接口定义
export interface UserNotification {
  id: string;
  title: string;
  message: string;
  type: 'booking' | 'message' | 'system' | 'promotion';
  read: boolean;
  createdAt: string;
  relatedId?: string; // 相关的订单ID、消息ID等
  userId: string;
}

export interface NotificationFilter {
  type?: 'all' | 'booking' | 'message' | 'system' | 'promotion';
  read?: boolean;
  page?: number;
  limit?: number;
}

// 获取用户通知列表
export const getUserNotifications = async (filter: NotificationFilter = {}): Promise<{
  notifications: UserNotification[];
  total: number;
  unreadCount: number;
}> => {
  try {
    const params = new URLSearchParams();
    if (filter.type && filter.type !== 'all') params.append('type', filter.type);
    if (filter.read !== undefined) params.append('read', filter.read.toString());
    if (filter.page) params.append('page', filter.page.toString());
    if (filter.limit) params.append('limit', filter.limit.toString());

    const response = await fetch(`/api/user/notifications?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching notifications:', error);
    
    // 开发环境下的模拟数据
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockNotifications: UserNotification[] = [
        {
          id: '1',
          title: '预约成功',
          message: '您已成功预约了陪玩服务，陪玩师将在约定时间联系您。',
          type: 'booking',
          read: false,
          createdAt: '2024-01-15 16:30:00',
          relatedId: 'ORDER001',
          userId: 'user123'
        },
        {
          id: '2',
          title: '新消息',
          message: '您有一条来自陪玩师的新消息，请及时查看。',
          type: 'message',
          read: true,
          createdAt: '2024-01-15 14:20:00',
          userId: 'user123'
        },
        {
          id: '3',
          title: '系统维护通知',
          message: '系统将于今晚23:00-01:00进行维护，期间可能无法正常使用服务。',
          type: 'system',
          read: true,
          createdAt: '2024-01-14 10:00:00',
          userId: 'user123'
        },
        {
          id: '4',
          title: '限时优惠',
          message: '新用户专享8折优惠，快来体验我们的陪玩服务吧！',
          type: 'promotion',
          read: false,
          createdAt: '2024-01-13 09:15:00',
          userId: 'user123'
        }
      ];
      
      // 根据筛选条件过滤
      let filteredNotifications = mockNotifications;
      if (filter.type && filter.type !== 'all') {
        filteredNotifications = filteredNotifications.filter(n => n.type === filter.type);
      }
      if (filter.read !== undefined) {
        filteredNotifications = filteredNotifications.filter(n => n.read === filter.read);
      }
      
      const unreadCount = mockNotifications.filter(n => !n.read).length;
      
      return {
        notifications: filteredNotifications,
        total: filteredNotifications.length,
        unreadCount
      };
    }
    
    throw error;
  }
};

// 标记通知为已读
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const response = await fetch(`/api/user/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to mark notification as read');
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
    
    // 开发环境下的模拟
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 200));
      return;
    }
    
    throw error;
  }
};

// 标记所有通知为已读
export const markAllNotificationsAsRead = async (): Promise<void> => {
  try {
    const response = await fetch('/api/user/notifications/read-all', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to mark all notifications as read');
    }
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    
    // 开发环境下的模拟
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 300));
      return;
    }
    
    throw error;
  }
};

// 删除通知
export const deleteUserNotification = async (notificationId: string): Promise<void> => {
  try {
    const response = await fetch(`/api/user/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete notification');
    }
  } catch (error) {
    console.error('Error deleting notification:', error);
    
    // 开发环境下的模拟
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 300));
      return;
    }
    
    throw error;
  }
};

// 获取未读通知数量
export const getUnreadNotificationCount = async (): Promise<number> => {
  try {
    const response = await fetch('/api/user/notifications/unread-count', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch unread count');
    }

    const data = await response.json();
    return data.count;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    
    // 开发环境下的模拟数据
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 200));
      return 2; // 模拟有2条未读通知
    }
    
    throw error;
  }
};