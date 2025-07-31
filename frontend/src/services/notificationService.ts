// 通知相关的API服务
import { API_BASE_URL } from '@/config/api';

// 通知接口定义
export interface Notification {
  id: string;
  title: string;
  content: string;
  recipient: 'all' | 'players' | 'users';
  createdAt: string;
  createdBy: string;
  status: 'sent' | 'draft' | 'scheduled';
  readCount?: number;
  totalRecipients?: number;
}

export interface CreateNotificationRequest {
  title: string;
  content: string;
  recipient: 'all' | 'players' | 'users';
  scheduledAt?: string; // 可选的定时发送时间
}

export interface NotificationStats {
  totalSent: number;
  totalRead: number;
  readRate: number;
}

// 发送通知
export const sendNotification = async (notificationData: CreateNotificationRequest): Promise<Notification> => {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(notificationData)
    });

    if (!response.ok) {
      throw new Error('发送通知失败');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

// 获取通知列表
export const getNotifications = async (page = 1, limit = 20): Promise<{
  notifications: Notification[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications?page=${page}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('获取通知列表失败');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

// 获取通知统计
export const getNotificationStats = async (): Promise<NotificationStats> => {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/stats`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('获取通知统计失败');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    throw error;
  }
};

// 删除通知
export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('删除通知失败');
    }
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// 获取通知详情
export const getNotificationById = async (notificationId: string): Promise<Notification> => {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('获取通知详情失败');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching notification:', error);
    throw error;
  }
};