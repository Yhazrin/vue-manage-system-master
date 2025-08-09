import { get, post, put, patch } from '@/services/api';
import WebSocketService from './websocketService';
import { buildAvatarUrl } from '@/utils/imageUtils';

// 格式化服务时长
const formatServiceTime = (hours: number): string => {
  if (hours === Math.floor(hours)) {
    // 整数小时
    return `${hours}小时`;
  } else {
    // 小数小时，转换为小时分钟格式
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    
    if (wholeHours === 0) {
      return `${minutes}分钟`;
    } else if (minutes === 0) {
      return `${wholeHours}小时`;
    } else {
      return `${wholeHours}小时${minutes}分钟`;
    }
  }
};

// 定义订单类型接口
export interface Order {
  id: string;
  gameType: string;
  price: number;
  orderTime: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'pending_review' | 'completed' | 'cancelled';
  serviceTime: string;
  description?: string;
  isRated?: boolean; // 添加评价状态字段
  user_confirmed_end?: boolean; // 用户确认结束状态
  player_confirmed_end?: boolean; // 陪玩确认结束状态
  gift_count?: number;
  gift_total?: number;
  gift_details?: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  player: {
    id: string;
    name: string;
    avatar?: string;
  };
}

// 获取用户订单列表
export const getUserOrders = async (status?: string): Promise<Order[]> => {
  const params = status && status !== 'all' ? `?status=${status}` : '';
  const response = await get<{ success: boolean; orders: any[] }>(`/orders/user${params}`);
  
  // 确保price字段是数字类型，并转换数据格式
  const orders = (response.orders || []).map((order: any) => ({
    id: order.order_id || order.id,
    gameType: order.game_name || order.gameType || '未知游戏',
    price: Number(order.amount || order.price || 0),
    orderTime: order.orderTime || order.created_at,
    status: mapOrderStatus(order.status),
    serviceTime: order.service_hours ? formatServiceTime(order.service_hours) : 
                        (order.serviceTime || formatServiceTime(order.hours) || formatServiceTime(order.minimum_hours) || '未知'),
    description: order.description,
    isRated: Boolean(order.is_rated), // 添加评价状态
    user_confirmed_end: Boolean(order.user_confirmed_end), // 用户确认结束状态
    player_confirmed_end: Boolean(order.player_confirmed_end), // 陪玩确认结束状态
    gift_count: Number(order.gift_count || 0),
    gift_total: Number(order.gift_total || 0),
    gift_details: order.gift_details || '',
    user: {
      id: order.user_id?.toString() || order.user?.id || '',
      name: order.user_name || order.user?.name || '用户',
      avatar: buildAvatarUrl(order.user_avatar || order.user?.avatar)
    },
    player: {
      id: order.player_id?.toString() || order.player?.id || '',
      name: order.player_name || order.player?.name || '陪玩',
      avatar: buildAvatarUrl(order.player_avatar || order.player?.avatar)
    }
  }));
  
  return orders;
};

// 状态映射函数
const mapOrderStatus = (status: string): Order['status'] => {
  switch (status) {
    case 'pending':
      return 'pending';
    case 'accepted':
      return 'accepted';
    case 'in_progress':
      return 'in_progress';
    case 'pending_review':
      return 'pending_review';
    case 'completed':
      return 'completed';
    case 'cancelled':
      return 'cancelled';
    case '进行中':
      return 'in_progress';
    case '已完成':
      return 'completed';
    case '已取消':
      return 'cancelled';
    default:
      return 'pending';
  }
};

// 获取陪玩订单列表
export const getPlayerOrders = async (status?: string): Promise<Order[]> => {
  const params = status && status !== 'all' ? `?status=${status}` : '';
  const response = await get<{ success: boolean; orders: any[] }>(`/orders/player${params}`);
  
  // 确保price字段是数字类型，并转换数据格式
  const orders = (response.orders || []).map((order: any) => ({
    id: order.order_id || order.id,
    gameType: order.game_name || order.gameType || '未知游戏',
    price: Number(order.amount || order.price || 0),
    orderTime: order.orderTime || order.created_at,
    status: mapOrderStatus(order.status),
    serviceTime: order.service_hours ? formatServiceTime(order.service_hours) : 
                        (order.serviceTime || formatServiceTime(order.hours) || formatServiceTime(order.minimum_hours) || '未知'),
    description: order.description,
    user_confirmed_end: Boolean(order.user_confirmed_end), // 用户确认结束状态
    player_confirmed_end: Boolean(order.player_confirmed_end), // 陪玩确认结束状态
    gift_count: Number(order.gift_count || 0),
    gift_total: Number(order.gift_total || 0),
    gift_details: order.gift_details || '',
    user: {
      id: order.user_id?.toString() || order.user?.id || '',
      name: order.user_name || order.user?.name || '用户',
      avatar: buildAvatarUrl(order.user_avatar || order.user?.avatar)
    },
    player: {
      id: order.player_id?.toString() || order.player?.id || '',
      name: order.player_name || order.player?.name || '陪玩',
      avatar: buildAvatarUrl(order.player_avatar || order.player?.avatar)
    }
  }));
  
  return orders;
};

// 获取订单详情
export const getOrderById = async (orderId: string): Promise<Order> => {
  return get<Order>(`/orders/${orderId}`);
};

// 创建订单
export const createOrder = async (orderData: {
  player_id: number;
  service_id: number;
  hours: number;
  amount: number;
  description?: string;
}): Promise<{ order_id: string; success: boolean; message: string }> => {
  const response = await post<{ order_id: string; success: boolean; message: string }>('/orders', orderData);
  
  // 订单创建成功后，模拟发送通知给陪玩
  // 在实际项目中，这应该由后端WebSocket服务器处理
  const wsService = WebSocketService.getInstance();
  setTimeout(() => {
    wsService.triggerTestNotification();
  }, 1000); // 延迟1秒模拟网络延迟
  
  return response;
};

// 更新订单状态
export const updateOrderStatus = async (orderId: string, status: Order['status']): Promise<Order> => {
  return patch<Order>(`/orders/${orderId}/status`, { status });
};

// 取消订单
export const cancelOrder = async (orderId: string): Promise<Order> => {
  return put<Order>(`/orders/${orderId}/cancel`, {});
};

// 审核订单
export const reviewOrder = async (orderId: string, approved: boolean, note?: string): Promise<void> => {
  return patch<void>(`/orders/${orderId}/review`, { approved, note });
};

// 完成订单
export const completeOrder = async (orderId: string): Promise<Order> => {
  return put<Order>(`/orders/${orderId}/complete`, {});
};

// 评价订单
export const rateOrder = async (orderId: string, rating: number, comment: string) => {
  return post(`/orders/${orderId}/rate`, { rating, comment });
};

// 确认结束订单
export const confirmEndOrder = async (orderId: string): Promise<{ success: boolean; message: string; order?: Order }> => {
  return patch<{ success: boolean; message: string; order?: Order }>(`/orders/${orderId}/confirm-end`, {});
};