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
      // TODO: 在实际项目中，这里应该连接到真实的WebSocket服务器
      // const wsUrl = `ws://localhost:3001/ws?userId=${userId}&userType=${userType}`;
      // this.ws = new WebSocket(wsUrl);
      // this.setupEventListeners();
      console.log('WebSocket连接功能暂未实现');
      this.isConnecting = false;
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.isConnecting = false;
    }
  }

  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket连接已建立');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event);
    };

    this.ws.onclose = () => {
      console.log('WebSocket连接已关闭');
      this.ws = null;
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket错误:', error);
    };
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      console.log('收到WebSocket消息:', message);
      
      // TODO: 处理不同类型的消息
      switch (message.type) {
        case 'new_order':
          // 处理新订单通知
          break;
        case 'order_update':
          // 处理订单状态更新
          break;
        case 'message':
          // 处理聊天消息
          break;
        case 'system':
          // 处理系统通知
          break;
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
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

  sendMessage(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket 未连接，无法发送消息');
    }
  }
}

export default WebSocketService;