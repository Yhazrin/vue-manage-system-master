import { useState, useEffect } from 'react';
import Header from "@/components/Header";
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import {
  getAdminProfile,
  updateAdminPassword,
  AdminProfileData
} from '@/services/adminProfileService';

export default function AdminSecurity() {
  const [profile, setProfile] = useState<AdminProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    loginNotifications: true,
    sessionTimeout: 30
  });
  const navigate = useNavigate();

  // 获取管理员资料
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getAdminProfile();
      setProfile(data);
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      toast.error('获取管理员资料失败');
    } finally {
      setLoading(false);
    }
  };

  // 修改密码
  const handlePasswordChange = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('请填写所有密码字段');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('新密码和确认密码不匹配');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('新密码长度至少为6位');
      return;
    }

    if (passwordForm.newPassword === passwordForm.currentPassword) {
      toast.error('新密码不能与当前密码相同');
      return;
    }

    try {
      setIsChangingPassword(true);
      await updateAdminPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      toast.success('密码修改成功，请重新登录');
      
      // 清空表单
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // 延迟跳转到登录页
      setTimeout(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }, 2000);
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || '密码修改失败');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // 切换密码显示状态
  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // 密码强度检查
  const getPasswordStrength = (password: string) => {
    if (!password) return { level: 0, text: '', color: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score <= 2) return { level: 1, text: '弱', color: 'text-theme-error' };
    if (score <= 3) return { level: 2, text: '中等', color: 'text-theme-warning' };
    if (score <= 4) return { level: 3, text: '强', color: 'text-theme-success' };
    return { level: 4, text: '很强', color: 'text-theme-success' };
  };

  useEffect(() => {
    fetchProfile();
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

  const passwordStrength = getPasswordStrength(passwordForm.newPassword);

  return (
    <div className="bg-theme-background min-h-screen text-theme-text">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-theme-text">安全设置</h1>
              <p className="text-theme-text/70 mt-1">管理您的账户安全和隐私设置</p>
            </div>
            <button 
              onClick={() => navigate('/admin/profile')}
              className="py-2 px-4 bg-theme-primary text-white text-sm font-medium rounded-lg hover:bg-theme-primary/80 transition-colors flex items-center"
            >
              <i className="fa-solid fa-arrow-left mr-2"></i> 返回个人主页
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 修改密码 */}
          <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border p-6">
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 bg-theme-primary/10 rounded-lg flex items-center justify-center mr-3">
                <i className="fa-solid fa-key text-theme-primary"></i>
              </div>
              <h3 className="text-lg font-semibold text-theme-text">修改密码</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-theme-text/70 mb-2">当前密码</label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-4 py-3 pr-12 border border-theme-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary bg-theme-background text-theme-text"
                    placeholder="请输入当前密码"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-theme-text/40 hover:text-theme-text/60"
                  >
                    <i className={`fa-solid ${showPasswords.current ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-theme-text/70 mb-2">新密码</label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-4 py-3 pr-12 border border-theme-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary bg-theme-background text-theme-text"
                    placeholder="请输入新密码"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-theme-text/40 hover:text-theme-text/60"
                  >
                    <i className={`fa-solid ${showPasswords.new ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                {passwordForm.newPassword && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-theme-text/60">密码强度:</span>
                    <span className={`text-xs font-medium ${passwordStrength.color}`}>
                      {passwordStrength.text}
                    </span>
                    <div className="flex-1 bg-theme-background rounded-full h-1.5 ml-2">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          passwordStrength.level === 1 ? 'bg-theme-error w-1/4' :
                          passwordStrength.level === 2 ? 'bg-theme-warning w-2/4' :
                          passwordStrength.level === 3 ? 'bg-theme-success w-3/4' :
                          'bg-theme-success w-full'
                        }`}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-theme-text/70 mb-2">确认新密码</label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 pr-12 border border-theme-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary bg-theme-background text-theme-text"
                    placeholder="请再次输入新密码"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-theme-text/40 hover:text-theme-text/60"
                  >
                    <i className={`fa-solid ${showPasswords.confirm ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                  <p className="mt-1 text-xs text-theme-error">密码不匹配</p>
                )}
              </div>
              
              <div className="pt-4">
                <button
                  onClick={handlePasswordChange}
                  disabled={isChangingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword || passwordForm.newPassword !== passwordForm.confirmPassword}
                  className="w-full py-3 bg-theme-primary text-white text-sm font-medium rounded-lg hover:bg-theme-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isChangingPassword ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      修改中...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-save mr-2"></i>
                      修改密码
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 安全设置 */}
          <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border p-6">
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 bg-theme-success/10 rounded-lg flex items-center justify-center mr-3">
                <i className="fa-solid fa-shield-halved text-theme-success"></i>
              </div>
              <h3 className="text-lg font-semibold text-theme-text">安全选项</h3>
            </div>
            
            <div className="space-y-6">
              {/* 双因素认证 */}
              <div className="flex items-center justify-between p-4 bg-theme-background rounded-lg border border-theme-border">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-theme-accent/10 rounded-lg flex items-center justify-center mr-3">
                    <i className="fa-solid fa-mobile-screen text-theme-accent"></i>
                  </div>
                  <div>
                    <h4 className="font-medium text-theme-text">双因素认证</h4>
                    <p className="text-sm text-theme-text/60">为您的账户添加额外的安全保护</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-theme-text/60 mr-3">
                    {securitySettings.twoFactorEnabled ? '已启用' : '未启用'}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={securitySettings.twoFactorEnabled}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, twoFactorEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-theme-border peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-theme-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theme-primary"></div>
                  </label>
                </div>
              </div>

              {/* 登录通知 */}
              <div className="flex items-center justify-between p-4 bg-theme-background rounded-lg border border-theme-border">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-theme-info/10 rounded-lg flex items-center justify-center mr-3">
                    <i className="fa-solid fa-bell text-theme-info"></i>
                  </div>
                  <div>
                    <h4 className="font-medium text-theme-text">登录通知</h4>
                    <p className="text-sm text-theme-text/60">当有新设备登录时发送通知</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-theme-text/60 mr-3">
                    {securitySettings.loginNotifications ? '已启用' : '已关闭'}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={securitySettings.loginNotifications}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, loginNotifications: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-theme-border peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-theme-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theme-primary"></div>
                  </label>
                </div>
              </div>

              {/* 会话超时 */}
              <div className="p-4 bg-theme-background rounded-lg border border-theme-border">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-theme-warning/10 rounded-lg flex items-center justify-center mr-3">
                    <i className="fa-solid fa-clock text-theme-warning"></i>
                  </div>
                  <div>
                    <h4 className="font-medium text-theme-text">会话超时</h4>
                    <p className="text-sm text-theme-text/60">设置自动登出时间</p>
                  </div>
                </div>
                <select
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-theme-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary bg-theme-background text-theme-text"
                >
                  <option value={15}>15分钟</option>
                  <option value={30}>30分钟</option>
                  <option value={60}>1小时</option>
                  <option value={120}>2小时</option>
                  <option value={480}>8小时</option>
                </select>
              </div>
            </div>
            
            <div className="pt-6 mt-6 border-t border-theme-border">
              <button
                onClick={() => toast.success('安全设置已保存')}
                className="w-full py-3 bg-theme-success text-white text-sm font-medium rounded-lg hover:bg-theme-success/80 transition-colors flex items-center justify-center"
              >
                <i className="fa-solid fa-save mr-2"></i>
                保存设置
              </button>
            </div>
          </div>
        </div>

        {/* 账户信息 */}
        {profile && (
          <div className="mt-6 bg-theme-surface rounded-xl shadow-sm border border-theme-border p-6">
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 bg-theme-secondary/10 rounded-lg flex items-center justify-center mr-3">
                <i className="fa-solid fa-info-circle text-theme-secondary"></i>
              </div>
              <h3 className="text-lg font-semibold text-theme-text">账户信息</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-theme-background rounded-lg border border-theme-border">
                <div className="text-2xl font-bold text-theme-text mb-1">{profile.loginCount}</div>
                <div className="text-sm text-theme-text/60">总登录次数</div>
              </div>
              <div className="text-center p-4 bg-theme-background rounded-lg border border-theme-border">
                <div className="text-2xl font-bold text-theme-text mb-1">{profile.lastLogin}</div>
                <div className="text-sm text-theme-text/60">最后登录时间</div>
              </div>
              <div className="text-center p-4 bg-theme-background rounded-lg border border-theme-border">
                <div className="text-2xl font-bold text-theme-text mb-1">{profile.lastLoginIp}</div>
                <div className="text-sm text-theme-text/60">最后登录IP</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}