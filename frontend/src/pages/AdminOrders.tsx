import Header from "@/components/Header";
import { useState, useEffect } from "react";  // 补充导入useEffect
import { format } from 'date-fns';
import { toast } from "sonner";  // 导入toast（之前使用但未导入）
import { API_BASE_URL } from '@/config/api';
import { OrderAmountTooltip } from '../components/OrderAmountTooltip';
import { reviewOrder } from '../services/orderService';

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
interface Order {
  id: string;
  userName: string;
  userUid: string;
  playerName: string;
  playerUid: string;
  gameType: string;
  price: number;
  orderTime: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'pending_review' | 'completed' | 'cancelled';
  serviceTime: string;
  service_hours?: number; // 实际服务时长
  minimum_hours?: number; // 最低服务时长
  is_paid?: boolean; // 是否已完成
  gift_count?: number; // 礼物数量
  gift_total?: number; // 礼物总金额
  gift_details?: string; // 礼物详情
}

// 获取订单状态样式（工具函数可以在组件外部）
const getStatusStyle = (status: Order['status']) => {
  switch(status) {
    case 'pending':
      return { 
        className: 'bg-theme-accent/10 text-theme-accent', 
        label: '待接单' 
      };
    case 'accepted':
      return { 
        className: 'bg-theme-primary/10 text-theme-primary', 
        label: '已接单' 
      };
    case 'in_progress':
      return { 
        className: 'bg-theme-primary/10 text-theme-primary', 
        label: '服务中' 
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
        className: 'bg-theme-text/10 text-theme-text/70', 
        label: '已取消' 
      };
    default:
      return { 
        className: 'bg-theme-text/10 text-theme-text/70', 
        label: '未知状态' 
      };
  }
};

