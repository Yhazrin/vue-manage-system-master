import Header from "@/components/Header";
import { useState, useEffect } from "react"; // 确保导入React钩子
import { toast } from "sonner";
import { API_BASE_URL } from '@/config/api';

// 定义订单接口
interface RecentOrder {
  id: string;
  user: string;
  amount: number;
  status: string;
  date: string;
}

// 所有的状态和钩子必须在组件内部定义
export default function AdminHome() {
  // 在这里定义所有状态
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    newUsersToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  
  // 在这里使用useEffect钩子
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 调用真实API获取数据
        const [statsResponse, ordersResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/statistics/global`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }),
          fetch(`${API_BASE_URL}/orders?limit=10&sort=created_at&order=desc`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
        ]);
        
        if (!statsResponse.ok || !ordersResponse.ok) {
          throw new Error('API请求失败');
        }
        
        const statsData = await statsResponse.json();
        const ordersData = await ordersResponse.json();
        
        // 映射统计数据
        setStats({
          totalUsers: statsData.totalUsers || 0,
          totalOrders: statsData.totalOrders || 0,
          totalRevenue: statsData.totalRevenue || 0,
          newUsersToday: statsData.newUsersToday || 0
        });
        
        // 映射订单数据
        const orders = ordersData.orders || ordersData || [];
        const mappedOrders: RecentOrder[] = orders.map((order: any) => ({
          id: order.id || order.order_id || '',
          user: order.userNickname || order.user || order.username || '未知用户',
          amount: Number(order.amount || order.price || 0),
          status: order.status || '未知',
          date: order.orderTime || order.created_at || order.date || new Date().toISOString().split('T')[0]
        }));
        setRecentOrders(mappedOrders);
      } catch (error) {
        console.error('数据加载失败:', error);
        toast.error('获取数据失败');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // 加载状态显示
  if (loading) {
    return (
      <div className="bg-theme-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-theme-primary border-t-transparent rounded-full" role="status">
            <span className="sr-only">加载中...</span>
          </div>
          <p className="mt-2 text-theme-text/70">正在加载数据...</p>
        </div>
      </div>
    );
  }
  
  // 主页面渲染
  return (
    <div className="bg-theme-background min-h-screen text-theme-text">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-theme-text mb-2">管理员控制台</h1>
          <p className="text-theme-text/70">欢迎回来，这里是平台数据概览</p>
        </div>
        
        {/* 数据统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-theme-text/70">总用户数</p>
                <h3 className="text-2xl font-bold text-theme-text mt-1">{stats.totalUsers.toLocaleString()}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                <i className="fa-solid fa-users text-xl"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-500 flex items-center">
                <i className="fa-solid fa-arrow-up mr-1"></i> 12.5%
              </span>
              <span className="text-theme-text/60 ml-2">较上月</span>
            </div>
          </div>
          <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-theme-text/70">总订单数</p>
                <h3 className="text-2xl font-bold text-theme-text mt-1">{stats.totalOrders.toLocaleString()}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                <i className="fa-solid fa-shopping-cart text-xl"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-500 flex items-center">
                <i className="fa-solid fa-arrow-up mr-1"></i> 8.3%
              </span>
              <span className="text-theme-text/60 ml-2">较上月</span>
            </div>
          </div>
          <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-theme-text/70">总营收 (元)</p>
                <h3 className="text-2xl font-bold text-theme-text mt-1">¥{stats.totalRevenue.toLocaleString()}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                <i className="fa-solid fa-money-bill-wave text-xl"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-500 flex items-center">
                <i className="fa-solid fa-arrow-up mr-1"></i> 18.2%
              </span>
              <span className="text-theme-text/60 ml-2">较上月</span>
            </div>
          </div>
          <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-theme-text/70">今日新增用户</p>
                <h3 className="text-2xl font-bold text-theme-text mt-1">{stats.newUsersToday.toLocaleString()}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                <i className="fa-solid fa-user-plus text-xl"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-500 flex items-center">
                <i className="fa-solid fa-arrow-up mr-1"></i> 5.2%
              </span>
              <span className="text-theme-text/60 ml-2">较昨日</span>
            </div>
          </div>
        </div>
        
        {/* 最近订单表格 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">最近订单</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">订单ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额 (元)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.user}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">¥{order.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        order.status === '已完成' ? 'bg-green-100 text-green-800' : 
                        order.status === '处理中' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

// 统计卡片组件（必须在主组件外部或作为独立组件定义）
interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{value.toLocaleString()}</h3>
        </div>
        <div className={`${color} p-3 rounded-lg text-white`}>
          <i className={`fa ${icon} text-xl`}></i>
        </div>
      </div>
      <div className="mt-4 flex items-center text-sm">
        <span className="text-green-500 flex items-center">
          <i className="fa fa-arrow-up mr-1"></i> 12.5%
        </span>
        <span className="text-gray-500 ml-2">较上月</span>
      </div>
    </div>
  );
}
