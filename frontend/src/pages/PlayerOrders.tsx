import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import Header from "@/components/Header";
import { cn } from '@/lib/utils';
import { buildAvatarUrl } from '@/utils/imageUtils';
import { getPlayerOrders, updateOrderStatus, Order, confirmEndOrder } from '@/services/orderService';
import { toast } from 'sonner';
import { useNotifications } from '@/components/NotificationManager';
import { AuthContext } from '@/contexts/authContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '@/config/api';
import { fetchJson } from '@/utils/fetchWrapper';
import RatingStats from '@/components/RatingStats';
import { OrderAmountTooltip } from '@/components/OrderAmountTooltip';
import { useOrderAutoRefresh } from '@/hooks/useAutoRefresh';
import CreateCompletedOrder from '@/components/CreateCompletedOrder';

interface DashboardStats {
  todayOrders: number;
  monthlyIncome: number;
  serviceRating: number;
  pendingTasks: number;
}

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
    case 'pending_review':
      return { 
        className: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300', 
        label: '待审核' 
      };
    case 'completed':
      return { 
        className: 'bg-theme-success/10 text-theme-success', 
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
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [stats, setStats] = useState<DashboardStats>({
    todayOrders: 0,
    monthlyIncome: 0,
    serviceRating: 0,
    pendingTasks: 0
  });
  const [statsLoading, setStatsLoading] = useState<boolean>(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  
  // 获取用户认证信息
  const { userRole, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // 使用通知系统
  const { notifications, unreadCount } = useNotifications();

  // 定义 loadDashboardStats 函数
  const loadDashboardStats = useCallback(async () => {
    // 防抖机制：避免频繁调用
    const now = Date.now();
    const lastCallKey = 'lastDashboardStatsCall';
    const lastCall = parseInt(localStorage.getItem(lastCallKey) || '0');
    const minInterval = 5000; // 最小间隔5秒
    
    if (now - lastCall < minInterval) {
      console.log('Dashboard stats request skipped due to rate limiting');
      return;
    }
    
    localStorage.setItem(lastCallKey, now.toString());
    
    try {
      setStatsLoading(true);
      
      // 从token中获取用户ID
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }
      
      let userId = '1'; // 默认值
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.id.toString();
      } catch (e) {
        console.error('Failed to parse token:', e);
      }
      
      // 获取玩家统计数据
      const responseData = await fetchJson(`${API_BASE_URL}/statistics/player/${userId}`);
      
      const statsData = {
        todayOrders: responseData.todayOrders || 0,
        monthlyIncome: responseData.monthlyIncome || 0,
        serviceRating: Number(responseData.serviceRating) || 0,
        pendingTasks: responseData.pendingTasks || 0
      };
      
      setStats(statsData);
      
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      
      // 检查是否是资源不足错误
      if (err instanceof Error && err.message.includes('ERR_INSUFFICIENT_RESOURCES')) {
        console.warn('Dashboard stats request failed due to insufficient resources, using default values');
      }
      
      // 设置默认值
      setStats({
        todayOrders: 0,
        monthlyIncome: 0,
        serviceRating: 0,
        pendingTasks: 0
      });
    } finally {
      setStatsLoading(false);
    }
  }, []); // 空依赖数组，因为函数内部没有依赖外部变量

  // 添加初始加载标记，防止初始加载时显示新订单通知
  const isInitialLoadRef = useRef(true);
  
  // 使用自动刷新Hook
  const { 
    data: orders, 
    loading, 
    error, 
    refresh: loadOrders 
  } = useOrderAutoRefresh(
    () => userRole === 'player' ? getPlayerOrders(activeFilter) : Promise.resolve([]),
    {
      onDataUpdate: (newOrders, hasChanged) => {
        // 如果是初始加载，不显示通知
        if (isInitialLoadRef.current) {
          isInitialLoadRef.current = false;
          return;
        }
        
        // 只有在数据确实发生变化时才处理通知
        if (!hasChanged) {
          return;
        }
        
        // 简化通知逻辑，只在有新数据时显示通知
        if (newOrders && Array.isArray(newOrders) && newOrders.length > 0) {
          // 检查是否有待处理的订单
          const pendingOrders = newOrders.filter(order => order.status === 'pending');
          if (pendingOrders.length > 0) {
            toast.info('订单数据已更新', {
              description: `当前有 ${pendingOrders.length} 个待处理订单`,
              position: 'bottom-right',
            });
          }
        }
      }
    }
  );
  
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
  
  // 监听通知变化，刷新订单列表（减少频率，避免重复刷新）
  const lastNotificationProcessed = useRef<string | null>(null);
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      if (latestNotification.type === 'order' && 
          !latestNotification.read && 
          latestNotification.id !== lastNotificationProcessed.current) {
        lastNotificationProcessed.current = latestNotification.id;
        // 有新订单通知时，刷新订单列表
        loadOrders();
      }
    }
  }, [notifications, loadOrders]);
  
  // 当筛选条件改变时，重新加载数据（useAutoRefresh会自动处理，这里只需要加载统计数据）
  useEffect(() => {
    if (userRole === 'player') {
      loadDashboardStats();
    }
  }, [activeFilter, userRole, loadDashboardStats]);

  // 当订单数据变化时，更新待处理事项数量
  useEffect(() => {
    const pendingOrdersCount = orders ? orders.filter(order => order.status === 'pending').length : 0;
    setStats(prevStats => ({
      ...prevStats,
      pendingTasks: pendingOrdersCount
    }));
  }, [orders]);

  // 处理接单操作
  const handleAcceptOrder = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'accepted');
      toast.success('订单已接受');
      // 立即刷新数据
      loadOrders();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '接单失败';
      toast.error(errorMessage);
    }
  };
  
  // 处理开始服务操作
  const handleStartService = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'in_progress');
      toast.success('服务已开始');
      // 立即刷新数据
      loadOrders();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '开始服务失败';
      toast.error(errorMessage);
    }
  };
  
  // 处理结束服务操作（改为确认结束）
  const handleEndService = async (orderId: string) => {
    try {
      const response = await confirmEndOrder(orderId);
      toast.success(response.message);
      
      // 重新加载订单以更新状态
      loadOrders();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '确认结束服务失败';
      toast.error(errorMessage);
    }
  };

  const handleCreateOrderSuccess = () => {
    loadOrders();
    loadDashboardStats();
  };
  
  // 处理拒单操作
  const handleRejectOrder = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'cancelled');
      toast.success('订单已拒绝');
      // 立即刷新数据
      loadOrders();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '拒单失败';
      toast.error(errorMessage);
    }
  };
  
  // 筛选订单
  const filteredOrders = !orders ? [] : (
    activeFilter === 'all' 
      ? orders 
      : activeFilter === 'in_progress'
        ? orders.filter(order => order.status === 'accepted' || order.status === 'in_progress')
        : orders.filter(order => order.status === activeFilter)
  );
  
  
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
            <p className="text-theme-error mb-4">加载失败: {error?.message || String(error)}</p>
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
        {/* 数据概览卡片 */}
        <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border p-6 mb-6">
          {statsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 bg-theme-background rounded-lg animate-pulse">
                  <div className="h-4 bg-theme-border rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-theme-border rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-theme-background rounded-lg">
                <p className="text-sm text-theme-text/70 mb-1">今日订单</p>
                <div className="flex items-end justify-between">
                  <h3 className="text-2xl font-bold text-theme-text">{stats.todayOrders}</h3>
                  <span className="text-xs text-theme-success flex items-center">
                    <i className="fa-solid fa-arrow-up mr-1"></i> 今日
                  </span>
                </div>
              </div>
              <div className="p-4 bg-theme-background rounded-lg">
                <p className="text-sm text-theme-text/70 mb-1">本月收入</p>
                <div className="flex items-end justify-between">
                  <h3 className="text-2xl font-bold text-theme-text">¥{Number(stats.monthlyIncome || 0).toFixed(1)}</h3>
                  <span className="text-xs text-theme-success flex items-center">
                    <i className="fa-solid fa-arrow-up mr-1"></i> 本月
                  </span>
                </div>
              </div>
              <div 
                 className="p-4 bg-theme-background rounded-lg cursor-pointer hover:bg-theme-background/80 transition-colors relative group"
                 onClick={() => setShowRatingModal(true)}
               >
                 <div className="flex items-center justify-between mb-1">
                   <p className="text-sm text-theme-text/70">平均评分</p>
                   <i className="fa-solid fa-chart-line text-theme-primary opacity-60 group-hover:opacity-100 transition-opacity"></i>
                 </div>
                 <div className="flex items-end justify-between">
                   <h3 className="text-2xl font-bold text-theme-text">{typeof stats.serviceRating === 'number' && !isNaN(stats.serviceRating) ? stats.serviceRating.toFixed(1) : '0.0'}</h3>
                   <span className="text-xs text-theme-text/70 flex items-center">
                     <i className="fa-solid fa-star mr-1 text-theme-warning"></i> 点击查看详情
                   </span>
                 </div>
               </div>
              <div className="p-4 bg-theme-background rounded-lg">
                <p className="text-sm text-theme-text/70 mb-1">待接取订单</p>
                <div className="flex items-end justify-between">
                  <h3 className="text-2xl font-bold text-theme-text">{stats.pendingTasks}</h3>
                  <span className="text-xs text-theme-error flex items-center">
                    <i className="fa-solid fa-exclamation-circle mr-1"></i> 待处理
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* 评分统计浮窗 */}
         {showRatingModal && (
           <div 
             className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
             onClick={() => setShowRatingModal(false)}
           >
             <div 
               className="bg-theme-surface rounded-xl shadow-lg border border-theme-border max-w-2xl w-full max-h-[80vh] overflow-y-auto"
               onClick={(e) => e.stopPropagation()}
             >
               <div className="p-6">
                 <div className="flex items-center justify-between mb-4">
                   <h2 className="text-xl font-bold text-theme-text">评分统计详情</h2>
                   <button 
                     onClick={() => setShowRatingModal(false)}
                     className="text-theme-text/70 hover:text-theme-text transition-colors p-1"
                   >
                     <i className="fa-solid fa-times text-xl"></i>
                   </button>
                 </div>
                 <RatingStats />
               </div>
             </div>
           </div>
         )}
        
        {/* 订单筛选和操作 */}
        <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
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
            
            {/* 创建订单按钮 */}
            <button
              onClick={() => setShowCreateOrderModal(true)}
              className="py-1.5 px-4 bg-theme-success text-white text-sm font-medium rounded-lg hover:bg-theme-success/90 transition-colors flex items-center gap-2"
            >
              <i className="fa-solid fa-plus"></i>
              创建已完成订单
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
                          src={buildAvatarUrl(order.user.avatar)} 
                          alt={order.user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="font-medium text-theme-text">{order.user.name}</h3>
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
                          <OrderAmountTooltip
                             serviceAmount={typeof order.price === 'number' ? order.price : parseFloat(order.price) || 0}
                             giftCount={order.gift_count || 0}
                             giftAmount={typeof order.gift_total === 'number' ? order.gift_total : parseFloat(order.gift_total || '0')}
                             totalAmount={(typeof order.price === 'number' ? order.price : parseFloat(order.price || '0')) + (typeof order.gift_total === 'number' ? order.gift_total : parseFloat(order.gift_total || '0'))}
                           >
                             <p className="font-medium text-theme-text cursor-help">
                               ¥{((typeof order.price === 'number' ? order.price : parseFloat(order.price) || 0) + (typeof order.gift_total === 'number' ? order.gift_total : parseFloat(order.gift_total) || 0)).toFixed(1)}
                             </p>
                           </OrderAmountTooltip>
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
                        {order.gift_details && (
                          <div className="flex items-center text-theme-text/70">
                            <i className="fa-solid fa-gift mr-2 text-purple-500"></i>
                            <span className="text-xs truncate max-w-xs" title={order.gift_details}>
                              礼物: {order.gift_details}
                            </span>
                          </div>
                        )}
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
                            className="py-1.5 px-4 bg-theme-success text-white text-sm font-medium rounded-lg hover:bg-theme-success/80 transition-colors"
                          >
                            开始服务
                          </button>
                        </div>
                      )}
                      
                      {order.status === 'in_progress' && (
                        <div className="flex items-center gap-2">
                          {order.player_confirmed_end ? (
                            <span className="text-theme-success text-sm">
                              <i className="fa-solid fa-check-circle mr-1"></i> 您已确认结束
                            </span>
                          ) : (
                            <button 
                              onClick={() => handleEndService(order.id)}
                              className="py-1.5 px-4 bg-theme-error text-white text-sm font-medium rounded-lg hover:bg-theme-error/80 transition-colors"
                            >
                              结束服务
                            </button>
                          )}
                          {order.user_confirmed_end && !order.player_confirmed_end && (
                            <span className="text-theme-warning text-sm">
                              <i className="fa-solid fa-clock mr-1"></i> 等待您确认结束
                            </span>
                          )}
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
        
        {/* 创建已完成订单模态框 */}
        <CreateCompletedOrder
          isOpen={showCreateOrderModal}
          onClose={() => setShowCreateOrderModal(false)}
          onSuccess={handleCreateOrderSuccess}
        />
      </main>
    </div>
  );
}