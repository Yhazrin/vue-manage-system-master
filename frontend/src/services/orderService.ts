import { get, post, put, patch } from '@/services/api';
import WebSocketService from './websocketService';

// 定义订单类型接口
export interface Order {
  id: string;
  gameType: string;
  price: number;
  orderTime: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  serviceTime: string;
  description?: string;
  user: {
    id: string;
    nickname: string;
    avatar: string;
  };
  player: {
    id: string;
    nickname: string;
    avatar: string;
  };
}

// 获取用户订单列表
export const getUserOrders = async (status?: string): Promise<Order[]> => {
  const params = status && status !== 'all' ? `?status=${status}` : '';
  return get<Order[]>(`/orders/user${params}`);
};

// 获取陪玩订单列表
export const getPlayerOrders = async (status?: string): Promise<Order[]> => {
  const params = status && status !== 'all' ? `?status=${status}` : '';
  return get<Order[]>(`/orders/player${params}`);
};

// 获取订单详情
export const getOrderById = async (orderId: string): Promise<Order> => {
  return get<Order>(`/orders/${orderId}`);
};

// 创建订单
export const createOrder = async (orderData: {
  playerId: string;
  gameType: string;
  serviceTime: string;
  price: number;
  description?: string;
}): Promise<Order> => {
  const order = await post<Order>('/orders', orderData);
  
  // 订单创建成功后，模拟发送通知给陪玩
  // 在实际项目中，这应该由后端WebSocket服务器处理
  const wsService = WebSocketService.getInstance();
  setTimeout(() => {
    wsService.triggerTestNotification();
  }, 1000); // 延迟1秒模拟网络延迟
  
  return order;
};

// 更新订单状态
export const updateOrderStatus = async (orderId: string, status: Order['status']): Promise<Order> => {
  return patch<Order>(`/orders/${orderId}/status`, { status });
};

// 取消订单
export const cancelOrder = async (orderId: string): Promise<Order> => {
  return put<Order>(`/orders/${orderId}/cancel`, {});
};

// 完成订单
export const completeOrder = async (orderId: string): Promise<Order> => {
  return put<Order>(`/orders/${orderId}/complete`, {});
};

// 评价订单
export const rateOrder = async (orderId: string, rating: number, comment: string) => {
  return post(`/orders/${orderId}/rate`, { rating, comment });
};