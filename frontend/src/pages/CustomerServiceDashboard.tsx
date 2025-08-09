import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useTheme } from '@/hooks/useTheme';
import { useAttendance } from '@/contexts/AttendanceContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import superUnifiedAttendanceService from '@/services/superUnifiedAttendanceService';
import { 
  getCustomerServiceEarnings, 
  getCustomerServiceWithdrawals, 
  createCustomerServiceWithdrawal 
} from '@/services/withdrawalService';
import type { SuperUnifiedAttendanceRecord } from '../services/superUnifiedAttendanceService';
import type { WithdrawalStatusUpdate } from '@/services/websocketService';

// 为了兼容性，创建类型别名
type AttendanceRecord = SuperUnifiedAttendanceRecord;

// 数据接口定义
interface EarningsData {
  totalEarnings: number;
  availableBalance: number;
  todayEarnings: number;
  monthEarnings: number;
  todayWorkHours: number;
  processedOrders: number;
  hourlyRate?: number;
}

interface WithdrawalRecord {
  id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  description: string;
  created_at: string;
  updated_at: string;
  processed_at?: string;
  processed_by_name?: string;
  reject_reason?: string;
  approval_notes?: string;
}

// 状态文本和颜色映射
const getStatusInfo = (status: string) => {
  const statusMap = {
    '待审核': { text: '待审核', color: 'bg-yellow-500/10 text-yellow-600 dark:bg-yellow-600/20 dark:text-yellow-400' },
    '已通过': { text: '已通过', color: 'bg-blue-500/10 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400' },
    '已拒绝': { text: '已拒绝', color: 'bg-red-500/10 text-red-600 dark:bg-red-600/20 dark:text-red-400' },
    '已完成': { text: '已完成', color: 'bg-green-500/10 text-green-600 dark:bg-green-600/20 dark:text-green-400' },
    // 兼容英文状态
    'pending': { text: '待审核', color: 'bg-yellow-500/10 text-yellow-600 dark:bg-yellow-600/20 dark:text-yellow-400' },
    'approved': { text: '已批准', color: 'bg-blue-500/10 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400' },
    'rejected': { text: '已拒绝', color: 'bg-red-500/10 text-red-600 dark:bg-red-600/20 dark:text-red-400' },
    'completed': { text: '已完成', color: 'bg-green-500/10 text-green-600 dark:bg-green-600/20 dark:text-green-400' }
  };
  return statusMap[status as keyof typeof statusMap] || { text: status || '未知', color: 'bg-gray-500/10 text-gray-600 dark:bg-gray-600/20 dark:text-gray-400' };
};

