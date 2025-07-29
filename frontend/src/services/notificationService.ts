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
    // 由于后端没有通知路由，模拟发送通知操作
    console.log('Sending notification (mock operation):', notificationData);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 返回模拟的通知对象
    return {
      id: `notif_${Date.now()}`,
      title: notificationData.title,
      content: notificationData.content,
      recipient: notificationData.recipient,
      createdAt: new Date().toISOString(),
      createdBy: 'admin',
      status: 'sent',
      readCount: 0,
      totalRecipients: notificationData.recipient === 'all' ? 1000 :
        notificationData.recipient === 'players' ? 300 : 700
    };
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
    // 由于后端没有通知路由，返回模拟数据
    console.log('Getting notifications (mock data)');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const mockNotifications: Notification[] = [
      {
        id: '1',
        title: '系统维护通知',
        content: '系统将于今晚进行维护，请提前做好准备',
        recipient: 'all',
        createdAt: '2024-01-15T10:00:00Z',
        createdBy: 'admin',
        status: 'sent',
        readCount: 800,
        totalRecipients: 1000
      },
      {
        id: '2',
        title: '新功能上线',
        content: '我们推出了新的陪玩功能，快来体验吧',
        recipient: 'players',
        createdAt: '2024-01-14T14:30:00Z',
        createdBy: 'admin',
        status: 'sent',
        readCount: 250,
        totalRecipients: 300
      },
      {
        id: '3',
        title: '活动通知',
        content: '新年特惠活动开始了',
        recipient: 'users',
        createdAt: '2024-01-13T09:00:00Z',
        createdBy: 'admin',
        status: 'sent',
        readCount: 600,
        totalRecipients: 700
      }
    ];

    return {
      notifications: mockNotifications,
      total: mockNotifications.length,
      page: page,
      totalPages: Math.ceil(mockNotifications.length / limit)
    };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

// 获取通知统计
export const getNotificationStats = async (): Promise<NotificationStats> => {
  try {
    // 由于后端没有通知路由，返回模拟数据
    console.log('Getting notification stats (mock data)');
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      totalSent: 156,
      totalRead: 1245,
      readRate: 79.8
    };
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    throw error;
  }
};

// 删除通知
export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    // 由于后端没有通知路由，模拟删除操作
    console.log(`Deleting notification ${notificationId} (mock operation)`);
    await new Promise(resolve => setTimeout(resolve, 300));
    return;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// 获取通知详情
export const getNotificationById = async (notificationId: string): Promise<Notification> => {
  try {
    // 由于后端没有通知路由，返回模拟数据
    console.log(`Getting notification ${notificationId} (mock data)`);
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      id: notificationId,
      title: '系统维护通知',
      content: '系统将于今晚进行维护，请提前做好准备',
      recipient: 'all',
      createdAt: '2024-01-15T10:00:00Z',
      createdBy: 'admin',
      status: 'sent',
      readCount: 800,
      totalRecipients: 1000
    };
  } catch (error) {
    console.error('Error fetching notification:', error);
    throw error;
  }
};