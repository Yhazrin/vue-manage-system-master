import { useState, useEffect, useContext } from 'react';
import Header from "@/components/Header";
import { cn } from "@/lib/utils";
import { useNavigate } from 'react-router-dom';
import { buildAvatarUrl } from '@/utils/imageUtils';
import { format } from 'date-fns';
import { toast } from "sonner";
import { AuthContext } from '@/contexts/authContext';
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
  const { userInfo } = useContext(AuthContext);

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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary"></div>
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
            <p className="text-theme-error mb-4">{error}</p>
            <button 
              onClick={fetchProfile}
              className="px-4 py-2 bg-theme-primary text-white rounded-lg hover:bg-theme-primary/80 transition-colors"
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
            <div>
              <h1 className="text-2xl font-bold text-theme-text">
                {userInfo?.authority === 2 ? '客服个人主页' : '管理员个人主页'}
              </h1>
              <p className="text-theme-text/70 mt-1">
                {userInfo?.authority === 2 
                  ? '查看您的客服账户信息和工作状态' 
                  : '管理您的管理员账户信息和权限'
                }
              </p>
            </div>
            <button 
              onClick={() => navigate(userInfo?.authority === 2 ? '/admin/attendance' : '/admin/dashboard')}
              className="py-2 px-4 bg-theme-primary text-white text-sm font-medium rounded-lg hover:bg-theme-primary/80 transition-colors flex items-center"
            >
              <i className="fa-solid fa-arrow-left mr-2"></i> 
              {userInfo?.authority === 2 ? '返回工作台' : '返回控制台'}
            </button>
          </div>
        </div>
        
        <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border overflow-hidden mb-6">
          <div className="p-6">
            {/* 管理员信息头部 */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
              <div className="relative">
                <img 
                  src={buildAvatarUrl(profile.avatar)} 
                  alt={profile.nickname}
                  className="w-24 h-24 rounded-full object-cover border-4 border-theme-surface shadow-lg"
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-theme-success rounded-full border-2 border-theme-surface flex items-center justify-center">
                  <i className="fa-solid fa-check text-white text-xs"></i>
                </div>
              </div>
              
              <div className="text-center md:text-left flex-1">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-theme-text">{profile.nickname}</h2>
                  <span className="px-3 py-1 bg-theme-primary/10 text-theme-primary text-sm rounded-full font-medium">{profile.role}</span>
                </div>
                <p className="text-sm text-theme-text/60 mb-4">UID: {profile.uid}</p>
                
                <div className="grid grid-cols-3 gap-6 max-w-md mx-auto md:mx-0">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-theme-text">{profile.loginCount}</p>
                    <p className="text-xs text-theme-text/60">登录次数</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-theme-text">{profile.tenureDuration}年</p>
                    <p className="text-xs text-theme-text/60">任职时长</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-theme-text">{profile.permissions.length}</p>
                    <p className="text-xs text-theme-text/60">权限数量</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 管理员信息卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-theme-background p-6 rounded-xl border border-theme-border">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-theme-primary/10 rounded-lg flex items-center justify-center mr-3">
                    <i className="fa-solid fa-user-shield text-theme-primary"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-theme-text">
                    {userInfo?.authority === 2 ? '客服信息' : '管理员信息'}
                  </h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-theme-text/60 mb-1">账号角色</p>
                    <p className="text-sm text-theme-text font-medium">{profile.role}</p>
                  </div>
                  <div>
                    <p className="text-xs text-theme-text/60 mb-1">入职日期</p>
                    <p className="text-sm text-theme-text font-medium">{profile.joinDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-theme-text/60 mb-1">最后登录</p>
                    <p className="text-sm text-theme-text font-medium">{profile.lastLogin}</p>
                  </div>
                  <div>
                    <p className="text-xs text-theme-text/60 mb-1">登录IP</p>
                    <p className="text-sm text-theme-text font-medium">{profile.lastLoginIp}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-theme-background p-6 rounded-xl border border-theme-border">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-theme-secondary/10 rounded-lg flex items-center justify-center mr-3">
                    <i className="fa-solid fa-key text-theme-secondary"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-theme-text">拥有权限</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.permissions.map((permission, index) => (
                    <span key={index} className="px-3 py-1.5 bg-theme-secondary/10 text-theme-secondary text-sm rounded-full font-medium">
                      {permission}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            

          </div>
        </div>
        
        {/* 最近操作日志 - 仅管理员可见 */}
        {userInfo?.authority !== 2 && (
          <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-theme-primary/10 rounded-lg flex items-center justify-center mr-3">
                    <i className="fa-solid fa-history text-theme-primary"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-theme-text">最近操作日志</h3>
                </div>
                <button 
                  onClick={() => navigate('/admin/logs')}
                  className="text-sm text-theme-primary hover:text-theme-primary/80 font-medium flex items-center"
                >
                  查看全部 <i className="fa-solid fa-arrow-right ml-1"></i>
                </button>
              </div>
              
              {logsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary"></div>
                </div>
              ) : operationLogs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-theme-background">
                        <th className="px-4 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">操作</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">模块</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">时间</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">IP地址</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border">
                      {operationLogs.map(log => (
                        <tr key={log.id} className="hover:bg-theme-background transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-theme-text font-medium">{log.operation}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-theme-text/70">{log.module}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-theme-text/70">{log.time}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-theme-text/70">{log.ip}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-theme-background rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fa-solid fa-clock-rotate-left text-theme-text/40 text-xl"></i>
                  </div>
                  <p className="text-theme-text/60">暂无操作记录</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}