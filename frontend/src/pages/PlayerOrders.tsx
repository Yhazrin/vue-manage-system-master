import { useState, useEffect } from 'react';
import Header from "@/components/Header";
import { cn } from "@/lib/utils";
import { getPlayerOrders, updateOrderStatus, Order } from '@/services/orderService';
import { toast } from 'sonner';

// 获取订单状态样式
const getStatusStyle = (status: Order['status']) => {
  switch(status) {
    case 'pending':
      return { 
        className: 'bg-yellow-50 text-yellow-700', 
        label: '待接单' 
      };
    case 'accepted':
      return { 
        className: 'bg-blue-50 text-blue-700', 
        label: '已接单' 
      };
    case 'in_progress':
      return { 
        className: 'bg-purple-50 text-purple-700', 
        label: '服务中' 
      };
    case 'completed':
      return { 
        className: 'bg-green-50 text-green-700', 
        label: '已完成' 
      };
    case 'cancelled':
      return { 
        className: 'bg-gray-50 text-gray-700', 
        label: '已取消' 
      };
    default:
      return { 
        className: 'bg-gray-50 text-gray-700', 
        label: '未知状态' 
      };
  }
};

export default function PlayerOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  
  // 加载订单数据
  useEffect(() => {
    loadOrders();
  }, [activeFilter]);

  const loadOrders = async () => {
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
    : orders.filter(order => {
        if (activeFilter === 'pending') return order.status === 'pending';
        if (activeFilter === 'accepted') return order.status === 'accepted';
        if (activeFilter === 'in_progress') return order.status === 'in_progress';
        if (activeFilter === 'completed') return order.status === 'completed';
        if (activeFilter === 'cancelled') return order.status === 'cancelled';
        return true;
      });
  
  
  if (loading) {
    return (
      <div className="bg-theme-background min-h-screen text-theme-text">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-16 bg-gray-200 rounded-xl mb-6"></div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">订单管理</h1>
            <p className="text-gray-500">查看和管理您的所有订单</p>
          </div>
          <div className="text-center py-10">
            <p className="text-red-500 mb-4">加载失败: {error}</p>
            <button 
              onClick={loadOrders}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">订单管理</h1>
          <p className="text-gray-500">查看和管理您的所有订单</p>
        </div>
        
        {/* 订单筛选 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setActiveFilter('all')}
              className={cn(
                "py-1.5 px-4 rounded-lg text-sm font-medium transition-colors",
                activeFilter === 'all' 
                  ? "bg-purple-600 text-white" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              全部订单
            </button>
            <button 
              onClick={() => setActiveFilter('pending')}
              className={cn(
                "py-1.5 px-4 rounded-lg text-sm font-medium transition-colors",
                activeFilter === 'pending' 
                  ? "bg-purple-600 text-white" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              待接单
            </button>
            <button 
              onClick={() => setActiveFilter('in_progress')}
              className={cn(
                "py-1.5 px-4 rounded-lg text-sm font-medium transition-colors",
                activeFilter === 'in_progress' 
                  ? "bg-purple-600 text-white" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              服务中
            </button>
            <button 
              onClick={() => setActiveFilter('completed')}
              className={cn(
                "py-1.5 px-4 rounded-lg text-sm font-medium transition-colors",
                activeFilter === 'completed' 
                  ? "bg-purple-600 text-white" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              已完成
            </button>
            <button 
              onClick={() => setActiveFilter('cancelled')}
              className={cn(
                "py-1.5 px-4 rounded-lg text-sm font-medium transition-colors",
                activeFilter === 'cancelled' 
                  ? "bg-purple-600 text-white" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              已取消
            </button>
            <button 
              onClick={() => setActiveFilter('accepted')}
              className={cn(
                "py-1.5 px-4 rounded-lg text-sm font-medium transition-colors",
                activeFilter === 'accepted' 
                  ? "bg-purple-600 text-white" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              已接单
            </button>
          </div>
        </div>
        
        {/* 订单列表 */}
        <div className="space-y-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map(order => {
              const statusInfo = getStatusStyle(order.status);
              return (
                <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-5">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={order.user.avatar} 
                          alt={order.user.nickname}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="font-medium text-gray-900">{order.user.nickname}</h3>
                          <p className="text-xs text-gray-500">订单号: {order.id}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-500">服务时长</p>
                          <p className="font-medium text-gray-900">{order.serviceTime}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">订单金额</p>
                          <p className="font-medium text-gray-900">¥{order.price.toFixed(2)}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-50">
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                        <div className="flex items-center text-gray-500">
                          <i className="fa-solid fa-gamepad mr-2 text-purple-600"></i>
                          <span>{order.gameType}</span>
                        </div>
                        <div className="flex items-center text-gray-500">
                          <i className="fa-solid fa-clock mr-2 text-purple-600"></i>
                          <span>{order.orderTime}</span>
                        </div>
                      </div>
                      
                      {/* 订单操作按钮 - 仅对"待接单"状态显示 */}
                      {order.status === 'pending' && (
                        <div className="flex gap-3">
                          <button 
                            onClick={() => handleRejectOrder(order.id)}
                            className="py-1.5 px-4 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            拒绝
                          </button>
                          <button 
                            onClick={() => handleAcceptOrder(order.id)}
                            className="py-1.5 px-4 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            接受
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 text-2xl mb-4">
                <i className="fa-file-invoice"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无订单</h3>
              <p className="text-gray-500 max-w-sm mx-auto">当前没有符合筛选条件的订单</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}