import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from "@/components/Header";
import AvatarUpload from "@/components/AvatarUpload";
import ProfileEditForm from "@/components/ProfileEditForm";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import { toast } from "sonner";
import {
  getPlayerProfile,
  updatePlayerProfile,
  uploadAvatar,
  updateStatus,
  updateOnlineStatus,
  uploadVoice,
  PlayerProfileData
} from '@/services/playerProfileService';
import { buildAvatarUrl, buildVoiceUrl } from '@/utils/imageUtils';
import { fetchJson } from '@/utils/fetchWrapper';
import { API_BASE_URL } from '@/config/api';

interface Service {
  id: number;
  player_id: number;
  game_id: number;
  game_name?: string;
  price: number;
  hours: number;
  created_at: string;
}

interface Game {
  id: number;
  name: string;
}

export default function PlayerProfile() {
  const [profile, setProfile] = useState<PlayerProfileData | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const [uploadingVoice, setUploadingVoice] = useState(false);
  const navigate = useNavigate();

  // 获取服务列表
  const fetchServices = async () => {
    try {
      const data = await fetchJson(`${API_BASE_URL}/services/my`);
      if (data.success) {
        setServices(data.services || []);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  // 获取陪玩资料
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPlayerProfile();
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError(error instanceof Error ? error.message : '获取陪玩资料失败，请重试');
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
      
      const updatedProfile = await updatePlayerProfile(data);
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



  // 处理在线状态切换
  const handleOnlineStatusToggle = async () => {
    if (!profile) return;
    
    try {
      const newOnlineStatus = !profile.online_status;
      await updateOnlineStatus(newOnlineStatus);
      setProfile(prev => prev ? { ...prev, online_status: newOnlineStatus } : null);
      toast.success(`已${newOnlineStatus ? '上线' : '下线'}`);
    } catch (error) {
      console.error('Error updating online status:', error);
      toast.error(error instanceof Error ? error.message : '在线状态更新失败');
    }
  };

  // 处理录音上传
  const handleVoiceUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('audio/')) {
      toast.error('请选择音频文件');
      return;
    }

    // 验证文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('音频文件大小不能超过10MB');
      return;
    }

    try {
      setUploadingVoice(true);
      const newVoiceUrl = await uploadVoice(file);
      setProfile(prev => prev ? { ...prev, voice: newVoiceUrl } : null);
      toast.success('录音上传成功');
    } catch (error) {
      console.error('Error uploading voice:', error);
      toast.error(error instanceof Error ? error.message : '上传失败，请重试');
    } finally {
      setUploadingVoice(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchServices();
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
            <p className="text-red-500 dark:text-red-400 mb-4">{String(error)}</p>
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
      key: 'intro',
      label: '个人简介',
      value: profile.intro || '',
      type: 'textarea' as const,
      editable: true,
      maxLength: 200,
      placeholder: '请输入个人简介'
    },

    {
      key: 'id',
      label: '陪玩ID',
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
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-theme-text">陪玩主页</h1>
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
                onClick={() => navigate('/player/dashboard')}
                className="py-1.5 px-3 bg-theme-text/80 text-white text-sm font-medium rounded-lg hover:bg-theme-text transition-colors"
              >
                <i className="fa-solid fa-arrow-left mr-1"></i> 返回大厅
              </button>
            </div>
          </div>
          <p className="text-theme-text/70">管理您的陪玩信息和服务设置</p>
        </div>
        
        <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border overflow-hidden mb-6">
          <div className="p-6">
            {/* 陪玩信息头部 */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
              <AvatarUpload
                currentAvatar={buildAvatarUrl(profile.photo_img)}
                onAvatarChange={handleAvatarUpload}
                size="lg"
                disabled={isEditing}
              />
              
              <div className="text-center md:text-left flex-1">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-theme-text">{profile.name}</h2>
                  <button
                    onClick={handleOnlineStatusToggle}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      profile.online_status 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300' 
                        : 'bg-theme-background text-theme-text/70 hover:bg-theme-border border border-theme-border'
                    }`}
                  >
                    {profile.online_status ? '在线' : '离线'}
                  </button>
                </div>
                <p className="text-sm text-theme-text/70 mb-4">ID: {profile.id}</p>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-6">
                  <div className="text-center">
                    <p className="text-lg font-bold text-theme-text">¥{Number(profile.money || 0).toFixed(1)}</p>
                    <p className="text-xs text-theme-text/70">账户余额</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-theme-text">¥{Number(profile.profit || 0).toFixed(1)}</p>
                    <p className="text-xs text-theme-text/70">累计收益</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-theme-text">{profile.totalOrders || 0}</p>
                    <p className="text-xs text-theme-text/70">完成订单</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-theme-text">{profile.rating || 0}</p>
                    <p className="text-xs text-theme-text/70">评分</p>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-theme-background p-5 rounded-lg">
                  <h3 className="text-sm font-semibold text-theme-text mb-4">基本信息</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-theme-text/70 mb-1">用户名</p>
                      <p className="text-sm text-theme-text">{profile.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-theme-text/70 mb-1">手机号</p>
                      <p className="text-sm text-theme-text">{profile.phone_num}</p>
                    </div>
                    <div>
                      <p className="text-xs text-theme-text/70 mb-1">个人简介</p>
                      <p className="text-sm text-theme-text">{profile.intro || '暂无简介'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-theme-text/70 mb-1">注册时间</p>
                      <p className="text-sm text-theme-text">{new Date(profile.created_at).toLocaleString('zh-CN')}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-theme-background p-5 rounded-lg">
                  <h3 className="text-sm font-semibold text-theme-text mb-4">服务信息</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-theme-text/70 mb-1">陪玩ID</p>
                      <p className="text-sm text-theme-text">{profile.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-theme-text/70 mb-1">在线状态</p>
                      <div className="flex items-center gap-2">
                        <p className={`text-sm ${profile.online_status ? 'text-green-600 dark:text-green-400' : 'text-theme-text/70'}`}>
                          {profile.online_status ? '在线' : '离线'}
                        </p>
                        <button
                          onClick={handleOnlineStatusToggle}
                          className={`px-2 py-1 text-xs rounded-md transition-colors ${
                            profile.online_status 
                              ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30' 
                              : 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30'
                          }`}
                        >
                          {profile.online_status ? '下线' : '上线'}
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-theme-text/70 mb-1">基础小时单价</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-theme-text">
                          {profile.hourlyRate && Number(profile.hourlyRate) > 0 
                            ? `¥${Number(profile.hourlyRate).toFixed(1)}/小时` 
                            : '未设置'}
                        </p>
                        <button
                          onClick={() => navigate('/player/services')}
                          className="text-xs text-theme-primary hover:text-theme-primary/80 underline"
                        >
                          设置价格
                        </button>
                      </div>
                      <p className="text-xs text-theme-text/50 mt-1">在服务管理中可设置不同游戏的具体价格</p>
                    </div>
                    <div className="pt-2">
                      <button
                        onClick={() => setShowChangePassword(true)}
                        className="w-full py-2 px-3 bg-theme-primary text-white text-sm rounded-lg hover:bg-theme-primary/90 transition-colors"
                      >
                        <i className="fa-solid fa-key mr-2"></i>
                        修改密码
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* 录音管理区域 - 移到这里与其他信息区域并排 */}
                <div className="bg-theme-background p-5 rounded-lg">
                  <h3 className="text-sm font-semibold text-theme-text mb-4">录音介绍</h3>
                  {profile.voice ? (
                    <div className="space-y-4">
                      <div>
                        <audio 
                          controls 
                          className="w-full"
                          preload="metadata"
                        >
                          <source src={buildVoiceUrl(profile.voice)} type="audio/mpeg" />
                          <source src={buildVoiceUrl(profile.voice)} type="audio/wav" />
                          <source src={buildVoiceUrl(profile.voice)} type="audio/ogg" />
                          您的浏览器不支持音频播放
                        </audio>
                      </div>
                      <div>
                        <label>
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={handleVoiceUpload}
                            className="hidden"
                            disabled={uploadingVoice}
                          />
                          <span className="block w-full py-2 px-3 bg-blue-500 dark:bg-blue-600 text-white text-sm text-center rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors cursor-pointer">
                            {uploadingVoice ? '上传中...' : '更换录音'}
                          </span>
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-3">
                      <p className="text-sm text-theme-text/70">暂无录音介绍</p>
                      <div>
                        <label>
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={handleVoiceUpload}
                            className="hidden"
                            disabled={uploadingVoice}
                          />
                          <span className="inline-block py-2 px-4 bg-blue-500 dark:bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors cursor-pointer">
                            {uploadingVoice ? '上传中...' : '上传录音'}
                          </span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* 服务列表 */}
            {!isEditing && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-theme-text">我的服务</h3>
                  <button
                    onClick={() => navigate('/player/services')}
                    className="py-1.5 px-3 bg-theme-primary text-white text-sm font-medium rounded-lg hover:bg-theme-primary/90 transition-colors"
                  >
                    <i className="fa-solid fa-plus mr-1"></i> 管理服务
                  </button>
                </div>
                
                {services.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {services.map((service) => (
                      <div key={service.id} className="bg-theme-background p-4 rounded-lg border border-theme-border">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-theme-text">{service.game_name || `游戏 ${service.game_id}`}</h4>
                          <span className="text-sm text-theme-primary font-semibold">¥{service.price}/{service.hours}小时</span>
                        </div>
                        <p className="text-xs text-theme-text/70">创建时间: {new Date(service.created_at).toLocaleDateString('zh-CN')}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-theme-background p-6 rounded-lg text-center mb-8">
                    <p className="text-theme-text/70 mb-3">暂无服务项目</p>
                    <button
                      onClick={() => navigate('/player/services')}
                      className="py-2 px-4 bg-theme-primary text-white text-sm rounded-lg hover:bg-theme-primary/90 transition-colors"
                    >
                      添加服务
                    </button>
                  </div>
                )}
              </div>
            )}
            

          </div>
        </div>
      </main>

      {/* 修改密码模态框 */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        userType="player"
      />
    </div>
  );
}