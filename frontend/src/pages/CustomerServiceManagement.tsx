import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import Header from '../components/Header';
import { customerServiceApi, CustomerServiceInfo } from '../api/customerService';
import { 
  getCustomerServiceSalaries,
  updateCustomerServiceSalary
} from '../services/adminProfileService';
import { getAdminCredentials } from '../services/permissionService';
import attendanceService from '../services/attendanceService';
import { API_BASE_URL } from '../config/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface AttendanceRecord {
  id: number;
  adminId: number;
  adminName: string;
  phone?: string;
  checkInTime: string | null;
  checkOutTime?: string | null;
  workDuration?: number;
  hourlyRate: number;
  totalEarnings: number;
  status: 'checked_in' | 'checked_out';
  createdAt: string;
  updatedAt: string;
  
  // 薪资配置
  baseSalary?: number;
  commissionRate?: number;
  performanceBonus?: number;
  
  // 今日收益详情
  todayBaseEarnings?: number;
  todayCommissionEarnings?: number;
  todayBonusEarnings?: number;
  todayTotalEarnings?: number;
  
  // 工作时长统计
  currentMonthHours?: number;
  totalWorkHours?: number;
  currentMonthDays?: number;
  currentMonthEarnings?: number;
  monthlyTargetHours?: number;
  
  // 绩效数据
  performanceScore?: number;
  attendanceRate?: number;
  availableBalance?: number;
  
  // 在线状态
  isOnline?: boolean;
  lastLoginTime?: string;
}

interface CustomerServiceSalary {
  adminId: string;
  adminName: string;
  hourlyRate: number;
  updatedAt: string;
  updatedBy: string;
}

interface CustomerServiceStats {
  totalEarnings: number;
  attendanceDays: number;
  averageWorkHours: number;
  lastClockIn?: string;
  currentStatus: 'working' | 'offline';
}

interface ComprehensiveCustomerService {
  user: CustomerServiceInfo & { password?: string; role?: string; lastLogin?: string; operationCount?: number };
  salary: CustomerServiceSalary | null | undefined;
  stats: CustomerServiceStats;
  recentAttendance: AttendanceRecord[];
}

