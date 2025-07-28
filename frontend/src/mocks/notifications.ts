// 通知类型定义
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: string;
  read: boolean;
  relatedId?: string;
}

// 模拟数据已移除，请使用API获取真实数据