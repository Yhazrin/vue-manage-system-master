import Header from "@/components/Header";
import { useState, useEffect } from "react";  // 补充导入useEffect
import { format } from 'date-fns';
import { toast } from "sonner";  // 导入toast（之前使用但未导入）
import { API_BASE_URL } from '@/config/api';
import { OrderAmountTooltip } from '../components/OrderAmountTooltip';

// 定义订单类型接口
interface Order {
  id: string;
  userNickname: string;
  userUid: string;
  playerNickname: string;
  playerUid: string;
  gameType: string;
  price: number;
  orderTime: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  serviceTime: string;
  is_paid?: boolean; // 是否已打款
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
        
        // 确保data.orders是数组，如果不是则使用空数组
        setOrders(Array.isArray(data.orders) ? data.orders : []);
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

      toast.success(isPaid ? '已标记为已打款' : '已标记为未打款');
    } catch (error) {
      console.error('Failed to update payment status:', error);
      toast.error('更新打款状态失败');
    }
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
      order.userNickname.includes(searchTerm) ||
      order.userUid.includes(searchTerm) ||
      order.playerNickname.includes(searchTerm) ||
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
          <h1 className="text-2xl font-bold text-theme-text mb-2">订单管理</h1>
          <p className="text-theme-text/70">管理平台所有订单，包括搜索、筛选和状态更新</p>
        </div>
        
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
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => {
                    const statusInfo = getStatusStyle(order.status);
                    return (
                      <tr key={order.id} className="hover:bg-theme-background">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">{order.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-theme-text">{order.userNickname}</div>
                          <div className="text-xs text-theme-text/70">{order.userUid}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-theme-text">{order.playerNickname}</div>
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

                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-10 text-center text-theme-text/70">
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