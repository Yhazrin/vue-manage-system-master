import { useState, useEffect } from 'react';
import Header from "@/components/Header";
import { cn } from "@/lib/utils";
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from "sonner";
import {
  getAdminProfile,
  getAdminOperationLogs,
  AdminProfileData,
  AdminLog
} from '@/services/adminProfileService';

export default function AdminProfile() {
  const [profile, setProfile] = useState<AdminProfileData | null>(null);
  const [operationLogs, setOperationLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // 获取管理员资料
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminProfile();
      setProfile(data);
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      setError('获取管理员资料失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 获取操作日志
  const fetchOperationLogs = async () => {
    try {
      setLogsLoading(true);
      const data = await getAdminOperationLogs({ limit: 5 });
      setOperationLogs(data.logs);
    } catch (error) {
      console.error('Error fetching operation logs:', error);
      toast.error('获取操作日志失败');
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchOperationLogs();
  }, []);

  if (loading) {
    return (
      <div className="bg-theme-background min-h-screen text-theme-text">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
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
            <p className="text-red-500 mb-4">{error}</p>
            <button 
              onClick={fetchProfile}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              重试
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!profile) {
    return null;
  }
  
  return (
    <div className="bg-theme-background min-h-screen text-theme-text">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">管理员个人主页</h1>
            <button 
              onClick={() => navigate('/admin/dashboard')}
              className="py-1.5 px-3 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              <i className="fa-solid fa-arrow-left mr-1"></i> 返回控制台
            </button>
          </div>
          <p className="text-gray-500">管理您的管理员账户信息和权限</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-6">
            {/* 管理员信息头部 */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
              <div className="relative">
                <img 
                  src={profile.avatar} 
                  alt={profile.nickname}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-sm"
                />
              </div>
              
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                  <h2 className="text-xl font-bold text-gray-900">{profile.nickname}</h2>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">{profile.role}</span>
                </div>
                <p className="text-sm text-gray-500 mb-3">UID: {profile.uid}</p>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-6">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{profile.loginCount}</p>
                    <p className="text-xs text-gray-500">登录次数</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{profile.tenureDuration}年</p>
                    <p className="text-xs text-gray-500">任职时长</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{profile.permissions.length}</p>
                    <p className="text-xs text-gray-500">权限数量</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 管理员信息卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 p-5 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">管理员信息</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">账号角色</p>
                    <p className="text-sm text-gray-900">{profile.role}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">入职日期</p>
                    <p className="text-sm text-gray-900">{profile.joinDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">最后登录</p>
                    <p className="text-sm text-gray-900">{profile.lastLogin}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">登录IP</p>
                    <p className="text-sm text-gray-900">{profile.lastLoginIp}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-5 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">拥有权限</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.permissions.map((permission, index) => (
                    <span key={index} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-full">
                      {permission}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            {/* 安全设置和操作日志入口 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-gray-100 rounded-lg hover:border-purple-200 hover:bg-purple-50 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">安全设置</h3>
                    <p className="text-sm text-gray-500">修改密码和账户保护</p>
                  </div>
                  <i className="fa-solid fa-arrow-right text-gray-400"></i>
                </div>
              </div>
              
              <div className="p-4 border border-gray-100 rounded-lg hover:border-purple-200 hover:bg-purple-50 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">操作日志</h3>
                    <p className="text-sm text-gray-500">查看您的管理操作记录</p>
                  </div>
                  <i className="fa-solid fa-arrow-right text-gray-400"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 最近操作日志 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">最近操作日志</h3>
              <button 
                onClick={() => navigate('/admin/logs')}
                className="text-sm text-purple-600 hover:text-purple-700"
              >
                查看全部
              </button>
            </div>
            
            {logsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : operationLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">模块</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP地址</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {operationLogs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{log.operation}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{log.module}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{log.time}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{log.ip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">暂无操作记录</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}