export default function AdminOrders() {
  // 所有状态和钩子移到组件内部
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [sortField, setSortField] = useState<keyof Order>("orderTime");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  // 收入统计相关状态
  const [showStatsPanel, setShowStatsPanel] = useState(false);
  const [statsType, setStatsType] = useState<'user' | 'player'>('user');
  const [statsUserId, setStatsUserId] = useState('');
  const [statsStartDate, setStatsStartDate] = useState('');
  const [statsEndDate, setStatsEndDate] = useState('');
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsData, setStatsData] = useState<{
    totalSpent?: number;
    totalEarned?: number;
    orderCount: number;
    giftCount: number;
    giftTotal: number;
    userName?: string;
    playerName?: string;
  } | null>(null);
  
  // Fetch orders on component mount（移到组件内部）
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        // 实际项目中替换为真实API调用
        // const response = await fetch('/api/admin/orders');
        // const data = await response.json();
        
        // 调用真实API获取订单数据
        const response = await fetch(`${API_BASE_URL}/orders?page=1&pageSize=100`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }
        const data = await response.json();
        
        // 确保data.orders是数组，如果不是则使用空数组，并处理服务时长
        const processedOrders = Array.isArray(data.orders) ? data.orders.map((order: any) => ({
          ...order,
          serviceTime: order.serviceTime || (order.service_hours ? formatServiceTime(order.service_hours) : (order.minimum_hours ? formatServiceTime(order.minimum_hours) : '未知'))
        })) : [];
        setOrders(processedOrders);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
        toast.error('获取订单列表失败');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, []);
  
  // 处理订单状态变更
  const handleStatusChange = (orderId: string, newStatus: Order['status']) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
  };

  // 处理打款状态变更
  const handlePaymentStatusChange = async (orderId: string, isPaid: boolean) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/payment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ is_paid: isPaid })
      });

      if (!response.ok) {
        throw new Error('Failed to update payment status');
      }

      // 更新本地状态
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, is_paid: isPaid } : order
        )
      );

      toast.success(isPaid ? '已标记为已完成' : '已标记为未完成');
    } catch (error) {
      console.error('Failed to update payment status:', error);
      toast.error('更新打款状态失败');
    }
  };

  // 处理订单审核
  const handleReviewOrder = async (orderId: string, approved: boolean) => {
    try {
      await reviewOrder(orderId, approved);
      
      // 更新本地状态
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { 
            ...order, 
            status: approved ? 'completed' : 'cancelled' 
          } : order
        )
      );

      toast.success(approved ? '订单审核通过' : '订单审核拒绝');
    } catch (error) {
      console.error('Failed to review order:', error);
      toast.error('审核订单失败');
    }
  };

  // 获取收入统计数据
  const fetchStatsData = async () => {
    if (!statsUserId || !statsStartDate || !statsEndDate) {
      alert('请填写完整的查询条件');
      return;
    }

    setStatsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/income-stats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: statsType,
          userId: statsUserId,
          startDate: statsStartDate,
          endDate: statsEndDate
        })
      });

      if (!response.ok) {
        throw new Error('获取统计数据失败');
      }

      const data = await response.json();
      setStatsData(data);
    } catch (error) {
      console.error('获取统计数据失败:', error);
      alert('获取统计数据失败，请重试');
    } finally {
      setStatsLoading(false);
    }
  };

  // 重置统计数据
  const resetStats = () => {
    setStatsUserId('');
    setStatsStartDate('');
    setStatsEndDate('');
    setStatsData(null);
  };
  
  // 排序订单
  const sortedOrders = [...(Array.isArray(orders) ? orders : [])].sort((a, b) => {
    if ((a[sortField] ?? '') < (b[sortField] ?? '')) {
      return sortDirection === "asc" ? -1 : 1;
    }
    if ((a[sortField] ?? '') > (b[sortField] ?? '')) {
      return sortDirection === "asc" ? 1 : -1;
    }
    return 0;
  });
  
  // 筛选订单
  const filteredOrders = sortedOrders.filter(order => {
    // 搜索筛选
    const matchesSearch = 
      searchTerm === "" ||
      order.id.includes(searchTerm) ||
      order.userName.includes(searchTerm) ||
      order.username.includes(searchTerm) ||
      order.playerName.includes(searchTerm) ||
      order.playerUid.includes(searchTerm);
    
    // 状态筛选
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    // 日期筛选
    const matchesDate = dateRange === "all" || {
      today: order.orderTime.startsWith(format(new Date(), 'yyyy-MM-dd')),
      yesterday: order.orderTime.startsWith(format(new Date(Date.now() - 86400000), 'yyyy-MM-dd')),
      week: new Date(order.orderTime) >= new Date(Date.now() - 7 * 86400000),
      month: new Date(order.orderTime) >= new Date(Date.now() - 30 * 86400000),
    }[dateRange as keyof {today: boolean, yesterday: boolean, week: boolean, month: boolean}];
    
    return matchesSearch && matchesStatus && matchesDate;
  });
  
  // 加载状态显示
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mx-auto" role="status">
            <span className="visually-hidden">加载中...</span>
          </div>
          <p className="mt-2 text-theme-text/70">正在加载订单数据...</p>
        </div>
      </div>
    );
  }
  
  return (
     <div className="bg-theme-background min-h-screen text-theme-text">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold text-theme-text">订单管理</h1>
            <button
              onClick={() => setShowStatsPanel(!showStatsPanel)}
              className="px-4 py-2 bg-theme-primary text-white rounded-lg hover:bg-theme-primary/90 transition-colors flex items-center gap-2"
            >
              <i className="fa-solid fa-chart-line"></i>
              {showStatsPanel ? '隐藏统计' : '收入统计'}
            </button>
          </div>
          <p className="text-theme-text/70">管理平台所有订单，包括搜索、筛选和状态更新</p>
        </div>

        {/* 收入统计面板 */}
        {showStatsPanel && (
          <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border p-6 mb-6">
            <h2 className="text-lg font-semibold text-theme-text mb-4 flex items-center gap-2">
              <i className="fa-solid fa-chart-bar text-theme-primary"></i>
              收入统计查询
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-theme-text mb-1">查询类型</label>
                <select 
                  className="w-full px-3 py-2 border border-theme-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary bg-theme-background text-theme-text"
                  value={statsType}
                  onChange={(e) => setStatsType(e.target.value as 'user' | 'player')}
                >
                  <option value="user">用户消费</option>
                  <option value="player">陪玩收入</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-theme-text mb-1">
                  {statsType === 'user' ? '用户ID' : '陪玩ID'}
                </label>
                <input
                  type="text"
                  value={statsUserId}
                  onChange={(e) => setStatsUserId(e.target.value)}
                  placeholder={statsType === 'user' ? '输入用户ID' : '输入陪玩ID'}
                  className="w-full px-3 py-2 border border-theme-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary bg-theme-background text-theme-text placeholder-theme-text/40"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-theme-text mb-1">开始日期</label>
                <input
                  type="date"
                  value={statsStartDate}
                  onChange={(e) => setStatsStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-theme-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary bg-theme-background text-theme-text"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-theme-text mb-1">结束日期</label>
                <input
                  type="date"
                  value={statsEndDate}
                  onChange={(e) => setStatsEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-theme-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary bg-theme-background text-theme-text"
                />
              </div>
              
              <div className="flex items-end gap-2">
                <button
                  onClick={fetchStatsData}
                  disabled={statsLoading}
                  className="flex-1 px-4 py-2 bg-theme-primary text-white rounded-lg hover:bg-theme-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {statsLoading ? '查询中...' : '查询'}
                </button>
                <button
                  onClick={resetStats}
                  className="px-3 py-2 border border-theme-border rounded-lg hover:bg-theme-background transition-colors text-theme-text"
                >
                  <i className="fa-solid fa-refresh"></i>
                </button>
              </div>
            </div>
            
            {/* 统计结果显示 */}
            {statsData && (
              <div className="mt-6 p-4 bg-theme-background rounded-lg border border-theme-border">
                <h3 className="text-md font-medium text-theme-text mb-3 flex items-center gap-2">
                  <i className="fa-solid fa-chart-pie text-theme-primary"></i>
                  统计结果
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {statsType === 'user' ? (
                    <>
                      <div className="text-center p-3 bg-theme-surface rounded-lg">
                        <div className="text-2xl font-bold text-theme-primary">
                          ¥{(typeof statsData.totalSpent === 'number' ? statsData.totalSpent : parseFloat(String(statsData.totalSpent)) || 0).toFixed(1)}
                        </div>
                        <div className="text-sm text-theme-text/70">总消费金额</div>
                        {statsData.userName && (
                          <div className="text-xs text-theme-text/50 mt-1">{statsData.userName}</div>
                        )}
                      </div>
                      <div className="text-center p-3 bg-theme-surface rounded-lg">
                        <div className="text-2xl font-bold text-blue-500">
                          {statsData.orderCount}
                        </div>
                        <div className="text-sm text-theme-text/70">订单数量</div>
                      </div>
                      <div className="text-center p-3 bg-theme-surface rounded-lg">
                        <div className="text-2xl font-bold text-green-500">
                          {statsData.giftCount}
                        </div>
                        <div className="text-sm text-theme-text/70">礼物数量</div>
                      </div>
                      <div className="text-center p-3 bg-theme-surface rounded-lg">
                        <div className="text-2xl font-bold text-purple-500">
                          ¥{(typeof statsData.giftTotal === 'number' ? statsData.giftTotal : parseFloat(String(statsData.giftTotal)) || 0).toFixed(1)}
                        </div>
                        <div className="text-sm text-theme-text/70">礼物总额</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-center p-3 bg-theme-surface rounded-lg">
                        <div className="text-2xl font-bold text-theme-primary">
                          ¥{(typeof statsData.totalEarned === 'number' ? statsData.totalEarned : parseFloat(String(statsData.totalEarned)) || 0).toFixed(1)}
                        </div>
                        <div className="text-sm text-theme-text/70">总收入金额</div>
                        {statsData.playerName && (
                          <div className="text-xs text-theme-text/50 mt-1">{statsData.playerName}</div>
                        )}
                      </div>
                      <div className="text-center p-3 bg-theme-surface rounded-lg">
                        <div className="text-2xl font-bold text-blue-500">
                          {statsData.orderCount}
                        </div>
                        <div className="text-sm text-theme-text/70">完成订单</div>
                      </div>
                      <div className="text-center p-3 bg-theme-surface rounded-lg">
                        <div className="text-2xl font-bold text-green-500">
                          {statsData.giftCount}
                        </div>
                        <div className="text-sm text-theme-text/70">收到礼物</div>
                      </div>
                      <div className="text-center p-3 bg-theme-surface rounded-lg">
                        <div className="text-2xl font-bold text-purple-500">
                          ¥{(typeof statsData.giftTotal === 'number' ? statsData.giftTotal : parseFloat(String(statsData.giftTotal)) || 0).toFixed(2)}
                        </div>
                        <div className="text-sm text-theme-text/70">礼物收入</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* 搜索和筛选区域 */}
        <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-theme-text mb-1">搜索</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-text/40">
                  <i className="fa-solid fa-search"></i>
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="订单号、用户、陪玩..."
                  className="w-full pl-10 pr-4 py-2 border border-theme-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary bg-theme-background text-theme-text placeholder-theme-text/40"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-theme-text mb-1">订单状态</label>
              <select 
                className="w-full px-4 py-2 border border-theme-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary bg-theme-background text-theme-text"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">所有状态</option>
                <option value="pending">待接单</option>
                <option value="accepted">已接单</option>
                <option value="in_progress">服务中</option>
                <option value="pending_review">待审核</option>
                <option value="completed">已完成</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-theme-text mb-1">时间范围</label>
              <select 
                className="w-full px-4 py-2 border border-theme-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary bg-theme-background text-theme-text"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="all">所有时间</option>
                <option value="today">今天</option>
                <option value="yesterday">昨天</option>
                <option value="week">近7天</option>
                <option value="month">近30天</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* 订单列表 */}
        <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-theme-background">
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">
                    <div className="flex items-center">
                      订单号
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">
                    <div className="flex items-center">
                      用户信息
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">
                    <div className="flex items-center">
                      陪玩信息
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">
                    <div className="flex items-center">
                      游戏类型
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">
                    <div className="flex items-center">
                      总金额
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">
                    <div className="flex items-center">
                      下单时间
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">服务时间</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">礼物信息</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => {
                    const statusInfo = getStatusStyle(order.status);
                    return (
                      <tr key={order.id} className="hover:bg-theme-surface/50 hover:border-theme-accent/30 transition-all duration-200">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">{order.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-theme-text">{order.userName}</div>
                          <div className="text-xs text-theme-text/70">{order.userUid}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-theme-text">{order.playerName}</div>
                          <div className="text-xs text-theme-text/70">{order.playerUid}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">{order.gameType}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <OrderAmountTooltip
                            serviceAmount={typeof order.price === 'number' ? order.price : parseFloat(order.price) || 0}
                            giftCount={order.gift_count || 0}
                            giftAmount={typeof order.gift_total === 'number' ? order.gift_total : parseFloat(String(order.gift_total)) || 0}
                            totalAmount={(typeof order.price === 'number' ? order.price : parseFloat(String(order.price)) || 0) + (typeof order.gift_total === 'number' ? order.gift_total : parseFloat(String(order.gift_total)) || 0)}
                          >
                            <span className="text-sm text-theme-text cursor-help">
                              ¥{((typeof order.price === 'number' ? order.price : parseFloat(String(order.price)) || 0) + (typeof order.gift_total === 'number' ? order.gift_total : parseFloat(String(order.gift_total)) || 0)).toFixed(2)}
                            </span>
                          </OrderAmountTooltip>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">{order.orderTime}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">{order.serviceTime}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {order.gift_count && order.gift_count > 0 ? (
                            <div className="text-sm">
                              <div className="font-medium text-theme-primary text-xs">
{order.gift_count?.toString()}个 ¥{(typeof order.gift_total === 'number' ? order.gift_total : parseFloat(String(order.gift_total)) || 0).toFixed(2)}
                              </div>
                              {order.gift_details && (
                                <div className="text-xs text-theme-text/70 max-w-xs truncate" title={order.gift_details}>
                                  {order.gift_details}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-theme-text/40">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {order.status === 'pending_review' ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleReviewOrder(order.id, true)}
                                className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                              >
                                通过
                              </button>
                              <button
                                onClick={() => handleReviewOrder(order.id, false)}
                                className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                              >
                                拒绝
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-theme-text/40">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="px-6 py-10 text-center text-theme-text/70">
                      <div className="flex flex-col items-center">
                        <i className="fa-solid fa-file-invoice text-2xl mb-2"></i>
                        <p>没有找到匹配的订单</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}