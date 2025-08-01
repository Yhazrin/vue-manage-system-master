import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from "@/components/Header";
import AvatarUpload from "@/components/AvatarUpload";
import ProfileEditForm from "@/components/ProfileEditForm";
import { toast } from "sonner";
import {
  getUserProfile,
  updateUserProfile,
  uploadAvatar,
  UserProfileData
} from '@/services/userProfileService';

export default function UserProfile() {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();

  // 获取用户资料
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUserProfile();
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError(error instanceof Error ? error.message : '获取用户资料失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理头像上传
  const handleAvatarUpload = async (file: File) => {
    try {
      const newAvatarUrl = await uploadAvatar(file);
      setProfile(prev => prev ? { ...prev, photo_img: newAvatarUrl } : null);
    } catch (error) {
      throw error; // 让AvatarUpload组件处理错误显示
    }
  };

  // 处理个人信息保存
  const handleProfileSave = async (data: Record<string, string>) => {
    try {
      setUpdating(true);
      const updatedProfile = await updateUserProfile(data);
      setProfile(updatedProfile);
      setIsEditing(false);
      toast.success('个人信息更新成功');
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

  // 准备编辑表单字段
  const profileFields = [
    {
      key: 'name',
      label: '用户名',
      value: profile.name,
      type: 'text' as const,
      editable: true,
      required: true,
      maxLength: 20,
      placeholder: '请输入用户名'
    },
    {
      key: 'phone_num',
      label: '手机号',
      value: profile.phone_num,
      type: 'tel' as const,
      editable: true,
      required: true,
      placeholder: '请输入手机号'
    },
    {
      key: 'id',
      label: '用户ID',
      value: profile.id.toString(),
      type: 'text' as const,
      editable: false
    },
    {
      key: 'role',
      label: '用户角色',
      value: profile.role === 'user' ? '普通用户' : profile.role,
      type: 'text' as const,
      editable: false
    },
    {
      key: 'status',
      label: '账户状态',
      value: profile.status ? '正常' : '已禁用',
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
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">个人主页</h1>
            <div className="flex space-x-3">
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="py-1.5 px-3 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <i className="fa-solid fa-edit mr-1"></i> 编辑资料
                </button>
              )}
              <button 
                onClick={() => navigate('/user/dashboard')}
                className="py-1.5 px-3 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
              >
                <i className="fa-solid fa-arrow-left mr-1"></i> 返回大厅
              </button>
            </div>
          </div>
          <p className="text-gray-500">管理您的个人信息和偏好设置</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-6">
            {/* 用户信息头部 */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
              <AvatarUpload
                currentAvatar={profile.photo_img || '/default-avatar.svg'}
                onAvatarChange={handleAvatarUpload}
                size="lg"
                disabled={isEditing}
              />
              
              <div className="text-center md:text-left flex-1">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    profile.status 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {profile.status ? '正常' : '已禁用'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-4">ID: {profile.id} | 角色: {profile.role === 'user' ? '普通用户' : profile.role}</p>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-6">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{profile.orderCount || 0}</p>
                    <p className="text-xs text-gray-500">订单总数</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{profile.favoritePlayers || 0}</p>
                    <p className="text-xs text-gray-500">收藏陪玩</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 个人信息编辑表单或显示 */}
            {isEditing ? (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">编辑个人信息</h3>
                <ProfileEditForm
                  fields={profileFields}
                  onSave={handleProfileSave}
                  onCancel={() => setIsEditing(false)}
                  loading={updating}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 p-5 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">基本信息</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">用户名</p>
                      <p className="text-sm text-gray-900">{profile.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">手机号</p>
                      <p className="text-sm text-gray-900">{profile.phone_num}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">注册时间</p>
                      <p className="text-sm text-gray-900">{new Date(profile.created_at).toLocaleString('zh-CN')}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-5 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">账户信息</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">用户ID</p>
                      <p className="text-sm text-gray-900">{profile.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">用户角色</p>
                      <p className="text-sm text-gray-900">{profile.role === 'user' ? '普通用户' : profile.role}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">账户状态</p>
                      <p className={`text-sm ${profile.status ? 'text-green-600' : 'text-red-600'}`}>
                        {profile.status ? '正常' : '已禁用'}
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