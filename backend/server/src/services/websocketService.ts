// WebSocket服务 - 处理实时通信
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';

export interface WithdrawalStatusUpdate {
  withdrawalId: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  processedBy?: string;
  processedAt?: string;
  amount?: number;
  userType?: 'player' | 'customer_service';
  userId?: string;
}

export interface NewWithdrawalRequest {
  withdrawalId: string;
  userType: 'player' | 'customer_service';
  userId: string;
  amount: number;
  requestedAt: string;
}

export interface ConnectedUser {
  userId: string;
  userType: 'player' | 'user' | 'admin' | 'customer_service';
  socketId: string;
}

class WebSocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, ConnectedUser> = new Map();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: ["http://localhost:3004", "http://localhost:3000"],
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log('新的WebSocket连接:', socket.id);

      // 处理用户认证和注册
      socket.on('authenticate', async (data: { token: string, userType: string }) => {
        try {
          const decoded = jwt.verify(data.token, process.env.JWT_SECRET || 'your-secret-key') as any;
          const userId = decoded.id || decoded.userId;
          
          if (userId) {
            const user: ConnectedUser = {
              userId: userId.toString(),
              userType: data.userType as any,
              socketId: socket.id
            };
            
            this.connectedUsers.set(socket.id, user);
            socket.join(`user_${userId}`);
            socket.join(`role_${data.userType}`);
            
            console.log(`用户认证成功: ${userId} (${data.userType})`);
            socket.emit('authenticated', { success: true, userId });
          } else {
            socket.emit('authentication_error', { message: '无效的token' });
          }
        } catch (error) {
          console.error('WebSocket认证失败:', error);
          socket.emit('authentication_error', { message: '认证失败' });
        }
      });

      // 处理心跳检测
      socket.on('ping', () => {
        socket.emit('pong');
      });

      // 处理断开连接
      socket.on('disconnect', () => {
        const user = this.connectedUsers.get(socket.id);
        if (user) {
          console.log(`用户断开连接: ${user.userId} (${user.userType})`);
          this.connectedUsers.delete(socket.id);
        }
      });

      // 处理错误
      socket.on('error', (error) => {
        console.error('WebSocket错误:', error);
      });
    });
  }

  // 通知提现状态更新
  public notifyWithdrawalStatusUpdate(data: WithdrawalStatusUpdate): void {
    console.log('发送提现状态更新通知:', data);
    
    // 通知特定用户
    if (data.userId) {
      this.io.to(`user_${data.userId}`).emit('withdrawal_status_update', data);
    }
    
    // 通知所有管理员
    this.io.to('role_admin').emit('withdrawal_status_update', data);
    
    // 如果是客服或陪玩的提现，也通知相应的角色组
    if (data.userType) {
      this.io.to(`role_${data.userType}`).emit('withdrawal_status_update', data);
    }
  }

  // 通知新提现申请
  public notifyNewWithdrawalRequest(data: NewWithdrawalRequest): void {
    console.log('发送新提现申请通知:', data);
    
    // 通知所有管理员
    this.io.to('role_admin').emit('new_withdrawal_request', data);
  }

  // 通知订单更新
  public notifyOrderUpdate(data: any): void {
    console.log('发送订单更新通知:', data);
    
    // 通知相关用户
    if (data.userId) {
      this.io.to(`user_${data.userId}`).emit('order_update', data);
    }
    if (data.playerId) {
      this.io.to(`user_${data.playerId}`).emit('order_update', data);
    }
    
    // 通知管理员和客服
    this.io.to('role_admin').emit('order_update', data);
    this.io.to('role_customer_service').emit('order_update', data);
  }

  // 通知新订单
  public notifyNewOrder(data: any): void {
    console.log('发送新订单通知:', data);
    
    // 通知相关陪玩
    if (data.playerId) {
      this.io.to(`user_${data.playerId}`).emit('new_order', data);
    }
    
    // 通知管理员和客服
    this.io.to('role_admin').emit('new_order', data);
    this.io.to('role_customer_service').emit('new_order', data);
  }

  // 发送系统通知
  public sendSystemNotification(message: string, targetUsers?: string[], targetRoles?: string[]): void {
    const notification = {
      type: 'system',
      message,
      timestamp: new Date().toISOString()
    };

    if (targetUsers) {
      targetUsers.forEach(userId => {
        this.io.to(`user_${userId}`).emit('system_notification', notification);
      });
    }

    if (targetRoles) {
      targetRoles.forEach(role => {
        this.io.to(`role_${role}`).emit('system_notification', notification);
      });
    }

    if (!targetUsers && !targetRoles) {
      // 广播给所有连接的用户
      this.io.emit('system_notification', notification);
    }
  }

  // 获取在线用户统计
  public getOnlineStats(): { total: number, byRole: Record<string, number> } {
    const stats = { total: 0, byRole: {} as Record<string, number> };
    
    this.connectedUsers.forEach(user => {
      stats.total++;
      stats.byRole[user.userType] = (stats.byRole[user.userType] || 0) + 1;
    });
    
    return stats;
  }

  // 获取特定用户是否在线
  public isUserOnline(userId: string): boolean {
    for (const user of this.connectedUsers.values()) {
      if (user.userId === userId) {
        return true;
      }
    }
    return false;
  }
}

export default WebSocketService;