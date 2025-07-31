// 用户通知相关的API服务
import { API_BASE_URL } from '@/config/api';

// 用户通知接口定义
export interface UserNotification {
  id: string;
  title: string;
  content: string;
  type: 'order' | 'system' | 'message' | 'promotion';
  isRead: boolean;
  createdAt: string;
  data?: any; // 额外的数据，如订单信息等
}

export interface NotificationFilter {
  type?: UserNotification['type'];
  isRead?: boolean;
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
    if (filter.type) params.append('type', filter.type);
    if (filter.isRead !== undefined) params.append('isRead', filter.isRead.toString());
    if (filter.page) params.append('page', filter.page.toString());
    if (filter.limit) params.append('limit', filter.limit.toString());

    const response = await fetch(`${API_BASE_URL}/user-notifications?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('获取用户通知失败');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    throw error;
  }
};

// 标记通知为已读
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/user-notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('标记通知为已读失败');
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// 标记所有通知为已读
export const markAllNotificationsAsRead = async (): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/user-notifications/read-all`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('标记所有通知为已读失败');
    }
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// 删除通知
export const deleteUserNotification = async (notificationId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/user-notifications/${notificationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('删除通知失败');
    }
  } catch (error) {
    console.error('Error deleting user notification:', error);
    throw error;
  }
};

// 获取未读通知数量
export const getUnreadNotificationCount = async (): Promise<number> => {
  try {
    const response = await fetch(`${API_BASE_URL}/user-notifications/unread-count`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('获取未读通知数量失败');
    }

    const data = await response.json();
    return data.count;
  } catch (error) {
    console.error('Error fetching unread notification count:', error);
    throw error;
  }
};