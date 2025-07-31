import Header from "@/components/Header";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { format } from 'date-fns';
import {
  getAdmins,
  createAdmin,
  toggleAdminStatus as toggleAdminStatusAPI,
  getOperationLogs,
  getAdminCredentials,
  Admin,
  AdminCredentials,
  OperationLog
} from '@/services/permissionService';

// 获取角色样式
const getRoleStyle = (role: Admin['role']) => {
  switch(role) {
    case 'super_admin':
      return { 
        className: "bg-purple-50 text-purple-700", 
        label: "超级管理员" 
      };
    case 'shareholder':
      return { 
        className: "bg-blue-50 text-blue-700", 
        label: "股东" 
      };
    case 'customer_service':
      return { 
        className: "bg-green-50 text-green-700", 
        label: "客服" 
      };
    default:
      return { 
        className: "bg-gray-50 text-gray-700", 
        label: "未知角色" 
      };
  }
};

// 获取状态样式
const getStatusStyle = (status: Admin['status']) => {
  switch(status) {
    case 'active':
      return { 
        className: "bg-green-50 text-green-700", 
        label: "正常" 
      };
    case 'inactive':
      return { 
        className: "bg-red-50 text-red-700", 
        label: "禁用" 
      };
    default:
      return { 
        className: "bg-gray-50 text-gray-700", 
        label: "未知状态" 
      };
  }
};

