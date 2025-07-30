import Header from "@/components/Header";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from '@/contexts/authContext';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/api';

interface DashboardStats {
  todayOrders: number;
  monthlyIncome: number;
  serviceRating: number;
  pendingTasks: number;
}

interface RecentOrder {
  id: string;
  userName: string;
  gameName: string;
  amount: number;
  status: string;
  scheduledTime: string;
  userAvatar?: string;
}

export default function PlayerHome() {
  const { logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("profile");
  const [stats, setStats] = useState<DashboardStats>({
    todayOrders: 0,
    monthlyIncome: 0,
    serviceRating: 0,
    pendingTasks: 0
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 首次登录显示通知
  useEffect(() => {
    const firstLoginKey = 'firstLogin_player';
    const isFirstLogin = localStorage.getItem(firstLoginKey) !== 'false';
    
    if (isFirstLogin) {
      toast.success("欢迎回来，陪玩！", {
        description: "查看您的工作台和最新订单",
        position: "bottom-right",
        duration: 5000,
        icon: <i className="fa-solid fa-user-tie"></i>,
      });
      
      // 标记为非首次登录
      localStorage.setItem(firstLoginKey, 'false');
    }
    
    // 加载数据
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 从token中获取用户ID
      const token = localStorage.getItem('token');
      if (!token) {
        setError('请先登录');
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
      const statsResponse = await fetch(`${API_BASE_URL}/statistics/player/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats({
          todayOrders: statsData.todayOrders || 0,
          monthlyIncome: statsData.monthlyIncome || 0,
          serviceRating: statsData.serviceRating || 0,
          pendingTasks: statsData.pendingTasks || 0
        });
      }
      
      // 获取最近订单
      const ordersResponse = await fetch(`${API_BASE_URL}/orders?page=1&pageSize=3&status=all`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        if (ordersData.success && ordersData.orders) {
          setRecentOrders(ordersData.orders.slice(0, 3));
        }
      }
      
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('加载数据失败');
      toast.error('加载数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'pending':
        return 'bg-yellow-50 text-yellow-700';
      case 'in_progress':
        return 'bg-purple-50 text-purple-700';
      case 'completed':
        return 'bg-green-50 text-green-700';
      case 'cancelled':
        return 'bg-red-50 text-red-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'pending':
        return '待接单';
      case 'in_progress':
        return '服务中';
      case 'completed':
        return '已完成';
      case 'cancelled':
        return '已取消';
      default:
        return '未知状态';
    }
  };
  
  return (
    <div className="bg-theme-background min-h-screen text-theme-text">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        
        {/* 陪玩管理内容区域 */}
         <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">欢迎回来，陪玩</h2>
                <p className="text-gray-500">今天是 {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
            
            {/* 数据概览卡片 */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-lg animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">今日订单</p>
                  <div className="flex items-end justify-between">
                    <h3 className="text-2xl font-bold text-gray-900">{stats.todayOrders}</h3>
                    <span className="text-xs text-green-600 flex items-center">
                      <i className="fa-solid fa-arrow-up mr-1"></i> 今日
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">本月收入</p>
                  <div className="flex items-end justify-between">
                    <h3 className="text-2xl font-bold text-gray-900">¥{stats.monthlyIncome}</h3>
                    <span className="text-xs text-green-600 flex items-center">
                      <i className="fa-solid fa-arrow-up mr-1"></i> 本月
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">服务评分</p>
                  <div className="flex items-end justify-between">
                    <h3 className="text-2xl font-bold text-gray-900">{stats.serviceRating}</h3>
                    <span className="text-xs text-gray-500 flex items-center">
                      <i className="fa-solid fa-star mr-1 text-yellow-400"></i> 评分
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">待处理事项</p>
                  <div className="flex items-end justify-between">
                    <h3 className="text-2xl font-bold text-gray-900">{stats.pendingTasks}</h3>
                    <span className="text-xs text-red-600 flex items-center">
                      <i className="fa-solid fa-exclamation-circle mr-1"></i> 待处理
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* 最近订单 */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">最近订单</h3>
                <a href="/player/orders" className="text-sm text-purple-600 hover:text-purple-700">查看全部</a>
              </div>
              
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg animate-pulse">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                          <div>
                            <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                            <div className="h-3 bg-gray-200 rounded w-32"></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                          <div className="h-6 bg-gray-200 rounded w-12"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-500 mb-4">加载订单失败: {error}</p>
                  <button 
                    onClick={loadDashboardData}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    重试
                  </button>
                </div>
              ) : recentOrders.length > 0 ? (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <i className="fa-solid fa-user text-purple-600 text-sm"></i>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{order.userName || '用户'}</p>
                          <p className="text-xs text-gray-500">{order.gameName || '游戏'} • {order.scheduledTime || '时间'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-medium text-gray-900">¥{order.amount}</p>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusStyle(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <i className="fa-solid fa-inbox text-4xl mb-4"></i>
                  <p>暂无订单数据</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}