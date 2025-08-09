import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileEditForm from "@/components/ProfileEditForm";
import { toast } from "sonner";
import { API_BASE_URL } from '@/config/api';

interface CustomerServiceInfo {
  id: number;
  username: string;
  phone: string;
  photo_img?: string;
  role: string;
  status: string;
  hourly_rate: number;
  total_earnings: number;
  available_balance: number;
  created_at: string;
}

export default function CustomerServiceProfile() {
  const [profile, setProfile] = useState<CustomerServiceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();

  // 获取客服资料
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/customer-service/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('获取个人信息失败');
      }

      const data = await response.json();
      if (data.success) {
        setProfile(data.data);
      } else {
        throw new Error(data.message || '获取个人信息失败');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError(error instanceof Error ? error.message : '获取客服资料失败，请重试');
    } finally {
      setLoading(false);
    }
  };



  // 处理个人信息保存
  const handleProfileSave = async (data: Record<string, string>) => {
    try {
      setUpdating(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/customer-service/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('更新个人信息失败');
      }

      const result = await response.json();
      if (result.success) {
        setProfile(result.data);
        setIsEditing(false);
        toast.success('个人信息更新成功');
      } else {
        throw new Error(result.message || '更新个人信息失败');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error instanceof Error ? error.message : '更新失败，请重试');
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="bg-theme-background min-h-screen text-theme-text">
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
        <main className="container mx-auto px-4 py-6">
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            <button 
              onClick={fetchProfile}
              className="px-4 py-2 bg-theme-primary text-white rounded-lg hover:bg-theme-primary/90 transition-colors"
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

  // 准备编辑表单字段
  const profileFields = [
    {
      key: 'username',
      label: '用户名',
      value: profile.username,
      type: 'text' as const,
      editable: true,
      required: true,
      maxLength: 20,
      placeholder: '请输入用户名'
    },
    {
      key: 'phone',
      label: '手机号',
      value: profile.phone,
      type: 'tel' as const,
      editable: true,
      required: true,
      placeholder: '请输入手机号'
    },
    {
      key: 'id',
      label: '客服ID',
      value: profile.id.toString(),
      type: 'text' as const,
      editable: false
    },
    {
      key: 'created_at',
      label: '注册时间',
      value: new Date(profile.created_at).toLocaleString('zh-CN'),
      type: 'text' as const,
      editable: false
    }
  ];
  
  return (
    <div className="bg-theme-background min-h-screen text-theme-text">
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-theme-text">客服主页</h1>
            <div className="flex space-x-3">
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="py-1.5 px-3 bg-theme-primary text-white text-sm font-medium rounded-lg hover:bg-theme-primary/90 transition-colors"
                >
                  <i className="fa-solid fa-edit mr-1"></i> 编辑资料
                </button>
              )}
              <button 
                onClick={() => navigate('/customer-service/dashboard')}
                className="py-1.5 px-3 bg-theme-text/80 text-white text-sm font-medium rounded-lg hover:bg-theme-text transition-colors"
              >
                <i className="fa-solid fa-arrow-left mr-1"></i> 返回工作台
              </button>
            </div>
          </div>
          <p className="text-theme-text/70">管理您的客服信息和账户设置</p>
        </div>
        
        <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border overflow-hidden mb-6">
          <div className="p-6">
            {/* 客服信息头部 */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
              {/* 默认客服头像 */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  客服
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              
              <div className="text-center md:text-left flex-1">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-theme-text">{profile.username}</h2>
                  <span className={`px-3 py-1 text-sm rounded-full ${
                    profile.status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                  }`}>
                    {profile.status === 'active' ? '正常' : '禁用'}
                  </span>
                </div>
                <p className="text-sm text-theme-text/70 mb-4">ID: {profile.id}</p>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-6">
                  <div className="text-center">
                    <p className="text-lg font-bold text-theme-text">{profile.role}</p>
                    <p className="text-xs text-theme-text/70">用户角色</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-lg font-bold ${
                      profile.status === 'active' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {profile.status === 'active' ? '正常' : '禁用'}
                    </p>
                    <p className="text-xs text-theme-text/70">账户状态</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-theme-text">
                      {new Date(profile.created_at).toLocaleDateString('zh-CN')}
                    </p>
                    <p className="text-xs text-theme-text/70">注册时间</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 个人信息编辑表单或显示 */}
            {isEditing ? (
              <div>
                <h3 className="text-lg font-semibold text-theme-text mb-4">编辑个人信息</h3>
                <ProfileEditForm
                  fields={profileFields}
                  onSave={handleProfileSave}
                  onCancel={() => setIsEditing(false)}
                  loading={updating}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-theme-background p-5 rounded-lg">
                  <h3 className="text-sm font-semibold text-theme-text mb-4">基本信息</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-theme-text/70 mb-1">用户名</p>
                      <p className="text-sm text-theme-text">{profile.username}</p>
                    </div>
                    <div>
                      <p className="text-xs text-theme-text/70 mb-1">手机号</p>
                      <p className="text-sm text-theme-text">{profile.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-theme-text/70 mb-1">客服ID</p>
                      <p className="text-sm text-theme-text">{profile.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-theme-text/70 mb-1">注册时间</p>
                      <p className="text-sm text-theme-text">{new Date(profile.created_at).toLocaleString('zh-CN')}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-theme-background p-5 rounded-lg">
                  <h3 className="text-sm font-semibold text-theme-text mb-4">账户信息</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-theme-text/70 mb-1">账户状态</p>
                      <p className={`text-sm ${
                        profile.status === 'active' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {profile.status === 'active' ? '正常' : '禁用'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-theme-text/70 mb-1">用户角色</p>
                      <p className="text-sm text-theme-text">{profile.role}</p>
                    </div>
                    <div>
                      <p className="text-xs text-theme-text/70 mb-1">时薪</p>
                      <p className="text-sm text-theme-text font-medium text-green-600">
                        ¥{Number(profile.hourly_rate || 0).toFixed(2)}/小时
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-theme-text/70 mb-1">总收入</p>
                      <p className="text-sm text-theme-text font-medium">
                        ¥{Number(profile.total_earnings || 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-theme-text/70 mb-1">可用余额</p>
                      <p className="text-sm text-theme-text font-medium text-blue-600">
                        ¥{Number(profile.available_balance || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}