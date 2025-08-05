import Header from "@/components/Header";
import { useState, useContext, useEffect } from "react";
import { AuthContext } from '@/contexts/authContext';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useApi } from '@/hooks/useApi';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/api';
import { useNavigate } from 'react-router-dom';
import { getCommissionRate, updateCommissionRate, getCommissionRates, updateCommissionRates, getTrendData } from '../services/configService';

// 定义数据概览接口
interface OverviewData {
  totalOrders: number;
  totalRevenue: number;
  withdrawalRequests: number;
  withdrawalAmount: number;
  giftTypes: number;
  giftRevenue: number;
  activePlayers: number;
  totalUsers: number;
  trendData: Array<{ date: string; orders: number; revenue: number; players: number; users: number }>;
  revenueData: Array<{ name: string; value: number }>;
}

// 获取数据概览
const fetchOverviewData = async (timeRange: string = 'month'): Promise<OverviewData> => {
  try {
    // 并行获取全局统计数据和趋势数据
    const [globalResponse, trendResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/statistics/global?timeRange=${timeRange}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }),
      getTrendData(timeRange, getPeriodsForTimeRange(timeRange))
    ]);
    
    if (!globalResponse.ok) {
      throw new Error(`HTTP ${globalResponse.status}: ${globalResponse.statusText}`);
    }
    
    const result = await globalResponse.json();
    
    // 将后端返回的统计数据映射为概览数据格式
    if (result.success && result.global) {
      const globalData = result.global;
      // 修复趋势数据获取逻辑
      const trendData = trendResponse.success ? trendResponse.trends || [] : [];
      
      return {
        totalOrders: globalData.total_orders || 0,
        totalRevenue: globalData.total_revenue || 0,
        withdrawalRequests: globalData.total_withdrawal_requests || 0, // 提现记录数量
        withdrawalAmount: globalData.total_withdrawn || 0, // 提现总金额
        giftTypes: globalData.total_gift_types || 0, // 使用后端返回的真实礼物类型数量
        giftRevenue: globalData.total_gift_amount || 0,
        activePlayers: globalData.total_players || 0,
        totalUsers: globalData.total_users || 0,
        trendData,
        revenueData: [
          { name: '订单抽成', value: parseFloat(globalData.order_platform_fee) || 0 },
          { name: '礼物抽成', value: parseFloat(globalData.gift_platform_fee) || 0 },
          { name: '提现手续费', value: parseFloat(globalData.withdraw_platform_fee) || 0 }
        ]
      };
    }
    
    throw new Error('服务器返回数据格式错误');
  } catch (error) {
    console.error('Error fetching overview data:', error);
    throw error; // 不再返回模拟数据，直接抛出错误让上层处理
  }
};

// 根据时间范围获取对应的时间段数量
const getPeriodsForTimeRange = (range: string): number => {
  switch (range) {
    case 'day': return 24; // 24小时
    case 'week': return 7; // 7天
    case 'month': return 30; // 30天
    case 'year': return 12; // 12个月
    default: return 7;
  }
}

