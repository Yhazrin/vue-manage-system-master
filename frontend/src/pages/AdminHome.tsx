import Header from "@/components/Header";
import { useState, useEffect } from "react"; // 确保导入React钩子
import { toast } from "sonner";

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
  const [recentOrders, setRecentOrders] = useState([]);
  
  // 在这里使用useEffect钩子
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 调用真实API获取数据
        const [statsResponse, ordersResponse] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/orders/recent')
        ]);
        
        if (!statsResponse.ok || !ordersResponse.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const statsData = await statsResponse.json();
        const ordersData = await ordersResponse.json();
        
        setStats(statsData);
        setRecentOrders(ordersData);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" role="status">
            <span className="visually-hidden">加载中...</span>
          </div>
          <p className="mt-2 text-gray-600">正在加载数据...</p>
        </div>
      </div>
    );
  }
  
  // 主页面渲染
  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">管理员首页</h1>
          <p className="text-gray-500">欢迎回来，这里是平台数据概览</p>
        </div>
        
        {/* 数据统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">总用户数</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalUsers.toLocaleString()}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <i className="fa-solid fa-users text-xl"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-500 flex items-center">
                <i className="fa-solid fa-arrow-up mr-1"></i> 12.5%
              </span>
              <span className="text-gray-500 ml-2">较上月</span>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">总订单数</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalOrders.toLocaleString()}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <i className="fa-solid fa-shopping-cart text-xl"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-500 flex items-center">
                <i className="fa-solid fa-arrow-up mr-1"></i> 8.3%
              </span>
              <span className="text-gray-500 ml-2">较上月</span>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">总营收 (元)</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">¥{stats.totalRevenue.toLocaleString()}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                <i className="fa-solid fa-money-bill-wave text-xl"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-500 flex items-center">
                <i className="fa-solid fa-arrow-up mr-1"></i> 18.2%
              </span>
              <span className="text-gray-500 ml-2">较上月</span>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">今日新增用户</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.newUsersToday.toLocaleString()}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                <i className="fa-solid fa-user-plus text-xl"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-500 flex items-center">
                <i className="fa-solid fa-arrow-up mr-1"></i> 5.2%
              </span>
              <span className="text-gray-500 ml-2">较昨日</span>
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
function StatCard({ title, value, icon, color }) {
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
