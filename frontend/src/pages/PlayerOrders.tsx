import { useState, useEffect, useContext } from 'react';
import Header from "@/components/Header";
import { cn } from "@/lib/utils";
import { getPlayerOrders, updateOrderStatus, Order } from '@/services/orderService';
import { toast } from 'sonner';
import { useNotifications } from '@/components/NotificationManager';
import { AuthContext } from '@/contexts/authContext';
import { useNavigate } from 'react-router-dom';

// 获取订单状态样式
const getStatusStyle = (status: Order['status']) => {
  switch(status) {
    case 'pending':
      return { 
        className: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300', 
        label: '待接单' 
      };
    case 'accepted':
    case 'in_progress':
      return {
        className: 'bg-theme-primary/10 text-theme-primary', 
        label: '进行中' 
      };
    case 'completed':
      return { 
        className: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300', 
        label: '已完成' 
      };
    case 'cancelled':
      return { 
        className: 'bg-theme-surface text-theme-text/70 border border-theme-border', 
        label: '已取消' 
      };
    default:
      return { 
        className: 'bg-theme-surface text-theme-text/70 border border-theme-border', 
        label: '未知状态' 
      };
  }
};

export default function PlayerOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  
  // 获取用户认证信息
  const { userRole, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // 使用通知系统
  const { notifications, unreadCount } = useNotifications();
  
  // 检查用户权限
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (userRole !== 'player') {
      // 如果不是陪玩用户，重定向到对应的订单页面
      if (userRole === 'user') {
        navigate('/user/orders');
      } else if (userRole === 'admin') {
        navigate('/admin/orders');
      } else {
        navigate('/');
      }
      return;
    }
  }, [isAuthenticated, userRole, navigate]);
  
  // 监听通知变化，刷新订单列表
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      if (latestNotification.type === 'order' && !latestNotification.read) {
        // 有新订单通知时，刷新订单列表
        loadOrders();
      }
    }
  }, [notifications]);
  
  // 加载订单数据
  useEffect(() => {
    if (userRole === 'player') {
      loadOrders();
    }
  }, [activeFilter, userRole]);

  const loadOrders = async () => {
    // 只有陪玩用户才能加载订单
    if (userRole !== 'player') {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await getPlayerOrders(activeFilter);
      setOrders(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载订单失败';
      setError(errorMessage);
      console.error('Error loading orders:', err);
      
      // 在开发环境下提供空数组
      if (process.env.NODE_ENV === 'development') {
        setOrders([]);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // 处理接单操作
  const handleAcceptOrder = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'accepted');
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: 'accepted' } : order
        )
      );
      toast.success('订单已接受');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '接单失败';
      toast.error(errorMessage);
    }
  };
  
  // 处理开始服务操作
  const handleStartService = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'in_progress');
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: 'in_progress' } : order
        )
      );
      toast.success('服务已开始');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '开始服务失败';
      toast.error(errorMessage);
    }
  };
  
  // 处理结束服务操作
  const handleEndService = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'completed');
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: 'completed' } : order
        )
      );
      toast.success('服务已结束');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '结束服务失败';
      toast.error(errorMessage);
    }
  };
  
  // 处理拒单操作
  const handleRejectOrder = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'cancelled');
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: 'cancelled' } : order
        )
      );
      toast.success('订单已拒绝');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '拒单失败';
      toast.error(errorMessage);
    }
  };
  
  // 筛选订单
  const filteredOrders = activeFilter === 'all' 
    ? orders 
    : activeFilter === 'in_progress'
      ? orders.filter(order => order.status === 'accepted' || order.status === 'in_progress')
      : orders.filter(order => order.status === activeFilter);
  
  
  if (loading) {
    return (
      <div className="bg-theme-background min-h-screen text-theme-text">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-theme-border rounded w-1/4 mb-6"></div>
            <div className="h-16 bg-theme-border rounded-xl mb-6"></div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-theme-border rounded-xl"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-theme-background min-h-screen text-theme-text">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-theme-text mb-2">订单管理</h1>
            <p className="text-theme-text/70">查看和管理您的所有订单</p>
          </div>
          <div className="text-center py-10">
            <p className="text-red-500 mb-4">加载失败: {error}</p>
            <button 
              onClick={loadOrders}
              className="px-4 py-2 bg-theme-primary text-white rounded-lg hover:bg-theme-primary/90"
            >
              重试
            </button>
          </div>
        </main>
      </div>
    );
  }



  return (
     <div className="bg-theme-background min-h-screen text-theme-text">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-theme-text mb-2">订单管理</h1>
              <p className="text-theme-text/70">查看和管理您的所有订单</p>
            </div>
            <div className="flex items-center gap-4">
              {/* 通知图标 */}
               <div className="relative">
                 <button className={`p-2 text-theme-text/70 hover:text-theme-primary transition-colors ${unreadCount > 0 ? 'animate-pulse-notification' : ''}`}>
                   <i className="fa-solid fa-bell text-xl"></i>
                   {unreadCount > 0 && (
                     <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-bounce-gentle">
                       {unreadCount > 9 ? '9+' : unreadCount}
                     </span>
                   )}
                 </button>
               </div>
            </div>
          </div>
        </div>
        
        {/* 订单筛选 */}
        <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setActiveFilter('all')}
              className={cn(
                "py-1.5 px-4 rounded-lg text-sm font-medium transition-colors",
                activeFilter === 'all' 
                  ? "bg-theme-primary text-white" 
                  : "bg-theme-background text-theme-text hover:bg-theme-primary/10"
              )}
            >
              全部订单
            </button>
            <button 
              onClick={() => setActiveFilter('pending')}
              className={cn(
                "py-1.5 px-4 rounded-lg text-sm font-medium transition-colors",
                activeFilter === 'pending' 
                  ? "bg-theme-primary text-white" 
                  : "bg-theme-background text-theme-text hover:bg-theme-primary/10"
              )}
            >
              待接单
            </button>
            <button 
              onClick={() => setActiveFilter('in_progress')}
              className={cn(
                "py-1.5 px-4 rounded-lg text-sm font-medium transition-colors",
                activeFilter === 'in_progress' 
                  ? "bg-theme-primary text-white" 
                  : "bg-theme-background text-theme-text hover:bg-theme-primary/10"
              )}
            >
              进行中
            </button>
            <button 
              onClick={() => setActiveFilter('completed')}
              className={cn(
                "py-1.5 px-4 rounded-lg text-sm font-medium transition-colors",
                activeFilter === 'completed' 
                  ? "bg-theme-primary text-white" 
                  : "bg-theme-background text-theme-text hover:bg-theme-primary/10"
              )}
            >
              已完成
            </button>
            <button 
              onClick={() => setActiveFilter('cancelled')}
              className={cn(
                "py-1.5 px-4 rounded-lg text-sm font-medium transition-colors",
                activeFilter === 'cancelled' 
                  ? "bg-theme-primary text-white" 
                  : "bg-theme-background text-theme-text hover:bg-theme-primary/10"
              )}
            >
              已取消
            </button>
          </div>
        </div>
        
        {/* 订单列表 */}
        <div className="space-y-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map(order => {
              const statusInfo = getStatusStyle(order.status);
              return (
                <div key={order.id} className="bg-theme-surface rounded-xl shadow-sm border border-theme-border overflow-hidden">
                  <div className="p-5">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={order.user.avatar} 
                          alt={order.user.nickname}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="font-medium text-theme-text">{order.user.nickname}</h3>
                          <p className="text-xs text-theme-text/70">订单号: {order.id}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-theme-text/70">服务时长</p>
                          <p className="font-medium text-theme-text">{order.serviceTime}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-theme-text/70">订单金额</p>
                          <p className="font-medium text-theme-text">¥{order.price.toFixed(2)}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-theme-border/30">
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                        <div className="flex items-center text-theme-text/70">
                          <i className="fa-solid fa-gamepad mr-2 text-theme-primary"></i>
                          <span>{order.gameType}</span>
                        </div>
                        <div className="flex items-center text-theme-text/70">
                          <i className="fa-solid fa-clock mr-2 text-theme-primary"></i>
                          <span>{order.orderTime}</span>
                        </div>
                      </div>
                      
                      {/* 订单操作按钮 - 根据状态显示不同操作 */}
                      {order.status === 'pending' && (
                        <div className="flex gap-3">
                          <button 
                            onClick={() => handleRejectOrder(order.id)}
                            className="py-1.5 px-4 bg-theme-background text-theme-text text-sm font-medium rounded-lg hover:bg-theme-background/80 transition-colors border border-theme-border"
                          >
                            拒绝
                          </button>
                          <button 
                            onClick={() => handleAcceptOrder(order.id)}
                            className="py-1.5 px-4 bg-theme-primary text-white text-sm font-medium rounded-lg hover:bg-theme-primary/90 transition-colors"
                          >
                            接受
                          </button>
                        </div>
                      )}
                      
                      {order.status === 'accepted' && (
                        <div className="flex gap-3">
                          <button 
                            onClick={() => handleStartService(order.id)}
                            className="py-1.5 px-4 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
                          >
                            开始服务
                          </button>
                        </div>
                      )}
                      
                      {order.status === 'in_progress' && (
                        <div className="flex gap-3">
                          <button 
                            onClick={() => handleEndService(order.id)}
                            className="py-1.5 px-4 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
                          >
                            结束服务
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-theme-background text-theme-text/40 text-2xl mb-4">
                <i className="fa-file-invoice"></i>
              </div>
              <h3 className="text-lg font-medium text-theme-text mb-2">暂无订单</h3>
              <p className="text-theme-text/70 max-w-sm mx-auto">当前没有符合筛选条件的订单</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}