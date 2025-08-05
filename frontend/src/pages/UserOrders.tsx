import { useState, useEffect } from 'react';
import Header from "@/components/Header";
import { useNavigate } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { getUserOrders, Order, confirmEndOrder } from '@/services/orderService';
import { toast } from 'sonner';
import { RatingModal } from '@/components/RatingModal';
import { createComment } from '@/services/commentService';
import { buildAvatarUrl } from '@/utils/imageUtils';
import { OrderAmountTooltip } from '../components/OrderAmountTooltip';
import { useOrderAutoRefresh } from '@/hooks/useAutoRefresh';

// 获取订单状态样式
const getStatusStyle = (status: Order['status']) => {
  switch(status) {
    case 'pending':
      return {
        className: "bg-theme-warning/10 text-theme-warning", 
        label: "待确认" 
      };
    case 'accepted':
    case 'in_progress':
      return {
        className: "bg-theme-primary/10 text-theme-primary",
        label: "进行中"
      };
    case 'completed':
      return {
        className: "bg-theme-success/10 text-theme-success", 
        label: "已完成" 
      };
    case 'cancelled':
      return {
        className: "bg-theme-text/10 text-theme-text/70", 
        label: "已取消" 
      };
    default:
      return {
        className: "bg-theme-text/10 text-theme-text/70", 
        label: "未知状态" 
      };
  }
};

