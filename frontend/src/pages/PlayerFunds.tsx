import { useState, useEffect } from 'react';
import Header from "@/components/Header";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  getFundsOverview, 
  getEarningsTrend, 
  getWithdrawalRecords, 
  requestWithdrawal,
  getRecentEarnings,
  WithdrawalRecord,
  EarningsData,
  FundsOverview,
  RecentEarning
} from '@/services/fundsService';
import { toast } from 'sonner';

// 获取提现状态样式
const getWithdrawalStatusStyle = (status: WithdrawalRecord['status']) => {
  switch(status) {
    case 'pending':
      return { 
        className: 'bg-yellow-50 text-yellow-700', 
        label: '待审核' 
      };
    case 'approved':
      return { 
        className: 'bg-blue-50 text-blue-700', 
        label: '已审核' 
      };
    case 'paid':
      return { 
        className: 'bg-green-50 text-green-700', 
        label: '已打款' 
      };
    case 'rejected':
      return { 
        className: 'bg-red-50 text-red-700', 
        label: '已拒绝' 
      };
    default:
      return { 
        className: 'bg-gray-50 text-gray-700', 
        label: '未知状态' 
      };
  }
};

export default function PlayerFunds() {
  const [fundsOverview, setFundsOverview] = useState<FundsOverview | null>(null);
  const [earningsTrend, setEarningsTrend] = useState<EarningsData[]>([]);
  const [withdrawalRecords, setWithdrawalRecords] = useState<WithdrawalRecord[]>([]);
  const [recentEarnings, setRecentEarnings] = useState<RecentEarning[]>([]);
  const [withdrawalAmount, setWithdrawalAmount] = useState<string>("");
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [overview, trend, records, earnings] = await Promise.all([
        getFundsOverview(),
        getEarningsTrend(),
        getWithdrawalRecords(),
        getRecentEarnings()
      ]);
      
      setFundsOverview(overview);
      setEarningsTrend(trend);
      setWithdrawalRecords(records);
      setRecentEarnings(earnings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载数据失败';
      setError(errorMessage);
      console.error('Error loading funds data:', err);
      
      // 在开发环境下提供默认值
      if (process.env.NODE_ENV === 'development') {
        setFundsOverview({
          availableBalance: 0,
          monthlyEarnings: 0,
          totalWithdrawals: 0,
          withdrawalCount: 0
        });
        setEarningsTrend([]);
        setWithdrawalRecords([]);
        setRecentEarnings([]);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // 处理提现申请
  const handleWithdrawal = async () => {
    if (!withdrawalAmount || isNaN(Number(withdrawalAmount)) || Number(withdrawalAmount) <= 0) {
      toast.error("请输入有效的提现金额");
      return;
    }
    
    const amount = parseFloat(withdrawalAmount);
    if (fundsOverview && amount > fundsOverview.availableBalance) {
      toast.error("提现金额不能超过可用余额");
      return;
    }
    
    if (amount < 100) {
      toast.error("最低提现金额为100元");
      return;
    }
    
    setIsWithdrawing(true);
    
    try {
      const newWithdrawal = await requestWithdrawal(amount);
      setWithdrawalRecords([newWithdrawal, ...withdrawalRecords]);
      setWithdrawalAmount("");
      toast.success("提现申请已提交，请等待审核");
      
      // 重新加载资金概览
      const overview = await getFundsOverview();
      setFundsOverview(overview);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '提现申请失败';
      toast.error(errorMessage);
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-theme-background min-h-screen text-theme-text">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-xl"></div>
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
            <p className="text-red-500 mb-4">加载失败: {error}</p>
            <button 
              onClick={loadData}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              重试
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!fundsOverview) {
    return (
      <div className="bg-theme-background min-h-screen text-theme-text">
        <Header />
        <main className="container mx-auto px-4 py-6 text-center">
          <p className="text-red-500">错误：无法加载资金数据。</p>
        </main>
      </div>
    );
  }
  
  return (
     <div className="bg-theme-background min-h-screen text-theme-text">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">资金与提现</h1>
          <p className="text-gray-500">管理您的收益和提现</p>
        </div>
        
        {/* 资金概览卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100 p-5">
            <p className="text-sm text-gray-500 mb-1">可用余额</p>
            <div className="flex items-end justify-between">
              <h3 className="text-2xl font-bold text-gray-900">¥{fundsOverview?.availableBalance.toFixed(2) || '0.00'}</h3>
              <button 
                onClick={() => setActiveTab('withdraw')}
                className="py-1 px-3 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                提现
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3">可提现至您绑定的收款账户</p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100 p-5">
            <p className="text-sm text-gray-500 mb-1">本月收益</p>
            <h3 className="text-2xl font-bold text-gray-900">¥{fundsOverview?.monthlyEarnings.toFixed(2) || '0.00'}</h3>
            <p className="text-xs text-green-600 mt-3 flex items-center">
              <i className="fa-arrow-up mr-1"></i> 较上月增长 12.5%
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl border border-green-100 p-5">
            <p className="text-sm text-gray-500 mb-1">累计提现</p>
            <h3 className="text-2xl font-bold text-gray-900">¥{fundsOverview?.totalWithdrawals.toFixed(2) || '0.00'}</h3>
            <p className="text-xs text-gray-500 mt-3">共 {fundsOverview?.withdrawalCount || 0} 笔提现记录</p>
          </div>
        </div>
        
        {/* 功能标签页 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="border-b border-gray-100">
            <div className="flex">
              <button
                onClick={() => setActiveTab("overview")}
                className={cn(
                  "py-3 px-6 text-sm font-medium transition-colors",
                  activeTab === "overview" 
                    ? "text-purple-600 border-b-2 border-purple-600" 
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                资金概览
              </button>
              <button
                onClick={() => setActiveTab("withdraw")}
                className={cn(
                  "py-3 px-6 text-sm font-medium transition-colors",
                  activeTab === "withdraw" 
                    ? "text-purple-600 border-b-2 border-purple-600" 
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                提现申请
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={cn(
                  "py-3 px-6 text-sm font-medium transition-colors",
                  activeTab === "history" 
                    ? "text-purple-600 border-b-2 border-purple-600" 
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                提现历史
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {/* 资金概览标签内容 */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">收益趋势</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={earningsTrend}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '12px', 
                            border: 'none', 
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' 
                          }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="earnings" 
                          stroke="#9333ea" 
                          strokeWidth={2}
                          dot={{ r: 4, fill: "#9333ea" }}
                          activeDot={{ r: 6, fill: "#9333ea" }}
                          name="收益 (¥)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">最近订单收益</h3>
                  <div className="space-y-3">
                    {recentEarnings.length > 0 ? (
                      recentEarnings.map((earning, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                              <i className="fa-gamepad"></i>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{earning.gameName || '游戏陪玩'}</p>
                              <p className="text-xs text-gray-500">{earning.date}</p>
                            </div>
                          </div>
                          <p className="font-medium text-gray-900">+¥{earning.amount.toFixed(2)}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>暂无收益记录</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* 提现申请标签内容 */}
            {activeTab === "withdraw" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">提现申请</h3>
                  <p className="text-sm text-gray-500">将您的收益提现至绑定的收款账户</p>
                </div>
                
                <div className="bg-gray-50 p-5 rounded-lg">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">提现金额 (元)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">¥</span>
                      <input
                        type="number"
                        value={withdrawalAmount}
                        onChange={(e) => setWithdrawalAmount(e.target.value)}
                        placeholder="请输入提现金额"
                        className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      最低提现金额：100元，当前可用余额：¥{fundsOverview?.availableBalance.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">收款账户</h4>
                    <div className="flex items-center p-3 bg-white border border-gray-200 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3">
                        <i className="fa-qrcode"></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">微信支付 (张三)</p>
                        <p className="text-xs text-gray-500">点击更换收款账户</p>
                      </div>
                      <i className="fa-angle-right text-gray-400"></i>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleWithdrawal}
                    disabled={isWithdrawing}
                    className="w-full py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isWithdrawing ? '提交中...' : '确认提现'}
                  </button>
                  
                  <div className="mt-4 text-xs text-gray-500 text-center">
                    <p>提现申请提交后，将在1-3个工作日内处理</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* 提现历史标签内容 */}
            {activeTab === "history" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">提现历史</h3>
                  <p className="text-sm text-gray-500">查看您的所有提现记录</p>
                </div>
                
                <div className="space-y-4">
                  {withdrawalRecords.map(record => {
                    const statusInfo = getWithdrawalStatusStyle(record.status);
                    return (
                      <div key={record.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">¥{record.amount.toFixed(2)}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">订单号: {record.id}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{record.date}</p>
                          <p className="text-xs text-gray-500">预计到账时间: {record.status === 'pending' ? '审核后1-3个工作日' : '已完成'}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}