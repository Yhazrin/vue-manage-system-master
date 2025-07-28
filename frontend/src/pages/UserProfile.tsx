import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from "@/components/Header";
import { cn } from "@/lib/utils";
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import {
  getUserProfile,
  updateUserProfile,
  UserProfileData
} from '@/services/userProfileService';

export default function UserProfile() {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();

  // 获取用户资料
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUserProfile();
      setProfile(data);
      setNewNickname(data.nickname);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('获取用户资料失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 保存昵称修改
  const saveNicknameChange = async () => {
    if (!profile || newNickname.trim() === profile.nickname) {
      setIsEditing(false);
      return;
    }

    try {
      setUpdating(true);
      const updatedProfile = await updateUserProfile({ nickname: newNickname.trim() });
      setProfile(updatedProfile);
      setIsEditing(false);
      toast.success('昵称修改成功');
    } catch (error) {
      console.error('Error updating nickname:', error);
      toast.error('昵称修改失败，请重试');
      setNewNickname(profile.nickname); // 恢复原昵称
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
  
  return (
    <div className="bg-theme-background min-h-screen text-theme-text">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">个人主页</h1>
            <button 
              onClick={() => navigate('/lobby')}
              className="py-1.5 px-3 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              <i className="fa-solid fa-arrow-left mr-1"></i> 返回大厅
            </button>
          </div>
          <p className="text-gray-500">管理您的个人信息和偏好设置</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-6">
            {/* 用户信息头部 */}
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
                  <h2 className="text-xl font-bold text-gray-900">
                    {isEditing ? (
                      <input
                        type="text"
                        value={newNickname}
                        onChange={(e) => setNewNickname(e.target.value)}
                        className="text-xl font-bold text-gray-900 border-b border-gray-300 focus:outline-none focus:border-purple-500"
                      />
                    ) : (
                      profile.nickname
                    )}
                  </h2>
                  {isEditing ? (
                    <button 
                      onClick={saveNicknameChange}
                      disabled={updating}
                      className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updating ? '保存中...' : '保存'}
                    </button>
                  ) : (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <i className="fa-solid fa-pencil"></i>
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-3">UID: {profile.uid}</p>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-6">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{profile.orderCount}</p>
                    <p className="text-xs text-gray-500">订单总数</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{profile.favoritePlayers}</p>
                    <p className="text-xs text-gray-500">收藏陪玩</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{profile.membershipDuration}年</p>
                    <p className="text-xs text-gray-500">会员时长</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 个人信息卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 p-5 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">联系信息</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">邮箱</p>
                    <p className="text-sm text-gray-900">{profile.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">手机号</p>
                    <p className="text-sm text-gray-900">{profile.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">注册时间</p>
                    <p className="text-sm text-gray-900">{profile.registerDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">最后登录</p>
                    <p className="text-sm text-gray-900">{profile.lastLogin}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-5 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">账户安全</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">密码修改</p>
                      <p className="text-sm text-gray-900">上次修改: {profile.securitySettings.lastPasswordChange}</p>
                    </div>
                    <button className="text-purple-600 text-sm hover:text-purple-700">
                      修改
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">两步验证</p>
                      <p className="text-sm text-gray-900">{profile.securitySettings.twoFactorEnabled ? '已开启' : '未开启'}</p>
                    </div>
                    <button className="text-purple-600 text-sm hover:text-purple-700">
                      {profile.securitySettings.twoFactorEnabled ? '关闭' : '开启'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">登录设备管理</p>
                      <p className="text-sm text-gray-900">当前{profile.securitySettings.activeDevices}台设备在线</p>
                    </div>
                    <button className="text-purple-600 text-sm hover:text-purple-700">
                      查看
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 最近订单和收藏陪玩入口 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <Link to="/user/orders" className="p-4 border border-gray-100 rounded-lg hover:border-purple-200 hover:bg-purple-50 transition-colors cursor-pointer block">
                 <div className="flex items-center justify-between">
                   <div>
                     <h3 className="font-medium text-gray-900 mb-1">我的订单</h3>
                     <p className="text-sm text-gray-500">查看和管理您的所有订单</p>
                   </div>
                   <i className="fa-solid fa-arrow-right text-gray-400"></i>
                 </div>
               </Link>
               

               <Link to="/user/favorites" className="p-4 border border-gray-100 rounded-lg hover:border-purple-200 hover:bg-purple-50 transition-colors cursor-pointer block">
                 <div className="flex items-center justify-between">
                   <div>
                     <h3 className="font-medium text-gray-900 mb-1">收藏的陪玩</h3>
                     <p className="text-sm text-gray-500">查看您收藏的陪玩列表</p>
                   </div>
                   <i className="fa-solid fa-arrow-right text-gray-400"></i>
                 </div>
               </Link>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}