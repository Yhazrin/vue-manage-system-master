import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from "@/components/Header";
import { toast } from "sonner";
import { fetchJson } from '@/utils/fetchWrapper';
import { API_BASE_URL } from '@/config/api';

interface Game {
  id: number;
  name: string;
}

interface Service {
  id: number;
  player_id: number;
  game_id: number;
  game_name?: string;
  price: number;
  hours: number;
  created_at: string;
}

export default function PlayerServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    game_id: '',
    price: '',
    hours: '1'
  });
  const navigate = useNavigate();

  // 获取游戏列表
  const fetchGames = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/games`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setGames(data.games || []);
      }
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  };

  // 获取服务列表
  const fetchServices = async () => {
    try {
      setLoading(true);
      const data = await fetchJson(`${API_BASE_URL}/services/my`);
      if (data.success) {
        setServices(data.services || []);
      } else {
        toast.error(data.error || '获取服务列表失败');
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('获取服务列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 创建服务
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.game_id || !formData.price) {
      toast.error('请填写完整信息');
      return;
    }

    try {
      const data = await fetchJson(`${API_BASE_URL}/services`, {
        method: 'POST',
        body: JSON.stringify({
          game_id: parseInt(formData.game_id),
          price: parseFloat(formData.price),
          hours: parseInt(formData.hours)
        })
      });

      if (data.success) {
        toast.success('服务创建成功');
        setIsAdding(false);
        setFormData({ game_id: '', price: '', hours: '1' });
        fetchServices();
      } else {
        toast.error(data.error || '创建服务失败');
      }
    } catch (error) {
      console.error('Error creating service:', error);
      toast.error('创建服务失败');
    }
  };

  // 更新服务
  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingService || !formData.game_id || !formData.price) {
      toast.error('请填写完整信息');
      return;
    }

    try {
      const data = await fetchJson(`${API_BASE_URL}/services/${editingService.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          game_id: parseInt(formData.game_id),
          price: parseFloat(formData.price),
          hours: parseInt(formData.hours)
        })
      });

      if (data.success) {
        toast.success('服务更新成功');
        setEditingService(null);
        setFormData({ game_id: '', price: '', hours: '1' });
        fetchServices();
      } else {
        toast.error(data.error || '更新服务失败');
      }
    } catch (error) {
      console.error('Error updating service:', error);
      toast.error('更新服务失败');
    }
  };

  // 删除服务
  const handleDeleteService = async (serviceId: number) => {
    if (!confirm('确定要删除这个服务吗？')) {
      return;
    }

    try {
      const data = await fetchJson(`${API_BASE_URL}/services/${serviceId}`, {
        method: 'DELETE'
      });

      if (data.success) {
        toast.success('服务删除成功');
        fetchServices();
      } else {
        toast.error(data.error || '删除服务失败');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('删除服务失败');
    }
  };

  // 开始编辑服务
  const startEditService = (service: Service) => {
    setEditingService(service);
    setFormData({
      game_id: service.game_id.toString(),
      price: service.price.toString(),
      hours: service.hours.toString()
    });
    setIsAdding(false);
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingService(null);
    setIsAdding(false);
    setFormData({ game_id: '', price: '', hours: '1' });
  };

  useEffect(() => {
    fetchGames();
    fetchServices();
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

  return (
    <div className="bg-theme-background min-h-screen text-theme-text">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-theme-text">服务管理</h1>
            <div className="flex space-x-3">
              {!isAdding && !editingService && (
                <button 
                  onClick={() => setIsAdding(true)}
                  className="py-1.5 px-3 bg-theme-primary text-white text-sm font-medium rounded-lg hover:bg-theme-primary/90 transition-colors"
                >
                  <i className="fa-solid fa-plus mr-1"></i> 添加服务
                </button>
              )}
              <button 
                onClick={() => navigate('/player/dashboard')}
                className="py-1.5 px-3 bg-theme-text/60 text-white text-sm font-medium rounded-lg hover:bg-theme-text/70 transition-colors"
              >
                <i className="fa-solid fa-arrow-left mr-1"></i> 返回大厅
              </button>
            </div>
          </div>
          <p className="text-theme-text/70">管理您的陪玩服务和价格设置</p>
        </div>

        {/* 添加/编辑服务表单 */}
        {(isAdding || editingService) && (
          <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border p-6 mb-6">
            <h2 className="text-lg font-semibold text-theme-text mb-4">
              {editingService ? '编辑服务' : '添加新服务'}
            </h2>
            <form onSubmit={editingService ? handleUpdateService : handleCreateService}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-theme-text mb-2">
                    游戏类型 <span className="text-red-500 dark:text-red-400">*</span>
                  </label>
                  <select
                    value={formData.game_id}
                    onChange={(e) => setFormData({ ...formData, game_id: e.target.value })}
                    className="w-full px-3 py-2 border border-theme-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-theme-background text-theme-text"
                    required
                  >
                    <option value="">请选择游戏</option>
                    {games.map(game => (
                      <option key={game.id} value={game.id}>{game.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-text mb-2">
                    服务价格 (元/小时) <span className="text-red-500 dark:text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-theme-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-theme-background text-theme-text"
                    placeholder="请输入价格"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-text mb-2">
                    最少服务时长 (小时)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.hours}
                    onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                    className="w-full px-3 py-2 border border-theme-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-theme-background text-theme-text"
                    placeholder="最少服务时长"
                  />
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-theme-primary text-white text-sm font-medium rounded-lg hover:bg-theme-primary/90 transition-colors"
                >
                  {editingService ? '更新服务' : '创建服务'}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 bg-theme-text/60 text-white text-sm font-medium rounded-lg hover:bg-theme-text/70 transition-colors"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 服务列表 */}
        <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-theme-text mb-4">我的服务列表</h2>
            {services.length === 0 ? (
              <div className="text-center py-12">
                <i className="fa-solid fa-gamepad text-4xl text-theme-text/30 mb-4"></i>
                <p className="text-theme-text/70 mb-4">您还没有设置任何服务</p>
                <button 
                  onClick={() => setIsAdding(true)}
                  className="px-4 py-2 bg-theme-primary text-white text-sm font-medium rounded-lg hover:bg-theme-primary/90 transition-colors"
                >
                  添加第一个服务
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map(service => {
                  const game = games.find(g => g.id === service.game_id);
                  return (
                    <div key={service.id} className="border border-theme-border rounded-lg p-4 hover:border-purple-200 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-theme-text">{game?.name || '未知游戏'}</h3>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => startEditService(service)}
                            className="text-theme-primary hover:text-theme-primary/80 text-sm"
                          >
                            <i className="fa-solid fa-edit"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteService(service.id)}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-theme-text/70">价格:</span>
                          <span className="text-sm font-medium text-theme-primary">¥{service.price}/小时</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-theme-text/70">最少时长:</span>
                          <span className="text-sm text-theme-text">{service.hours}小时</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-theme-text/70">创建时间:</span>
                          <span className="text-sm text-theme-text">
                            {new Date(service.created_at).toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 提示信息 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900/20 dark:border-blue-700/30">
          <div className="flex">
            <i className="fa-solid fa-info-circle text-blue-600 dark:text-blue-400 mt-1 mr-3"></i>
            <div>
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">服务设置提示</h3>
              <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                <li>• 设置合理的价格有助于获得更多订单</li>
                <li>• 您可以为不同游戏设置不同的价格</li>
                <li>• 最少服务时长建议设置为1-2小时</li>
                <li>• 服务信息会显示在陪玩列表中供用户选择</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}