const CustomerServiceDashboard: React.FC = () => {
  const { theme } = useTheme();
  const { attendanceStatus, currentWorkTime, isWorking, refreshAttendanceStatus, updateAttendanceStatus } = useAttendance();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // 提现相关状态
  const [earningsData, setEarningsData] = useState<EarningsData>({
    totalEarnings: 0,
    availableBalance: 0,
    todayEarnings: 0,
    monthEarnings: 0,
    todayWorkHours: 0,
    processedOrders: 0
  });
  const [withdrawalRecords, setWithdrawalRecords] = useState<WithdrawalRecord[]>([]);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalDescription, setWithdrawalDescription] = useState('');
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);
  const [activeTab, setActiveTab] = useState<'attendance' | 'earnings' | 'withdrawal'>('attendance');

  // 处理提现状态更新
  const handleWithdrawalStatusUpdate = (update: WithdrawalStatusUpdate) => {
    console.log('收到提现状态更新:', update);
    
    // 更新提现记录
    setWithdrawalRecords(prev => 
      prev.map(record => 
        record.id === update.withdrawalId 
          ? { ...record, status: update.status }
          : record
      )
    );
    
    // 刷新余额数据
    fetchEarningsData();
    
    // 显示通知
    const statusText = update.status === 'approved' ? '已批准' : 
                      update.status === 'completed' ? '已完成' : 
                      update.status === 'rejected' ? '已拒绝' : update.status;
    toast.success(`您的提现申请状态已更新: ${statusText}`);
  };

  // WebSocket实时同步
  const { connect, disconnect } = useWebSocket({
    onWithdrawalStatusUpdate: handleWithdrawalStatusUpdate
  });

  // 收入详情浮窗状态
  const [earningsTooltip, setEarningsTooltip] = useState<{
    show: boolean;
    x: number;
    y: number;
    data: {
      workHours: number;
      hourlyRate: number;
      totalEarnings: number;
    } | null;
  }>({
    show: false,
    x: 0,
    y: 0,
    data: null
  });
  const [isTooltipHovered, setIsTooltipHovered] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const todayRecord = attendanceStatus.todayRecord;

  // 判断是否可以打卡
  const canClockToday = () => {
    const today = new Date().toDateString();
    
    // 如果没有今日记录，可以上班打卡
    if (!todayRecord) {
      return { canClock: true, isClockIn: true };
    }
    
    // 检查今日记录的日期
    const recordDate = todayRecord.date ? new Date(todayRecord.date).toDateString() : null;
    
    // 如果记录不是今天的，可以上班打卡
    if (recordDate !== today) {
      return { canClock: true, isClockIn: true };
    }
    
    // 如果今天已经上班但还没下班，可以下班打卡
    if (todayRecord.status === 'clocked_in') {
      return { canClock: true, isClockIn: false };
    }
    
    // 如果今天已经下班，不能再打卡
    if (todayRecord.status === 'clocked_out') {
      return { canClock: false, isClockIn: true };
    }
    
    // 默认可以上班打卡
    return { canClock: true, isClockIn: true };
  };

  const clockStatus = canClockToday();

  // 处理收入详情浮窗
  const handleEarningsMouseEnter = (event: React.MouseEvent, workHours: number, hourlyRate: number, totalEarnings: number) => {
    // 清除之前的隐藏定时器
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    
    const rect = event.currentTarget.getBoundingClientRect();
    setEarningsTooltip({
      show: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 15, // 增加距离避免鼠标冲突
      data: {
        workHours,
        hourlyRate,
        totalEarnings
      }
    });
  };

  const handleEarningsMouseLeave = () => {
    // 只有在浮窗没有被悬浮时才隐藏
    if (!isTooltipHovered) {
      hideTimeoutRef.current = setTimeout(() => {
        setEarningsTooltip(prev => ({ ...prev, show: false }));
      }, 100);
    }
  };

  const handleTooltipMouseEnter = () => {
    setIsTooltipHovered(true);
    // 清除隐藏定时器
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const handleTooltipMouseLeave = () => {
    setIsTooltipHovered(false);
    setEarningsTooltip(prev => ({ ...prev, show: false }));
  };

  // 点击外部关闭浮窗
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setEarningsTooltip(prev => ({ ...prev, show: false }));
        setIsTooltipHovered(false);
      }
    };

    if (earningsTooltip.show) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [earningsTooltip.show]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // 获取打卡记录
  const fetchAttendanceRecords = async () => {
    try {
      const response = await superUnifiedAttendanceService.getAttendanceRecords(1, 10);
      setAttendanceRecords(response.records);
    } catch (error) {
      console.error('获取打卡记录失败:', error);
      toast.error('获取打卡记录失败');
    }
  };

  // 获取收益数据
  const fetchEarningsData = async () => {
    try {
      // 首先获取客服信息以获取时薪等基础数据
      const customerInfo = await superUnifiedAttendanceService.getCustomerServiceInfo();
      const hourlyRate = customerInfo.hourly_rate || 20;
      
      // 使用现有的API服务获取收益数据
      const { get } = await import('@/services/api');
      const data = await get<any>('/customer-service/dashboard');
      
      let todayWorkHours = 0;
      let todayEarnings = 0;
      let monthEarnings = 0;
      
      if (data.success && data.earnings) {
        // 优先使用后端API返回的数据
        todayWorkHours = data.earnings.todayWorkHours || 0;
        todayEarnings = data.earnings.todayEarnings || 0;
        monthEarnings = data.earnings.monthEarnings || 0;
      }
      
      // 如果正在工作中，计算实时工作时长和收益
      if (isWorking && todayRecord?.clock_in_time) {
        const clockInTime = new Date(todayRecord.clock_in_time);
        const now = new Date();
        const workingMilliseconds = now.getTime() - clockInTime.getTime();
        const workingHours = Math.round(workingMilliseconds / (1000 * 60)) / 60; // 精确到分钟
        todayWorkHours = Math.max(0, workingHours);
        
        // 计算实时收益
        todayEarnings = Math.round(todayWorkHours * hourlyRate * 100) / 100;
      }
      
      // 如果下班后今日收益为0，从今日考勤记录中计算
      if (!isWorking && todayEarnings === 0 && todayRecord) {
        if (todayRecord.status === 'clocked_out' && todayRecord.work_hours) {
          todayWorkHours = todayRecord.work_hours;
          todayEarnings = Math.round(todayWorkHours * hourlyRate * 100) / 100;
        }
      }

      // 如果后端没有返回本月收益，从考勤记录中计算
      if (monthEarnings === 0) {
        const currentMonth = new Date().toISOString().substring(0, 7);
        attendanceRecords.forEach(record => {
          if (record.date && record.date.startsWith(currentMonth) && 
              record.status === 'clocked_out' && 
              record.work_hours) {
            monthEarnings += Math.round(record.work_hours * hourlyRate * 100) / 100;
          }
        });
      }

      setEarningsData({
        totalEarnings: customerInfo.total_earnings || 0,
        availableBalance: customerInfo.available_balance || 0,
        todayEarnings: todayEarnings,
        monthEarnings: monthEarnings,
        todayWorkHours: Math.round(todayWorkHours * 100) / 100, // 精确到小数点后两位
        hourlyRate: hourlyRate,
        processedOrders: data.earnings?.processedOrders || 0
      });
    } catch (error) {
      console.error('获取收益数据失败:', error);
      toast.error('获取收益数据失败');
    }
  };

  // 获取提现记录
  const fetchWithdrawalRecords = async () => {
    try {
      const data = await getCustomerServiceWithdrawals();
      if (data.success) {
        setWithdrawalRecords(data.data || []);
      }
    } catch (error) {
      console.error('获取提现记录失败:', error);
      toast.error('获取提现记录失败');
    }
  };

  // 提交提现申请
  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 防止重复提交
    if (submittingWithdrawal) {
      toast.error("正在提交中，请勿重复点击");
      return;
    }
    
    if (!withdrawalAmount || isNaN(Number(withdrawalAmount)) || Number(withdrawalAmount) <= 0) {
      toast.error("请输入有效的提现金额");
      return;
    }
    
    const amount = parseFloat(withdrawalAmount);
    if (amount > earningsData.availableBalance) {
      toast.error("提现金额不能超过可用余额");
      return;
    }
    
    if (amount < 1) {
      toast.error("最低提现金额为1元");
      return;
    }
    
    setSubmittingWithdrawal(true);
    
    try {
      const data = await createCustomerServiceWithdrawal({ 
        amount,
        description: withdrawalDescription || '客服提现申请'
      });
      
      if (data.success) {
        setWithdrawalAmount("");
        setWithdrawalDescription("");
        toast.success("提现申请已提交，请等待管理员审核");
        // 刷新数据
        await Promise.all([
          fetchWithdrawalRecords(),
          fetchEarningsData()
        ]);
      } else {
        toast.error(data.error || '提现申请失败');
      }
    } catch (error) {
      console.error('提现申请失败:', error);
      // 检查是否是重复提交错误
      if (error instanceof Error && error.message.includes('重复提交')) {
        toast.error(error.message);
      } else {
        toast.error('提现申请失败，请重试');
      }
    } finally {
      setSubmittingWithdrawal(false);
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  // 初始化数据
  const initializeData = async () => {
    setIsLoading(true);
    try {
      // 先获取考勤记录，再计算收益数据
      await fetchAttendanceRecords();
      await fetchEarningsData();
      await fetchWithdrawalRecords();
    } catch (error) {
      console.error('初始化数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 刷新数据
  const refreshData = async () => {
    await Promise.all([
      refreshAttendanceStatus(),
      fetchAttendanceRecords(),
      fetchEarningsData()
    ]);
  };

  // 上班打卡
  const handleClockIn = async () => {
    try {
      setIsLoading(true);
      const result = await superUnifiedAttendanceService.clockIn();
      toast.success('上班打卡成功！');
      await refreshData();
    } catch (error: any) {
      const errorMessage = error.message || '上班打卡失败';
      
      // 如果是重复打卡的错误，使用警告样式的弹窗
      if (errorMessage.includes('已经打卡') || errorMessage.includes('重复打卡')) {
        toast.warning(errorMessage, {
          duration: 4000,
          description: '请勿重复打卡，如有疑问请联系管理员'
        });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setIsLoading(true);
      const result = await superUnifiedAttendanceService.clockOut();
      toast.success('下班打卡成功！');
      await refreshData();
    } catch (error: any) {
      toast.error(error.message || '下班打卡失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 重置今日打卡状态 - 已移除，投入生产使用

  useEffect(() => {
    initializeData();
    
    // 连接WebSocket
    connect();
    
    // 清理函数
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-accent mx-auto mb-4"></div>
          <p className="text-theme-text">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-theme-text">客服工作台</h1>
        <div className="text-sm text-theme-text/70">
          {new Date().toLocaleDateString('zh-CN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
          })}
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="bg-theme-surface rounded-lg shadow-sm border border-theme-border">
        <div className="flex border-b border-theme-border">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'attendance'
                ? 'text-theme-accent border-b-2 border-theme-accent bg-theme-accent/5'
                : 'text-theme-text/70 hover:text-theme-text hover:bg-theme-background/50'
            }`}
          >
            <i className="fas fa-clock mr-2"></i>
            考勤打卡
          </button>
          <button
            onClick={() => setActiveTab('earnings')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'earnings'
                ? 'text-theme-accent border-b-2 border-theme-accent bg-theme-accent/5'
                : 'text-theme-text/70 hover:text-theme-text hover:bg-theme-background/50'
            }`}
          >
            <i className="fas fa-chart-line mr-2"></i>
            收益统计
          </button>
          <button
            onClick={() => setActiveTab('withdrawal')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'withdrawal'
                ? 'text-theme-accent border-b-2 border-theme-accent bg-theme-accent/5'
                : 'text-theme-text/70 hover:text-theme-text hover:bg-theme-background/50'
            }`}
          >
            <i className="fas fa-money-bill-wave mr-2"></i>
            提现管理
          </button>
        </div>
      </div>

      {/* 标签页内容 */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* 工作状态卡片 */}
          <div className="bg-theme-surface rounded-lg shadow-sm border border-theme-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-theme-text">今日工作状态</h2>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isWorking 
              ? 'bg-green-500/10 text-green-500 dark:bg-green-600/20 dark:text-green-400' 
              : attendanceStatus.status === 'clocked_out'
                ? 'bg-blue-500/10 text-blue-500 dark:bg-blue-600/20 dark:text-blue-400'
                : 'bg-theme-text/10 text-theme-text/60'
          }`}>
            {superUnifiedAttendanceService.getStatusText(attendanceStatus.status)}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* 上班时间 */}
          <div className="text-center">
            <div className="text-2xl font-bold text-theme-text mb-1">
              {todayRecord?.clock_in_time 
                ? superUnifiedAttendanceService.formatTime(todayRecord.clock_in_time)
                : '--:--:--'
              }
            </div>
            <div className="text-sm text-theme-text/70">上班时间</div>
          </div>

          {/* 当前工作时长 */}
          <div className="text-center">
            <div className="text-2xl font-bold text-theme-accent mb-1">
              {isWorking ? currentWorkTime : (
                todayRecord?.work_hours 
                  ? superUnifiedAttendanceService.formatWorkHours(todayRecord.work_hours)
                  : '00:00:00'
              )}
            </div>
            <div className="text-sm text-theme-text/70">
              {isWorking ? '当前工作时长' : '今日工作时长'}
            </div>
          </div>

          {/* 下班时间 */}
          <div className="text-center">
            <div className="text-2xl font-bold text-theme-text mb-1">
              {todayRecord?.clock_out_time 
                ? superUnifiedAttendanceService.formatTime(todayRecord.clock_out_time)
                : '--:--:--'
              }
            </div>
            <div className="text-sm text-theme-text/70">下班时间</div>
          </div>
        </div>

        {/* 今日收入 */}
        {(todayRecord?.earnings !== undefined && todayRecord?.earnings !== null) && (
          <div className="bg-theme-background/50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-theme-text/70">今日收入</span>
              <span className="text-xl font-bold text-green-500 dark:text-green-400">
                ¥{Number(todayRecord.earnings).toFixed(2)}
              </span>
            </div>
            {(todayRecord.hourly_rate !== undefined && todayRecord.hourly_rate !== null) && (
              <div className="text-sm text-theme-text/50 mt-1">
                时薪：¥{Number(todayRecord.hourly_rate).toFixed(2)}/小时
              </div>
            )}
          </div>
        )}

        {/* 打卡按钮和重置按钮 */}
        <div className="text-center space-y-4">
          <button
            onClick={clockStatus.isClockIn ? handleClockIn : handleClockOut}
            disabled={isLoading || !clockStatus.canClock}
            className={`px-8 py-4 rounded-lg font-medium text-lg transition-colors ${
              isLoading
                ? 'bg-theme-text/40 text-white cursor-not-allowed'
                : !clockStatus.canClock
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-60'
                  : clockStatus.isClockIn 
                    ? 'bg-theme-accent hover:bg-theme-accent/90 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-600'
            }`}
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                处理中...
              </>
            ) : (
              <>
                <i className={`fas ${
                  clockStatus.isClockIn 
                    ? 'fa-sign-in-alt' 
                    : 'fa-sign-out-alt'
                } mr-2`}></i>
                {clockStatus.isClockIn 
                  ? (!clockStatus.canClock ? '今日已完成打卡' : '上班打卡')
                  : '下班打卡'
                }
              </>
            )}
          </button>
          
          {!clockStatus.canClock && (
            <p className="text-sm text-theme-text/60 mt-2">
              今日打卡已完成，明天可重新打卡
            </p>
          )}
        </div>
      </div>

      {/* 考勤记录 */}
      <div className="bg-theme-surface rounded-lg shadow-sm border border-theme-border">
        <div className="p-6 border-b border-theme-border">
          <h2 className="text-xl font-semibold text-theme-text">最近考勤记录</h2>
        </div>
        
        <div className="overflow-x-auto">
          {attendanceRecords.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-theme-text/60 mb-4">
                <i className="fas fa-clock text-4xl"></i>
              </div>
              <p className="text-theme-text/70">暂无考勤记录</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-theme-background/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">日期</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">上班时间</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">下班时间</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">工作时长</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">今日收入</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border">
                {attendanceRecords.map((record, index) => {
                  // 计算今日收入：只有已下班的记录才显示收入
                  const dailyEarnings = record.status === 'clocked_out' && record.work_hours && record.hourly_rate 
                    ? (record.work_hours * record.hourly_rate).toFixed(2)
                    : null;
                  
                  return (
                    <tr key={`attendance-record-${record.id}-${index}`} className="hover:bg-theme-background/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">
                        {superUnifiedAttendanceService.formatDate(record.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">
                        {superUnifiedAttendanceService.formatTime(record.clock_in_time)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">
                        {superUnifiedAttendanceService.formatTime(record.clock_out_time)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">
                        {record.work_hours && record.work_hours > 0 
                          ? superUnifiedAttendanceService.formatWorkHours(record.work_hours)
                          : '--'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">
                        {dailyEarnings ? (
                          <span 
                            className="text-green-600 font-medium cursor-help inline-flex items-center gap-1 hover:text-green-700 transition-colors"
                            onMouseEnter={(e) => handleEarningsMouseEnter(
                              e, 
                              parseFloat(record.work_hours) || 0, 
                              parseFloat(record.hourly_rate) || 0, 
                              parseFloat(dailyEarnings)
                            )}
                            onMouseLeave={handleEarningsMouseLeave}
                          >
                            ¥{dailyEarnings}
                            <i className="fas fa-info-circle text-xs opacity-60"></i>
                          </span>
                        ) : (
                          <span className="text-theme-text/50">--</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full`}
                              style={{ 
                                backgroundColor: `${superUnifiedAttendanceService.getStatusColor(record.status)}20`,
                                color: superUnifiedAttendanceService.getStatusColor(record.status)
                              }}>
                          {superUnifiedAttendanceService.getStatusText(record.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
        </div>
      )}

      {/* 收益统计标签页 */}
      {activeTab === 'earnings' && (
        <div className="space-y-6">
          {/* 收益统计 */}
          <div className="space-y-6">
            {/* 第一行：剩余2个模块重新排布 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div key="total-earnings-card" className="bg-theme-surface rounded-lg shadow-sm border border-theme-border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-theme-text/70">总收益</p>
                    <p className="text-2xl font-bold text-theme-text">¥{Number(earningsData.totalEarnings || 0).toFixed(2)}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                    <i className="fas fa-coins text-green-500 text-xl"></i>
                  </div>
                </div>
              </div>

              <div key="available-balance-card" className="bg-theme-surface rounded-lg shadow-sm border border-theme-border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-theme-text/70">可用余额</p>
                    <p className="text-2xl font-bold text-theme-accent">¥{Number(earningsData.availableBalance || 0).toFixed(2)}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <i className="fas fa-wallet text-blue-500 text-xl"></i>
                  </div>
                </div>
              </div>
            </div>

            {/* 第二行：个人日薪横向占据全宽 */}
            <div key="hourly-rate-section-card" className="bg-theme-surface rounded-lg shadow-sm border border-theme-border p-8">
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 bg-theme-accent/10 rounded-full flex items-center justify-center mr-4">
                    <i className="fas fa-money-bill-wave text-theme-accent text-2xl"></i>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-theme-accent mb-2">
                      ¥{Number(earningsData.hourlyRate || 0).toFixed(2)}
                    </div>
                    <div className="text-lg text-theme-text/70">个人日薪 (每小时)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>


        </div>
      )}

      {/* 提现管理标签页 */}
      {activeTab === 'withdrawal' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 提现申请表单 */}
            <div className="bg-theme-surface rounded-lg shadow-sm border border-theme-border">
              <div className="p-6 border-b border-theme-border">
                <h2 className="text-lg font-semibold text-theme-text flex items-center">
                  <i className="fas fa-plus text-theme-accent mr-2"></i>
                  申请提现
                </h2>
              </div>
              <form onSubmit={handleSubmitWithdrawal} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-theme-text mb-2">
                    可用余额
                  </label>
                  <div className="text-2xl font-bold text-theme-accent mb-4">
                    ¥{Number(earningsData.availableBalance || 0).toFixed(2)}
                  </div>
                </div>

                <div>
                  <label htmlFor="withdrawalAmount" className="block text-sm font-medium text-theme-text mb-2">
                    提现金额 *
                  </label>
                  <input
                    type="number"
                    id="withdrawalAmount"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-theme-border rounded-lg bg-theme-background text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent focus:border-transparent"
                    placeholder="请输入提现金额"
                    step="0.01"
                    min="1"
                    max={earningsData.availableBalance}
                    required
                  />
                  <p className="text-xs text-theme-text/60 mt-1">最低提现金额：¥1.00</p>
                </div>

                <div>
                  <label htmlFor="withdrawalDescription" className="block text-sm font-medium text-theme-text mb-2">
                    提现说明
                  </label>
                  <textarea
                    id="withdrawalDescription"
                    value={withdrawalDescription}
                    onChange={(e) => setWithdrawalDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-theme-border rounded-lg bg-theme-background text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent focus:border-transparent"
                    placeholder="请输入提现说明（可选）"
                    rows={3}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingWithdrawal || !withdrawalAmount || Number(withdrawalAmount) <= 0}
                  className="w-full px-4 py-2 bg-theme-accent text-white rounded-lg font-medium hover:bg-theme-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submittingWithdrawal ? (
                    <span className="flex items-center justify-center">
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      提交中...
                    </span>
                  ) : (
                    '提交申请'
                  )}
                </button>
              </form>
            </div>

            {/* 提现记录 */}
            <div className="bg-theme-surface rounded-lg shadow-sm border border-theme-border">
              <div className="p-6 border-b border-theme-border">
                <h2 className="text-lg font-semibold text-theme-text flex items-center">
                  <i className="fas fa-history text-theme-accent mr-2"></i>
                  提现记录
                </h2>
              </div>
              <div className="p-6">
                {withdrawalRecords.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-theme-text/60 mb-4">
                      <i className="fas fa-file-alt text-4xl"></i>
                    </div>
                    <p className="text-theme-text/70">暂无提现记录</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {withdrawalRecords.map((record) => {
                      const statusInfo = getStatusInfo(record.status);
                      return (
                        <div key={record.id} className="border border-theme-border rounded-lg p-4 hover:bg-theme-surface/50 hover:border-theme-accent/30 transition-all duration-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-theme-text">¥{Number(record.amount).toFixed(2)}</span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
                              {statusInfo.text}
                            </span>
                          </div>
                          <div className="text-sm text-theme-text/70 space-y-1">
                            <div>申请时间：{formatDate(record.created_at)}</div>
                            {record.description && (
                              <div>说明：{record.description}</div>
                            )}
                            {record.processed_at && (
                              <div>处理时间：{formatDate(record.processed_at)}</div>
                            )}
                            {record.processed_by_name && (
                              <div>处理人：{record.processed_by_name}</div>
                            )}
                            {record.reject_reason && (
                              <div className="text-red-500">拒绝原因：{record.reject_reason}</div>
                            )}
                            {record.approval_notes && (
                              <div className="text-green-600">批准备注：{record.approval_notes}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 收入详情浮窗 */}
      {earningsTooltip.show && earningsTooltip.data && (
        <div
          ref={tooltipRef}
          className="fixed z-50"
          style={{
            left: `${earningsTooltip.x}px`,
            top: `${earningsTooltip.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
        >
          <div className="bg-theme-surface border border-theme-border rounded-lg shadow-lg p-4 min-w-64">
            {/* 浮窗箭头 */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-theme-border"></div>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-px">
                <div className="w-0 h-0 border-l-5 border-r-5 border-t-5 border-l-transparent border-r-transparent border-t-theme-surface"></div>
              </div>
            </div>
            
            {/* 浮窗内容 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-theme-text font-medium border-b border-theme-border pb-2">
                <i className="fas fa-calculator text-theme-accent"></i>
                <span>收入计算详情</span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-theme-text/70">工作时长：</span>
                  <span className="text-theme-text font-medium">
                    {earningsTooltip.data.workHours.toFixed(2)} 小时
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-theme-text/70">时薪标准：</span>
                  <span className="text-theme-text font-medium">
                    ¥{earningsTooltip.data.hourlyRate.toFixed(2)}/小时
                  </span>
                </div>
                
                <div className="border-t border-theme-border pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-theme-text/70">计算公式：</span>
                    <span className="text-xs text-theme-text/60">
                      {earningsTooltip.data.workHours.toFixed(2)} × ¥{earningsTooltip.data.hourlyRate.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-theme-text font-medium">总收入：</span>
                    <span className="text-green-600 font-bold text-lg">
                      ¥{earningsTooltip.data.totalEarnings.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-theme-text/50 text-center pt-2 border-t border-theme-border">
                <i className="fas fa-info-circle mr-1"></i>
                收入按实际工作时长计算
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerServiceDashboard;