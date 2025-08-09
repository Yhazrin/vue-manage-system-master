interface WebSocketMessage {
  type: 'new_order' | 'order_update' | 'message' | 'system' | 'withdrawal_status_update' | 'new_withdrawal_request' | 'ping' | 'pong';
  data: any;
  timestamp?: number;
}

export interface WithdrawalStatusUpdate {
  withdrawalId: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  processedBy?: string;
  processedAt?: string;
  notes?: string;
  applicantType: 'player' | 'customer_service';
  applicantId: string;
}

export interface NewWithdrawalRequest {
  withdrawalId: string;
  applicantType: 'player' | 'customer_service';
  applicantId: string;
  applicantName: string;
  amount: number;
  createdAt: string;
}

class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private isConnecting = false;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;

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
      
      switch (message.type) {
        case 'new_order':
          // 处理新订单通知
          this.notifyListeners('new_order', message.data);
          break;
        case 'order_update':
          // 处理订单状态更新
          this.notifyListeners('order_update', message.data);
          break;
        case 'message':
          // 处理聊天消息
          this.notifyListeners('message', message.data);
          break;
        case 'system':
          // 处理系统通知
          this.notifyListeners('system', message.data);
          break;
        case 'withdrawal_status_update':
          // 处理提现状态更新
          this.notifyListeners('withdrawal_status_update', message.data);
          this.showWithdrawalStatusNotification(message.data);
          break;
        case 'new_withdrawal_request':
          // 处理新提现申请
          this.notifyListeners('new_withdrawal_request', message.data);
          this.showNewWithdrawalNotification(message.data);
          break;
        case 'ping':
          // 响应ping
          this.sendMessage({ type: 'pong', data: {} });
          break;
        case 'pong':
          // 收到pong响应
          break;
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  private notifyListeners(type: string, data: any): void {
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('WebSocket监听器执行失败:', error);
        }
      });
    }
  }

  private showWithdrawalStatusNotification(data: WithdrawalStatusUpdate): void {
    const userRole = localStorage.getItem('userRole');
    const userId = localStorage.getItem('userId');
    
    // 动态导入toast以避免循环依赖
    import('sonner').then(({ toast }) => {
      // 只向相关用户显示通知
      if (data.applicantType === 'player' && userRole === 'player' && data.applicantId === userId) {
        const statusText = this.getStatusText(data.status);
        toast.success(`您的提现申请状态已更新: ${statusText}`);
      } else if (data.applicantType === 'customer_service' && userRole === 'customer_service' && data.applicantId === userId) {
        const statusText = this.getStatusText(data.status);
        toast.success(`您的提现申请状态已更新: ${statusText}`);
      } else if (userRole === 'admin') {
        const statusText = this.getStatusText(data.status);
        toast.info(`提现申请 ${data.withdrawalId} 状态已更新: ${statusText}`);
      }
    });
  }

  private showNewWithdrawalNotification(data: NewWithdrawalRequest): void {
    const userRole = localStorage.getItem('userRole');
    
    // 动态导入toast以避免循环依赖
    import('sonner').then(({ toast }) => {
      // 只向管理员显示新申请通知
      if (userRole === 'admin') {
        const typeText = data.applicantType === 'player' ? '陪玩' : '客服';
        toast.info(`收到新的${typeText}提现申请: ¥${data.amount}`);
      }
    });
  }

  private getStatusText(status: string): string {
    // 使用统一的状态标签函数
    const { getWithdrawalStatusLabel } = require('@/utils/withdrawalStatus');
    return getWithdrawalStatusLabel(status);
  }

  public subscribe(type: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);

    // 返回取消订阅函数
    return () => {
      const listeners = this.listeners.get(type);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(type);
        }
      }
    };
  }

  disconnect(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
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

  // 触发测试通知（用于开发测试）
  triggerTestNotification(): void {
    console.log('触发测试通知：模拟新订单通知');
    
    // 模拟发送新订单通知
    const testMessage: WebSocketMessage = {
      type: 'new_order',
      data: {
        message: '收到新订单',
        timestamp: new Date().toISOString()
      }
    };
    
    // 由于WebSocket连接暂未实现，这里只是打印日志
    console.log('模拟WebSocket消息:', testMessage);
    
    // 在实际项目中，这里应该通过WebSocket发送消息
    // this.sendMessage(testMessage);
  }
}

export default WebSocketService;