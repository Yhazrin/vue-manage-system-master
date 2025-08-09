import Header from "@/components/Header";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { format } from 'date-fns';
import { 
  getGifts, 
  createGift, 
  updateGift, 
  deleteGift, 
  getGiftRecords,
  Gift,
  GiftRecord 
} from '@/services/giftService';
import { API_BASE_URL } from '@/config/api';
import { buildImageUrl } from '@/utils/imageUtils';

export default function AdminGiftManagement() {
  // State for gifts
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [giftRecords, setGiftRecords] = useState<GiftRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recordsError, setRecordsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'gifts' | 'records'>('gifts');
  const [isAddingGift, setIsAddingGift] = useState(false);
  const [isEditingGift, setIsEditingGift] = useState<Gift | null>(null);
  const [newGift, setNewGift] = useState<{
    name: string;
    price: number;
    imageUrl: string;
    uploadFile?: File;
  }>({
    name: "",
    price: 0,
    imageUrl: ""
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editSelectedImage, setEditSelectedImage] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [uploadMethod, setUploadMethod] = useState<'file' | 'base64'>('file');
  const [editUploadMethod, setEditUploadMethod] = useState<'file' | 'base64'>('file');
  
  // Fetch gifts on component mount
  useEffect(() => {
    loadGifts();
  }, []);

  // Fetch gift records when switching to records tab
  useEffect(() => {
    if (activeTab === 'records') {
      loadGiftRecords();
    }
  }, [activeTab]);

  const loadGifts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getGifts();
      // 确保data是数组，如果不是则使用空数组
      setGifts(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取礼物列表失败';
      setError(errorMessage);
      console.error('Failed to fetch gifts:', err);
      
      // 确保在错误情况下设置空数组
      setGifts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadGiftRecords = async () => {
    try {
      setRecordsLoading(true);
      setRecordsError(null);
      
      const data = await getGiftRecords();
      // 确保data是数组，如果不是则使用空数组
      setGiftRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取送礼记录失败';
      setRecordsError(errorMessage);
      console.error('Failed to fetch gift records:', err);
      
      // 确保在错误情况下设置空数组
      setGiftRecords([]);
    } finally {
      setRecordsLoading(false);
    }
  };
  
  // 切换排序方向
  const toggleSortDirection = () => {
    const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(newDirection);
    
    const sortedGifts = [...gifts].sort((a, b) => {
      if (newDirection === 'asc') {
        return a.price - b.price;
      } else {
        return b.price - a.price;
      }
    });
    
    setGifts(sortedGifts);
  };

  // 处理图片选择（base64方式，保留原有功能）
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Image = event.target?.result as string;
        if (isEdit) {
          setEditSelectedImage(base64Image);
          if (isEditingGift) {
            setIsEditingGift({...isEditingGift, imageUrl: base64Image});
          }
        } else {
          setSelectedImage(base64Image);
          setNewGift({...newGift, imageUrl: base64Image});
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // 处理文件上传（新增，用于FormData方式）
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      // 创建预览URL
      const previewUrl = URL.createObjectURL(file);
      
      if (isEdit) {
        setEditSelectedImage(previewUrl);
        if (isEditingGift) {
          setIsEditingGift({
            ...isEditingGift,
            imageUrl: previewUrl,
            uploadFile: file // 存储文件对象
          } as any);
        }
      } else {
        setSelectedImage(previewUrl);
        setNewGift({
          ...newGift,
          imageUrl: previewUrl,
          uploadFile: file // 存储文件对象
        });
      }
    }
  };
  
  // 处理添加礼物
  const handleAddGift = async () => {
    if (!newGift.name.trim() || newGift.price <= 0) {
      toast.error("请输入有效的礼物名称和价格");
      return;
    }
    
    // 检查认证状态
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      toast.error("请先登录管理员账号");
      window.location.href = '/login';
      return;
    }
    
    try {
      const userInfo = JSON.parse(user);
      console.log('当前用户信息:', userInfo);
      console.log('当前token:', token);
      
      let gift;
      
      // 如果有上传的文件，使用FormData方式
      if (newGift.uploadFile) {
        const formData = new FormData();
        formData.append('name', newGift.name.trim());
        formData.append('price', newGift.price.toString());
        formData.append('image', newGift.uploadFile);
        
        const response = await fetch(`${API_BASE_URL}/gifts`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (response.status === 404) {
            throw new Error('图片上传接口不存在，请联系管理员');
          } else if (response.status === 413) {
            throw new Error('图片文件过大，请选择小于10MB的图片');
          } else if (response.status === 400) {
            throw new Error(errorData.error || errorData.message || '图片格式不支持，请选择JPEG、PNG、GIF或WebP格式');
          } else {
            throw new Error(errorData.message || `上传失败 (${response.status})`);
          }
        }
        
        gift = await response.json();
      } else {
        // 否则使用原有的base64方式
        gift = await createGift({
          name: newGift.name.trim(),
          price: newGift.price,
          imageUrl: selectedImage || newGift.imageUrl.trim() || undefined
        });
      }
      
      setGifts(prev => [...prev, gift].sort((a, b) => 
        sortDirection === 'asc' ? a.price - b.price : b.price - a.price
      ));
      setIsAddingGift(false);
      setNewGift({ name: "", price: 0, imageUrl: "" });
      setSelectedImage(null);
      setUploadMethod('file');
      toast.success("礼物添加成功");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '添加礼物失败';
      console.error('Failed to add gift:', err);
      
      // 如果是认证错误，提示重新登录
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('认证')) {
        toast.error("认证失败，请重新登录管理员账号");
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else {
        toast.error(errorMessage);
      }
    }
  };
  
  // 处理编辑礼物
  const handleEditGift = async () => {
    if (!isEditingGift || !isEditingGift.name.trim() || isEditingGift.price <= 0) {
      toast.error("请输入有效的礼物名称和价格");
      return;
    }
    
    // 检查认证状态
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      toast.error("请先登录管理员账号");
      window.location.href = '/login';
      return;
    }
    
    try {
      console.log('🎁 开始更新礼物:', { 
        id: isEditingGift.id, 
        name: isEditingGift.name.trim(), 
        price: isEditingGift.price,
        hasUploadFile: !!(isEditingGift as any).uploadFile,
        hasEditSelectedImage: !!editSelectedImage
      });
      
      let updatedGift;
      
      // 如果有上传的文件，使用FormData方式
      if ((isEditingGift as any).uploadFile) {
        console.log('🎁 使用FormData方式更新（有新上传文件）');
        
        const formData = new FormData();
        formData.append('name', isEditingGift.name.trim());
        formData.append('price', isEditingGift.price.toString());
        formData.append('image', (isEditingGift as any).uploadFile);
        
        const response = await fetch(`${API_BASE_URL}/gifts/${isEditingGift.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('🎁 FormData更新失败:', { status: response.status, errorData });
          
          if (response.status === 400) {
            if (errorData.error?.includes('已存在')) {
              throw new Error(`礼物名称"${isEditingGift.name.trim()}"已存在，请使用其他名称`);
            } else if (errorData.error?.includes('格式')) {
              throw new Error(errorData.error);
            } else {
              throw new Error(errorData.error || errorData.message || '请求参数错误：请检查礼物名称和价格是否有效');
            }
          } else if (response.status === 404) {
            throw new Error('礼物不存在或已被删除');
          } else if (response.status === 403) {
            throw new Error('权限不足：仅管理员可更新礼物');
          } else if (response.status === 401) {
            throw new Error('请先登录');
          } else {
            throw new Error(`更新失败 (${response.status})`);
          }
        }
        
        const responseData = await response.json();
        updatedGift = responseData.gift || responseData;
        console.log('🎁 FormData更新成功:', updatedGift);
      } else {
        // 否则使用原有的base64方式
        console.log('🎁 使用updateGift服务更新');
        
        updatedGift = await updateGift(isEditingGift.id, {
          name: isEditingGift.name.trim(),
          price: isEditingGift.price,
          imageUrl: editSelectedImage || isEditingGift.imageUrl?.trim() || undefined
        });
        
        console.log('🎁 updateGift服务更新成功:', updatedGift);
      }
      
      // 更新礼物列表
      setGifts(gifts.map(gift => 
        gift.id === isEditingGift.id ? updatedGift : gift
      ).sort((a, b) => 
        sortDirection === 'asc' ? a.price - b.price : b.price - a.price
      ));
      
      setIsEditingGift(null);
      setEditSelectedImage(null);
      toast.success(`礼物"${updatedGift.name}"更新成功`);
      console.log('✅ 礼物更新完成:', updatedGift);
    } catch (err) {
      console.error('🎁 礼物更新失败:', err);
      
      let errorMessage = '更新礼物失败';
      
      if (err instanceof Error) {
        // 处理特定的错误消息
        if (err.message.includes('名称已存在') || err.message.includes('已存在')) {
          errorMessage = err.message;
        } else if (err.message.includes('礼物不存在')) {
          errorMessage = '礼物不存在或已被删除';
          // 如果礼物不存在，关闭编辑框并刷新列表
          setIsEditingGift(null);
          setEditSelectedImage(null);
          loadGifts();
        } else if (err.message.includes('权限')) {
          errorMessage = '权限不足：仅管理员可更新礼物';
        } else if (err.message.includes('请先登录')) {
          errorMessage = '登录已过期，请重新登录';
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else {
          errorMessage = err.message || errorMessage;
        }
      }
      
      toast.error(errorMessage);
    }
  };
  
  // 处理删除礼物
  const handleDeleteGift = async (id: number) => {
    const gift = gifts.find(g => g.id === id);
    const giftName = gift ? gift.name : `ID: ${id}`;
    
    if (!window.confirm(`确定要删除礼物"${giftName}"吗？\n\n注意：如果该礼物已被用户赠送，将无法删除。`)) {
      return;
    }
    
    try {
      console.log('开始删除礼物:', { id, name: giftName });
      await deleteGift(id);
      setGifts(gifts.filter(gift => gift.id !== id));
      toast.success(`礼物"${giftName}"删除成功`);
      console.log('礼物删除成功:', { id, name: giftName });
    } catch (err) {
      console.error('删除礼物失败:', err);
      
      let errorMessage = '删除礼物失败';
      
      if (err instanceof Error) {
        // 处理特定的错误消息
        if (err.message.includes('存在相关的送礼记录') || err.message.includes('已被用户赠送')) {
          errorMessage = `无法删除礼物"${giftName}"：该礼物已被用户赠送，存在相关的送礼记录`;
        } else if (err.message.includes('礼物不存在')) {
          errorMessage = `礼物"${giftName}"不存在或已被删除`;
          // 如果礼物不存在，从列表中移除
          setGifts(gifts.filter(gift => gift.id !== id));
        } else if (err.message.includes('权限')) {
          errorMessage = '权限不足：仅管理员可删除礼物';
        } else {
          errorMessage = err.message || errorMessage;
        }
      }
      
      toast.error(errorMessage);
    }
  };
  
  return (
    <div className="bg-theme-background min-h-screen text-theme-text">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-theme-text mb-2">礼物管理</h1>
          <p className="text-theme-text/70">管理礼物类型和送礼记录</p>
        </div>
        
        {/* 标签页切换 */}
        <div className="mb-6">
          <div className="inline-flex bg-theme-surface rounded-lg p-1 border border-theme-border">
            <button
              onClick={() => setActiveTab('gifts')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'gifts' 
                  ? 'bg-theme-background text-theme-primary shadow-sm' 
                  : 'text-theme-text/70 hover:text-theme-text'
              }`}
            >
              礼物列表
            </button>
            <button
              onClick={() => setActiveTab('records')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'records' 
                  ? 'bg-theme-background text-theme-primary shadow-sm' 
                  : 'text-theme-text/70 hover:text-theme-text'
              }`}
            >
              送礼记录
            </button>
          </div>
        </div>
        
        {/* 礼物列表标签内容 */}
        {activeTab === 'gifts' && (
          <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border overflow-hidden">
            <div className="p-5 border-b border-theme-border flex items-center justify-between">
              <h2 className="font-semibold text-theme-text">礼物管理</h2>
              <button 
                onClick={() => setIsAddingGift(true)}
                className="py-1.5 px-3 bg-theme-primary text-white text-sm font-medium rounded-lg hover:bg-theme-primary/80 transition-colors"
              >
                <i className="fa-solid fa-plus mr-1"></i>添加礼物
              </button>
            </div>
            
            {/* 添加礼物模态框 */}
            {isAddingGift && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-theme-surface rounded-xl shadow-lg w-full max-w-md overflow-hidden">
                  <div className="p-5 border-b border-theme-border flex items-center justify-between">
                    <h3 className="font-semibold text-theme-text">添加新礼物</h3>
                    <button 
                      onClick={() => {
                        setIsAddingGift(false);
                        setNewGift({ name: "", price: 0, imageUrl: "" });
                        setSelectedImage(null);
                        setUploadMethod('file');
                      }}
                      className="text-theme-text/70 hover:text-theme-text"
                    >
                      <i className="fa-solid fa-times"></i>
                    </button>
                  </div>
                  
                  <div className="p-5">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-theme-text mb-1">礼物名称</label>
                      <input
                        type="text"
                        value={newGift.name}
                        onChange={(e) => setNewGift({...newGift, name: e.target.value})}
                        className="w-full px-4 py-2 border border-theme-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary bg-theme-background text-theme-text"
                        placeholder="请输入礼物名称"
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-theme-text mb-1">礼物价格 (元)</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={newGift.price}
                        onChange={(e) => setNewGift({...newGift, price: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-theme-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary bg-theme-background text-theme-text"
                        placeholder="请输入礼物价格"
                      />
                    </div>
                    
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-theme-text mb-1">礼物图片</label>
                      
                      {/* 上传方式选择 */}
                      <div className="mb-3">
                        <div className="flex space-x-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="uploadMethod"
                              value="file"
                              checked={uploadMethod === 'file'}
                              onChange={(e) => setUploadMethod(e.target.value as 'file' | 'base64')}
                              className="mr-2"
                            />
                            <span className="text-sm text-theme-text">文件上传（推荐）</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="uploadMethod"
                              value="base64"
                              checked={uploadMethod === 'base64'}
                              onChange={(e) => setUploadMethod(e.target.value as 'file' | 'base64')}
                              className="mr-2"
                            />
                            <span className="text-sm text-theme-text">Base64编码</span>
                          </label>
                        </div>
                      </div>
                      
                      <div className="border-2 border-dashed border-theme-border rounded-lg p-4 text-center hover:border-theme-primary transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => uploadMethod === 'file' ? handleFileUpload(e, false) : handleImageSelect(e, false)}
                          className="hidden"
                          id={uploadMethod === 'file' ? "gift-file-upload" : "gift-base64-upload"}
                        />
                        {selectedImage ? (
                          <div className="flex flex-col items-center">
                            <img 
                              src={buildImageUrl(selectedImage)}
                              alt="Selected gift image"
                              className="h-48 w-48 object-cover rounded-md mb-2"
                            />
                            <button
                              onClick={() => {
                                setSelectedImage(null);
                                setNewGift({...newGift, imageUrl: "", uploadFile: undefined});
                              }}
                              className="text-red-600 hover:text-red-900 text-sm"
                            >
                              移除图片
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <i className="fa-solid fa-image text-theme-text/40 text-4xl mb-2"></i>
                            <div className="flex items-center space-x-2">
                              {uploadMethod === 'file' ? (
                                <label 
                                  htmlFor="gift-file-upload"
                                  className="cursor-pointer text-theme-primary hover:text-theme-primary/80 font-medium px-3 py-1 border border-theme-primary rounded"
                                >
                                  选择文件
                                </label>
                              ) : (
                                <label 
                                  htmlFor="gift-base64-upload"
                                  className="cursor-pointer text-theme-accent hover:text-theme-accent/80 font-medium px-3 py-1 border border-theme-accent rounded"
                                >
                                  选择图片
                                </label>
                              )}
                            </div>
                            <p className="text-xs text-theme-text/70 mt-2">
                              JPEG、PNG、GIF、WebP (最大 10MB)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => {
                          setIsAddingGift(false);
                          setNewGift({ name: "", price: 0, imageUrl: "" });
                          setSelectedImage(null);
                          setUploadMethod('file');
                        }}
                        className="py-2 px-4 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        取消
                      </button>
                      <button 
                        onClick={handleAddGift}
                        className="py-2 px-4 bg-theme-primary text-white text-sm font-medium rounded-lg hover:bg-theme-primary/80 transition-colors"
                      >
                        添加
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* 编辑礼物模态框 */}
            {isEditingGift && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">编辑礼物</h3>
                    <button 
                      onClick={() => {
                        setIsEditingGift(null);
                        setEditSelectedImage(null);
                        setEditUploadMethod('file');
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <i className="fa-solid fa-times"></i>
                    </button>
                  </div>
                  
                  <div className="p-5">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">礼物名称</label>
                      <input
                        type="text"
                        value={isEditingGift.name}
                        onChange={(e) => setIsEditingGift({...isEditingGift, name: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary"
                        placeholder="请输入礼物名称"
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">礼物价格 (元)</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={isEditingGift.price}
                        onChange={(e) => setIsEditingGift({...isEditingGift, price: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary"
                        placeholder="请输入礼物价格"
                      />
                    </div>
                    
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">礼物图片</label>
                      
                      {/* 上传方式选择 */}
                      <div className="mb-3">
                        <div className="flex space-x-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="editUploadMethod"
                              value="file"
                              checked={editUploadMethod === 'file'}
                              onChange={(e) => setEditUploadMethod(e.target.value as 'file' | 'base64')}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700">文件上传（推荐）</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="editUploadMethod"
                              value="base64"
                              checked={editUploadMethod === 'base64'}
                              onChange={(e) => setEditUploadMethod(e.target.value as 'file' | 'base64')}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700">Base64编码</span>
                          </label>
                        </div>
                      </div>
                      
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-theme-primary transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => editUploadMethod === 'file' ? handleFileUpload(e, true) : handleImageSelect(e, true)}
                          className="hidden"
                          id={editUploadMethod === 'file' ? "edit-gift-file-upload" : "edit-gift-base64-upload"}
                        />
                        {editSelectedImage || (isEditingGift.imageUrl && !isEditingGift.imageUrl.startsWith('data:')) ? (
                          <div className="flex flex-col items-center">
                            <img 
                              src={buildImageUrl(editSelectedImage || isEditingGift.imageUrl)}
                              alt="Gift image"
                              className="h-48 w-48 object-cover rounded-md mb-2"
                            />
                            <button
                              onClick={() => {
                                setEditSelectedImage(null);
                                if (isEditingGift) {
                                  setIsEditingGift({...isEditingGift, imageUrl: "", uploadFile: undefined} as any);
                                }
                              }}
                              className="text-red-600 hover:text-red-900 text-sm"
                            >
                              移除图片
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <i className="fa-solid fa-image text-theme-text/40 text-4xl mb-2"></i>
                            <div className="flex items-center space-x-2">
                              {editUploadMethod === 'file' ? (
                                <label 
                                  htmlFor="edit-gift-file-upload"
                                  className="cursor-pointer text-theme-primary hover:text-theme-primary/80 font-medium px-3 py-1 border border-theme-primary rounded"
                                >
                                  选择文件
                                </label>
                              ) : (
                                <label 
                                  htmlFor="edit-gift-base64-upload"
                                  className="cursor-pointer text-theme-accent hover:text-theme-accent/80 font-medium px-3 py-1 border border-theme-accent rounded"
                                >
                                  选择图片
                                </label>
                              )}
                            </div>
                            <p className="text-xs text-theme-text/70 mt-2">
                              JPEG、PNG、GIF、WebP (最大 10MB)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => {
                          setIsEditingGift(null);
                          setEditSelectedImage(null);
                          setEditUploadMethod('file');
                        }}
                        className="py-2 px-4 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        取消
                      </button>
                      <button 
                        onClick={handleEditGift}
                        className="py-2 px-4 bg-theme-primary text-white text-sm font-medium rounded-lg hover:bg-theme-primary/80 transition-colors"
                      >
                        保存
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mx-auto mb-4"></div>
                  <p className="text-theme-text/70">加载礼物列表中...</p>
                </div>
              ) : error ? (
                <div className="p-8 text-center">
                  <div className="text-theme-error mb-4">
                    <i className="fa-solid fa-exclamation-triangle text-2xl"></i>
                  </div>
                  <p className="text-theme-text mb-4">{error}</p>
                  <button 
                    onClick={loadGifts}
                    className="px-4 py-2 bg-theme-primary text-white rounded-lg hover:bg-theme-primary/80 transition-colors"
                  >
                    重试
                  </button>
                </div>
              ) : gifts.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-theme-text/40 mb-4">
                    <i className="fa-solid fa-gift text-4xl"></i>
                  </div>
                  <p className="text-theme-text/70 mb-4">暂无礼物数据</p>
                  <button 
                    onClick={() => setIsAddingGift(true)}
                    className="px-4 py-2 bg-theme-primary text-white rounded-lg hover:bg-theme-primary/80 transition-colors"
                  >
                    添加第一个礼物
                  </button>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-theme-surface/50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">礼物图片</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">礼物名称</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider cursor-pointer" onClick={toggleSortDirection}>
                        <div className="flex items-center">
                          价格 (元)
                          <i className={`fa-solid ml-1 ${sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down'}`}></i>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">创建时间</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border">
                    {gifts.map(gift => (
                      <tr key={gift.id} className="hover:bg-theme-surface/30">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">{gift.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <img 
                            src={buildImageUrl(gift.imageUrl)} 
                            alt={gift.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">{gift.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">¥{(typeof gift.price === 'number' ? gift.price : parseFloat(gift.price) || 0).toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">{gift.createdAt}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => setIsEditingGift({...gift})}
                            className="text-theme-primary hover:text-theme-primary/80 mr-3"
                          >
                            编辑
                          </button>
                          <button 
                            onClick={() => handleDeleteGift(gift.id)}
                            className="text-theme-error hover:text-theme-error/80"
                          >
                            删除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
        
        {/* 送礼记录标签内容 */}
        {activeTab === 'records' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">送礼记录管理</h2>
            </div>
            
            <div className="overflow-x-auto">
              {recordsLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mx-auto mb-4"></div>
                  <p className="text-gray-500">加载送礼记录中...</p>
                </div>
              ) : recordsError ? (
                <div className="p-8 text-center">
                  <div className="text-red-500 mb-4">
                    <i className="fa-solid fa-exclamation-triangle text-2xl"></i>
                  </div>
                  <p className="text-gray-700 mb-4">{recordsError}</p>
                  <button 
                    onClick={loadGiftRecords}
                    className="px-4 py-2 bg-theme-primary text-white rounded-lg hover:bg-theme-primary/80 transition-colors"
                  >
                    重试
                  </button>
                </div>
              ) : giftRecords.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-gray-400 mb-4">
                    <i className="fa-solid fa-heart text-4xl"></i>
                  </div>
                  <p className="text-gray-500">暂无送礼记录</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">记录ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户信息</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">陪玩信息</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">礼物信息</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">数量</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">总价 (元)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">平台抽成 (元)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">陪玩收入 (元)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">赠送时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {giftRecords.map(record => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{record.user_name || `用户${record.user_id}`}</div>
                            <div className="text-xs text-gray-500">ID: {record.user_id}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{record.player_name || `陪玩${record.player_id}`}</div>
                            <div className="text-xs text-gray-500">ID: {record.player_id}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900 text-sm">{record.gift_name || `礼物${record.gift_id}`}</div>
                          <div className="text-xs text-gray-500">单价: ¥{(record.gift_price || 0).toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">¥{(record.total_price || 0).toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-warning">¥{(record.platform_fee || 0).toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-success">¥{(record.final_amount || 0).toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(record.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}