export default function CustomerServiceManagement() {
  // 标签页状态
  const [activeTab, setActiveTab] = useState<'management' | 'attendance'>('management');
  
  const [customerServices, setCustomerServices] = useState<ComprehensiveCustomerService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'working' | 'offline'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'earnings' | 'lastLogin'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // 编辑状态
  const [editingSalary, setEditingSalary] = useState<{adminId: string, hourlyRate: number} | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState<CustomerServiceInfo | null>(null);
  const [isAddingCustomerService, setIsAddingCustomerService] = useState(false);
  const [newCustomerService, setNewCustomerService] = useState({ username: "", role: "customer_service" });
  const [loadingPassword, setLoadingPassword] = useState(false);

  // 打卡记录相关状态
  const [allAttendanceRecords, setAllAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendanceSearchTerm, setAttendanceSearchTerm] = useState('');

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (activeTab === 'attendance') {
      loadAllAttendanceRecords();
    }
  }, [activeTab, selectedDate]);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('开始加载客服数据...');
      
      // 检查认证状态
      const token = localStorage.getItem('token');
      console.log('Token存在:', !!token);
      
      // 并行加载所有数据
      console.log('调用客服API...');
      const customerServicesResponse = await customerServiceApi.admin.getCustomerServiceList();
      console.log('客服API响应:', customerServicesResponse);
      
      console.log('调用考勤API...');
      const attendanceData = await attendanceService.getAttendanceRecords({ page: 1, limit: 1000 });
      console.log('考勤API响应:', attendanceData);
      
      console.log('调用薪资API...');
      const salariesData = await getCustomerServiceSalaries();
      console.log('薪资API响应:', salariesData);

      // 获取客服列表数据 - 修复数据结构
      const customerServiceUsers = customerServicesResponse?.success && Array.isArray(customerServicesResponse?.data) 
        ? customerServicesResponse.data
        : [];

      // 构建综合数据
      const comprehensiveData: ComprehensiveCustomerService[] = customerServiceUsers.map(user => {
        // 添加兼容性字段
        const extendedUser = {
          ...user,
          role: 'customer_service',
          lastLogin: user.last_login,
          operationCount: 0
        };

        // 找到对应的薪资信息
        const salary = Array.isArray(salariesData) 
          ? salariesData.find(sal => sal.adminId === user.id.toString())
          : null;

        // 计算统计信息 - 修复打卡记录过滤
        const userAttendance = Array.isArray(attendanceData?.records) 
          ? attendanceData.records.filter(record => 
              record.adminId === user.id || 
              record.cs_id === user.id ||
              record.admin_id === user.id
            )
          : [];

        const stats = calculateStats(userAttendance, user);
        
        return {
          user: extendedUser,
          salary,
          stats,
          recentAttendance: userAttendance.slice(0, 5) // 最近5条记录
        };
      });

      setCustomerServices(comprehensiveData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载数据失败';
      setError(errorMessage);
      console.error('Failed to load customer service data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (attendanceRecords: AttendanceRecord[], user: any): CustomerServiceStats => {
    const totalEarnings = attendanceRecords.reduce((sum, record) => {
      return sum + (record.totalEarnings || record.total_earnings || 0);
    }, 0);

    // 添加客服表中的总收入
    const userTotalEarnings = user.total_earnings || 0;
    const finalTotalEarnings = Math.max(totalEarnings, userTotalEarnings);

    const attendanceDays = attendanceRecords.length;
    const averageWorkHours = 0; // 移除工作时长相关计算

    // 查找最近的打卡记录
    const sortedRecords = [...attendanceRecords].sort((a, b) => {
      const timeA = new Date(a.checkInTime || a.clock_in_time || a.created_at).getTime();
      const timeB = new Date(b.checkInTime || b.clock_in_time || b.created_at).getTime();
      return timeB - timeA;
    });
    
    const lastClockIn = sortedRecords.length > 0 ? 
      (sortedRecords[0].checkInTime || sortedRecords[0].clock_in_time || sortedRecords[0].created_at) : undefined;
    const currentStatus = sortedRecords.length > 0 && 
      (sortedRecords[0].status === 'checked_in' || sortedRecords[0].status === 'working') 
      ? 'working' : 'offline';

    return {
      totalEarnings: finalTotalEarnings,
      attendanceDays,
      averageWorkHours,
      lastClockIn,
      currentStatus
    };
  };

  // 获取所有客服打卡记录
  const loadAllAttendanceRecords = async () => {
    setAttendanceLoading(true);
    try {
      // 使用 attendanceService 中的管理员接口方法
      const data = await attendanceService.getAllAttendanceRecords(1, 100);
      console.log('打卡记录响应:', data);
      
      // 管理员接口返回格式：{ records: [...], total: number, stats: {...} }
      const records = data.records || [];
      if (records && Array.isArray(records)) {
        // 根据管理员接口的返回格式转换数据
        const formattedRecords = records.map((record: any) => ({
          id: record.id,
          adminId: record.adminId,
          adminName: record.adminName || `客服${record.adminId}`,
          phone: record.phone,
          checkInTime: record.checkInTime,
          checkOutTime: record.checkOutTime,
          workDuration: record.workDuration || 0,
          hourlyRate: parseFloat(record.hourlyRate || 20),
          totalEarnings: parseFloat(record.totalEarnings || 0),
          status: record.status === 'clocked_in' ? 'checked_in' : (record.status || 'checked_out'),
          date: record.date,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          
          // 薪资配置 - 从客服信息中获取
          baseSalary: 0,
          commissionRate: 0,
          performanceBonus: 0,
          
          // 今日收益详情
          todayBaseEarnings: 0,
          todayCommissionEarnings: 0,
          todayBonusEarnings: 0,
          todayTotalEarnings: parseFloat(record.totalEarnings || 0),
          
          // 工作时长统计
          currentMonthHours: 0,
          totalWorkHours: 0,
          currentMonthDays: 0,
          currentMonthEarnings: 0,
          monthlyTargetHours: 160,
          
          // 绩效数据
          performanceScore: 0,
          attendanceRate: 100,
          availableBalance: 0,
          
          // 在线状态
          isOnline: false,
          lastLoginTime: null
        }));
        setAllAttendanceRecords(formattedRecords);
      } else {
        setAllAttendanceRecords([]);
      }
    } catch (error) {
      console.error('获取打卡记录失败:', error);
      setAllAttendanceRecords([]);
      toast.error('获取打卡记录失败');
    } finally {
      setAttendanceLoading(false);
    }
  };

  // 过滤和排序数据
  const filteredAndSortedData = customerServices
    .filter(cs => {
      const matchesSearch = cs.user.username.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && cs.user.status === 1) ||
                           (statusFilter === 'inactive' && cs.user.status === 0) ||
                           (statusFilter === 'working' && cs.stats.currentStatus === 'working') ||
                           (statusFilter === 'offline' && cs.stats.currentStatus === 'offline');
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.user.username;
          bValue = b.user.username;
          break;
        case 'earnings':
          aValue = a.stats.totalEarnings;
          bValue = b.stats.totalEarnings;
          break;
        case 'lastLogin':
          aValue = a.user.lastLogin ? new Date(a.user.lastLogin).getTime() : 0;
          bValue = b.user.lastLogin ? new Date(b.user.lastLogin).getTime() : 0;
          break;
        default:
          return 0;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      return sortOrder === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
    });

  // 过滤打卡记录
  const filteredAttendanceRecords = allAttendanceRecords.filter(record => {
    // 按客服姓名搜索
    const matchesSearch = attendanceSearchTerm === '' || 
      (record.adminName && record.adminName.toLowerCase().includes(attendanceSearchTerm.toLowerCase()));
    
    // 按日期过滤 - 如果没有打卡时间，使用创建时间或更新时间
    let recordDate;
    if (record.checkInTime) {
      recordDate = new Date(record.checkInTime);
    } else if (record.createdAt) {
      recordDate = new Date(record.createdAt);
    } else if (record.updatedAt) {
      recordDate = new Date(record.updatedAt);
    } else {
      // 如果都没有时间信息，显示在今天
      recordDate = new Date();
    }
    
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    const recordDateStr = format(recordDate, 'yyyy-MM-dd');
    const matchesDate = recordDateStr === selectedDateStr;
    
    return matchesDate && matchesSearch;
  });

  // 切换客服状态
  const toggleCustomerServiceStatus = async (id: string) => {
    try {
      const currentService = customerServices.find(cs => cs.user.id.toString() === id);
      if (!currentService) return;
      
      const newStatus = currentService.user.status === 1 ? false : true;
      await customerServiceApi.admin.updateCustomerServiceStatus(parseInt(id), newStatus);
      
      setCustomerServices(prev => prev.map(cs => 
        cs.user.id.toString() === id ? { ...cs, user: { ...cs.user, status: newStatus ? 1 : 0 } } : cs
      ));
      
      toast.success(`客服状态已${newStatus ? '启用' : '禁用'}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '切换客服状态失败';
      console.error('Failed to toggle customer service status:', err);
      toast.error(errorMessage);
    }
  };

  // 删除客服
  const deleteCustomerService = async (id: number) => {
    if (!confirm('确定要注销这个客服吗？此操作不可撤销。')) {
      return;
    }

    try {
      await customerServiceApi.admin.deleteCustomerService(id);

      // 从列表中移除已删除的客服
      setCustomerServices(prevServices => prevServices.filter(cs => cs.user.id !== id));
      toast.success('客服注销成功');
    } catch (error) {
      console.error('Failed to delete customer service:', error);
      toast.error('注销客服失败');
    }
  };

  // 获取客服密码
  const handleShowPassword = async (user: CustomerServiceInfo) => {
    setLoadingPassword(true);
    try {
      // 调用credentials接口获取包含明文密码的数据
      const credentialsData = await getAdminCredentials();
      
      // 查找对应的客服数据
      const customerServiceCredential = credentialsData.find(
        cred => cred.id === user.id.toString() && cred.role === 'customer_service'
      );
      
      if (customerServiceCredential) {
        // 将密码信息添加到用户对象中
        const userWithPassword = {
          ...user,
          password: customerServiceCredential.password
        };
        setShowPasswordModal(userWithPassword);
      } else {
        toast.error('未找到该客服的密码信息');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取密码失败';
      console.error('Failed to get customer service password:', err);
      toast.error(errorMessage);
    } finally {
      setLoadingPassword(false);
    }
  };

  // 更新时薪
  const handleUpdateSalary = async () => {
    if (!editingSalary) return;
    
    if (editingSalary.hourlyRate <= 0) {
      toast.error("时薪必须大于0");
      return;
    }
    
    try {
      const updatedSalary = await updateCustomerServiceSalary(editingSalary.adminId, editingSalary.hourlyRate);
      
      setCustomerServices(prev => prev.map(cs => 
        cs.user.id === editingSalary.adminId 
          ? { ...cs, salary: updatedSalary }
          : cs
      ));
      
      setEditingSalary(null);
      toast.success("时薪更新成功");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新时薪失败';
      console.error('Failed to update salary:', err);
      toast.error(errorMessage);
    }
  };

  // 批量设置时薪
  const handleBatchUpdateSalary = async () => {
    const hourlyRate = prompt("请输入要设置的统一时薪（元/小时）：");
    if (!hourlyRate || isNaN(Number(hourlyRate)) || Number(hourlyRate) <= 0) {
      toast.error("请输入有效的时薪");
      return;
    }

    const rate = Number(hourlyRate);
    const confirmMessage = `确定要将所有客服的时薪设置为 ¥${rate}/小时 吗？`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const updatePromises = customerServices.map(cs => 
        updateCustomerServiceSalary(cs.user.id, rate)
      );
      
      await Promise.all(updatePromises);
      
      // 重新加载数据
      await loadAllData();
      
      toast.success(`已成功将所有客服时薪设置为 ¥${rate}/小时`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '批量更新时薪失败';
      console.error('Failed to batch update salary:', err);
      toast.error(errorMessage);
    }
  };

  // 添加新客服
  const handleAddCustomerService = async () => {
    if (!newCustomerService.username.trim()) {
      toast.error("请输入客服用户名");
      return;
    }
    
    try {
      await customerServiceApi.admin.createCustomerService({
        username: newCustomerService.username.trim(),
        name: newCustomerService.username.trim() // 使用用户名作为昵称
      });
      
      setIsAddingCustomerService(false);
      setNewCustomerService({ username: "", role: "customer_service" });
      
      // 重新加载数据
      await loadAllData();
      
      toast.success("客服账号添加成功");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '添加客服失败';
      console.error('Failed to add customer service:', err);
      toast.error(errorMessage);
    }
  };

  const getStatusBadge = (status: string | number, type: 'user' | 'work') => {
    if (type === 'user') {
      return status === 1 || status === 'active'
        ? 'bg-green-500/10 text-green-500 border-green-500/20'
        : 'bg-red-500/10 text-red-500 border-red-500/20';
    } else {
      return status === 'working'
        ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
        : 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div className="bg-theme-background min-h-screen text-theme-text">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary"></div>
            <span className="ml-3 text-lg text-theme-text/70">加载客服数据中...</span>
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
          <div className="text-center py-20">
            <div className="text-red-500 mb-4">
              <svg className="mx-auto h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-xl font-medium text-theme-text">加载失败</p>
              <p className="text-sm text-theme-text/70 mt-2">{error}</p>
            </div>
            <button
              onClick={loadAllData}
              className="bg-theme-primary text-white px-6 py-3 rounded-lg hover:bg-theme-primary/90 transition-colors"
            >
              重新加载
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-theme-background min-h-screen text-theme-text">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        {/* 标签页导航 */}
        <div className="mb-6">
          <div className="border-b border-theme-border">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('management')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'management'
                    ? 'border-theme-primary text-theme-primary'
                    : 'border-transparent text-theme-text/70 hover:text-theme-text hover:border-theme-text/30'
                }`}
              >
                <i className="fa-solid fa-users mr-2"></i>
                客服管理
              </button>
              <button
                onClick={() => setActiveTab('attendance')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'attendance'
                    ? 'border-theme-primary text-theme-primary'
                    : 'border-transparent text-theme-text/70 hover:text-theme-text hover:border-theme-text/30'
                }`}
              >
                <i className="fa-solid fa-clock mr-2"></i>
                打卡记录
              </button>
            </nav>
          </div>
        </div>

        {/* 客服管理标签页 */}
        {activeTab === 'management' && (
          <>
            {/* 页面标题和操作栏 */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-theme-text mb-2">客服管理中心</h1>
                  <p className="text-theme-text/70">统一管理所有客服的状态、信息、密码、打卡情况和绩效</p>
                </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleBatchUpdateSalary}
                className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors flex items-center"
              >
                <i className="fa-solid fa-coins mr-2"></i>批量设置时薪
              </button>
              <button
                onClick={() => setIsAddingCustomerService(true)}
                className="px-4 py-2 bg-theme-primary text-white text-sm font-medium rounded-lg hover:bg-theme-primary/90 transition-colors flex items-center"
              >
                <i className="fa-solid fa-plus mr-2"></i>添加客服
              </button>
            </div>
          </div>

          {/* 搜索和过滤栏 */}
          <div className="bg-theme-surface rounded-xl border border-theme-border p-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* 搜索框 */}
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <i className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-text/50"></i>
                  <input
                    type="text"
                    placeholder="搜索客服姓名或用户名..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-theme-border bg-theme-background rounded-lg text-sm text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary"
                  />
                </div>
              </div>

              {/* 状态过滤 */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-theme-border bg-theme-background rounded-lg text-sm text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary"
              >
                <option value="all">全部状态</option>
                <option value="active">账号启用</option>
                <option value="inactive">账号禁用</option>
                <option value="working">工作中</option>
                <option value="offline">离线</option>
              </select>

              {/* 排序方式 */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-theme-border bg-theme-background rounded-lg text-sm text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary"
              >
                <option value="name">按姓名排序</option>
                <option value="earnings">按收益排序</option>
                <option value="workHours">按工时排序</option>
                <option value="lastLogin">按最后登录排序</option>
              </select>

              {/* 排序顺序 */}
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-theme-border bg-theme-background rounded-lg text-sm text-theme-text hover:bg-theme-surface transition-colors"
              >
                <i className={`fa-solid fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
              </button>
            </div>
          </div>
        </div>

        {/* 统计概览 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-theme-surface rounded-xl border border-theme-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-theme-text/70 text-sm">总客服数</p>
                <p className="text-2xl font-bold text-theme-text">{customerServices.length}</p>
              </div>
              <div className="w-12 h-12 bg-theme-primary/10 rounded-full flex items-center justify-center">
                  <i className="fa-solid fa-users text-theme-primary text-xl"></i>
                </div>
            </div>
          </div>

          <div className="bg-theme-surface rounded-xl border border-theme-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-theme-text/70 text-sm">在线客服</p>
                <p className="text-2xl font-bold text-green-500">
                  {customerServices.filter(cs => cs.stats.currentStatus === 'working').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-user-check text-green-500 text-xl"></i>
              </div>
            </div>
          </div>



          <div className="bg-theme-surface rounded-xl border border-theme-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-theme-text/70 text-sm">总收益</p>
                <p className="text-2xl font-bold text-orange-500">
                  ¥{customerServices.reduce((sum, cs) => sum + cs.stats.totalEarnings, 0).toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-coins text-orange-500 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* 客服列表 */}
        <div className="space-y-6">
          {filteredAndSortedData.length === 0 ? (
            <div className="bg-theme-surface rounded-xl border border-theme-border p-12 text-center">
              <div className="text-theme-text/50 mb-4">
                <svg className="mx-auto h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM9 9a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-xl font-medium text-theme-text">没有找到客服</p>
                <p className="text-sm text-theme-text/70 mt-2">尝试调整搜索条件或添加新的客服账号</p>
              </div>
            </div>
          ) : (
            filteredAndSortedData.map(cs => (
              <div key={cs.user.id} className="bg-theme-surface rounded-xl border border-theme-border overflow-hidden hover:shadow-lg transition-shadow">
                {/* 客服基本信息头部 */}
                <div className="p-6 border-b border-theme-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-theme-primary/10 rounded-full flex items-center justify-center">
                  <i className="fa-solid fa-user text-theme-primary text-2xl"></i>
                </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-theme-text">
                            {cs.user.name || cs.user.username}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(cs.user.status, 'user')}`}>
                            {cs.user.status === 1 ? '账号启用' : '账号禁用'}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(cs.stats.currentStatus, 'work')}`}>
                            {cs.stats.currentStatus === 'working' ? '工作中' : '离线'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-theme-text/70">
                          <span>ID: {cs.user.id}</span>
                          <span>用户名: {cs.user.username}</span>
                          <span className="text-red-600 font-mono">密码: {cs.user.plain_passwd || '未设置'}</span>
                          <span>创建时间: {cs.user.createdAt}</span>
                          {cs.user.lastLogin && (
                            <span>最后登录: {cs.user.lastLogin}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleShowPassword(cs.user)}
                        disabled={loadingPassword}
                        className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingPassword ? (
                          <>
                            <i className="fa-solid fa-spinner fa-spin mr-1"></i>获取中...
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-key mr-1"></i>查看密码
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => toggleCustomerServiceStatus(cs.user.id.toString())}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          cs.user.status === 1
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {cs.user.status === 1 ? '禁用' : '启用'}
                      </button>
                      <button
                        onClick={() => deleteCustomerService(cs.user.id)}
                        className="px-3 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <i className="fa-solid fa-trash mr-1"></i>注销
                      </button>
                    </div>
                  </div>
                </div>

                {/* 详细信息网格 */}
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 绩效统计 */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-theme-text flex items-center">
                        <i className="fa-solid fa-chart-line mr-2 text-theme-primary"></i>绩效统计
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-theme-text/70">总收益</span>
                          <span className="font-medium text-green-600">¥{cs.stats.totalEarnings.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-theme-text/70">出勤天数</span>
                          <span className="font-medium text-theme-text">{cs.stats.attendanceDays}天</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-theme-text/70">平均工时</span>
                          <span className="font-medium text-theme-text">{cs.stats.averageWorkHours.toFixed(1)}小时/天</span>
                        </div>
                        {cs.stats.lastClockIn && (
                          <div className="flex justify-between items-center">
                            <span className="text-theme-text/70">最后打卡</span>
                            <span className="font-medium text-theme-text">
                              {format(new Date(cs.stats.lastClockIn), 'MM-dd HH:mm')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 时薪设置 */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-theme-text flex items-center">
                        <i className="fa-solid fa-dollar-sign mr-2 text-orange-600"></i>时薪设置
                      </h4>
                      <div className="space-y-3">
                        {cs.salary ? (
                          <>
                            <div className="text-center p-4 bg-orange-600/10 rounded-lg border border-orange-600/20">
                              <p className="text-3xl font-bold text-orange-600">¥{cs.salary.hourlyRate}</p>
                              <p className="text-sm text-theme-text/70">元/小时</p>
                            </div>
                            <div className="text-xs text-theme-text/60 space-y-1">
                              <p>更新时间: {cs.salary.updatedAt}</p>
                              <p>更新人: {cs.salary.updatedBy}</p>
                            </div>
                            <button
                              onClick={() => setEditingSalary({adminId: cs.user.id.toString(), hourlyRate: cs.salary!.hourlyRate})}
                              className="w-full px-3 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
                            >
                              <i className="fa-solid fa-edit mr-1"></i>调整时薪
                            </button>
                          </>
                        ) : (
                          <div className="text-center p-4 bg-gray-500/10 rounded-lg border border-gray-500/20">
                            <p className="text-theme-text/70 mb-2">未设置时薪</p>
                            <button
                              onClick={() => setEditingSalary({adminId: cs.user.id.toString(), hourlyRate: 0})}
                              className="px-3 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
                            >
                              <i className="fa-solid fa-plus mr-1"></i>设置时薪
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 最近打卡记录 */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-theme-text flex items-center">
                        <i className="fa-solid fa-clock mr-2 text-blue-600"></i>最近打卡
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {cs.recentAttendance.length > 0 ? (
                          cs.recentAttendance.map(record => (
                            <div key={record.id} className="p-3 bg-theme-background/50 rounded-lg border border-theme-border">
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-medium text-theme-text">{record.checkInTime}</span>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  record.status === 'checked_in' 
                                    ? 'bg-green-500/10 text-green-500' 
                                    : 'bg-gray-500/10 text-gray-500'
                                }`}>
                                  {record.status === 'checked_in' ? '已上班' : '已下班'}
                                </span>
                              </div>
                              <div className="text-xs text-theme-text/70 space-y-1">
                                <p>上班: {format(new Date(record.checkInTime), 'HH:mm:ss')}</p>
                                {record.checkOutTime && (
                                  <p>下班: {format(new Date(record.checkOutTime), 'HH:mm:ss')}</p>
                                )}
                                {record.workDuration && (
                                  <p>工时: {Math.floor(record.workDuration / 60)}小时{record.workDuration % 60}分钟</p>
                                )}
                                {record.totalEarnings && (
                                  <p className="text-green-600">收益: ¥{record.totalEarnings.toFixed(2)}</p>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-theme-text/50">
                            <i className="fa-solid fa-clock text-2xl mb-2"></i>
                            <p className="text-sm">暂无打卡记录</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 密码查看模态框 */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-theme-surface rounded-xl shadow-lg w-full max-w-md overflow-hidden border border-theme-border">
              <div className="p-5 border-b border-theme-border flex items-center justify-between">
                <h3 className="font-semibold text-theme-text">客服账号密码</h3>
                <button 
                  onClick={() => setShowPasswordModal(null)}
                  className="text-theme-text/70 hover:text-theme-text p-1"
                >
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>
              
              <div className="p-5">
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-start">
                    <i className="fa-solid fa-exclamation-triangle text-red-500 mr-2 mt-0.5"></i>
                    <div className="text-sm">
                      <p className="font-medium text-red-500">安全提醒</p>
                      <p className="text-red-500/80 mt-1">此为真实登录密码，请严格保密</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-theme-text mb-1">客服姓名</label>
                    <input
                      type="text"
                      value={showPasswordModal.name || showPasswordModal.username}
                      readOnly
                      className="w-full px-3 py-2 border border-theme-border rounded-lg bg-theme-background text-sm text-theme-text"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-theme-text mb-1">登录用户名</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={showPasswordModal.username}
                        readOnly
                        className="flex-1 px-3 py-2 border border-theme-border rounded-lg bg-theme-background text-sm text-theme-text"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(showPasswordModal.username);
                          toast.success('用户名已复制');
                        }}
                        className="px-3 py-2 text-sm text-theme-primary hover:text-theme-primary/80 border border-theme-primary/20 rounded-lg hover:bg-theme-primary/10"
                      >
                        复制
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-theme-text mb-1">登录密码</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={showPasswordModal.password || '未获取到密码'}
                        readOnly
                        className="flex-1 px-3 py-2 border border-theme-border rounded-lg bg-theme-background text-sm font-mono text-theme-text"
                      />
                      <button
                        onClick={() => {
                          if (showPasswordModal.password) {
                            navigator.clipboard.writeText(showPasswordModal.password);
                            toast.success('密码已复制');
                          }
                        }}
                        className="px-3 py-2 text-sm text-theme-primary hover:text-theme-primary/80 border border-theme-primary/20 rounded-lg hover:bg-theme-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!showPasswordModal.password}
                      >
                        复制
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setShowPasswordModal(null)}
                    className="px-4 py-2 bg-theme-primary text-white text-sm font-medium rounded-lg hover:bg-theme-primary/90 transition-colors"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>
          </div>
           </>
         )}

         {/* 打卡记录标签页 */}
         {activeTab === 'attendance' && (
           <div className="space-y-6">
             {/* 页面标题和操作栏 */}
             <div className="mb-8">
               <div className="flex items-center justify-between mb-4">
                 <div>
                   <h1 className="text-3xl font-bold text-theme-text mb-2">打卡记录管理</h1>
                   <p className="text-theme-text/70">查看所有客服的打卡记录，支持按日期筛选</p>
                 </div>
                 <div className="flex items-center gap-3">
                   <button
                     onClick={loadAllAttendanceRecords}
                     disabled={attendanceLoading}
                     className="px-4 py-2 bg-theme-primary text-white text-sm font-medium rounded-lg hover:bg-theme-primary/90 transition-colors disabled:opacity-50 flex items-center"
                   >
                     <i className="fa-solid fa-refresh mr-2"></i>
                     {attendanceLoading ? '刷新中...' : '刷新数据'}
                   </button>
                 </div>
               </div>

               {/* 搜索和过滤栏 */}
               <div className="bg-theme-surface rounded-xl border border-theme-border p-4">
                 <div className="flex flex-wrap items-center gap-4">
                   {/* 日期选择器 */}
                   <div className="flex items-center gap-2">
                     <label className="text-sm font-medium text-theme-text">选择日期:</label>
                     <DatePicker
                       selected={selectedDate}
                       onChange={(date: Date) => setSelectedDate(date)}
                       dateFormat="yyyy-MM-dd"
                       className="px-3 py-2 border border-theme-border bg-theme-background rounded-lg text-sm text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary"
                       placeholderText="选择日期"
                     />
                   </div>

                   {/* 搜索框 */}
                   <div className="flex-1 min-w-64">
                     <div className="relative">
                       <i className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-text/50"></i>
                       <input
                         type="text"
                         placeholder="搜索客服姓名..."
                         value={attendanceSearchTerm}
                         onChange={(e) => setAttendanceSearchTerm(e.target.value)}
                         className="w-full pl-10 pr-4 py-2 border border-theme-border bg-theme-background rounded-lg text-sm text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary"
                       />
                     </div>
                   </div>
                 </div>
               </div>
             </div>

             {/* 统计概览 */}
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
               <div className="bg-theme-surface rounded-xl border border-theme-border p-6">
                 <div className="flex items-center justify-between">
                   <div>
                     <p className="text-theme-text/70 text-sm">当日打卡人数</p>
                     <p className="text-2xl font-bold text-theme-text">{filteredAttendanceRecords.length}</p>
                   </div>
                   <div className="w-12 h-12 bg-blue-600/10 rounded-full flex items-center justify-center">
                     <i className="fa-solid fa-clock text-blue-600 text-xl"></i>
                   </div>
                 </div>
               </div>

               <div className="bg-theme-surface rounded-xl border border-theme-border p-6">
                 <div className="flex items-center justify-between">
                   <div>
                     <p className="text-theme-text/70 text-sm">已下班人数</p>
                     <p className="text-2xl font-bold text-green-500">
                       {filteredAttendanceRecords.filter(record => record.status === 'checked_out').length}
                     </p>
                   </div>
                   <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                     <i className="fa-solid fa-user-check text-green-500 text-xl"></i>
                   </div>
                 </div>
               </div>

               <div className="bg-theme-surface rounded-xl border border-theme-border p-6">
                 <div className="flex items-center justify-between">
                   <div>
                     <p className="text-theme-text/70 text-sm">仍在工作</p>
                     <p className="text-2xl font-bold text-orange-500">
                       {filteredAttendanceRecords.filter(record => record.status === 'checked_in').length}
                     </p>
                   </div>
                   <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                     <i className="fa-solid fa-user-clock text-orange-500 text-xl"></i>
                   </div>
                 </div>
               </div>

               <div className="bg-theme-surface rounded-xl border border-theme-border p-6">
                 <div className="flex items-center justify-between">
                   <div>
                     <p className="text-theme-text/70 text-sm">总工作时长</p>
                     <p className="text-2xl font-bold text-theme-primary">
                       {Math.round(filteredAttendanceRecords.reduce((sum, record) => sum + (record.workDuration || 0), 0) / 60)}h
                     </p>
                   </div>
                   <div className="w-12 h-12 bg-theme-primary/10 rounded-full flex items-center justify-center">
                     <i className="fa-solid fa-chart-line text-theme-primary text-xl"></i>
                   </div>
                 </div>
               </div>
             </div>

             {/* 打卡记录表格 */}
             <div className="bg-theme-surface rounded-xl border border-theme-border overflow-hidden">
               <div className="p-6 border-b border-theme-border">
                 <h3 className="text-lg font-semibold text-theme-text flex items-center">
                   <i className="fa-solid fa-table mr-2 text-theme-primary"></i>
                   {format(selectedDate, 'yyyy年MM月dd日')} 打卡记录
                 </h3>
               </div>

               {attendanceLoading ? (
                 <div className="p-12 text-center">
                   <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-theme-text bg-theme-background transition ease-in-out duration-150">
                     <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-theme-text" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     加载中...
                   </div>
                 </div>
               ) : filteredAttendanceRecords.length === 0 ? (
                 <div className="p-12 text-center">
                   <div className="text-theme-text/50 mb-4">
                     <i className="fa-solid fa-calendar-xmark text-4xl mb-4"></i>
                     <p className="text-xl font-medium text-theme-text">暂无打卡记录</p>
                     <p className="text-sm text-theme-text/70 mt-2">
                       {format(selectedDate, 'yyyy年MM月dd日')} 没有客服打卡记录
                     </p>
                   </div>
                 </div>
               ) : (
                 <div className="overflow-x-auto">
                   <table className="w-full">
                     <thead className="bg-theme-background/50">
                       <tr>
                         <th className="px-4 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">客服信息</th>
                         <th className="px-4 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">打卡时间</th>
                         <th className="px-4 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">工作时长</th>
                         <th className="px-4 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">时薪</th>
                         <th className="px-4 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">收益</th>
                         <th className="px-4 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">状态</th>
                         <th className="px-4 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">记录时间</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-theme-border">
                       {filteredAttendanceRecords.map(record => (
                         <tr key={record.id} className="hover:bg-theme-background/30 transition-colors">
                           {/* 客服信息 */}
                           <td className="px-4 py-4 whitespace-nowrap">
                             <div className="flex items-center">
                               <div className="w-10 h-10 bg-theme-primary/10 rounded-full flex items-center justify-center mr-3">
                          <i className="fa-solid fa-user text-theme-primary text-sm"></i>
                        </div>
                               <div>
                                 <div className="text-sm font-medium text-theme-text">{record.adminName}</div>
                                 <div className="text-xs text-theme-text/70">ID: {record.adminId}</div>
                               </div>
                             </div>
                           </td>
                           
                           {/* 打卡时间 */}
                           <td className="px-4 py-4 whitespace-nowrap">
                             <div className="space-y-1">
                               <div className="flex items-center text-xs">
                                 <i className="fa-solid fa-clock-rotate-left text-green-600 mr-1"></i>
                                 <span className="text-theme-text/70">上班:</span>
                                 <span className="ml-1 text-theme-text">
                                   {record.checkInTime ? format(new Date(record.checkInTime), 'HH:mm:ss') : '未打卡'}
                                 </span>
                               </div>
                               <div className="flex items-center text-xs">
                                 <i className="fa-solid fa-clock text-red-600 mr-1"></i>
                                 <span className="text-theme-text/70">下班:</span>
                                 <span className="ml-1 text-theme-text">
                                   {record.checkOutTime ? format(new Date(record.checkOutTime), 'HH:mm:ss') : 
                                    (record.status === 'checked_in' ? '工作中' : '未打卡')}
                                 </span>
                               </div>
                             </div>
                           </td>
                           
                           {/* 工作时长 */}
                           <td className="px-4 py-4 whitespace-nowrap">
                             <div className="text-sm font-medium text-theme-text">
                               {record.checkInTime && record.checkOutTime ? 
                                 (() => {
                                   const start = new Date(record.checkInTime);
                                   const end = new Date(record.checkOutTime);
                                   const diffMs = end.getTime() - start.getTime();
                                   const hours = Math.floor(diffMs / (1000 * 60 * 60));
                                   const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                                   return `${hours}h${minutes}m`;
                                 })() : 
                                 record.status === 'checked_in' ? '进行中...' : '-'
                               }
                             </div>
                           </td>
                           
                           {/* 时薪 */}
                           <td className="px-4 py-4 whitespace-nowrap">
                             <div className="text-sm font-medium text-theme-text">
                               ¥{record.hourlyRate}/h
                             </div>
                           </td>
                           
                           {/* 收益 */}
                           <td className="px-4 py-4 whitespace-nowrap">
                             <div className="text-sm font-medium text-green-600">
                               ¥{record.totalEarnings ? record.totalEarnings.toFixed(2) : '0.00'}
                             </div>
                           </td>
                           
                           {/* 状态 */}
                           <td className="px-4 py-4 whitespace-nowrap">
                             <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                               !record.checkInTime ? 'bg-gray-500/10 text-gray-500 border border-gray-500/20' :
                               record.status === 'checked_in' 
                                 ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' 
                                 : 'bg-green-500/10 text-green-500 border border-green-500/20'
                             }`}>
                               {!record.checkInTime ? '未打卡' : 
                                record.status === 'checked_in' ? '工作中' : '已下班'}
                             </span>
                           </td>
                           
                           {/* 记录时间 */}
                           <td className="px-4 py-4 whitespace-nowrap">
                             <div className="space-y-1">
                               <div className="text-xs text-theme-text/70">
                                 创建: {record.createdAt ? format(new Date(record.createdAt), 'MM-dd HH:mm') : '-'}
                               </div>
                               <div className="text-xs text-theme-text/70">
                                 更新: {record.updatedAt ? format(new Date(record.updatedAt), 'MM-dd HH:mm') : '-'}
                               </div>
                             </div>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               )}
             </div>
           </div>
         )}

        {/* 时薪编辑模态框 */}
        {editingSalary && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-theme-surface rounded-xl shadow-lg w-full max-w-md overflow-hidden border border-theme-border">
              <div className="p-5 border-b border-theme-border flex items-center justify-between">
                <h3 className="font-semibold text-theme-text">设置客服时薪</h3>
                <button 
                  onClick={() => setEditingSalary(null)}
                  className="text-theme-text/70 hover:text-theme-text p-1"
                >
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>
              
              <div className="p-5">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-theme-text mb-1">时薪 (元/小时)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingSalary.hourlyRate}
                    onChange={(e) => setEditingSalary({...editingSalary, hourlyRate: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-theme-border bg-theme-background rounded-lg text-sm text-theme-text focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="请输入时薪"
                  />
                </div>
                
                <div className="flex justify-end gap-3">
                  <button 
                    onClick={() => setEditingSalary(null)}
                    className="py-2 px-4 bg-theme-text/10 text-theme-text text-sm font-medium rounded-lg hover:bg-theme-text/20 transition-colors"
                  >
                    取消
                  </button>
                  <button 
                    onClick={handleUpdateSalary}
                    className="py-2 px-4 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 添加客服模态框 */}
        {isAddingCustomerService && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-theme-surface rounded-xl shadow-lg w-full max-w-md overflow-hidden border border-theme-border">
              <div className="p-5 border-b border-theme-border flex items-center justify-between">
                <h3 className="font-semibold text-theme-text">添加客服账号</h3>
                <button 
                  onClick={() => setIsAddingCustomerService(false)}
                  className="text-theme-text/70 hover:text-theme-text p-1"
                >
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>
              
              <div className="p-5">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-theme-text mb-1">用户名</label>
                  <input
                    type="text"
                    value={newCustomerService.username}
                    onChange={(e) => setNewCustomerService({...newCustomerService, username: e.target.value})}
                    className="w-full px-4 py-2 border border-theme-border bg-theme-background rounded-lg text-sm text-theme-text focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="请输入客服用户名或编号"
                  />
                  <p className="text-xs text-theme-text/70 mt-1">
                    提示：输入数字（如"1"、"01"）将自动生成"客服01"格式的昵称
                  </p>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-theme-text mb-1">角色</label>
                  <select
                    value={newCustomerService.role}
                    onChange={(e) => setNewCustomerService({...newCustomerService, role: e.target.value})}
                    className="w-full px-4 py-2 border border-theme-border bg-theme-background rounded-lg text-sm text-theme-text focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled
                  >
                    <option value="customer_service">客服</option>
                  </select>
                </div>
                
                <div className="flex justify-end gap-3">
                  <button 
                    onClick={() => setIsAddingCustomerService(false)}
                    className="py-2 px-4 bg-theme-text/10 text-theme-text text-sm font-medium rounded-lg hover:bg-theme-text/20 transition-colors"
                  >
                    取消
                  </button>
                  <button 
                    onClick={handleAddCustomerService}
                    className="py-2 px-4 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    添加
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}