export default function UserOrders() {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [showRatingModal, setShowRatingModal] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const navigate = useNavigate();

  // 使用自动刷新Hook
  const { 
    data: orders, 
    loading, 
    error, 
    refresh: loadOrders 
  } = useOrderAutoRefresh(
    () => getUserOrders(activeFilter),
    {
      onDataUpdate: (newOrders, oldOrders) => {
        // 比较新旧订单状态，并发送通知
        if (Array.isArray(newOrders) && Array.isArray(oldOrders)) {
          newOrders.forEach(newOrder => {
            const oldOrder = oldOrders.find(o => o.id === newOrder.id);
            if (oldOrder && oldOrder.status !== newOrder.status) {
              toast.info(`订单 #${newOrder.id} 状态更新`, {
                description: `您的订单状态已从 ${getStatusStyle(oldOrder.status).label} 更新为 ${getStatusStyle(newOrder.status).label}`,
                position: 'bottom-right',
              });
            }
          });
        }
      }
    }
  );

  // 当筛选条件改变时，重新加载数据（移除loadOrders依赖避免循环）
  useEffect(() => {
    // 直接调用refresh而不依赖loadOrders
    if (loadOrders && typeof loadOrders === 'function') {
      try {
        loadOrders();
      } catch (error) {
        console.error('加载订单失败:', error);
        toast.error('加载订单失败，请稍后重试');
      }
    }
  }, [activeFilter]); // 移除loadOrders依赖

  // 处理评价
  const handleRating = (order: Order) => {
    setSelectedOrder(order);
    setShowRatingModal(true);
  };

  // 提交评价
   const handleSubmitRating = async (rating: number, comment: string, gifts?: Array<{giftId: number, quantity: number}>) => {
     if (!selectedOrder) return;

     try {
       await createComment({
         player_id: Number(selectedOrder.player.id),
         order_id: selectedOrder.id,
         rating,
         content: comment,
         gifts: gifts
       });
       
       const giftMessage = gifts && gifts.length > 0 ? '，礼物已赠送' : '';
       toast.success(`评价提交成功${giftMessage}`);
       setShowRatingModal(false);
       setSelectedOrder(null);
       
       // 重新加载订单以更新状态
       loadOrders();
     } catch (error) {
       console.error('提交评价失败:', error);
       toast.error('评价提交失败，请重试');
     }
   };

  // 处理确认结束订单
  const handleConfirmEnd = async (orderId: string) => {
    try {
      const response = await confirmEndOrder(orderId);
      toast.success(response.message);
      
      // 重新加载订单以更新状态
      loadOrders();
    } catch (error) {
      console.error('确认结束订单失败:', error);
      toast.error('确认结束订单失败，请重试');
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
            <div className="h-8 bg-theme-surface rounded w-1/4 mb-6"></div>
            <div className="h-16 bg-theme-surface rounded-xl mb-6"></div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-theme-surface rounded-xl"></div>
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-theme-text">我的订单</h1>
          <button 
            onClick={() => navigate('/user/profile')}
            className="py-1.5 px-3 bg-theme-primary text-white text-sm font-medium rounded-lg hover:bg-theme-primary/90 transition-colors"
          >
            <i className="fa-solid fa-arrow-left mr-1"></i> 返回个人主页
          </button>
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
                  : "bg-theme-background text-theme-text hover:bg-theme-border"
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
                  : "bg-theme-background text-theme-text hover:bg-theme-border"
              )}
            >
              待确认
            </button>
            <button 
              onClick={() => setActiveFilter('in_progress')}
              className={cn(
                "py-1.5 px-4 rounded-lg text-sm font-medium transition-colors",
                activeFilter === 'in_progress' 
                  ? "bg-theme-primary text-white" 
                  : "bg-theme-background text-theme-text hover:bg-theme-border"
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
                  : "bg-theme-background text-theme-text hover:bg-theme-border"
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
                  : "bg-theme-background text-theme-text hover:bg-theme-border"
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
                          src={buildAvatarUrl(order.player?.avatar)} 
                          alt={order.player?.nickname || '陪玩'}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="font-medium text-theme-text">{order.player?.nickname || '陪玩'}</h3>
                          <p className="text-xs text-theme-text/60">订单号: {order.id}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-theme-text/60">服务时间</p>
                          <p className="font-medium text-theme-text">{order.serviceTime}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-theme-text/60">订单金额</p>
                          <OrderAmountTooltip
                             serviceAmount={typeof order.price === 'number' ? order.price : parseFloat(order.price) || 0}
                             giftCount={order.gift_count || 0}
                             giftAmount={typeof order.gift_total === 'number' ? order.gift_total : parseFloat(order.gift_total) || 0}
                             totalAmount={(typeof order.price === 'number' ? order.price : parseFloat(order.price) || 0) + (typeof order.gift_total === 'number' ? order.gift_total : parseFloat(order.gift_total) || 0)}
                           >
                            <p className="font-medium text-theme-text cursor-help">
                              ¥{((typeof order.price === 'number' ? order.price : parseFloat(order.price) || 0) + (typeof order.gift_total === 'number' ? order.gift_total : parseFloat(order.gift_total) || 0)).toFixed(2)}
                            </p>
                          </OrderAmountTooltip>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-theme-border">
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                        <div className="flex items-center text-theme-text/60">
                          <i className="fa-solid fa-gamepad mr-2 text-theme-primary"></i>
                          <span>{order.gameType}</span>
                        </div>
                        <div className="flex items-center text-theme-text/60">
                          <i className="fa-solid fa-clock mr-2 text-theme-primary"></i>
                          <span>{order.orderTime}</span>
                        </div>
                        {order.gift_details && (
                          <div className="flex items-center text-theme-text/60">
                            <i className="fa-solid fa-gift mr-2 text-purple-500"></i>
                            <span className="text-xs truncate max-w-xs" title={order.gift_details}>
                              礼物: {order.gift_details}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {/* 进行中状态显示结束按钮 */}
                        {order.status === 'in_progress' && (
                          <div className="flex items-center gap-2">
                            {order.user_confirmed_end ? (
                              <span className="text-theme-success text-sm">
                                <i className="fa-solid fa-check-circle mr-1"></i> 您已确认结束
                              </span>
                            ) : (
                              <button 
                                onClick={() => handleConfirmEnd(order.id)}
                                className="py-1.5 px-3 bg-theme-error text-white text-sm font-medium rounded-lg hover:bg-theme-error/80 transition-colors"
                              >
                                结束订单
                              </button>
                            )}
                            {order.player_confirmed_end && !order.user_confirmed_end && (
                              <span className="text-theme-warning text-sm">
                                <i className="fa-solid fa-clock mr-1"></i> 等待您确认结束
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* 已完成状态显示评价按钮 */}
                        {order.status === 'completed' && (
                          order.isRated ? (
                            <span className="text-green-600 text-sm">
                              <i className="fa-solid fa-check-circle mr-1"></i> 已评价
                            </span>
                          ) : (
                            <button 
                              onClick={() => handleRating(order)}
                              className="text-theme-primary text-sm hover:text-theme-primary/80"
                            >
                              <i className="fa-solid fa-comment mr-1"></i> 评价
                            </button>
                          )
                        )}
                      </div>
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
              <p className="text-theme-text/60 max-w-sm mx-auto">当前没有符合筛选条件的订单</p>
            </div>
          )}
        </div>
      </main>
      
      {/* 评价弹窗 */}
       {showRatingModal && selectedOrder && (
         <RatingModal
           isOpen={showRatingModal}
           onClose={() => {
             setShowRatingModal(false);
             setSelectedOrder(null);
           }}
           onSubmit={handleSubmitRating}
           playerName={selectedOrder.player?.nickname || '陪玩'}
           orderId={selectedOrder.id}
         />
       )}
    </div>
  );
}
