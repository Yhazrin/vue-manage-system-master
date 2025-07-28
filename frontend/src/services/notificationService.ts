// 通知相关的API服务

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
    const response = await fetch('/api/admin/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(notificationData)
    });

    if (!response.ok) {
      throw new Error('Failed to send notification');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending notification:', error);
    
    // 开发环境下的模拟数据
    if (process.env.NODE_ENV === 'development') {
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return {
        id: `NOTIF${Date.now()}`,
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
    }
    
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
    const response = await fetch(`/api/admin/notifications?page=${page}&limit=${limit}`, {
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
      
      const mockNotifications: Notification[] = [
        {
          id: 'NOTIF001',
          title: '系统维护通知',
          content: '系统将于今晚23:00-01:00进行维护，期间可能无法正常使用服务。',
          recipient: 'all',
          createdAt: '2024-01-15 14:30:00',
          createdBy: 'admin',
          status: 'sent',
          readCount: 856,
          totalRecipients: 1000
        },
        {
          id: 'NOTIF002',
          title: '新功能上线',
          content: '我们很高兴地宣布，新的陪玩匹配功能已经上线！',
          recipient: 'players',
          createdAt: '2024-01-14 10:15:00',
          createdBy: 'admin',
          status: 'sent',
          readCount: 245,
          totalRecipients: 300
        }
      ];
      
      return {
        notifications: mockNotifications,
        total: mockNotifications.length,
        page: 1,
        totalPages: 1
      };
    }
    
    throw error;
  }
};

// 获取通知统计
export const getNotificationStats = async (): Promise<NotificationStats> => {
  try {
    const response = await fetch('/api/admin/notifications/stats', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch notification stats');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    
    // 开发环境下的模拟数据
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return {
        totalSent: 156,
        totalRead: 1245,
        readRate: 79.8
      };
    }
    
    throw error;
  }
};

// 删除通知
export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    const response = await fetch(`/api/admin/notifications/${notificationId}`, {
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
      await new Promise(resolve => setTimeout(resolve, 500));
      return;
    }
    
    throw error;
  }
};

// 获取通知详情
export const getNotificationById = async (notificationId: string): Promise<Notification> => {
  try {
    const response = await fetch(`/api/admin/notifications/${notificationId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch notification');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching notification:', error);
    
    // 开发环境下的模拟数据
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return {
        id: notificationId,
        title: '示例通知',
        content: '这是一个示例通知内容。',
        recipient: 'all',
        createdAt: '2024-01-15 14:30:00',
        createdBy: 'admin',
        status: 'sent',
        readCount: 856,
        totalRecipients: 1000
      };
    }
    
    throw error;
  }
};