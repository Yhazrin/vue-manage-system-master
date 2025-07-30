import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from "@/components/Header";
import AvatarUpload from "@/components/AvatarUpload";
import ProfileEditForm from "@/components/ProfileEditForm";
import { toast } from "sonner";
import {
  getPlayerProfile,
  updatePlayerProfile,
  uploadAvatar,
  uploadQRCode,
  deleteQRCode,
  updateStatus,
  uploadVoice,
  PlayerProfileData
} from '@/services/playerProfileService';

export default function PlayerProfile() {
  const [profile, setProfile] = useState<PlayerProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [uploadingQR, setUploadingQR] = useState(false);
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const navigate = useNavigate();

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
      
      // 处理game_id字段，确保它是有效的数字或null
      const processedData: any = { ...data };
      if ('game_id' in processedData) {
        const gameIdValue = processedData.game_id;
        if (gameIdValue === '' || gameIdValue === null || gameIdValue === undefined) {
          processedData.game_id = null;
        } else {
          const numericGameId = parseInt(gameIdValue, 10);
          if (isNaN(numericGameId) || numericGameId <= 0) {
            processedData.game_id = null;
          } else {
            processedData.game_id = numericGameId;
          }
        }
      }
      
      const updatedProfile = await updatePlayerProfile(processedData);
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

  // 处理二维码上传
  const handleQRUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    // 验证文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过5MB');
      return;
    }

    try {
      setUploadingQR(true);
      const newQRUrl = await uploadQRCode(file);
      setProfile(prev => prev ? { ...prev, QR_img: newQRUrl } : null);
      toast.success('二维码上传成功');
    } catch (error) {
      console.error('Error uploading QR code:', error);
      toast.error(error instanceof Error ? error.message : '上传失败，请重试');
    } finally {
      setUploadingQR(false);
    }
  };

  // 处理二维码删除
  const handleQRDelete = async () => {
    try {
      await deleteQRCode();
      setProfile(prev => prev ? { ...prev, QR_img: null } : null);
      toast.success('二维码删除成功');
    } catch (error) {
      console.error('Error deleting QR code:', error);
      toast.error(error instanceof Error ? error.message : '删除失败，请重试');
    }
  };

  // 处理状态切换
  const handleStatusToggle = async () => {
    if (!profile) return;
    
    try {
      const newStatus = !profile.status;
      await updateStatus(newStatus);
      setProfile(prev => prev ? { ...prev, status: newStatus } : null);
      toast.success(`已${newStatus ? '上线' : '下线'}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error instanceof Error ? error.message : '状态更新失败');
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
      key: 'intro',
      label: '个人简介',
      value: profile.intro || '',
      type: 'textarea' as const,
      editable: true,
      maxLength: 200,
      placeholder: '请输入个人简介'
    },
    {
      key: 'game_id',
      label: '游戏ID',
      value: profile.game_id?.toString() || '',
      type: 'select' as const,
      editable: true,
      placeholder: '请选择游戏'
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
            <h1 className="text-2xl font-bold text-gray-900">陪玩主页</h1>
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
                onClick={() => navigate('/player/dashboard')}
                className="py-1.5 px-3 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
              >
                <i className="fa-solid fa-arrow-left mr-1"></i> 返回大厅
              </button>
            </div>
          </div>
          <p className="text-gray-500">管理您的陪玩信息和服务设置</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-6">
            {/* 陪玩信息头部 */}
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
                  <button
                    onClick={handleStatusToggle}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      profile.status 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {profile.status ? '在线' : '离线'}
                  </button>
                </div>
                <p className="text-sm text-gray-500 mb-4">ID: {profile.id} | 游戏ID: {profile.game_id || '未设置'}</p>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-6">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">¥{profile.money || 0}</p>
                    <p className="text-xs text-gray-500">账户余额</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">¥{profile.profit || 0}</p>
                    <p className="text-xs text-gray-500">累计收益</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{profile.totalOrders || 0}</p>
                    <p className="text-xs text-gray-500">完成订单</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{profile.rating || 0}</p>
                    <p className="text-xs text-gray-500">评分</p>
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
                      <p className="text-xs text-gray-500 mb-1">个人简介</p>
                      <p className="text-sm text-gray-900">{profile.intro || '暂无简介'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">注册时间</p>
                      <p className="text-sm text-gray-900">{new Date(profile.created_at).toLocaleString('zh-CN')}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-5 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">服务信息</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">陪玩ID</p>
                      <p className="text-sm text-gray-900">{profile.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">在线状态</p>
                      <p className={`text-sm ${profile.status ? 'text-green-600' : 'text-gray-600'}`}>
                        {profile.status ? '在线' : '离线'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">基础小时单价</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-900">¥{profile.hourlyRate || '未设置'}/小时</p>
                        <button
                          onClick={() => navigate('/player/services')}
                          className="text-xs text-purple-600 hover:text-purple-700 underline"
                        >
                          设置价格
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">在服务管理中可设置不同游戏的具体价格</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">录音介绍</p>
                      {profile.voice ? (
                        <audio controls className="w-full">
                          <source src={profile.voice} type="audio/mpeg" />
                          您的浏览器不支持音频播放
                        </audio>
                      ) : (
                        <p className="text-sm text-gray-400">暂无录音</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* 文件管理区域 */}
            {!isEditing && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* 收款二维码管理 */}
                <div className="bg-gray-50 p-5 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">收款二维码</h3>
                  {profile.QR_img ? (
                    <div className="space-y-3">
                      <img 
                        src={profile.QR_img} 
                        alt="收款二维码" 
                        className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <div className="flex space-x-2">
                        <label className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleQRUpload}
                            className="hidden"
                            disabled={uploadingQR}
                          />
                          <span className="block w-full py-2 px-3 bg-blue-600 text-white text-sm text-center rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                            {uploadingQR ? '上传中...' : '更换二维码'}
                          </span>
                        </label>
                        <button
                          onClick={handleQRDelete}
                          className="py-2 px-3 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm text-gray-500 mb-3">暂无收款二维码</p>
                      <label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleQRUpload}
                          className="hidden"
                          disabled={uploadingQR}
                        />
                        <span className="inline-block py-2 px-4 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors cursor-pointer">
                          {uploadingQR ? '上传中...' : '上传二维码'}
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                {/* 录音管理 */}
                <div className="bg-gray-50 p-5 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">录音介绍</h3>
                  {profile.voice ? (
                    <div className="space-y-3">
                      <audio controls className="w-full">
                        <source src={profile.voice} type="audio/mpeg" />
                        您的浏览器不支持音频播放
                      </audio>
                      <label>
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={handleVoiceUpload}
                          className="hidden"
                          disabled={uploadingVoice}
                        />
                        <span className="block w-full py-2 px-3 bg-blue-600 text-white text-sm text-center rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                          {uploadingVoice ? '上传中...' : '更换录音'}
                        </span>
                      </label>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm text-gray-500 mb-3">暂无录音介绍</p>
                      <label>
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={handleVoiceUpload}
                          className="hidden"
                          disabled={uploadingVoice}
                        />
                        <span className="inline-block py-2 px-4 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors cursor-pointer">
                          {uploadingVoice ? '上传中...' : '上传录音'}
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}