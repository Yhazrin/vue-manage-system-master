import { useState, useEffect } from 'react';
import Header from "@/components/Header";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import { 
  getPlayerProfile, 
  updatePlayerProfile, 
  uploadAvatar,
  PlayerProfileData 
} from '@/services/playerProfileService';
import { apiRequest } from '@/services/api';

export default function PlayerProfile() {
  const [profile, setProfile] = useState<PlayerProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newSkills, setNewSkills] = useState("");
  const [newRecipientName, setNewRecipientName] = useState("");
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);
  
  // 获取个人资料
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPlayerProfile();
      setProfile(data);
      setNewRecipientName(data.recipientName);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取个人资料失败';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // 初始加载
  useEffect(() => {
    fetchProfile();
  }, []);
  
  // 获取状态文本
  const getStatusText = () => {
    if (!profile) return '离线';
    switch(profile.status) {
      case 'online': return '在线';
      case 'busy': return '忙碌';
      case 'offline': return '离线';
      default: return '离线';
    }
  };
  
  // 获取状态颜色
  const getStatusColor = () => {
    if (!profile) return 'bg-gray-300';
    switch(profile.status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-300';
      default: return 'bg-gray-300';
    }
  };
  
  // 添加技能标签
  const addSkill = async () => {
    if (!profile || !newSkills || profile.skills.includes(newSkills)) return;
    
    try {
      setUpdating(true);
      const updatedSkills = [...profile.skills, newSkills];
      const updatedProfile = await updatePlayerProfile({ skills: updatedSkills });
      setProfile(updatedProfile);
      setNewSkills("");
      toast.success('技能标签添加成功');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '添加技能失败';
      toast.error(errorMessage);
    } finally {
      setUpdating(false);
    }
  };
  
  // 删除技能标签
  const removeSkill = async (skillToRemove: string) => {
    if (!profile) return;
    
    try {
      setUpdating(true);
      const updatedSkills = profile.skills.filter(skill => skill !== skillToRemove);
      const updatedProfile = await updatePlayerProfile({ skills: updatedSkills });
      setProfile(updatedProfile);
      toast.success('技能标签删除成功');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除技能失败';
      toast.error(errorMessage);
    } finally {
      setUpdating(false);
    }
  };
  
  // 处理收款码上传
  const handleQrCodeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setQrCodeFile(file);
      
      try {
        const formData = new FormData();
        formData.append('qrCode', file);
        const response = await apiRequest<{ url: string }>('/player/profile/qrcode', {
          method: 'POST',
          body: formData,
        });
        
        setProfile(prev => prev ? ({
          ...prev,
          qrCodeUrl: response.url
        }) : null);
        
        toast.success('收款码上传成功');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '上传收款码失败';
        toast.error(errorMessage);
      }
    }
  };

  // 删除收款码
  const handleRemoveQrCode = () => {
    setProfile(prev => prev ? { ...prev, qrCodeUrl: "" } : null);
    setQrCodeFile(null);
  };
  
  // 保存修改
  const saveChanges = async () => {
    if (!profile) return;
    
    try {
      setUpdating(true);
      const updatedProfile = await updatePlayerProfile({
        recipientName: newRecipientName,
        qrCodeUrl: profile.qrCodeUrl
      });
      setProfile(updatedProfile);
      setIsEditing(false);
      toast.success('个人资料更新成功');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '保存失败';
      toast.error(errorMessage);
    } finally {
      setUpdating(false);
    }
  };
  
  return (
    <div className="bg-theme-background min-h-screen text-theme-text">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">个人主页</h1>
            {profile && (
              <button 
                onClick={() => setIsEditing(!isEditing)}
                disabled={updating}
                className="py-1.5 px-3 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {isEditing ? '取消' : '编辑资料'}
              </button>
            )}
          </div>
          <p className="text-gray-500">管理您的个人信息和偏好设置</p>
        </div>
        
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="animate-pulse">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
                <div>
                  <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                  <div className="flex gap-3">
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="text-red-500 mb-4">
              <i className="fa-solid fa-exclamation-triangle text-2xl mb-2"></i>
              <p>{error}</p>
            </div>
            <button 
              onClick={fetchProfile}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              重试
            </button>
          </div>
        ) : !profile ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-gray-500">未找到个人资料信息</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6">
                {/* 个人信息头部 */}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
                  <div className="relative">
                    <img 
                      src={profile.avatar} 
                      alt={profile.nickname}
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-sm"
                    />
                    <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center">
                      <span className={`w-4 h-4 rounded-full ${getStatusColor()}`}></span>
                    </div>
                  </div>
                  
                  <div className="text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                      <h2 className="text-xl font-bold text-gray-900">{profile.nickname}</h2>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{getStatusText()}</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">UID: {profile.uid}</p>
                    
                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">¥{profile.balance.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">当前余额</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">¥{profile.withdrawalEarnings.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">累计收益</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 技能标签 */}
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">擅长技能</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, index) => (
                      <div 
                        key={index} 
                        className="flex items-center px-3 py-1.5 bg-gray-50 text-gray-700 text-sm rounded-full"
                      >
                        <span>{skill}</span>
                        {isEditing && (
                          <button 
                            onClick={() => removeSkill(skill)}
                            disabled={updating}
                            className="ml-1 text-gray-400 hover:text-red-500 disabled:opacity-50"
                          >
                            <i className="fa-solid fa-times text-xs"></i>
                          </button>
                        )}
                      </div>
                    ))}
                    
                    {isEditing && (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newSkills}
                          onChange={(e) => setNewSkills(e.target.value)}
                          placeholder="添加技能"
                          className="px-3 py-1.5 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <button 
                          onClick={addSkill}
                          disabled={updating}
                          className="p-1.5 bg-purple-600 text-white rounded-full text-sm hover:bg-purple-700 transition-colors disabled:opacity-50"
                        >
                          <i className="fa-solid fa-plus"></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* 收款信息 */}
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">收款信息</h3>
                  
                  <div className="mb-4">
                    <label className="block text-xs text-gray-500 mb-1">收款人姓名</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={newRecipientName}
                        onChange={(e) => setNewRecipientName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    ) : (
                      <p className="text-sm text-gray-900">{profile.recipientName}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">收款码</label>
                    <div className="mt-2">
                      {profile.qrCodeUrl ? (
                        <div className="relative w-40 h-40 bg-white p-2 rounded-lg border border-gray-100">
                          <img 
                            src={profile.qrCodeUrl} 
                            alt="收款码"
                            className="w-full h-full object-contain"
                          />
                          {isEditing && (
                            <button 
                              onClick={handleRemoveQrCode}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                            >
                              <i className="fa-solid fa-times"></i>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="w-40 h-40 bg-gray-50 rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                          <i className="fa-solid fa-qrcode text-2xl mb-2"></i>
                          <p className="text-xs text-center">未上传收款码</p>
                        </div>
                      )}
                      
                      {isEditing && (
                        <div className="mt-3">
                          <label className="inline-block py-2 px-3 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                            <i className="fa-solid fa-upload mr-1"></i> 上传收款码
                            <input type="file" accept="image/*" onChange={handleQrCodeUpload} className="hidden" />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {isEditing && (
                  <div className="flex justify-end">
                    <button 
                      onClick={saveChanges}
                      disabled={updating}
                      className="py-2 px-4 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                      {updating ? '保存中...' : '保存修改'}
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* 我的订单入口 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-6">
              <div className="p-4 border border-gray-100 rounded-lg hover:border-purple-200 hover:bg-purple-50 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">我的订单</h3>
                    <p className="text-sm text-gray-500">查看和管理您的所有订单</p>
                  </div>
                  <i className="fa-solid fa-arrow-right text-gray-400"></i>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}