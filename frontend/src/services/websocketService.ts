import NotificationManager from '@/components/NotificationManager';

interface WebSocketMessage {
  type: 'new_order' | 'order_update' | 'message' | 'system';
  data: any;
}

class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private isConnecting = false;
  private notificationManager = NotificationManager.getInstance();

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  connect(userId: string, userType: 'player' | 'user'): void {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    
    try {
      // 在实际项目中，这里应该连接到真实的WebSocket服务器
      // 现在我们模拟WebSocket连接
      this.simulateWebSocketConnection(userId, userType);
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.handleReconnect(userId, userType);
    }
  }

  private simulateWebSocketConnection(userId: string, userType: 'player' | 'user'): void {
    // 模拟连接成功
    this.isConnecting = false;
    this.reconnectAttempts = 0;

    // 如果是陪玩用户，模拟接收新订单通知
    if (userType === 'player') {
      this.simulatePlayerNotifications();
    }
  }

  private simulatePlayerNotifications(): void {
    // 模拟每30秒收到一个新订单通知（仅用于演示）
    setInterval(() => {
      if (Math.random() > 0.7) { // 30%的概率收到通知
        this.handleNewOrderNotification({
          orderId: `order_${Date.now()}`,
          gameType: ['王者荣耀', '英雄联盟', '原神', 'CSGO'][Math.floor(Math.random() * 4)],
          price: Math.floor(Math.random() * 100) + 50,
          userName: `玩家${Math.floor(Math.random() * 1000)}`,
          serviceTime: `${Math.floor(Math.random() * 3) + 1}小时`
        });
      }
    }, 30000);
  }

  private handleNewOrderNotification(orderData: any): void {
    this.notificationManager.addNotification({
      type: 'order',
      title: '新订单通知',
      message: `${orderData.userName} 预约了您的 ${orderData.gameType} 陪玩服务，价格 ¥${orderData.price}`,
      data: orderData
    });
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      switch (message.type) {
        case 'new_order':
          this.handleNewOrderNotification(message.data);
          break;
        case 'order_update':
          this.notificationManager.addNotification({
            type: 'order',
            title: '订单状态更新',
            message: `订单 ${message.data.orderId} 状态已更新为 ${message.data.status}`,
            data: message.data
          });
          break;
        case 'message':
          this.notificationManager.addNotification({
            type: 'message',
            title: '新消息',
            message: message.data.content,
            data: message.data
          });
          break;
        case 'system':
          this.notificationManager.addNotification({
            type: 'system',
            title: '系统通知',
            message: message.data.content,
            data: message.data
          });
          break;
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  private handleReconnect(userId: string, userType: 'player' | 'user'): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`尝试重连 WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(userId, userType);
      }, this.reconnectInterval);
    } else {
      console.error('WebSocket 重连失败，已达到最大重试次数');
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  // 发送消息（在实际项目中使用）
  sendMessage(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket 未连接，无法发送消息');
    }
  }

  // 模拟触发新订单通知（用于测试）
  triggerTestNotification(): void {
    this.handleNewOrderNotification({
      orderId: `test_order_${Date.now()}`,
      gameType: '王者荣耀',
      price: 88,
      userName: '测试用户',
      serviceTime: '2小时'
    });
  }
}

export default WebSocketService;