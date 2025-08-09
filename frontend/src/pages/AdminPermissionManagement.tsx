import Header from "@/components/Header";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { format } from 'date-fns';

// 时区转换工具函数 - 将UTC时间转换为中国时间
const formatToChinaTime = (dateString: string | null | undefined, formatStr: string = 'yyyy-MM-dd HH:mm:ss'): string => {
  if (!dateString) return '-';
  
  try {
    // 创建Date对象（假设输入是UTC时间）
    const utcDate = new Date(dateString);
    
    // 转换为中国时间（UTC+8）
    const chinaTime = new Date(utcDate.getTime() + (8 * 60 * 60 * 1000));
    
    return format(chinaTime, formatStr);
  } catch (error) {
    console.error('时间格式化错误:', error);
    return dateString;
  }
};
import {
  getAdmins,
  getAdminCredentials,
  createAdmin,
  deleteAdmin,

  getCustomerServiceSalaries,
  updateCustomerServiceSalary,
  getGlobalHourlyRate,
  setGlobalHourlyRate,
  updateAdminPassword,
  Admin,
  AdminCredentials,
  CustomerServiceSalary
} from '@/services/permissionService';
import { customerServiceApi } from '@/api/customerService';
import attendanceService from '@/services/attendanceService';
import superUnifiedAttendanceService from '@/services/superUnifiedAttendanceService';
import type { AttendanceRecord } from '@/services/attendanceService';

// 获取角色样式
const getRoleStyle = (role: Admin['role']) => {
  switch(role) {
    case 'super_admin':
      return { 
        className: "bg-purple-500/10 text-purple-500", 
        label: "超级管理员" 
      };
    case 'shareholder':
      return { 
        className: "bg-blue-500/10 text-blue-500", 
        label: "股东" 
      };
    case 'customer_service':
      return { 
        className: "bg-green-500/10 text-green-500", 
        label: "客服" 
      };
    default:
      return { 
        className: "bg-gray-500/10 text-gray-500", 
        label: "未知角色" 
      };
  }
};