export default function AdminPermissionManagement() {
  // 所有状态
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [operationLogs, setOperationLogs] = useState<OperationLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'admins' | 'logs' | 'credentials'>('admins');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    username: "",
    role: "customer_service"
  });
  const [newAdminInfo, setNewAdminInfo] = useState<{username: string, password: string} | null>(null);
  const [adminCredentials, setAdminCredentials] = useState<AdminCredentials[]>([]);
  const [credentialsLoading, setCredentialsLoading] = useState(false);
  const [credentialsError, setCredentialsError] = useState<string | null>(null);
  
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

  // Fetch admin credentials when switching to credentials tab
  useEffect(() => {
    if (activeTab === 'credentials') {
      loadAdminCredentials();
    }
  }, [activeTab]);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getAdmins();
      // 确保data是数组，如果不是则使用空数组
      setAdmins(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取管理员列表失败';
      setError(errorMessage);
      console.error('Failed to fetch admins:', err);
      
      // 确保在错误情况下设置空数组
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  const loadOperationLogs = async () => {
    try {
      setLogsLoading(true);
      setLogsError(null);
      
      const data = await getOperationLogs();
      // 确保data是数组，如果不是则使用空数组
      setOperationLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取操作日志失败';
      setLogsError(errorMessage);
      console.error('Failed to fetch operation logs:', err);
      
      // 确保在错误情况下设置空数组
      setOperationLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const loadAdminCredentials = async () => {
    try {
      setCredentialsLoading(true);
      setCredentialsError(null);
      
      const data = await getAdminCredentials();
      // 确保data是数组，如果不是则使用空数组
      setAdminCredentials(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取管理员凭据失败';
      setCredentialsError(errorMessage);
      console.error('Failed to fetch admin credentials:', err);
      
      // 确保在错误情况下设置空数组
      setAdminCredentials([]);
    } finally {
      setCredentialsLoading(false);
    }
  };
  
  // 切换管理员状态
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
  
  // 添加新管理员
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
      
      // 保存新创建的账号信息（包含密码）
      if (admin.password) {
        setNewAdminInfo({
          username: admin.username,
          password: admin.password
        });
      }
      
      toast.success("客服账号添加成功");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '添加管理员失败';
      console.error('Failed to add admin:', err);
      toast.error(errorMessage);
    }
  };
  
  return (
    <div className="bg-theme-background min-h-screen text-theme-text">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">权限与日志</h1>
          <p className="text-gray-500">管理管理员账号和查看操作日志</p>
        </div>
        
        {/* 标签页切换 */}
        <div className="mb-6">
          <div className="inline-flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('admins')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'admins' 
                  ? 'bg-white text-purple-600 shadow-sm' 
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              管理员管理
            </button>
            <button
              onClick={() => setActiveTab('credentials')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'credentials' 
                  ? 'bg-white text-purple-600 shadow-sm' 
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              账号密码
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'logs' 
                  ? 'bg-white text-purple-600 shadow-sm' 
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              操作日志
            </button>
          </div>
        </div>
        
        {/* 管理员管理标签内容 */}
        {activeTab === 'admins' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">管理员账号管理</h2>
              <button 
                onClick={() => setIsAddingAdmin(true)}
                className="py-1.5 px-3 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                <i className="fa-solid fa-plus mr-1"></i>添加客服账号
              </button>
            </div>
            
            {/* 加载状态 */}
            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-2 text-gray-600">加载中...</span>
              </div>
            )}
            
            {/* 显示新创建客服账号信息的模态框 */}
            {newAdminInfo && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">客服账号创建成功</h3>
                    <button 
                      onClick={() => setNewAdminInfo(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <i className="fa-solid fa-times"></i>
                    </button>
                  </div>
                  
                  <div className="p-5">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center mb-2">
                        <i className="fa-solid fa-check-circle text-green-600 mr-2"></i>
                        <span className="text-green-800 font-medium">账号创建成功！</span>
                      </div>
                      <p className="text-green-700 text-sm">请将以下登录信息告知客服人员：</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-900 font-mono">{newAdminInfo.username}</span>
                          <button
                            onClick={() => navigator.clipboard.writeText(newAdminInfo.username)}
                            className="text-purple-600 hover:text-purple-800 text-sm"
                          >
                            <i className="fa-solid fa-copy mr-1"></i>复制
                          </button>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-900 font-mono">{newAdminInfo.password}</span>
                          <button
                            onClick={() => navigator.clipboard.writeText(newAdminInfo.password)}
                            className="text-purple-600 hover:text-purple-800 text-sm"
                          >
                            <i className="fa-solid fa-copy mr-1"></i>复制
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start">
                        <i className="fa-solid fa-exclamation-triangle text-yellow-600 mr-2 mt-0.5"></i>
                        <div className="text-yellow-800 text-sm">
                          <p className="font-medium mb-1">重要提醒：</p>
                          <p>请妥善保管登录信息，关闭此窗口后将无法再次查看密码。建议客服首次登录后立即修改密码。</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-3 mt-6">
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(`用户名: ${newAdminInfo.username}\n密码: ${newAdminInfo.password}`);
                          toast.success('登录信息已复制到剪贴板');
                        }}
                        className="py-2 px-4 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <i className="fa-solid fa-copy mr-1"></i>复制全部信息
                      </button>
                      <button 
                        onClick={() => setNewAdminInfo(null)}
                        className="py-2 px-4 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        我已保存，关闭
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* 错误状态 */}
            {error && (
              <div className="text-center py-12">
                <div className="text-red-600 mb-4">
                  <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-lg font-medium">加载失败</p>
                  <p className="text-sm text-gray-500 mt-1">{error}</p>
                </div>
                <button
                  onClick={loadAdmins}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  重试
                </button>
              </div>
            )}
            
            {/* 添加管理员模态框 */}
            {isAddingAdmin && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">添加客服账号</h3>
                    <button 
                      onClick={() => setIsAddingAdmin(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <i className="fa-solid fa-times"></i>
                    </button>
                  </div>
                  
                  <div className="p-5">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                      <input
                        type="text"
                        value={newAdmin.username}
                        onChange={(e) => setNewAdmin({...newAdmin, username: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="请输入客服用户名"
                      />
                    </div>
                    
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                      <select
                        value={newAdmin.role}
                        onChange={(e) => setNewAdmin({...newAdmin, role: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        disabled
                      >
                        <option value="customer_service">客服</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">注：仅允许添加客服角色账号</p>
                    </div>
                    
                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => setIsAddingAdmin(false)}
                        className="py-2 px-4 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
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
            
            {/* 管理员列表 */}
            {!loading && !error && (
              <>
                {admins.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM9 9a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-lg font-medium">暂无管理员账号</p>
                      <p className="text-sm text-gray-500 mt-1">点击上方按钮添加第一个客服账号</p>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户名</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最后登录</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作次数</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {admins.map(admin => {
                          const roleInfo = getRoleStyle(admin.role);
                          const statusInfo = getStatusStyle(admin.status);
                          
                          return (
                            <tr key={admin.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{admin.id}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{admin.username}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${roleInfo.className}`}>
                                  {roleInfo.label}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo.className}`}>
                                  {statusInfo.label}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{admin.createdAt}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{admin.lastLogin || '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{admin.operationCount}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                {admin.role !== 'super_admin' && (
                                  <button 
                                    onClick={() => toggleAdminStatus(admin.id)}
                                    className={admin.status === 'active' 
                                      ? 'text-red-600 hover:text-red-900' 
                                      : 'text-green-600 hover:text-green-900'
                                    }
                                  >
                                    {admin.status === 'active' ? '禁用' : '启用'}
                                  </button>
                                )}
                                {admin.role === 'super_admin' && (
                                  <span className="text-gray-400 cursor-not-allowed">不可操作</span>
                                )}
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
        
        {/* 新管理员账号信息模态框 */}
        {newAdminInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">客服账号创建成功</h3>
                <p className="text-sm text-gray-500">请妥善保存以下账号信息，密码仅显示一次</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newAdminInfo.username}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(newAdminInfo.username);
                        toast.success('用户名已复制');
                      }}
                      className="px-3 py-2 text-sm text-purple-600 hover:text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-50"
                    >
                      复制
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newAdminInfo.password}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm font-mono"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(newAdminInfo.password);
                        toast.success('密码已复制');
                      }}
                      className="px-3 py-2 text-sm text-purple-600 hover:text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-50"
                    >
                      复制
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex">
                  <svg className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">重要提示</p>
                    <p className="text-yellow-700 mt-1">请立即保存账号信息，关闭此窗口后将无法再次查看密码。建议客服人员首次登录后立即修改密码。</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setNewAdminInfo(null)}
                  className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                >
                  我已保存，关闭
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* 账号密码查看标签内容 */}
        {activeTab === 'credentials' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">管理员账号密码</h2>
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>仅超级管理员可查看</span>
                </div>
              </div>
            </div>
            
            {/* 凭据加载状态 */}
            {credentialsLoading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-2 text-gray-600">加载中...</span>
              </div>
            )}
            
            {/* 凭据错误状态 */}
            {credentialsError && (
              <div className="text-center py-12">
                <div className="text-red-600 mb-4">
                  <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-lg font-medium">加载失败</p>
                  <p className="text-sm text-gray-500 mt-1">{credentialsError}</p>
                </div>
                <button
                  onClick={loadAdminCredentials}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  重试
                </button>
              </div>
            )}
            
            {/* 管理员凭据列表 */}
            {!credentialsLoading && !credentialsError && (
              <>
                {adminCredentials.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM9 9a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-lg font-medium">暂无管理员账号</p>
                      <p className="text-sm text-gray-500 mt-1">管理员账号信息将显示在这里</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-5">
                    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start">
                        <svg className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div className="text-sm">
                          <p className="font-medium text-yellow-800">安全提醒</p>
                          <p className="text-yellow-700 mt-1">此页面显示的是加密后的密码哈希值，无法直接用于登录。如需重置密码，请联系系统管理员。</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid gap-4">
                      {adminCredentials.map(admin => {
                        const roleInfo = getRoleStyle(admin.role);
                        const statusInfo = getStatusStyle(admin.status);
                        
                        return (
                          <div key={admin.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                  <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                                <div>
                                  <h3 className="font-medium text-gray-900">{admin.username}</h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${roleInfo.className}`}>
                                      {roleInfo.label}
                                    </span>
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo.className}`}>
                                      {statusInfo.label}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right text-sm text-gray-500">
                                <p>ID: {admin.id}</p>
                                <p>{admin.createdAt}</p>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={admin.username}
                                    readOnly
                                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm"
                                  />
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(admin.username);
                                      toast.success('用户名已复制');
                                    }}
                                    className="px-3 py-2 text-sm text-purple-600 hover:text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-50"
                                  >
                                    复制
                                  </button>
                                </div>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">密码哈希</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={admin.password}
                                    readOnly
                                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm font-mono text-xs"
                                  />
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(admin.password);
                                      toast.success('密码哈希已复制');
                                    }}
                                    className="px-3 py-2 text-sm text-purple-600 hover:text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-50"
                                  >
                                    复制
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        {/* 操作日志标签内容 */}
        {activeTab === 'logs' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">操作日志记录</h2>
            </div>
            
            {/* 日志加载状态 */}
            {logsLoading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-2 text-gray-600">加载中...</span>
              </div>
            )}
            
            {/* 日志错误状态 */}
            {logsError && (
              <div className="text-center py-12">
                <div className="text-red-600 mb-4">
                  <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-lg font-medium">加载失败</p>
                  <p className="text-sm text-gray-500 mt-1">{logsError}</p>
                </div>
                <button
                  onClick={loadOperationLogs}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  重试
                </button>
              </div>
            )}
            
            {/* 操作日志列表 */}
            {!logsLoading && !logsError && (
              <>
                {operationLogs.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-lg font-medium">暂无操作日志</p>
                      <p className="text-sm text-gray-500 mt-1">系统操作记录将显示在这里</p>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日志ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作人</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">模块</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作详情</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP地址</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作时间</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {operationLogs.map(log => (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="font-medium text-gray-900 text-sm">{log.adminName}</div><div className="text-xs text-gray-500">{log.adminRole}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.operation}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.module}</td>
                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">{log.details}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.ipAddress}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.createdAt}</td>
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
  );
}