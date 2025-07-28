import Header from "@/components/Header";
import { useState, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useApi } from '@/hooks/useApi';
import { toast } from 'sonner';

// 定义统计数据接口
interface StatisticsData {
  orderStatistics: {
    totalOrders: number;
    totalAmount: number;
    totalWithdrawals: number;
    totalCommission: number;
  };
  orderData: Array<{ name: string; orders: number; amount: number }>;
  topUsers: Array<{ name: string; orders: number; amount: number }>;
  topPlayers: Array<{ name: string; orders: number; earnings: number }>;
  revenueData: Array<{ name: string; value: number }>;
}

// 获取统计数据
const fetchStatisticsData = async (): Promise<StatisticsData> => {
  const response = await fetch('/api/admin/statistics');
  
  if (!response.ok) {
    throw new Error('Failed to fetch statistics data');
  }
  
  return response.json();
};

// 饼图颜色
const COLORS = ['#9333ea', '#3b82f6', '#10b981'];

export default function AdminStatistics() {
  const [dateRange, setDateRange] = useState('month');
  const [orderSort, setOrderSort] = useState('orders');
  const [playerSort, setPlayerSort] = useState('earnings');
  const { data: stats, loading, error, execute: fetchStats } = useApi<StatisticsData>();
  
  // 获取统计数据
  useEffect(() => {
    fetchStats(fetchStatisticsData).catch(err => {
      toast.error('获取统计数据失败', {
        description: err instanceof Error ? err.message : '请稍后重试'
      });
    });
  }, [fetchStats]);
  
  // 导出报表功能
  const exportReport = (format: 'csv' | 'xls') => {
    fetch(`/api/admin/statistics/export?format=${format}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then(response => {
      if (!response.ok) throw new Error('导出失败');
      return response.blob();
    })
    .then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `statistics-report-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('报表导出成功');
    })
    .catch(err => {
      toast.error('导出报表失败', {
        description: err instanceof Error ? err.message : '请稍后重试'
      });
    });
  };
  
  if (loading) {
    return (
      <div className="bg-theme-background min-h-screen text-theme-text flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" role="status">
            <span className="visually-hidden">加载中...</span>
          </div>
          <p className="mt-2 text-gray-600">正在加载统计数据...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-theme-background min-h-screen text-theme-text">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="bg-red-50 border border-red-100 rounded-lg p-6 text-center">
            <i className="fa-solid fa-exclamation-circle text-red-500 text-3xl mb-4"></i>
            <h3 className="text-xl font-semibold text-red-900 mb-2">加载统计数据失败</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => fetchStats(fetchStatisticsData)}
              className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              <i className="fa-solid fa-refresh mr-2"></i>重试
            </button>
          </div>
        </main>
      </div>
    );
  }
  
  const { orderStatistics, orderData, topUsers, topPlayers, revenueData } = stats || {
    orderStatistics: { totalOrders: 0, totalAmount: 0, totalWithdrawals: 0, totalCommission: 0 },
    orderData: [],
    topUsers: [],
    topPlayers: [],
    revenueData: []
  };
  
  // 计算总收入
  const totalRevenue = revenueData.reduce((sum, item) => sum + item.value, 0);
  
  return (
   <div className="bg-theme-background min-h-screen text-theme-text">
    <Header />
    
    <main className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">统计分析</h1>
        <p className="text-gray-500">按时间区间进行查询和分析平台数据</p>
      </div>
      
      {/* 时间区间选择和导出 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">时间区间</label>
              <select 
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="week">近7天</option>
                <option value="month">近30天</option>
                <option value="quarter">近90天</option>
                <option value="year">近一年</option>
                <option value="custom">自定义</option>
              </select>
            </div>
            
            {dateRange === 'custom' && (
              <div className="flex gap-2">
                <input 
                  type="date" 
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <span className="flex items-center text-gray-500">至</span>
                <input 
                  type="date" 
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => exportReport('csv')}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              <i className="fa-solid fa-download mr-2"></i>导出CSV
            </button>
            <button 
              onClick={() => exportReport('xls')}
              className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              <i className="fa-solid fa-file-excel mr-2"></i>导出XLS
            </button>
          </div>
        </div>
      </div>
      
      {/* 订单明细统计 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">订单明细统计</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 p-5 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">订单总量</p>
              <p className="text-2xl font-bold text-gray-900">{orderStatistics.totalOrders.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 p-5 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">总下单金额</p>
              <p className="text-2xl font-bold text-gray-900">¥{orderStatistics.totalAmount.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 p-5 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">总提现金额</p>
              <p className="text-2xl font-bold text-gray-900">¥{orderStatistics.totalWithdrawals.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">总佣金: ¥{orderStatistics.totalCommission.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="orders" fill="#9333ea" radius={[4, 4, 0, 0]} name="订单量" />
                <Bar yAxisId="right" dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} name="订单金额" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* 用户/陪玩排行榜 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">用户排行榜</h3>
              <select 
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={orderSort}
                onChange={(e) => setOrderSort(e.target.value)}
              >
                <option value="orders">按订单量</option>
                <option value="amount">按消费金额</option>
              </select>
            </div>
            
            {topUsers.length > 0 ? (
              <div className="space-y-4">
                {topUsers.map((user, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-medium text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">{user.name}</h4>
                        <p className="text-xs text-gray-500">订单数: {user.orders} | 消费: ¥{user.amount.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="font-bold text-gray-900">
                      {orderSort === 'orders' ? user.orders : `¥${user.amount.toLocaleString()}`}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <i className="fa-solid fa-users text-2xl mb-2"></i>
                <p>暂无用户数据</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">陪玩排行榜</h3>
              <select 
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={playerSort}
                onChange={(e) => setPlayerSort(e.target.value)}
              >
                <option value="orders">按订单量</option>
                <option value="earnings">按收入</option>
              </select>
            </div>
            
            {topPlayers.length > 0 ? (
              <div className="space-y-4">
                {topPlayers.map((player, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-medium text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">{player.name}</h4>
                        <p className="text-xs text-gray-500">订单数: {player.orders} | 收入: ¥{player.earnings.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="font-bold text-gray-900">
                      {playerSort === 'orders' ? player.orders : `¥${player.earnings.toLocaleString()}`}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <i className="fa-solid fa-user-tie text-2xl mb-2"></i>
                <p>暂无陪玩数据</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 平台收益分析 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">平台收益分析</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {revenueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div>
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">总收益: ¥{totalRevenue.toLocaleString()}</h4>
                  
                  <div className="space-y-4">
                    {revenueData.map((item, index) => (
                      <div key={index}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700">{item.name}</span>
                          <span className="text-sm font-medium text-gray-900">¥{item.value.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full" 
                            style={{ 
                              width: `${(item.value / totalRevenue) * 100}%`,
                              backgroundColor: COLORS[index % COLORS.length]
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">收益趋势</h4>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={orderData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="amount" stroke="#9333ea" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
   </div>
  );
}