export default function AdminPermissionManagement() {
  // 计算工作时长的辅助函数
  const calculateWorkDuration = (clockInTime: string | null, clockOutTime: string | null): string => {
    if (!clockInTime) return '-';
    if (!clockOutTime) return '工作中';
    
    try {
      const inTime = new Date(clockInTime).getTime();
      const outTime = new Date(clockOutTime).getTime();
      
      // 检查时间是否有效
      if (isNaN(inTime) || isNaN(outTime)) {
        return '时间格式错误';
      }
      
      // 检查时间逻辑是否正确
      if (outTime <= inTime) {
        return '时间异常';
      }
      
      // 计算分钟数
      const minutes = Math.floor((outTime - inTime) / (1000 * 60));
      
      // 格式化显示
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      
      if (hours > 0) {
        return `${hours}小时${remainingMinutes}分钟`;
      } else {
        return `${remainingMinutes}分钟`;
      }
    } catch (error) {
      console.error('计算工作时长时出错:', error);
      return '计算错误';
    }
  };

  // 获取工作时长显示文本
  const getWorkDurationDisplay = (record: AttendanceRecord): string => {
    // 优先使用后端返回的 work_hours (小时数)
    if (record.work_hours && record.work_hours > 0) {
      const totalMinutes = Math.round(record.work_hours * 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      
      if (hours > 0) {
        return `${hours}小时${minutes}分钟`;
      } else {
        return `${minutes}分钟`;
      }
    }
    
    // 后端数据缺失时，使用前端计算
    return calculateWorkDuration(record.clock_in_time, record.clock_out_time);
  };

  // 所有状态
  const [admins, setAdmins] = useState<Admin[]>([]);
    const [adminCredentials, setAdminCredentials] = useState<AdminCredentials[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
  const [credentialsLoading, setCredentialsLoading] = useState(false);
  const [credentialsError, setCredentialsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'admins' | 'attendance' | 'salary'>('admins');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    username: "",
    phone: "",
    role: "customer_service"
  });
  const [newAdminInfo, setNewAdminInfo] = useState<{username: string, phone: string, password: string} | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [selectedAdminForAttendance, setSelectedAdminForAttendance] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]); // 默认今天
  const [customerServiceSalaries, setCustomerServiceSalaries] = useState<CustomerServiceSalary[]>([]);
  const [salaryLoading, setSalaryLoading] = useState(false);
  const [salaryError, setSalaryError] = useState<string | null>(null);
  const [editingSalary, setEditingSalary] = useState<{adminId: string, hourlyRate: number} | null>(null);
  const [globalHourlyRate, setGlobalHourlyRateState] = useState<number>(20);
  const [isUpdatingGlobalHourlyRate, setIsUpdatingGlobalHourlyRate] = useState(false);
  const [editingPasswordAdmin, setEditingPasswordAdmin] = useState<Admin | null>(null);
  const [newPassword, setNewPassword] = useState('');
  
  // Fetch admins on component mount
  useEffect(() => {
    loadAdmins();
  }, []);
  


  // Fetch data when switching tabs
  useEffect(() => {
    if (activeTab === 'attendance') {
      loadAttendanceRecords();
    } else if (activeTab === 'salary') {
      loadCustomerServiceSalaries();
      loadGlobalHourlyRate();
    }
  }, [activeTab]);

  // Reload attendance records when date or admin selection changes
  useEffect(() => {
    if (activeTab === 'attendance') {
      loadAttendanceRecords(selectedAdminForAttendance, selectedDate);
    }
  }, [selectedDate, selectedAdminForAttendance]);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [adminsData, credentialsData] = await Promise.all([
        getAdmins(),
        getAdminCredentials()
      ]);
      setAdmins(Array.isArray(adminsData) ? adminsData : []);
      setAdminCredentials(Array.isArray(credentialsData) ? credentialsData : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取管理员列表失败';
      setError(errorMessage);
      console.error('Failed to fetch admins:', err);
      setAdmins([]);
      setAdminCredentials([]);
    } finally {
      setLoading(false);
    }
  };



  const loadAdminCredentials = async () => {
    try {
      setCredentialsLoading(true);
      setCredentialsError(null);
      
      const data = await getAdminCredentials();
      setAdminCredentials(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取管理员凭据失败';
      setCredentialsError(errorMessage);
      console.error('Failed to fetch admin credentials:', err);
      setAdminCredentials([]);
    } finally {
      setCredentialsLoading(false);
    }
  };

  const loadAttendanceRecords = async (adminId?: string, date?: string) => {
    try {
      setAttendanceLoading(true);
      setAttendanceError(null);
      
      // 管理员使用getAllAttendanceRecords方法获取所有打卡记录
      // 如果指定了日期，则查询该日期的记录
      const targetDate = date || selectedDate;
      const startDate = targetDate || undefined;
      const endDate = targetDate || undefined;
      
      console.log('Loading attendance records with params:', { adminId, startDate, endDate, targetDate, selectedDate });
      
      const data = await attendanceService.getAllAttendanceRecords(1, 1000, startDate, endDate);
      console.log('Received attendance data:', data);
      
      let records = Array.isArray(data.records) ? data.records : [];
      
      // 如果指定了特定客服，在前端进行额外筛选
      if (adminId && adminId !== 'all') {
        records = records.filter(record => {
          const recordAdminId = record.admin_id?.toString() || record.adminId?.toString() || record.customer_service_id?.toString();
          return recordAdminId === adminId;
        });
        console.log('Filtered records for admin:', adminId, records);
      }
      
      setAttendanceRecords(records);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取打卡记录失败';
      setAttendanceError(errorMessage);
      console.error('Failed to fetch attendance records:', err);
      setAttendanceRecords([]);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const loadCustomerServiceSalaries = async () => {
    try {
      setSalaryLoading(true);
      setSalaryError(null);
      
      const data = await getCustomerServiceSalaries();
      setCustomerServiceSalaries(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取客服时薪失败';
      setSalaryError(errorMessage);
      console.error('Failed to fetch customer service salaries:', err);
      setCustomerServiceSalaries([]);
    } finally {
      setSalaryLoading(false);
    }
  };

  const loadGlobalHourlyRate = async () => {
    try {
      const data = await getGlobalHourlyRate();
      if (data) {
        setGlobalHourlyRateState(data.hourly_rate);
      }
    } catch (error) {
      console.error('获取全局时薪设置失败:', error);
    }
  };

  const updateGlobalHourlyRate = async () => {
    if (!globalHourlyRate || globalHourlyRate <= 0) {
      toast.error('请输入有效的时薪金额');
      return;
    }

    setIsUpdatingGlobalHourlyRate(true);
    try {
      await setGlobalHourlyRate(globalHourlyRate);
      toast.success('全局时薪设置成功');
    } catch (error) {
      console.error('设置全局时薪失败:', error);
      toast.error('设置失败，请重试');
    } finally {
      setIsUpdatingGlobalHourlyRate(false);
    }
  };
  

  
  const handleAddAdmin = async () => {
    if (!newAdmin.username.trim()) {
      toast.error("请输入管理员用户名");
      return;
    }
    
    if (!newAdmin.phone.trim()) {
      toast.error("请输入手机号");
      return;
    }
    
    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(newAdmin.phone.trim())) {
      toast.error("请输入正确的手机号格式");
      return;
    }
    
    if (admins.some(admin => admin.username === newAdmin.username)) {
      toast.error("用户名已存在");
      return;
    }
    
    try {
      const admin = await createAdmin({
        username: newAdmin.username.trim(),
        phone: newAdmin.phone.trim(),
        role: newAdmin.role as 'customer_service'
      });
      
      setIsAddingAdmin(false);
      setNewAdmin({ username: "", phone: "", role: "customer_service" });
      
      if (admin.password) {
        setNewAdminInfo({
          username: admin.username,
          phone: admin.phone || newAdmin.phone.trim(),
          password: admin.password
        });
      }
      
      // 重新加载完整的管理员列表和凭据
      await loadAdmins();
      
      toast.success("客服账号添加成功");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '添加管理员失败';
      console.error('Failed to add admin:', err);
      toast.error(errorMessage);
    }
  };

  const handleUpdateSalary = async () => {
    if (!editingSalary) return;
    
    if (editingSalary.hourlyRate <= 0) {
      toast.error("时薪必须大于0");
      return;
    }
    
    try {
      const updatedSalary = await updateCustomerServiceSalary(editingSalary.adminId, editingSalary.hourlyRate);
      
      setCustomerServiceSalaries(prev => 
        prev.map(salary => 
          salary.adminId === editingSalary.adminId 
            ? updatedSalary 
            : salary
        )
      );
      
      setEditingSalary(null);
      toast.success("时薪更新成功");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新时薪失败';
      console.error('Failed to update salary:', err);
      toast.error(errorMessage);
    }
  };

  const handleUpdatePassword = async () => {
    if (!editingPasswordAdmin) return;
    
    if (!newPassword.trim()) {
      toast.error("请输入新密码");
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error("密码长度至少6位");
      return;
    }
    
    try {
      // 使用客服API修改密码
      await customerServiceApi.admin.updateCustomerServicePassword(parseInt(editingPasswordAdmin.id), newPassword);
      
      setEditingPasswordAdmin(null);
      setNewPassword('');
      toast.success("密码修改成功");
      
      // 重新加载管理员列表和凭据信息以显示更新后的密码
      await loadAdmins();
      await loadAdminCredentials();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '修改密码失败';
      console.error('Failed to update password:', err);
      toast.error(errorMessage);
    }
  };

  const handleDeleteAdmin = async (adminId: number) => {
    if (!confirm('确定要注销这个客服账号吗？此操作不可撤销。')) {
      return;
    }
    
    try {
      console.log('正在注销客服账号，ID:', adminId);
      const result = await deleteAdmin(String(adminId));
      console.log('注销API调用结果:', result);
      
      await loadAdmins(); // 重新加载管理员列表
      toast.success("客服账号注销成功");
    } catch (err) {
      console.error('注销客服账号失败，详细错误:', err);
      
      let errorMessage = '注销客服账号失败';
      if (err instanceof Error) {
        errorMessage = err.message;
        console.error('错误消息:', err.message);
        console.error('错误堆栈:', err.stack);
      }
      
      // 检查是否是网络错误
      if (errorMessage.includes('fetch')) {
        errorMessage = '网络连接失败，请检查后端服务是否正常运行';
      } else if (errorMessage.includes('401')) {
        errorMessage = '权限不足，请重新登录';
      } else if (errorMessage.includes('404')) {
        errorMessage = '客服账号不存在或已被删除';
      } else if (errorMessage.includes('500')) {
        errorMessage = '服务器内部错误，请联系管理员';
      }
      
      toast.error(errorMessage);
    }
  };
  
  return (
    <>
      <div className="bg-theme-background min-h-screen text-theme-text">
        <Header />
        
        <main className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-theme-text mb-2">客服管理</h1>
            <p className="text-theme-text/70">管理客服账号、打卡记录和时薪设置</p>
          </div>
          
          {/* 标签页切换 */}
          <div className="mb-6">
            <div className="inline-flex bg-theme-surface border border-theme-border rounded-lg p-1">
              <button
                onClick={() => setActiveTab('admins')}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'admins' 
                    ? 'bg-purple-600 text-white shadow-sm' 
                    : 'text-theme-text/70 hover:text-theme-text'
                }`}
              >
                <i className="fa-solid fa-users mr-2"></i>客服管理
              </button>
              <button
                onClick={() => setActiveTab('attendance')}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'attendance' 
                    ? 'bg-purple-600 text-white shadow-sm' 
                    : 'text-theme-text/70 hover:text-theme-text'
                }`}
              >
                <i className="fa-solid fa-clock mr-2"></i>打卡记录
              </button>
              <button
                onClick={() => setActiveTab('salary')}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'salary' 
                    ? 'bg-purple-600 text-white shadow-sm' 
                    : 'text-theme-text/70 hover:text-theme-text'
                }`}
              >
                <i className="fa-solid fa-dollar-sign mr-2"></i>薪资管理
              </button>
            </div>
          </div>

          {/* 标签页内容 */}
          
          {/* 管理员管理标签内容 */}
          {activeTab === 'admins' && (
            <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border overflow-hidden">
              <div className="p-5 border-b border-theme-border flex items-center justify-between">
                <h2 className="font-semibold text-theme-text">客服账号管理</h2>
                <button 
                  onClick={() => setIsAddingAdmin(true)}
                  className="py-2 px-4 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                >
                  <i className="fa-solid fa-plus mr-2"></i>添加客服账号
                </button>
              </div>
              
              {loading && (
                <div className="flex justify-center items-center py-12 bg-theme-surface">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <span className="ml-2 text-theme-text/70">加载中...</span>
                </div>
              )}
              
              {error && (
                <div className="text-center py-12 bg-theme-surface">
                  <div className="text-red-500 mb-4">
                    <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-lg font-medium text-theme-text">加载失败</p>
                    <p className="text-sm text-theme-text/70 mt-1">{error}</p>
                  </div>
                  <button
                    onClick={loadAdmins}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    重试
                  </button>
                </div>
              )}
              
              {!loading && !error && (
                <>
                  {admins.filter(admin => admin.role === 'customer_service').length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-theme-text/60 mb-4">
                        <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                        <p className="text-lg font-medium text-theme-text">暂无客服</p>
                        <p className="text-sm text-theme-text/50 mt-1">点击上方按钮添加第一个客服账号</p>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-theme-surface border-b border-theme-border">
                            <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">用户名</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">手机号</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">密码</th>

                            <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">创建时间</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-theme-border">
                          {admins.filter(admin => admin.role === 'customer_service').map((admin, index) => {
                            // 从凭据数据中查找对应的密码信息
                            const credential = adminCredentials.find(cred => cred.id === admin.id);
                            const password = credential?.password || '密码未设置';
                            
                            return (
                              <tr key={`admin-${admin.id}-${admin.username}-${index}`} className="hover:bg-theme-surface/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="w-10 h-10 bg-purple-600/10 rounded-full flex items-center justify-center mr-3">
                                      <i className="fa-solid fa-user text-purple-600"></i>
                                    </div>
                                    <div className="font-medium text-theme-text text-sm">{admin.id}</div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-theme-text text-sm">{admin.username}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-theme-text text-sm">{credential?.phone || admin.phone || '未设置'}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-theme-text text-sm font-mono bg-theme-background/50 px-2 py-1 rounded border">
                                      {password}
                                    </span>
                                    {credential?.password && credential.password !== '密码未设置' && (
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(credential.password);
                                          toast.success('密码已复制到剪贴板');
                                        }}
                                        className="text-purple-500 hover:text-purple-400 text-xs px-2 py-1 rounded transition-colors"
                                        title="复制密码"
                                      >
                                        <i className="fa-solid fa-copy"></i>
                                      </button>
                                    )}
                                    <button
                                      onClick={() => {
                                        setEditingPasswordAdmin(admin);
                                        setNewPassword('');
                                      }}
                                      className="text-blue-500 hover:text-blue-400 text-xs px-2 py-1 rounded transition-colors"
                                      title="修改密码"
                                    >
                                      <i className="fa-solid fa-edit"></i>
                                    </button>
                                  </div>
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">
                                  {admin.createdAt ? formatToChinaTime(admin.createdAt, 'yyyy-MM-dd HH:mm:ss') : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex items-center space-x-2">

                                    <button
                                      onClick={() => handleDeleteAdmin(Number(admin.id))}
                                      className="px-3 py-1 rounded text-xs font-medium transition-colors bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                      title="注销账号"
                                    >
                                      <i className="fa-solid fa-trash mr-1"></i>注销
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          
          {/* 所有模态框和条件渲染块 */}
          {/* 添加管理员模态框 */}
          {isAddingAdmin && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-theme-surface rounded-xl shadow-lg w-full max-w-md overflow-hidden border border-theme-border">
                <div className="p-5 border-b border-theme-border flex items-center justify-between">
                  <h3 className="font-semibold text-theme-text">添加客服账号</h3>
                  <button 
                    onClick={() => setIsAddingAdmin(false)}
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
                      value={newAdmin.username}
                      onChange={(e) => setNewAdmin({...newAdmin, username: e.target.value})}
                      className="w-full px-4 py-2 border border-theme-border bg-theme-background rounded-lg text-sm text-theme-text focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="请输入用户名"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-theme-text mb-1">手机号</label>
                    <input
                      type="tel"
                      value={newAdmin.phone}
                      onChange={(e) => setNewAdmin({...newAdmin, phone: e.target.value})}
                      className="w-full px-4 py-2 border border-theme-border bg-theme-background rounded-lg text-sm text-theme-text focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="请输入手机号"
                    />
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => setIsAddingAdmin(false)}
                      className="py-2 px-4 bg-theme-text/10 text-theme-text text-sm font-medium rounded-lg hover:bg-theme-text/20 transition-colors"
                    >
                      取消
                    </button>
                    <button 
                      onClick={handleAddAdmin}
                      className="py-2 px-4 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      添加
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* 显示新创建客服账号信息的模态框 */}
          {newAdminInfo && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-theme-surface rounded-xl shadow-lg w-full max-w-md overflow-hidden border border-theme-border">
                <div className="p-5 border-b border-theme-border flex items-center justify-between">
                  <h3 className="font-semibold text-theme-text">客服账号创建成功</h3>
                  <button 
                    onClick={() => setNewAdminInfo(null)}
                    className="text-theme-text/70 hover:text-theme-text p-1"
                  >
                    <i className="fa-solid fa-times"></i>
                  </button>
                </div>
                
                <div className="p-5">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
                    <div className="flex items-center mb-2">
                      <i className="fa-solid fa-check-circle text-green-500 mr-2"></i>
                      <span className="text-green-500 font-medium">账号创建成功！</span>
                    </div>
                    <p className="text-green-500/80 text-sm">请将以下登录信息告知客服人员：</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="bg-theme-background/50 rounded-lg p-3 border border-theme-border">
                      <label className="block text-sm font-medium text-theme-text mb-1">登录用户名</label>
                      <div className="flex items-center justify-between">
                        <span className="text-theme-text font-mono">{newAdminInfo.username}</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(newAdminInfo.username)}
                          className="text-purple-500 hover:text-purple-400 text-sm px-2 py-1 rounded transition-colors"
                        >
                          <i className="fa-solid fa-copy mr-1"></i>复制
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-theme-background/50 rounded-lg p-3 border border-theme-border">
                      <label className="block text-sm font-medium text-theme-text mb-1">手机号</label>
                      <div className="flex items-center justify-between">
                        <span className="text-theme-text font-mono">{newAdminInfo.phone}</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(newAdminInfo.phone)}
                          className="text-purple-500 hover:text-purple-400 text-sm px-2 py-1 rounded transition-colors"
                        >
                          <i className="fa-solid fa-copy mr-1"></i>复制
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-theme-background/50 rounded-lg p-3 border border-theme-border">
                      <label className="block text-sm font-medium text-theme-text mb-1">登录密码</label>
                      <div className="flex items-center justify-between">
                        <span className="text-theme-text font-mono">{newAdminInfo.password}</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(newAdminInfo.password)}
                          className="text-purple-500 hover:text-purple-400 text-sm px-2 py-1 rounded transition-colors"
                        >
                          <i className="fa-solid fa-copy mr-1"></i>复制
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`登录用户名: ${newAdminInfo.username}\n手机号: ${newAdminInfo.phone}\n登录密码: ${newAdminInfo.password}`);
                        toast.success('登录信息已复制到剪贴板');
                      }}
                      className="py-2 px-4 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                    >
                      <i className="fa-solid fa-copy mr-2"></i>复制全部信息
                    </button>
                    <button 
                      onClick={() => setNewAdminInfo(null)}
                      className="py-2 px-4 bg-theme-text/10 text-theme-text text-sm font-medium rounded-lg hover:bg-theme-text/20 transition-colors"
                    >
                      我已保存，关闭
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 修改密码模态框 */}
          {editingPasswordAdmin && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-theme-surface rounded-xl shadow-lg w-full max-w-md overflow-hidden border border-theme-border">
                <div className="p-5 border-b border-theme-border flex items-center justify-between">
                  <h3 className="font-semibold text-theme-text">修改密码</h3>
                  <button 
                    onClick={() => {
                      setEditingPasswordAdmin(null);
                      setNewPassword('');
                    }}
                    className="text-theme-text/70 hover:text-theme-text p-1"
                  >
                    <i className="fa-solid fa-times"></i>
                  </button>
                </div>
                
                <div className="p-5">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-theme-text mb-1">客服账号</label>
                    <div className="px-4 py-2 bg-theme-background/50 border border-theme-border rounded-lg text-sm text-theme-text">
                      {editingPasswordAdmin.username}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-theme-text mb-1">新密码</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-theme-border bg-theme-background rounded-lg text-sm text-theme-text focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="请输入新密码（至少6位）"
                    />
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => {
                        setEditingPasswordAdmin(null);
                        setNewPassword('');
                      }}
                      className="py-2 px-4 bg-theme-text/10 text-theme-text text-sm font-medium rounded-lg hover:bg-theme-text/20 transition-colors"
                    >
                      取消
                    </button>
                    <button 
                      onClick={handleUpdatePassword}
                      className="py-2 px-4 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      确认修改
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 打卡记录标签内容 */}
          {activeTab === 'attendance' && (
            <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border overflow-hidden">
              <div className="p-5 border-b border-theme-border">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-theme-text flex items-center">
                      <i className="fa-solid fa-clock mr-2 text-purple-600"></i>
                      打卡记录
                    </h2>
                    <p className="text-sm text-theme-text/70 mt-1">查看客服的打卡记录和工作时长</p>
                  </div>
                  
                  {/* 筛选条件 */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-theme-background/50 p-4 rounded-lg border border-theme-border">
                    <div className="flex items-center gap-2 min-w-0">
                      <label className="text-sm font-medium text-theme-text whitespace-nowrap flex items-center">
                        <i className="fa-solid fa-calendar-days mr-1 text-purple-600"></i>
                        日期:
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="px-3 py-2 pr-8 border border-theme-border bg-theme-background rounded-lg text-sm text-theme-text focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-purple-400 min-w-[140px]"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                          <i className="fa-solid fa-calendar text-theme-text/40 text-xs"></i>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 min-w-0">
                      <label className="text-sm font-medium text-theme-text whitespace-nowrap flex items-center">
                        <i className="fa-solid fa-user mr-1 text-purple-600"></i>
                        客服:
                      </label>
                      <div className="relative">
                        <select
                          value={selectedAdminForAttendance}
                          onChange={(e) => setSelectedAdminForAttendance(e.target.value)}
                          className="px-3 py-2 pr-8 border border-theme-border bg-theme-background rounded-lg text-sm text-theme-text focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-purple-400 appearance-none cursor-pointer min-w-[120px]"
                        >
                          <option value="all">所有客服</option>
                          {admins.filter(admin => admin.role === 'customer_service').map((admin, index) => (
                            <option key={`admin-option-${admin.id}-${admin.username}-${index}`} value={admin.id}>{admin.username}</option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                          <i className="fa-solid fa-chevron-down text-theme-text/40 text-xs"></i>
                        </div>
                      </div>
                    </div>
                    
                    {/* 快速操作按钮 */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                        className="px-2 py-1.5 text-xs font-medium bg-purple-600/10 text-purple-600 rounded-md hover:bg-purple-600/20 transition-colors whitespace-nowrap"
                        title="查看今天"
                      >
                        今天
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDate('');
                          setSelectedAdminForAttendance('all');
                        }}
                        className="px-2 py-1.5 text-xs font-medium bg-gray-600/10 text-gray-600 rounded-md hover:bg-gray-600/20 transition-colors whitespace-nowrap"
                        title="清空筛选"
                      >
                        <i className="fa-solid fa-refresh mr-1"></i>
                        重置
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {attendanceLoading && (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <span className="ml-2 text-theme-text/70">加载中...</span>
                </div>
              )}
              
              {attendanceError && (
                <div className="text-center py-12">
                  <div className="text-red-500 mb-4">
                    <p className="text-lg font-medium text-theme-text">加载失败</p>
                    <p className="text-sm text-theme-text/70 mt-1">{attendanceError}</p>
                  </div>
                  <button
                    onClick={() => loadAttendanceRecords(undefined, selectedDate)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    重试
                  </button>
                </div>
              )}
              
              {!attendanceLoading && !attendanceError && (
                <>
                  {(() => {
                    // 直接使用已经筛选过的记录
                    const filteredRecords = attendanceRecords;

                    if (filteredRecords.length === 0) {
                      return (
                        <div className="text-center py-12">
                          <div className="text-theme-text/60 mb-4">
                            <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                            <p className="text-lg font-medium text-theme-text">暂无打卡记录</p>
                            <p className="text-sm text-theme-text/50 mt-1">
                              {selectedAdminForAttendance !== 'all' 
                                ? '该客服在选定日期没有打卡记录' 
                                : '选定日期没有任何打卡记录'}
                            </p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="overflow-x-auto">
                        <div className="px-6 py-3 bg-theme-surface/50 border-b border-theme-border">
                          <p className="text-sm text-theme-text/70">
                            共找到 <span className="font-medium text-theme-text">{filteredRecords.length}</span> 条打卡记录
                          </p>
                        </div>
                        <table className="w-full">
                          <thead>
                            <tr className="bg-theme-surface border-b border-theme-border">
                              <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">客服</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">日期</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">打卡时间</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">下班时间</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">工作时长</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">时薪</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">收入</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">状态</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-theme-border">
                            {filteredRecords.map((record, index) => (
                              <tr key={`attendance-${record.id || record.history_id || index}-${record.date || record.clock_in_time || index}`} className="hover:bg-theme-surface/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-purple-600/10 rounded-full flex items-center justify-center mr-3">
                                  <i className="fa-solid fa-user text-purple-600 text-sm"></i>
                                </div>
                                <span className="font-medium text-theme-text text-sm">{record.admin_name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">
                              {superUnifiedAttendanceService.formatDate(record.date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">
                              {record.clock_in_time ? formatToChinaTime(record.clock_in_time, 'HH:mm:ss') : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">
                              {record.clock_out_time ? formatToChinaTime(record.clock_out_time, 'HH:mm:ss') : '未下班'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">
                              {getWorkDurationDisplay(record)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">
                              ¥{record.hourly_rate || 20}/小时
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text font-medium">
                              <span className="text-green-600">¥{(Number(record.earnings) || Number(record.total_earnings) || 0).toFixed(2)}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                record.status === 'clocked_in' 
                                  ? 'bg-green-500/10 text-green-500' 
                                  : record.status === 'clocked_out'
                                  ? 'bg-blue-500/10 text-blue-500'
                                  : 'bg-gray-500/10 text-gray-500'
                              }`}>
                                {record.status === 'clocked_in' ? '工作中' : 
                                 record.status === 'clocked_out' ? '已完成' : '未打卡'}
                              </span>
                            </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          )}

          {/* 时薪管理标签内容 */}
          {activeTab === 'salary' && (
            <div className="space-y-6">
              {/* 全局时薪设置 */}
              <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border overflow-hidden">
                <div className="p-5 border-b border-theme-border">
                  <h2 className="font-semibold text-theme-text">全局时薪设置</h2>
                  <p className="text-sm text-theme-text/70 mt-1">设置新客服的默认时薪标准</p>
                </div>
                
                <div className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-theme-text mb-2">默认时薪 (元/小时)</label>
                      <input
                        type="number"
                        value={globalHourlyRate}
                        onChange={(e) => setGlobalHourlyRateState(Number(e.target.value))}
                        className="w-full px-4 py-2 border border-theme-border bg-theme-background rounded-lg text-sm text-theme-text focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="请输入时薪金额"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <button
                      onClick={updateGlobalHourlyRate}
                      disabled={isUpdatingGlobalHourlyRate}
                      className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {isUpdatingGlobalHourlyRate ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          保存中...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-save mr-2"></i>
                          保存设置
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* 客服时薪管理 */}
              <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border overflow-hidden">
                <div className="p-5 border-b border-theme-border">
                  <h2 className="font-semibold text-theme-text">客服时薪管理</h2>
                  <p className="text-sm text-theme-text/70 mt-1">管理每个客服的个人时薪设置</p>
                </div>
                
                {salaryLoading && (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    <span className="ml-2 text-theme-text/70">加载中...</span>
                  </div>
                )}
                
                {salaryError && (
                  <div className="text-center py-12">
                    <div className="text-red-500 mb-4">
                      <p className="text-lg font-medium text-theme-text">加载失败</p>
                      <p className="text-sm text-theme-text/70 mt-1">{salaryError}</p>
                    </div>
                    <button
                      onClick={loadCustomerServiceSalaries}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      重试
                    </button>
                  </div>
                )}
                
                {!salaryLoading && !salaryError && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-theme-surface border-b border-theme-border">
                          <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">客服</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">当前时薪</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-theme-border">
                          {customerServiceSalaries.map((salary, index) => (
                            <tr key={`salary-${salary.adminId}-${salary.username}-${index}`} className="hover:bg-theme-surface/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-purple-600/10 rounded-full flex items-center justify-center mr-3">
                                  <i className="fa-solid fa-user text-purple-600 text-sm"></i>
                                </div>
                                <span className="font-medium text-theme-text text-sm">{salary.adminName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {editingSalary?.adminId === salary.adminId ? (
                                <input
                                  type="number"
                                  value={editingSalary.hourlyRate}
                                  onChange={(e) => setEditingSalary({...editingSalary, hourlyRate: Number(e.target.value)})}
                                  className="w-20 px-2 py-1 border border-theme-border bg-theme-background rounded text-sm text-theme-text focus:outline-none focus:ring-1 focus:ring-purple-500"
                                  min="0"
                                  step="0.01"
                                />
                              ) : (
                                <span className="text-theme-text font-medium">¥{salary.hourlyRate}/小时</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {editingSalary?.adminId === salary.adminId ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={handleUpdateSalary}
                                    className="text-green-600 hover:text-green-500 px-2 py-1 rounded transition-colors"
                                  >
                                    <i className="fa-solid fa-check"></i>
                                  </button>
                                  <button
                                    onClick={() => setEditingSalary(null)}
                                    className="text-red-600 hover:text-red-500 px-2 py-1 rounded transition-colors"
                                  >
                                    <i className="fa-solid fa-times"></i>
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setEditingSalary({adminId: salary.adminId, hourlyRate: salary.hourlyRate})}
                                  className="text-purple-600 hover:text-purple-500 px-2 py-1 rounded transition-colors"
                                >
                                  <i className="fa-solid fa-edit mr-1"></i>编辑
                                </button>
                              )}
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
        </main>
      </div>
    </>
  );
}