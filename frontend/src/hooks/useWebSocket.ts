// useWebSocket Hook - 用于在React组件中使用WebSocket服务
import { useEffect, useCallback, useRef } from 'react';
import WebSocketService, { WithdrawalStatusUpdate, NewWithdrawalRequest } from '@/services/websocketService';

export interface UseWebSocketOptions {
  onWithdrawalStatusUpdate?: (data: WithdrawalStatusUpdate) => void;
  onNewWithdrawalRequest?: (data: NewWithdrawalRequest) => void;
  onOrderUpdate?: (data: any) => void;
  onNewOrder?: (data: any) => void;
  onMessage?: (data: any) => void;
  onSystemNotification?: (data: any) => void;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const wsService = useRef(WebSocketService.getInstance());
  const unsubscribeFunctions = useRef<(() => void)[]>([]);

  // 连接WebSocket
  const connect = useCallback((userId: string, userType: 'player' | 'user' | 'admin' | 'customer_service') => {
    wsService.current.connect(userId, userType as any);
  }, []);

  // 断开连接
  const disconnect = useCallback(() => {
    // 清理所有订阅
    unsubscribeFunctions.current.forEach(unsubscribe => unsubscribe());
    unsubscribeFunctions.current = [];
    
    wsService.current.disconnect();
  }, []);

  // 发送消息
  const sendMessage = useCallback((message: any) => {
    wsService.current.sendMessage(message);
  }, []);

  // 订阅提现状态更新
  const subscribeToWithdrawalUpdates = useCallback((callback: (data: WithdrawalStatusUpdate) => void) => {
    const unsubscribe = wsService.current.subscribe('withdrawal_status_update', callback);
    unsubscribeFunctions.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  // 订阅新提现申请
  const subscribeToNewWithdrawals = useCallback((callback: (data: NewWithdrawalRequest) => void) => {
    const unsubscribe = wsService.current.subscribe('new_withdrawal_request', callback);
    unsubscribeFunctions.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  // 订阅订单更新
  const subscribeToOrderUpdates = useCallback((callback: (data: any) => void) => {
    const unsubscribe = wsService.current.subscribe('order_update', callback);
    unsubscribeFunctions.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  // 订阅新订单
  const subscribeToNewOrders = useCallback((callback: (data: any) => void) => {
    const unsubscribe = wsService.current.subscribe('new_order', callback);
    unsubscribeFunctions.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  // 设置事件监听器
  useEffect(() => {
    const {
      onWithdrawalStatusUpdate,
      onNewWithdrawalRequest,
      onOrderUpdate,
      onNewOrder,
      onMessage,
      onSystemNotification
    } = options;

    // 订阅提现状态更新
    if (onWithdrawalStatusUpdate) {
      const unsubscribe = subscribeToWithdrawalUpdates(onWithdrawalStatusUpdate);
      unsubscribeFunctions.current.push(unsubscribe);
    }

    // 订阅新提现申请
    if (onNewWithdrawalRequest) {
      const unsubscribe = subscribeToNewWithdrawals(onNewWithdrawalRequest);
      unsubscribeFunctions.current.push(unsubscribe);
    }

    // 订阅订单更新
    if (onOrderUpdate) {
      const unsubscribe = subscribeToOrderUpdates(onOrderUpdate);
      unsubscribeFunctions.current.push(unsubscribe);
    }

    // 订阅新订单
    if (onNewOrder) {
      const unsubscribe = subscribeToNewOrders(onNewOrder);
      unsubscribeFunctions.current.push(unsubscribe);
    }

    // 订阅消息
    if (onMessage) {
      const unsubscribe = wsService.current.subscribe('message', onMessage);
      unsubscribeFunctions.current.push(unsubscribe);
    }

    // 订阅系统通知
    if (onSystemNotification) {
      const unsubscribe = wsService.current.subscribe('system', onSystemNotification);
      unsubscribeFunctions.current.push(unsubscribe);
    }

    // 清理函数
    return () => {
      unsubscribeFunctions.current.forEach(unsubscribe => unsubscribe());
      unsubscribeFunctions.current = [];
    };
  }, [
    options.onWithdrawalStatusUpdate,
    options.onNewWithdrawalRequest,
    options.onOrderUpdate,
    options.onNewOrder,
    options.onMessage,
    options.onSystemNotification,
    subscribeToWithdrawalUpdates,
    subscribeToNewWithdrawals,
    subscribeToOrderUpdates,
    subscribeToNewOrders
  ]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      unsubscribeFunctions.current.forEach(unsubscribe => unsubscribe());
      unsubscribeFunctions.current = [];
    };
  }, []);

  return {
    connect,
    disconnect,
    sendMessage,
    subscribeToWithdrawalUpdates,
    subscribeToNewWithdrawals,
    subscribeToOrderUpdates,
    subscribeToNewOrders,
    wsService: wsService.current
  };
};

export default useWebSocket;