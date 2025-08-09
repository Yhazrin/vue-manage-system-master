import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { AuthContext } from '@/contexts/authContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import { WithdrawalStatusUpdate } from '@/services/websocketService';
import { getWithdrawalStatusStyle, getWithdrawalStatusMessage, WithdrawalStatus } from '@/utils/withdrawalStatus';

export default function PlayerFunds() {
  const { isAuthenticated, userRole, user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [fundsOverview, setFundsOverview] = useState<FundsOverview>({
    availableBalance: 0,
    monthlyEarnings: 0,
    totalWithdrawals: 0,
    withdrawalCount: 0
  });
  const [earningsTrend, setEarningsTrend] = useState([]);
  const [withdrawalRecords, setWithdrawalRecords] = useState([]);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentEarnings, setRecentEarnings] = useState<RecentEarning[]>([]);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // WebSocket实时同步
  const { connect, disconnect } = useWebSocket({
    onWithdrawalStatusUpdate: (data: WithdrawalStatusUpdate) => {
      console.log('陪玩收到提现状态更新:', data);
      handleWithdrawalStatusUpdate(data);
    }
  });

  // 检查是否有认证token
  const hasToken = localStorage.getItem('token');

  // 处理提现状态更新
  const handleWithdrawalStatusUpdate = (update: WithdrawalStatusUpdate) => {
    setWithdrawalRecords(prev => 
      prev.map(record => 
        record.id === update.withdrawalId 
          ? { ...record, status: update.status }
          : record
      )
    );
    
    // 显示状态更新通知
    const message = getWithdrawalStatusMessage(update.status as WithdrawalStatus);
    if (message) {
      toast.success(message);
    }
    
    // 如果状态变更，重新加载资金概览
    if (['approved', 'completed', 'rejected'].includes(update.status)) {
      getFundsOverview().then(data => setFundsOverview(data)).catch(console.error);
    }
  };

  // 认证检查
  useEffect(() => {
    if (!isAuthenticated || userRole !== 'player') {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, userRole, navigate]);

  // 加载数据和WebSocket连接
  useEffect(() => {
    if (isAuthenticated && userRole === 'player') {
      loadData();
      
      // 连接WebSocket
      if (user?.id) {
        connect(user.id.toString(), 'player');
      }
      
      // 组件卸载时断开连接
      return () => {
        disconnect();
      };
    }
  }, [isAuthenticated, userRole, user, connect, disconnect]);

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
      
      // 不设置默认值，让错误状态显示
      // 这样用户可以看到实际的错误信息并重试
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
            <div className="h-8 bg-theme-border rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-theme-border rounded-xl"></div>
              ))}
            </div>
            <div className="h-96 bg-theme-border rounded-xl"></div>
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
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <i className="fa-solid fa-exclamation-triangle text-2xl text-red-600 dark:text-red-400"></i>
              </div>
              <h2 className="text-2xl font-bold text-theme-text mb-4">数据加载失败</h2>
              <p className="text-red-500 dark:text-red-400 mb-8">{typeof error === 'string' ? error : error?.message || '未知错误'}</p>
              <button 
                onClick={loadData}
                className="px-6 py-3 bg-theme-primary text-white font-medium rounded-lg hover:bg-theme-primary/90 transition-colors"
              >
                重新加载
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 检查登录状态
  if (!hasToken) {
    return (
      <div className="bg-theme-background min-h-screen text-theme-text">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-purple-100 flex items-center justify-center">
                <i className="fa-solid fa-lock text-2xl text-purple-600"></i>
              </div>
              <h2 className="text-2xl font-bold text-theme-text mb-4">需要登录</h2>
              <p className="text-theme-text/70 mb-8">
                您需要登录后才能查看资金信息和进行提现操作
              </p>
              <div className="space-y-3">
                <Link 
                  to="/login"
                  className="block w-full py-3 px-6 bg-theme-primary text-theme-surface font-medium rounded-lg hover:bg-theme-primary/90 transition-colors"
                >
                  立即登录
                </Link>
                <Link 
                  to="/register"
                  className="block w-full py-3 px-6 border border-theme-border text-theme-text font-medium rounded-lg hover:bg-theme-background transition-colors"
                >
                  注册账号
                </Link>
              </div>
            </div>
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
          <h1 className="text-2xl font-bold text-theme-text mb-2">资金与提现</h1>
          <p className="text-theme-text/70">管理您的收益和提现</p>
        </div>
        
        {/* 资金概览卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-theme-surface rounded-xl border border-theme-border p-5 shadow-sm">
            <p className="text-sm text-theme-text/70 mb-1">可用余额</p>
            <div className="flex items-end justify-between">
              <h3 className="text-2xl font-bold text-theme-primary">¥{(fundsOverview?.availableBalance || 0).toFixed(1)}</h3>
              <button 
                onClick={() => setActiveTab('withdraw')}
                className="py-1 px-3 bg-theme-primary text-theme-surface text-xs font-medium rounded-lg hover:bg-theme-primary/90 transition-colors"
              >
                提现
              </button>
            </div>
            <p className="text-xs text-theme-text/60 mt-3">可提现至您绑定的收款账户</p>
          </div>
          
          <div className="bg-theme-surface rounded-xl border border-theme-border p-5 shadow-sm">
            <p className="text-sm text-theme-text/70 mb-1">本月收益</p>
            <h3 className="text-2xl font-bold text-theme-accent">¥{(fundsOverview?.monthlyEarnings || 0).toFixed(1)}</h3>
            <p className="text-xs text-theme-text/60 mt-3">
              本月累计收益金额
            </p>
          </div>
          
          <div className="bg-theme-surface rounded-xl border border-theme-border p-5 shadow-sm">
            <p className="text-sm text-theme-text/70 mb-1">累计提现</p>
            <h3 className="text-2xl font-bold text-theme-success">¥{(fundsOverview?.totalWithdrawals || 0).toFixed(1)}</h3>
            <p className="text-xs text-theme-text/60 mt-3">共 {fundsOverview?.withdrawalCount || 0} 笔提现记录</p>
          </div>
          
          <div className="bg-theme-surface rounded-xl border border-theme-border p-5 shadow-sm">
            <p className="text-sm text-theme-text/70 mb-1">待处理提现</p>
            <h3 className="text-2xl font-bold text-orange-500">¥{(fundsOverview?.pendingWithdrawals || 0).toFixed(1)}</h3>
            <p className="text-xs text-theme-text/60 mt-3">正在审核中的提现金额</p>
          </div>
        </div>
        
        {/* 功能标签页 */}
        <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border overflow-hidden mb-6">
          <div className="border-b border-theme-border">
            <div className="flex">
              <button
                onClick={() => setActiveTab("overview")}
                className={cn(
                    "py-3 px-6 text-sm font-medium transition-colors",
                    activeTab === "overview" 
                      ? "text-theme-primary border-b-2 border-theme-primary" 
                      : "text-theme-text/70 hover:text-theme-text"
                  )}
              >
                资金概览
              </button>
              <button
                onClick={() => setActiveTab("withdraw")}
                className={cn(
                    "py-3 px-6 text-sm font-medium transition-colors",
                    activeTab === "withdraw" 
                      ? "text-theme-primary border-b-2 border-theme-primary" 
                      : "text-theme-text/70 hover:text-theme-text"
                  )}
              >
                提现申请
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={cn(
                    "py-3 px-6 text-sm font-medium transition-colors",
                    activeTab === "history" 
                      ? "text-theme-primary border-b-2 border-theme-primary" 
                      : "text-theme-text/70 hover:text-theme-text"
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
                  <h3 className="text-lg font-semibold text-theme-text mb-4">收益趋势</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={earningsTrend}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-theme-border" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} className="text-theme-text/60" />
                        <YAxis axisLine={false} tickLine={false} className="text-theme-text/60" />
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '12px', 
                            border: 'none', 
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                            backgroundColor: 'var(--theme-surface)',
                            color: 'var(--theme-text)'
                          }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="earnings" 
                          className="stroke-theme-primary" 
                          strokeWidth={2}
                          dot={{ r: 4, className: "fill-theme-primary" }}
                          activeDot={{ r: 6, className: "fill-theme-primary" }}
                          name="收益 (¥)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-theme-text mb-4">最近订单收益</h3>
                  <div className="space-y-3">
                    {recentEarnings.length > 0 ? (
                      recentEarnings.map((earning, index) => (
                        <div key={index} className="p-4 bg-theme-background rounded-lg border border-theme-border">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                                earning.type === 'order' ? 'bg-theme-primary' : 'bg-theme-accent'
                              }`}>
                                <i className={earning.type === 'order' ? 'fa-solid fa-gamepad' : 'fa-solid fa-gift'}></i>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-theme-text">{earning.gameName || '游戏陪玩'}</p>
                                <p className="text-xs text-theme-text/60">{earning.date}</p>
                                <p className="text-xs text-theme-text/50">订单号: {earning.orderId}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-theme-success text-lg">+¥{earning.amount.toFixed(1)}</p>
                              <p className="text-xs text-theme-text/60">实际收入</p>
                            </div>
                          </div>
                          
                          {/* 收益详情 */}
                          <div className="bg-theme-surface/50 rounded-lg p-3 space-y-2">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-theme-text/70">原始金额:</span>
                              <span className="text-theme-text font-medium">¥{earning.originalAmount.toFixed(1)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-theme-text/70">平台抽成 ({earning.commissionRate}%):</span>
                              <span className="text-theme-error">-¥{earning.platformFee.toFixed(1)}</span>
                            </div>
                            <div className="border-t border-theme-border pt-2 flex justify-between items-center text-sm font-medium">
                              <span className="text-theme-text">您的收益:</span>
                              <span className="text-theme-success">¥{earning.amount.toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-theme-text/60">
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
                  <h3 className="text-lg font-semibold text-theme-text mb-1">提现申请</h3>
                  <p className="text-sm text-theme-text/70">将您的收益提现至绑定的收款账户</p>
                </div>
                
                <div className="bg-theme-background p-5 rounded-lg">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-theme-text mb-2">提现金额 (元)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-theme-text/60">¥</span>
                      <input
                        type="number"
                        value={withdrawalAmount}
                        onChange={(e) => setWithdrawalAmount(e.target.value)}
                        placeholder="请输入提现金额"
                        className="w-full pl-8 pr-4 py-3 border border-theme-border rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-theme-primary bg-theme-surface text-theme-text"
                      />
                    </div>
                    <p className="text-xs text-theme-text/60 mt-2">
                      最低提现金额：100元，当前可用余额：¥{(fundsOverview?.availableBalance || 0).toFixed(1)}
                    </p>
                  </div>
                  

                  
                  <button 
                    onClick={handleWithdrawal}
                    disabled={isWithdrawing}
                    className="w-full py-3 bg-theme-primary text-theme-surface font-medium rounded-lg hover:bg-theme-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isWithdrawing ? '提交中...' : '确认提现'}
                  </button>
                  
                  <div className="mt-4 text-xs text-theme-text/60 text-center">
                    <p>提现申请提交后，将在1-3个工作日内处理</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* 提现历史标签内容 */}
            {activeTab === "history" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-theme-text mb-1">提现历史</h3>
                  <p className="text-sm text-theme-text/70">查看您的所有提现记录</p>
                </div>
                
                <div className="space-y-4">
                  {withdrawalRecords.map(record => {
                    const statusInfo = getWithdrawalStatusStyle(record.status as WithdrawalStatus);
                    return (
                      <div key={record.id} className="flex items-center justify-between p-4 border border-theme-border rounded-lg">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-theme-text">¥{Number(record.amount).toFixed(1)}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                          <p className="text-sm text-theme-text/60">订单号: {record.id}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-theme-text">{record.date}</p>
                          <p className="text-xs text-theme-text/60">预计到账时间: {record.status === 'pending' ? '审核后1-3个工作日' : '已完成'}</p>
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