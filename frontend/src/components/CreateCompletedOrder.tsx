import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/api';
import { fetchJson } from '@/utils/fetchWrapper';

interface CreateCompletedOrderProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface User {
  id: number;
  name: string;
  phone_num: string;
}

interface Game {
  id: number;
  name: string;
}

interface Gift {
  id: number;
  name: string;
  price: number;
}

interface Service {
  id: number;
  player_id: number;
  game_id: number;
  game_name: string;
  price: number;
  hours: number;
}

export default function CreateCompletedOrder({ isOpen, onClose, onSuccess }: CreateCompletedOrderProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const [formData, setFormData] = useState({
    user_id: '',
    game_id: '',
    hours: 1,
    hourly_rate: 0, // 改为0，将从服务中获取
    description: '',
    rating: 5,
    comment: '服务很好，非常满意！',
    include_gift: false,
    gift_id: '',
    gift_quantity: 1,
    // 新增匿名用户相关字段
    is_anonymous: false,
    customer_name: '',
    customer_phone: '',
    customer_note: ''
  });

  // 加载基础数据
  useEffect(() => {
    if (isOpen) {
      loadBasicData();
    }
  }, [isOpen]);

  const loadBasicData = async () => {
    setLoadingData(true);
    try {
      // 获取当前陪玩信息
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('请先登录');
        return;
      }

      // 并行加载用户、游戏、礼物和当前陪玩服务数据
      const [usersResponse, gamesResponse, giftsResponse, servicesResponse] = await Promise.all([
        fetchJson(`${API_BASE_URL}/orders/player/users`),
        fetchJson(`${API_BASE_URL}/games`),
        fetchJson(`${API_BASE_URL}/gifts`),
        fetchJson(`${API_BASE_URL}/services/my`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      ]);

      setUsers(usersResponse.users || []);
      setGames(gamesResponse.games || []);
      setGifts(giftsResponse.gifts || []);
      setServices(servicesResponse.services || []);
    } catch (error) {
      console.error('加载基础数据失败:', error);
      toast.error('加载数据失败，请重试');
    } finally {
      setLoadingData(false);
    }
  };

  // 处理游戏选择，自动更新对应的服务价格和最低时长
  const handleGameChange = (gameId: string) => {
    const selectedService = services.find(service => service.game_id === parseInt(gameId));
    const hourlyRate = selectedService ? selectedService.price : 0;
    const minHours = selectedService ? selectedService.hours : 1;
    
    setFormData({
      ...formData,
      game_id: gameId,
      hourly_rate: hourlyRate,
      hours: Math.max(formData.hours, minHours) // 确保服务时长不低于最低要求
    });

    if (!selectedService && gameId) {
      toast.warning('您还没有为该游戏设置服务价格，请先在服务管理中添加');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证必填字段
    if (!formData.game_id) {
      toast.error('请选择游戏类型');
      return;
    }
    
    if (formData.hourly_rate <= 0) {
      toast.error('请选择有效的游戏服务，该游戏暂无设置价格');
      return;
    }

    // 验证服务时长是否满足最低要求
    const selectedService = services.find(service => service.game_id === parseInt(formData.game_id));
    if (selectedService && formData.hours < selectedService.hours) {
      toast.error(`服务时长不能少于${selectedService.hours}小时（该游戏的最低服务时长）`);
      return;
    }
    
    if (!formData.is_anonymous && !formData.user_id) {
      toast.error('请选择用户或选择匿名用户');
      return;
    }
    
    if (formData.is_anonymous) {
      if (!formData.customer_name.trim()) {
        toast.error('匿名用户请填写客户姓名');
        return;
      }
      if (!formData.customer_phone.trim()) {
        toast.error('匿名用户请填写客户电话');
        return;
      }
    }

    setLoading(true);
    try {
      // 获取当前陪玩信息
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('请先登录');
        return;
      }

      const payload = JSON.parse(atob(token.split('.')[1]));
      const playerId = payload.id;

      // 生成唯一订单ID
      const timestamp = Date.now().toString().slice(-8);
      const random = Math.random().toString(36).substr(2, 6);
      const order_id = `ORD${timestamp}${random}`;

      const totalAmount = formData.hours * formData.hourly_rate;

      // 1. 创建订单
      const orderData = {
        order_id,
        user_id: formData.is_anonymous ? null : parseInt(formData.user_id), // 匿名用户使用null
        player_id: playerId,
        game_id: parseInt(formData.game_id),
        amount: totalAmount,
        status: 'pending_review', // 修改为待审核状态
        service_hours: formData.hours,
        description: formData.description,
        // 匿名用户信息
        is_anonymous: formData.is_anonymous,
        customer_name: formData.is_anonymous ? formData.customer_name : null,
        customer_phone: formData.is_anonymous ? formData.customer_phone : null,
        customer_note: formData.is_anonymous ? formData.customer_note : null
      };

      const orderResponse = await fetchJson(`${API_BASE_URL}/orders/player/create-completed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      if (!orderResponse.success) {
        throw new Error(orderResponse.message || '创建订单失败');
      }

      // 2. 创建评价
      const commentData = {
        order_id,
        player_id: playerId,
        content: formData.comment,
        rating: formData.rating
      };

      await fetchJson(`${API_BASE_URL}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(commentData)
      });

      // 3. 如果选择了礼物，创建送礼记录
      if (formData.include_gift && formData.gift_id) {
        const selectedGift = gifts.find(g => g.id === parseInt(formData.gift_id));
        if (selectedGift) {
          const giftData = {
            player_id: playerId,
            gift_id: parseInt(formData.gift_id),
            quantity: formData.gift_quantity,
            order_id
          };

          await fetchJson(`${API_BASE_URL}/gift-records`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(giftData)
          });
        }
      }

      toast.success('订单创建成功，等待管理员审核！');
      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('创建订单失败:', error);
      toast.error(error instanceof Error ? error.message : '创建订单失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      game_id: '',
      hours: 1,
      hourly_rate: 0,
      description: '',
      rating: 5,
      comment: '服务很好，非常满意！',
      include_gift: false,
      gift_id: '',
      gift_quantity: 1,
      is_anonymous: false,
      customer_name: '',
      customer_phone: '',
      customer_note: ''
    });
  };

  const calculateTotal = () => {
    let total = formData.hours * formData.hourly_rate;
    if (formData.include_gift && formData.gift_id) {
      const selectedGift = gifts.find(g => g.id === parseInt(formData.gift_id));
      if (selectedGift) {
        total += selectedGift.price * formData.gift_quantity;
      }
    }
    return total;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-theme-surface rounded-xl shadow-lg border border-theme-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-theme-text">创建服务订单</h2>
            <button 
              onClick={onClose}
              className="text-theme-text/70 hover:text-theme-text transition-colors p-1"
            >
              <i className="fa-solid fa-times text-xl"></i>
            </button>
          </div>

          {loadingData ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mx-auto mb-4"></div>
              <p className="text-theme-text/70">加载数据中...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 用户类型选择 */}
              <div className="bg-theme-background/50 rounded-lg p-4 border border-theme-border">
                <label className="block text-sm font-medium text-theme-text mb-3">
                  客户类型 <span className="text-theme-error">*</span>
                </label>
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="userType"
                      checked={!formData.is_anonymous}
                      onChange={() => setFormData({ ...formData, is_anonymous: false, user_id: '', customer_name: '', customer_phone: '', customer_note: '' })}
                      className="mr-2"
                    />
                    <span className="text-theme-text">注册用户</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="userType"
                      checked={formData.is_anonymous}
                      onChange={() => setFormData({ ...formData, is_anonymous: true, user_id: '' })}
                      className="mr-2"
                    />
                    <span className="text-theme-text">匿名用户</span>
                  </label>
                </div>

                {!formData.is_anonymous ? (
                  /* 注册用户选择 */
                  <div>
                    <label className="block text-sm font-medium text-theme-text mb-2">
                      选择用户
                    </label>
                    <select
                      value={formData.user_id}
                      onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                      className="w-full px-3 py-2 border border-theme-border bg-theme-background rounded-lg text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary"
                    >
                      <option value="">请选择用户</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.phone_num})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  /* 匿名用户信息输入 */
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-theme-text mb-2">
                          客户姓名 <span className="text-theme-error">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.customer_name}
                          onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                          className="w-full px-3 py-2 border border-theme-border bg-theme-background rounded-lg text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary"
                          placeholder="请输入客户姓名"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-theme-text mb-2">
                          客户电话 <span className="text-theme-error">*</span>
                        </label>
                        <input
                          type="tel"
                          value={formData.customer_phone}
                          onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                          className="w-full px-3 py-2 border border-theme-border bg-theme-background rounded-lg text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary"
                          placeholder="请输入客户电话"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-theme-text mb-2">
                        客户备注
                      </label>
                      <textarea
                        value={formData.customer_note}
                        onChange={(e) => setFormData({ ...formData, customer_note: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-theme-border bg-theme-background rounded-lg text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary"
                        placeholder="客户特殊要求或备注信息..."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 游戏选择 */}
              <div>
                <label className="block text-sm font-medium text-theme-text mb-2">
                  游戏类型 <span className="text-theme-error">*</span>
                </label>
                <select
                  value={formData.game_id}
                  onChange={(e) => handleGameChange(e.target.value)}
                  className="w-full px-3 py-2 border border-theme-border bg-theme-background rounded-lg text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary"
                  required
                >
                  <option value="">请选择游戏</option>
                  {games.map(game => {
                    const service = services.find(s => s.game_id === game.id);
                    return (
                      <option key={game.id} value={game.id}>
                        {game.name} {service ? `(¥${service.price}/小时)` : '(暂无服务)'}
                      </option>
                    );
                  })}
                </select>
                {formData.game_id && formData.hourly_rate === 0 && (
                   <p className="text-sm text-theme-error mt-1">
                     该游戏暂无设置服务价格，请先在服务管理中添加
                   </p>
                 )}
              </div>

              {/* 服务时长和价格 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-theme-text mb-2">
                    服务时长（小时）
                  </label>
                  {(() => {
                    const selectedService = services.find(service => service.game_id === parseInt(formData.game_id));
                    const minHours = selectedService ? selectedService.hours : 0.5;
                    return (
                      <>
                        <input
                          type="number"
                          min={minHours}
                          max="24"
                          step="0.5"
                          value={formData.hours}
                          onChange={(e) => {
                            const newHours = parseFloat(e.target.value) || minHours;
                            setFormData({ ...formData, hours: Math.max(newHours, minHours) });
                          }}
                          className="w-full px-3 py-2 border border-theme-border bg-theme-background rounded-lg text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary"
                        />
                        {selectedService && (
                          <p className="text-xs text-theme-text/60 mt-1">
                            最低服务时长：{selectedService.hours}小时
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-text mb-2">
                    时薪（元）
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.hourly_rate > 0 ? `¥${formData.hourly_rate}` : '请先选择游戏'}
                      readOnly
                      className="w-full px-3 py-2 border border-theme-border bg-theme-background/50 rounded-lg text-theme-text cursor-not-allowed"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <i className="fa-solid fa-lock text-theme-text/40 text-sm"></i>
                    </div>
                  </div>
                  <p className="text-xs text-theme-text/60 mt-1">
                    价格由您设置的服务自动确定
                  </p>
                </div>
              </div>

              {/* 服务描述 */}
              <div>
                <label className="block text-sm font-medium text-theme-text mb-2">
                  服务描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-theme-border bg-theme-background rounded-lg text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary"
                  placeholder="描述本次服务内容..."
                />
              </div>

              {/* 评价信息 */}
              <div className="bg-theme-background/50 rounded-lg p-4 border border-theme-border">
                <h3 className="text-sm font-medium text-theme-text mb-3">用户评价信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-theme-text mb-2">
                      评分
                    </label>
                    <select
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-theme-border bg-theme-background rounded-lg text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary"
                    >
                      <option value={5}>5星 - 非常满意</option>
                      <option value={4}>4星 - 满意</option>
                      <option value={3}>3星 - 一般</option>
                      <option value={2}>2星 - 不满意</option>
                      <option value={1}>1星 - 非常不满意</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-theme-text mb-2">
                      评价内容
                    </label>
                    <input
                      type="text"
                      value={formData.comment}
                      onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                      className="w-full px-3 py-2 border border-theme-border bg-theme-background rounded-lg text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary"
                      placeholder="用户评价内容"
                    />
                  </div>
                </div>
              </div>

              {/* 礼物选择 */}
              <div className="bg-theme-background/50 rounded-lg p-4 border border-theme-border">
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id="include_gift"
                    checked={formData.include_gift}
                    onChange={(e) => setFormData({ ...formData, include_gift: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="include_gift" className="text-sm font-medium text-theme-text">
                    包含送礼
                  </label>
                </div>
                
                {formData.include_gift && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-theme-text mb-2">
                        选择礼物
                      </label>
                      <select
                        value={formData.gift_id}
                        onChange={(e) => setFormData({ ...formData, gift_id: e.target.value })}
                        className="w-full px-3 py-2 border border-theme-border bg-theme-background rounded-lg text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary"
                      >
                        <option value="">请选择礼物</option>
                        {gifts.map(gift => (
                          <option key={gift.id} value={gift.id}>
                            {gift.name} - ¥{gift.price}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-theme-text mb-2">
                        数量
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.gift_quantity}
                        onChange={(e) => setFormData({ ...formData, gift_quantity: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-2 border border-theme-border bg-theme-background rounded-lg text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 订单总额 */}
              <div className="bg-theme-primary/10 rounded-lg p-4 border border-theme-primary/20">
                <div className="flex justify-between items-center">
                  <span className="text-theme-text font-medium">订单总额：</span>
                  <span className="text-xl font-bold text-theme-primary">¥{calculateTotal()}</span>
                </div>
                <div className="text-sm text-theme-text/70 mt-1">
                  服务费：¥{formData.hours * formData.hourly_rate}
                  {formData.include_gift && formData.gift_id && (
                    <span> + 礼物：¥{gifts.find(g => g.id === parseInt(formData.gift_id))?.price * formData.gift_quantity || 0}</span>
                  )}
                </div>
              </div>

              {/* 提交按钮 */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 px-4 bg-theme-background text-theme-text border border-theme-border rounded-lg hover:bg-theme-background/80 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 px-4 bg-theme-primary text-white rounded-lg hover:bg-theme-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      创建中...
                    </span>
                  ) : (
                    '创建订单'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}