// 用户通知相关的API服务
import { API_BASE_URL } from '@/config/api';

// 用户通知接口定义
export interface UserNotification {
  id: string;
  title: string;
  message: string;
  type: 'system' | 'order' | 'message' | 'promotion';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface NotificationFilter {
  type?: 'all' | 'system' | 'order' | 'message' | 'promotion';
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
    // 由于后端没有通知路由，直接使用模拟数据
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockNotifications: UserNotification[] = [
      {
        id: '1',
        title: '新订单通知',
        message: '您有一个新的陪玩订单，请及时查看',
        type: 'order',
        read: false,
        createdAt: '2024-01-15 14:30:00'
      },
      {
        id: '2',
        title: '系统维护通知',
        message: '系统将于今晚22:00-24:00进行维护，请提前做好准备',
        type: 'system',
        read: true,
        createdAt: '2024-01-14 10:00:00'
      },
      {
        id: '3',
        title: '新消息',
        message: '用户张三给您发送了一条消息',
        type: 'message',
        read: false,
        createdAt: '2024-01-13 16:45:00'
      },
      {
        id: '4',
        title: '促销活动',
        message: '新年特惠活动开始了，快来参与吧！',
        type: 'promotion',
        read: true,
        createdAt: '2024-01-12 09:00:00'
      },
      {
        id: '5',
        title: '收入到账',
        message: '您的陪玩收入已到账，金额：￥150.00',
        type: 'system',
        read: false,
        createdAt: '2024-01-11 20:30:00'
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
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

// 标记通知为已读
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    // 由于后端没有通知路由，模拟标记为已读操作
    console.log(`Marking notification ${notificationId} as read (mock operation)`);
    await new Promise(resolve => setTimeout(resolve, 200));
    return;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// 标记所有通知为已读
export const markAllNotificationsAsRead = async (): Promise<void> => {
  try {
    // 由于后端没有通知路由，模拟标记所有为已读操作
    console.log('Marking all notifications as read (mock operation)');
    await new Promise(resolve => setTimeout(resolve, 300));
    return;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// 删除通知
export const deleteUserNotification = async (notificationId: string): Promise<void> => {
  try {
    // 由于后端没有通知路由，模拟删除操作
    console.log(`Deleting notification ${notificationId} (mock operation)`);
    await new Promise(resolve => setTimeout(resolve, 200));
    return;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// 获取未读通知数量
export const getUnreadNotificationCount = async (): Promise<number> => {
  try {
    // 由于后端没有通知路由，返回模拟数据
    console.log('Getting unread notification count (mock data)');
    await new Promise(resolve => setTimeout(resolve, 100));
    return 3; // 模拟有3条未读通知
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    return 0;
  }
};