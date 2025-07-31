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
  const [newGift, setNewGift] = useState({
    name: "",
    price: 0
  });
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
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
  
  // 处理添加礼物
  const handleAddGift = async () => {
    if (!newGift.name.trim() || newGift.price <= 0) {
      toast.error("请输入有效的礼物名称和价格");
      return;
    }
    
    try {
      const gift = await createGift({
        name: newGift.name.trim(),
        price: newGift.price
      });
      
      setGifts(prev => [...prev, gift].sort((a, b) => 
        sortDirection === 'asc' ? a.price - b.price : b.price - a.price
      ));
      setIsAddingGift(false);
      setNewGift({ name: "", price: 0 });
      toast.success("礼物添加成功");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '添加礼物失败';
      console.error('Failed to add gift:', err);
      toast.error(errorMessage);
    }
  };
  
  // 处理编辑礼物
  const handleEditGift = async () => {
    if (!isEditingGift || !isEditingGift.name.trim() || isEditingGift.price <= 0) {
      toast.error("请输入有效的礼物名称和价格");
      return;
    }
    
    try {
      const updatedGift = await updateGift(isEditingGift.id, {
        name: isEditingGift.name.trim(),
        price: isEditingGift.price
      });
      
      setGifts(gifts.map(gift => 
        gift.id === isEditingGift.id ? updatedGift : gift
      ));
      setIsEditingGift(null);
      toast.success("礼物更新成功");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新礼物失败';
      console.error('Failed to update gift:', err);
      toast.error(errorMessage);
    }
  };
  
  // 处理删除礼物
  const handleDeleteGift = async (id: number) => {
    if (!window.confirm("确定要删除这个礼物吗？")) {
      return;
    }
    
    try {
      await deleteGift(id);
      setGifts(gifts.filter(gift => gift.id !== id));
      toast.success("礼物删除成功");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除礼物失败';
      console.error('Failed to delete gift:', err);
      toast.error(errorMessage);
    }
  };
  
  return (
    <div className="bg-theme-background min-h-screen text-theme-text">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">礼物管理</h1>
          <p className="text-gray-500">管理礼物类型和送礼记录</p>
        </div>
        
        {/* 标签页切换 */}
        <div className="mb-6">
          <div className="inline-flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('gifts')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'gifts' 
                  ? 'bg-white text-purple-600 shadow-sm' 
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              礼物列表
            </button>
            <button
              onClick={() => setActiveTab('records')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'records' 
                  ? 'bg-white text-purple-600 shadow-sm' 
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              送礼记录
            </button>
          </div>
        </div>
        
        {/* 礼物列表标签内容 */}
        {activeTab === 'gifts' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">礼物管理</h2>
              <button 
                onClick={() => setIsAddingGift(true)}
                className="py-1.5 px-3 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                <i className="fa-solid fa-plus mr-1"></i>添加礼物
              </button>
            </div>
            
            {/* 添加礼物模态框 */}
            {isAddingGift && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">添加新礼物</h3>
                    <button 
                      onClick={() => setIsAddingGift(false)}
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
                        value={newGift.name}
                        onChange={(e) => setNewGift({...newGift, name: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="请输入礼物名称"
                      />
                    </div>
                    
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">礼物价格 (元)</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={newGift.price}
                        onChange={(e) => setNewGift({...newGift, price: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="请输入礼物价格"
                      />
                    </div>
                    
                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => setIsAddingGift(false)}
                        className="py-2 px-4 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        取消
                      </button>
                      <button 
                        onClick={handleAddGift}
                        className="py-2 px-4 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
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
                      onClick={() => setIsEditingGift(null)}
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
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="请输入礼物名称"
                      />
                    </div>
                    
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">礼物价格 (元)</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={isEditingGift.price}
                        onChange={(e) => setIsEditingGift({...isEditingGift, price: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="请输入礼物价格"
                      />
                    </div>
                    
                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => setIsEditingGift(null)}
                        className="py-2 px-4 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        取消
                      </button>
                      <button 
                        onClick={handleEditGift}
                        className="py-2 px-4 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
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
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">加载礼物列表中...</p>
                </div>
              ) : error ? (
                <div className="p-8 text-center">
                  <div className="text-red-500 mb-4">
                    <i className="fa-solid fa-exclamation-triangle text-2xl"></i>
                  </div>
                  <p className="text-gray-700 mb-4">{error}</p>
                  <button 
                    onClick={loadGifts}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    重试
                  </button>
                </div>
              ) : gifts.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-gray-400 mb-4">
                    <i className="fa-solid fa-gift text-4xl"></i>
                  </div>
                  <p className="text-gray-500 mb-4">暂无礼物数据</p>
                  <button 
                    onClick={() => setIsAddingGift(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    添加第一个礼物
                  </button>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">礼物图片</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">礼物名称</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={toggleSortDirection}>
                        <div className="flex items-center">
                          价格 (元)
                          <i className={`fa-solid ml-1 ${sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down'}`}></i>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {gifts.map(gift => (
                      <tr key={gift.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{gift.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <img 
                            src={gift.imageUrl} 
                            alt={gift.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{gift.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">¥{(typeof gift.price === 'number' ? gift.price : parseFloat(gift.price) || 0).toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{gift.createdAt}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => setIsEditingGift({...gift})}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            编辑
                          </button>
                          <button 
                            onClick={() => handleDeleteGift(gift.id)}
                            className="text-red-600 hover:text-red-900"
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
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
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
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">订单号</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户信息</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">陪玩信息</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">礼物信息</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">总价 (元)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">收款码</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">赠送时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {giftRecords.map(record => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.orderId}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{record.userName}</div>
                            <div className="text-xs text-gray-500">{record.userUid}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{record.playerName}</div>
                            <div className="text-xs text-gray-500">{record.playerUid}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900 text-sm">{record.giftName}</div>
                          <div className="text-xs text-gray-500">单价: ¥{(typeof record.giftPrice === 'number' ? record.giftPrice : parseFloat(record.giftPrice) || 0).toFixed(2)} x {record.quantity}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">¥{(typeof record.totalPrice === 'number' ? record.totalPrice : parseFloat(record.totalPrice) || 0).toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <img 
                            src={record.qrCodeUrl} 
                            alt="Payment QR code"
                            className="w-12 h-12 rounded object-cover"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.createdAt}</td>
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