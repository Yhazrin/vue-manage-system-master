import Header from "@/components/Header";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { format } from 'date-fns';
import {
  getAdmins,
  getAdminCredentials,
  createAdmin,
  toggleAdminStatus as toggleAdminStatusAPI,
  getOperationLogs,
  getCustomerServiceSalaries,
  updateCustomerServiceSalary,
  getGlobalHourlyRate,
  setGlobalHourlyRate,
  Admin,
  AdminCredentials,
  OperationLog,
  CustomerServiceSalary
} from '@/services/permissionService';
import { attendanceService, AttendanceRecord } from '@/services/attendanceService';

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

// 获取状态样式
const getStatusStyle = (status: Admin['status']) => {
  switch(status) {
    case 'active':
      return { 
        className: "bg-green-500/10 text-green-500", 
        label: "正常" 
      };
    case 'inactive':
      return { 
        className: "bg-red-500/10 text-red-500", 
        label: "禁用" 
      };
    default:
      return { 
        className: "bg-gray-500/10 text-gray-500", 
        label: "未知状态" 
      };
  }
};

export default function AdminPermissionManagement() {
  // 所有状态
  const [admins, setAdmins] = useState<Admin[]>([]);
    const [adminCredentials, setAdminCredentials] = useState<AdminCredentials[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
  const [operationLogs, setOperationLogs] = useState<OperationLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'admins' | 'logs' | 'attendance' | 'salary'>('admins');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    username: "",
    role: "customer_service"
  });
  const [newAdminInfo, setNewAdminInfo] = useState<{username: string, nickname: string, password: string} | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [selectedAdminForAttendance, setSelectedAdminForAttendance] = useState<string>('all');
  const [customerServiceSalaries, setCustomerServiceSalaries] = useState<CustomerServiceSalary[]>([]);
  const [salaryLoading, setSalaryLoading] = useState(false);
  const [salaryError, setSalaryError] = useState<string | null>(null);
  const [editingSalary, setEditingSalary] = useState<{adminId: string, hourlyRate: number} | null>(null);
  const [globalHourlyRate, setGlobalHourlyRateState] = useState<number>(20);
  const [isUpdatingGlobalHourlyRate, setIsUpdatingGlobalHourlyRate] = useState(false);
  
  // Fetch admins on component mount
  useEffect(() => {
    loadAdmins();
  }, []);
  
  // Fetch operation logs when switching to logs tab
  useEffect(() => {
    if (activeTab === 'logs') {
      loadOperationLogs();
    }
  }, [activeTab]);

  // Fetch data when switching tabs
  useEffect(() => {
    if (activeTab === 'attendance') {
      loadAttendanceRecords(selectedAdminForAttendance);
    } else if (activeTab === 'salary') {
      loadCustomerServiceSalaries();
      loadGlobalHourlyRate();
    }
  }, [activeTab]);

  // Reload attendance records when selected admin changes
  useEffect(() => {
    if (activeTab === 'attendance') {
      loadAttendanceRecords(selectedAdminForAttendance);
    }
  }, [selectedAdminForAttendance]);

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

  const loadOperationLogs = async () => {
    try {
      setLogsLoading(true);
      setLogsError(null);
      
      const data = await getOperationLogs();
      setOperationLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取操作日志失败';
      setLogsError(errorMessage);
      console.error('Failed to fetch operation logs:', err);
      setOperationLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };



  const loadAttendanceRecords = async (adminId?: string) => {
    try {
      setAttendanceLoading(true);
      setAttendanceError(null);
      
      const params = adminId && adminId !== 'all' ? { adminId: parseInt(adminId), page: 1, limit: 1000 } : { page: 1, limit: 1000 };
      const data = await attendanceService.getAttendanceRecords(params);
      setAttendanceRecords(Array.isArray(data.records) ? data.records : []);
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
  
  const toggleAdminStatus = async (id: string) => {
    try {
      const updatedAdmin = await toggleAdminStatusAPI(id);
      setAdmins(admins.map(admin => 
        admin.id === id ? updatedAdmin : admin
      ));
      
      toast.success(`管理员状态已${updatedAdmin.status === 'active' ? '启用' : '禁用'}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '切换管理员状态失败';
      console.error('Failed to toggle admin status:', err);
      toast.error(errorMessage);
    }
  };
  
  const handleAddAdmin = async () => {
    if (!newAdmin.username.trim()) {
      toast.error("请输入管理员用户名");
      return;
    }
    
    if (admins.some(admin => admin.username === newAdmin.username)) {
      toast.error("用户名已存在");
      return;
    }
    
    try {
      const admin = await createAdmin({
        username: newAdmin.username.trim(),
        role: newAdmin.role as 'customer_service'
      });
      
      setAdmins([...admins, admin]);
      setIsAddingAdmin(false);
      setNewAdmin({ username: "", role: "customer_service" });
      
      if (admin.password) {
        setNewAdminInfo({
          username: admin.username,
          nickname: admin.nickname || admin.username,
          password: admin.password
        });
      }
      
      if (activeTab === 'admins') {
        loadAdminCredentials();
      }
      
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
  
  return (
    <>
      <div className="bg-theme-background min-h-screen text-theme-text">
        <Header />
        
        <main className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-theme-text mb-2">客服管理</h1>
            <p className="text-theme-text/70">管理客服账号、打卡记录、时薪设置和操作日志</p>
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
                <i className="fa-solid fa-dollar-sign mr-2"></i>时薪管理
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'logs' 
                    ? 'bg-purple-600 text-white shadow-sm' 
                    : 'text-theme-text/70 hover:text-theme-text'
                }`}
              >
                <i className="fa-solid fa-history mr-2"></i>操作日志
              </button>
            </div>
          </div>
          
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">用户名</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">昵称</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">密码</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">状态</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">创建时间</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-theme-border">
                          {admins.filter(admin => admin.role === 'customer_service').map(admin => {
                            const statusStyle = getStatusStyle(admin.status);
                            // 从凭据数据中查找对应的密码信息
                            const credential = adminCredentials.find(cred => cred.id === admin.id);
                            const password = credential?.password || '••••••••';
                            
                            return (
                              <tr key={admin.id} className="hover:bg-theme-surface/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="w-10 h-10 bg-purple-600/10 rounded-full flex items-center justify-center mr-3">
                                      <i className="fa-solid fa-user text-purple-600"></i>
                                    </div>
                                    <div>
                                      <div className="font-medium text-theme-text text-sm">{admin.username}</div>
                                      <div className="text-xs text-theme-text/60">ID: {admin.id}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-theme-text text-sm">{credential?.nickname || admin.nickname || admin.username}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-theme-text text-sm font-mono bg-theme-background/50 px-2 py-1 rounded border">
                                      {password}
                                    </span>
                                    {credential?.password && (
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
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle.className}`}>
                                    {statusStyle.label}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">
                                  {admin.createdAt}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <button
                                    onClick={() => toggleAdminStatus(admin.id)}
                                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                      admin.status === 'active'
                                        ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                                        : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                                    }`}
                                  >
                                    {admin.status === 'active' ? '禁用' : '启用'}
                                  </button>
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
                      <label className="block text-sm font-medium text-theme-text mb-1">客服昵称</label>
                      <div className="flex items-center justify-between">
                        <span className="text-theme-text font-mono">{newAdminInfo.nickname}</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(newAdminInfo.nickname)}
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
                  
                  <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-start">
                      <i className="fa-solid fa-exclamation-triangle text-yellow-500 mr-2 mt-0.5"></i>
                      <div className="text-yellow-500/90 text-sm">
                        <p className="font-medium mb-1">重要提醒：</p>
                        <p>请妥善保管登录信息，关闭此窗口后将无法再次查看密码。建议客服首次登录后立即修改密码。</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-6">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`登录用户名: ${newAdminInfo.username}\n客服昵称: ${newAdminInfo.nickname}\n登录密码: ${newAdminInfo.password}`);
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



          {/* 打卡记录标签内容 */}
          {activeTab === 'attendance' && (
            <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border overflow-hidden">
              <div className="p-5 border-b border-theme-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-theme-text">打卡记录</h2>
                    <p className="text-sm text-theme-text/70 mt-1">查看客服的打卡记录和工作时长</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={selectedAdminForAttendance}
                      onChange={(e) => setSelectedAdminForAttendance(e.target.value)}
                      className="px-3 py-2 border border-theme-border bg-theme-background rounded-lg text-sm text-theme-text focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="all">所有客服</option>
                      {admins.filter(admin => admin.role === 'customer_service').map(admin => (
                        <option key={admin.id} value={admin.id}>{admin.username}</option>
                      ))}
                    </select>
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
                    onClick={() => loadAttendanceRecords(selectedAdminForAttendance)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    重试
                  </button>
                </div>
              )}
              
              {!attendanceLoading && !attendanceError && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-theme-surface border-b border-theme-border">
                        <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">客服</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">打卡时间</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">类型</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">工作时长</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">备注</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border">
                      {attendanceRecords.map(record => (
                        <tr key={record.id} className="hover:bg-theme-surface/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-purple-600/10 rounded-full flex items-center justify-center mr-3">
                                  <i className="fa-solid fa-user text-purple-600 text-sm"></i>
                                </div>
                                <span className="font-medium text-theme-text text-sm">{record.adminName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">
                              {record.checkInTime ? format(new Date(record.checkInTime), 'yyyy-MM-dd HH:mm:ss') : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                record.status === 'checked_in' 
                                  ? 'bg-green-500/10 text-green-500' 
                                  : 'bg-blue-500/10 text-blue-500'
                              }`}>
                                {record.status === 'checked_in' ? '工作中' : '已完成'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">
                              {record.workDuration ? `${(Number(record.workDuration) / 60).toFixed(1)} 小时` : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">
{record.checkOutTime ? format(new Date(record.checkOutTime), 'yyyy-MM-dd HH:mm:ss') : '未下班'}
                            </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                          <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">本月工时</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">本月收入</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-theme-border">
                        {customerServiceSalaries.map(salary => (
                          <tr key={salary.adminId} className="hover:bg-theme-surface/50 transition-colors">
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">
                              {salary.monthlyHours || 0} 小时
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">
                              ¥{salary.monthlyEarnings || 0}
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

          {/* 操作日志标签内容 */}
          {activeTab === 'logs' && (
            <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border overflow-hidden">
              <div className="p-5 border-b border-theme-border">
                <h2 className="font-semibold text-theme-text">操作日志</h2>
                <p className="text-sm text-theme-text/70 mt-1">查看系统的所有操作记录</p>
              </div>
              
              {logsLoading && (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <span className="ml-2 text-theme-text/70">加载中...</span>
                </div>
              )}
              
              {logsError && (
                <div className="text-center py-12">
                  <div className="text-red-500 mb-4">
                    <p className="text-lg font-medium text-theme-text">加载失败</p>
                    <p className="text-sm text-theme-text/70 mt-1">{logsError}</p>
                  </div>
                  <button
                    onClick={loadOperationLogs}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    重试
                  </button>
                </div>
              )}
              
              {!logsLoading && !logsError && (
                <>
                  {operationLogs.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-theme-text/60 mb-4">
                        <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-lg font-medium text-theme-text">暂无操作日志</p>
                        <p className="text-sm text-theme-text/50 mt-1">系统操作记录将显示在这里</p>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-theme-surface border-b border-theme-border">
                            <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">操作时间</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">操作人</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">操作类型</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">操作描述</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">IP地址</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-theme-border">
                          {operationLogs.map(log => (
                            <tr key={log.id} className="hover:bg-theme-surface/50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">
                                {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 bg-purple-600/10 rounded-full flex items-center justify-center mr-3">
                                    <i className="fa-solid fa-user text-purple-600 text-sm"></i>
                                  </div>
                                  <span className="font-medium text-theme-text text-sm">{log.adminName}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  log.operation === 'create' ? 'bg-green-500/10 text-green-500' :
                                  log.operation === 'update' ? 'bg-blue-500/10 text-blue-500' :
                                  log.operation === 'delete' ? 'bg-red-500/10 text-red-500' :
                                  'bg-gray-500/10 text-gray-500'
                                }`}>
                                  {log.operation === 'create' ? '创建' :
                                   log.operation === 'update' ? '更新' :
                                   log.operation === 'delete' ? '删除' : log.operation}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-theme-text">
                                {log.details}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text/70">
                                {log.ipAddress}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}