export default function AdminOverview() {
  const { userRole } = useContext(AuthContext);
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('month');
  const { data: stats, loading, error, execute: fetchStats } = useApi<OverviewData>();
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [commissionRate, setCommissionRate] = useState<number>(15);
  const [newCommissionRate, setNewCommissionRate] = useState<string>('');
  const [orderCommissionRate, setOrderCommissionRate] = useState<number>(15);
  const [giftCommissionRate, setGiftCommissionRate] = useState<number>(15);
  const [newOrderCommissionRate, setNewOrderCommissionRate] = useState<string>('');
  const [newGiftCommissionRate, setNewGiftCommissionRate] = useState<string>('');
  
  // 获取统计数据
  useEffect(() => {
    fetchStats(() => fetchOverviewData(timeRange)).catch(err => {
      toast.error('获取数据概览失败', {
        description: err instanceof Error ? err.message : '请稍后重试'
      });
    });
    fetchCommissionRate();
  }, [fetchStats, timeRange]);

  // 获取平台提成率
  const fetchCommissionRate = async () => {
    try {
      const rate = await getCommissionRate();
      setCommissionRate(rate);
      
      // 同时获取分别的抽成率
      const rates = await getCommissionRates();
      setOrderCommissionRate(rates.order_commission_rate);
      setGiftCommissionRate(rates.gift_commission_rate);
    } catch (err) {
      console.error('获取平台提成率失败:', err);
    }
  };

  // 更新平台提成率
  const updateCommissionRateHandler = async () => {
    try {
      const rate = parseFloat(newCommissionRate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        toast.error('请输入有效的提成率（0-100）');
        return;
      }

      await updateCommissionRate(rate);
      setCommissionRate(rate);
      setShowCommissionModal(false);
      setNewCommissionRate('');
      toast.success('平台提成率更新成功');
    } catch (err) {
      console.error('更新平台提成率失败:', err);
      toast.error('更新失败');
    }
  };

  // 更新分别的抽成率
  const updateCommissionRatesHandler = async () => {
    try {
      const orderRate = parseFloat(newOrderCommissionRate);
      const giftRate = parseFloat(newGiftCommissionRate);
      
      if (isNaN(orderRate) || orderRate < 0 || orderRate > 100) {
        toast.error('请输入有效的订单抽成率（0-100）');
        return;
      }
      
      if (isNaN(giftRate) || giftRate < 0 || giftRate > 100) {
        toast.error('请输入有效的礼物抽成率（0-100）');
        return;
      }

      await updateCommissionRates({
        order_commission_rate: orderRate,
        gift_commission_rate: giftRate
      });
      
      setOrderCommissionRate(orderRate);
      setGiftCommissionRate(giftRate);
      setShowCommissionModal(false);
      setNewOrderCommissionRate('');
      setNewGiftCommissionRate('');
      toast.success('抽成率更新成功');
    } catch (err) {
      console.error('更新抽成率失败:', err);
      toast.error('更新失败');
    }
  };

  // 卡片点击跳转
  const handleCardClick = (cardType: string) => {
    switch (cardType) {
      case 'orders':
        navigate('/admin/orders');
        break;
      case 'users':
        navigate('/admin/users');
        break;
      case 'gifts':
        navigate('/admin/gifts');
        break;
      case 'withdrawals':
        navigate('/admin/withdrawals');
        break;
      case 'games':
        navigate('/admin/games');
        break;
      case 'platform-settings':
        setShowCommissionModal(true);
        break;
      default:
        break;
    }
  };
  
  // 判断是否为股东账号
  const isShareholder = userRole === 'admin';
  
  if (loading) {
    return (
      <div className="bg-theme-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-theme-primary border-t-transparent rounded-full" role="status">
            <span className="sr-only">加载中...</span>
          </div>
          <p className="mt-2 text-theme-text/70">正在加载数据概览...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-theme-background min-h-screen text-theme-text">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="bg-theme-error/10 border border-theme-error/20 rounded-lg p-6 text-center">
            <i className="fa-solid fa-exclamation-circle text-theme-error text-3xl mb-4"></i>
            <h3 className="text-xl font-semibold text-theme-text mb-2">加载数据概览失败</h3>
            <p className="text-theme-text/70 mb-4">{error}</p>
            <button 
              onClick={() => fetchStats(() => fetchOverviewData(timeRange))}
              className="px-4 py-2 bg-theme-primary text-white font-medium rounded-lg hover:bg-theme-primary/80 transition-colors"
            >
              <i className="fa-solid fa-refresh mr-2"></i>重试
            </button>
          </div>
        </main>
      </div>
    );
  }
  
  const overviewData = stats || {
    totalOrders: 0,
    totalRevenue: 0,
    withdrawalRequests: 0,
    withdrawalAmount: 0,
    giftTypes: 0,
    giftRevenue: 0,
    activePlayers: 0,
    totalUsers: 0,
    trendData: [],
    revenueData: []
  };
  
  return (
    <div className="bg-theme-background min-h-screen text-theme-text">
      <Header />
      
      <main className="container mx-auto px-4 py-4">
        
        {/* 关键指标卡片 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div 
            onClick={() => handleCardClick('orders')}
            className="bg-theme-surface rounded-xl shadow-sm border border-theme-border p-4 cursor-pointer hover:shadow-md hover:border-theme-primary/30 transition-all duration-200 group"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-theme-text/70">订单记录</p>
                <h3 className="text-2xl font-bold text-theme-text mt-1">{overviewData.totalOrders.toLocaleString()}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-theme-primary/10 flex items-center justify-center text-theme-primary group-hover:bg-theme-primary/20 transition-colors">
                <i className="fa-solid fa-file-invoice text-lg"></i>
              </div>
            </div>
            <div className="flex items-center text-sm text-theme-text/60">
              <i className="fa-solid fa-arrow-up-right mr-1"></i>
              点击查看详情
            </div>
          </div>
          
          <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-theme-text/70">流水记录</p>
                <h3 className="text-2xl font-bold text-theme-text mt-1">¥{overviewData.totalRevenue.toLocaleString()}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-theme-accent/10 flex items-center justify-center text-theme-accent">
                <i className="fa-solid fa-money-bill-wave text-lg"></i>
              </div>
            </div>
            <div className="flex items-center text-sm text-theme-success">
              <i className="fa-solid fa-arrow-up mr-1"></i>
              +12.5% 较上期
            </div>
          </div>
          
          <div 
            onClick={() => handleCardClick('withdrawals')}
            className="bg-theme-surface rounded-xl shadow-sm border border-theme-border p-4 cursor-pointer hover:shadow-md hover:border-theme-success/30 transition-all duration-200 group"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-theme-text/70">提现总额</p>
                <h3 className="text-2xl font-bold text-theme-text mt-1">¥{overviewData.withdrawalAmount.toLocaleString()}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-theme-success/10 flex items-center justify-center text-theme-success group-hover:bg-theme-success/20 transition-colors">
                <i className="fa-solid fa-money-bill-transfer text-lg"></i>
              </div>
            </div>
            <div className="flex items-center text-sm text-theme-text/60">
              <i className="fa-solid fa-arrow-up-right mr-1"></i>
              点击查看详情 ({overviewData.withdrawalRequests}条记录)
            </div>
          </div>
          
          <div 
            onClick={() => handleCardClick('gifts')}
            className="bg-theme-surface rounded-xl shadow-sm border border-theme-border p-4 cursor-pointer hover:shadow-md hover:border-theme-accent/30 transition-all duration-200 group"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-theme-text/70">礼物记录</p>
                <h3 className="text-xl font-bold text-theme-text mt-1">{overviewData.giftTypes}种 / ¥{overviewData.giftRevenue.toLocaleString()}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-theme-accent/10 flex items-center justify-center text-theme-accent group-hover:bg-theme-accent/20 transition-colors">
                <i className="fa-solid fa-gift text-lg"></i>
              </div>
            </div>
            <div className="flex items-center text-sm text-theme-text/60">
              <i className="fa-solid fa-arrow-up-right mr-1"></i>
              点击查看详情
            </div>
          </div>
        </div>
        
        {/* 第二行指标卡片 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div 
            onClick={() => handleCardClick('users')}
            className="bg-theme-surface rounded-xl shadow-sm border border-theme-border p-4 cursor-pointer hover:shadow-md hover:border-theme-accent/30 transition-all duration-200 group"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-theme-text/70">陪玩列表</p>
                <h3 className="text-2xl font-bold text-theme-text mt-1">{overviewData.activePlayers.toLocaleString()}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-theme-accent/10 flex items-center justify-center text-theme-accent group-hover:bg-theme-accent/20 transition-colors">
                <i className="fa-solid fa-user-tie text-lg"></i>
              </div>
            </div>
            <div className="flex items-center text-sm text-theme-text/60">
              <i className="fa-solid fa-arrow-up-right mr-1"></i>
              点击查看详情
            </div>
          </div>
          
          <div 
            onClick={() => handleCardClick('users')}
            className="bg-theme-surface rounded-xl shadow-sm border border-theme-border p-4 cursor-pointer hover:shadow-md hover:border-theme-primary/30 transition-all duration-200 group"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-theme-text/70">用户列表</p>
                <h3 className="text-2xl font-bold text-theme-text mt-1">{overviewData.totalUsers.toLocaleString()}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-theme-primary/10 flex items-center justify-center text-theme-primary group-hover:bg-theme-primary/20 transition-colors">
                <i className="fa-solid fa-users text-lg"></i>
              </div>
            </div>
            <div className="flex items-center text-sm text-theme-text/60">
              <i className="fa-solid fa-arrow-up-right mr-1"></i>
              点击查看详情
            </div>
          </div>
          
          {/* 平台收益率指标 */}
          <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-theme-text/70">平台收益率</p>
                <h3 className="text-2xl font-bold text-theme-text mt-1">
                  {overviewData.totalRevenue > 0 
                    ? ((overviewData.revenueData.reduce((sum, item) => sum + item.value, 0)) / overviewData.totalRevenue * 100).toFixed(1)
                    : '0.0'
                  }%
                </h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-theme-success/10 flex items-center justify-center text-theme-success">
                <i className="fa-solid fa-percentage text-lg"></i>
              </div>
            </div>
            <div className="flex items-center text-sm text-theme-success">
              <i className="fa-solid fa-chart-line mr-1"></i>
              利润率指标
            </div>
          </div>
          
          {/* 用户活跃度指标 */}
          <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-theme-text/70">用户活跃度</p>
                <h3 className="text-2xl font-bold text-theme-text mt-1">
                  {overviewData.totalUsers > 0 
                    ? (overviewData.totalOrders / overviewData.totalUsers).toFixed(1)
                    : '0.0'
                  }
                </h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-theme-accent/10 flex items-center justify-center text-theme-accent">
                <i className="fa-solid fa-chart-simple text-lg"></i>
              </div>
            </div>
            <div className="flex items-center text-sm text-theme-text/60">
              <i className="fa-solid fa-calculator mr-1"></i>
              订单/用户比
            </div>
          </div>
        </div>
        
        {/* 平台收益详细分析卡片（仅股东可见） */}
        {isShareholder && (
          <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold text-theme-text">平台收益分析</h3>
                <div className="flex items-center space-x-2 text-sm text-theme-text/60">
                  <i className="fa-solid fa-coins"></i>
                  <span>提成率: {commissionRate}%</span>
                </div>
              </div>
              <button
                onClick={() => setShowCommissionModal(true)}
                className="px-4 py-2 bg-theme-primary text-white rounded-lg hover:bg-theme-primary/80 transition-colors text-sm"
              >
                <i className="fa-solid fa-cog mr-2"></i>
                调整提成率
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* 收益构成饼图 */}
              <div>
                <h4 className="text-md font-medium text-theme-text/70 mb-3">平台抽成构成</h4>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={overviewData.revenueData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {overviewData.revenueData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['var(--theme-primary)', 'var(--theme-success)', 'var(--theme-accent)'][index % 3]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`¥${Number(value).toLocaleString()}`, '金额']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* 收益详情统计 */}
              <div className="space-y-3">
                <h4 className="text-md font-medium text-theme-text/70 mb-3">抽成详情统计</h4>
                
                {overviewData.revenueData.map((item, index) => {
                  const colors = ['bg-theme-primary', 'bg-theme-success', 'bg-theme-accent'];
                  const totalPlatformProfit = overviewData.revenueData.reduce((sum, item) => sum + item.value, 0);
                  const percentage = totalPlatformProfit > 0 ? (item.value / totalPlatformProfit * 100) : 0;
                  
                  return (
                    <div key={item.name} className="bg-theme-background rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${colors[index]}`}></div>
                          <span className="text-theme-text font-medium">{item.name}</span>
                        </div>
                        <span className="text-theme-text font-bold">¥{item.value.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-theme-text/60">
                        <span>占平台抽成比例</span>
                        <span>{percentage.toFixed(1)}%</span>
                      </div>
                      <div className="mt-2 bg-theme-border rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${colors[index]}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
                

              </div>
            </div>
          </div>
        )}
        
        {/* 趋势图 */}
        <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border overflow-hidden">
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold text-theme-text">平台趋势分析</h3>
                <div className="flex items-center space-x-2 text-sm text-theme-text/60">
                  <i className="fa-solid fa-chart-line"></i>
                  <span>实时数据</span>
                </div>
              </div>
              {/* 时间范围选择器 */}
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setTimeRange('day')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${timeRange === 'day' ? 'bg-theme-primary text-white' : 'bg-theme-surface text-theme-text hover:bg-theme-primary/10'}`}
                >
                  日
                </button>
                <button 
                  onClick={() => setTimeRange('week')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${timeRange === 'week' ? 'bg-theme-primary text-white' : 'bg-theme-surface text-theme-text hover:bg-theme-primary/10'}`}
                >
                  周
                </button>
                <button 
                  onClick={() => setTimeRange('month')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${timeRange === 'month' ? 'bg-theme-primary text-white' : 'bg-theme-surface text-theme-text hover:bg-theme-primary/10'}`}
                >
                  月
                </button>
                <button 
                  onClick={() => setTimeRange('year')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${timeRange === 'year' ? 'bg-theme-primary text-white' : 'bg-theme-surface text-theme-text hover:bg-theme-primary/10'}`}
                >
                  年
                </button>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={overviewData.trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--theme-border)" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--theme-text-secondary)' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--theme-text-secondary)' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'var(--theme-surface)',
                      border: '1px solid var(--theme-border)',
                      borderRadius: '8px',
                      color: 'var(--theme-text)'
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="orders" stroke="var(--theme-primary)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="订单量" />
                  <Line type="monotone" dataKey="revenue" stroke="var(--theme-accent)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="流水(千元)" />
                  <Line type="monotone" dataKey="players" stroke="var(--theme-warning)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="陪玩数" />
                  <Line type="monotone" dataKey="users" stroke="var(--theme-success)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="用户数" />
                  <Line type="monotone" dataKey="gifts" stroke="var(--theme-error)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="礼物数" />
                  <Line type="monotone" dataKey="gift_revenue" stroke="var(--theme-info)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="礼物收入(千元)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        

      </main>

      {/* 平台提成设置模态框 */}
      {showCommissionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-theme-surface rounded-lg p-6 w-full max-w-lg mx-4 border border-theme-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-theme-text">平台提成设置</h3>
              <button
                onClick={() => setShowCommissionModal(false)}
                className="text-theme-text/70 hover:text-theme-text"
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            
            <div className="mb-4">
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div className="text-sm text-theme-text/70">
                  当前订单抽成率: <span className="font-semibold text-theme-primary">{orderCommissionRate || 0}%</span>
                </div>
                <div className="text-sm text-theme-text/70">
                  当前礼物抽成率: <span className="font-semibold text-theme-accent">{giftCommissionRate || 0}%</span>
                </div>
              </div>
              <p className="text-xs text-theme-text/50">抽成率将应用于所有新的订单、提现和礼物交易</p>
            </div>
            
            {/* 利润计算公式说明 */}
            <div className="bg-gradient-to-r from-theme-primary/10 to-theme-accent/10 rounded-lg p-4 border border-theme-primary/20 mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <i className="fa-solid fa-calculator text-theme-primary"></i>
                <span className="text-sm font-medium text-theme-text">利润计算公式</span>
              </div>
              <div className="text-xs text-theme-text/70 space-y-1">
                <div>• 订单抽成 = 订单收入 × {newOrderCommissionRate || orderCommissionRate || 0}%</div>
                <div>• 礼物抽成 = 礼物收入 × {newGiftCommissionRate || giftCommissionRate || 0}%</div>
                <div>• 提现手续费 = 基于订单收入计算</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-theme-text mb-2">
                  <i className="fa-solid fa-shopping-cart text-theme-primary mr-1"></i>
                  订单抽成率 (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={newOrderCommissionRate}
                  onChange={(e) => setNewOrderCommissionRate(e.target.value)}
                  className="w-full px-3 py-2 border border-theme-border rounded-md focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent bg-theme-background text-theme-text"
                  placeholder={orderCommissionRate?.toString() || '0'}
                />
                <p className="text-xs text-theme-text/50 mt-1">范围: 0-100</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-theme-text mb-2">
                  <i className="fa-solid fa-gift text-theme-accent mr-1"></i>
                  礼物抽成率 (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={newGiftCommissionRate}
                  onChange={(e) => setNewGiftCommissionRate(e.target.value)}
                  className="w-full px-3 py-2 border border-theme-border rounded-md focus:outline-none focus:ring-2 focus:ring-theme-accent focus:border-transparent bg-theme-background text-theme-text"
                  placeholder={giftCommissionRate?.toString() || '0'}
                />
                <p className="text-xs text-theme-text/50 mt-1">范围: 0-100</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCommissionModal(false)}
                className="px-4 py-2 text-theme-text border border-theme-border rounded-md hover:bg-theme-background transition-colors"
              >
                取消
              </button>
              <button
                onClick={updateCommissionRatesHandler}
                className="px-4 py-2 bg-theme-primary text-white rounded-md hover:bg-theme-primary/80 transition-colors"
              >
                确认更新
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}