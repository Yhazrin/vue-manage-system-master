import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from "@/components/Header";
import { Player, Review } from "@/types";
import { cn } from "@/lib/utils";
import { getPlayers, getPlayerServices } from '@/services/playerService';
import { useNotifications } from '@/components/NotificationManager';
  // 导入orderService
  import { createOrder } from '@/services/orderService';

export default function BookingDetail() {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [selectedHours, setSelectedHours] = useState(1);
  const [discount, setDiscount] = useState<number | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<string>('');

  const [selectedGameData, setSelectedGameData] = useState<any>(null);
  
  // 获取陪玩信息
  useEffect(() => {
    const fetchPlayer = async () => {
      if (!playerId) {
        setError('无效的陪玩ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // 获取所有陪玩列表，然后找到对应的陪玩
        const players = await getPlayers();
        const foundPlayer = players.find(p => p.id === parseInt(playerId));
        
        if (!foundPlayer) {
          setError('陪玩不存在');
          setLoading(false);
          return;
        }
        
        setPlayer(foundPlayer);
        
        // 获取陪玩的服务信息
        try {
          const playerServices = await getPlayerServices(parseInt(playerId));
          setServices(playerServices);
          
          // 设置默认选择的游戏为第一个服务的游戏
          if (playerServices && playerServices.length > 0) {
            const firstService = playerServices[0];
            setSelectedGame(firstService.game_name);
            setSelectedGameData(firstService);
            
            // 设置最低服务时长
            if (firstService.min_hours) {
              setSelectedHours(firstService.min_hours);
            }
          }
        } catch (serviceError) {
          console.error('获取服务信息失败:', serviceError);
          // 即使服务信息获取失败，也显示陪玩基本信息
        }
        
        setLoading(false);
      } catch (error) {
        console.error('获取陪玩信息失败:', error);
        setError(error instanceof Error ? error.message : '获取陪玩信息失败，请重试');
        setLoading(false);
      }
    };

    fetchPlayer();
  }, [playerId]);
  
  // 当选择的游戏改变时，更新对应的游戏数据和价格
  useEffect(() => {
    if (selectedGame && services.length > 0) {
      // 查找匹配的游戏服务数据
      const gameService = services.find(service => service.game_name === selectedGame);
      if (gameService) {
        setSelectedGameData(gameService);
        // 设置最低服务时长
        if (gameService.min_hours && gameService.min_hours > selectedHours) {
          setSelectedHours(gameService.min_hours);
        }
      } else {
        setSelectedGameData(null);
      }
    }
  }, [selectedGame, services]);
  
  if (loading) {
    return (
      <div className="bg-theme-background min-h-screen text-theme-text">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-500">加载中...</p>
          </div>
        </main>
      </div>
    );
  }
  
  if (error || !player) {
    return (
      <div className="bg-theme-background min-h-screen text-theme-text">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {error === '陪玩不存在' ? '陪玩不存在' : '加载失败'}
            </h1>
            <p className="text-gray-500 mb-6">
              {error === '陪玩不存在' ? '找不到对应的陪玩信息，请返回重试' : error || '获取陪玩信息失败，请重试'}
            </p>
            <button 
              onClick={() => navigate('/lobby')}
              className="px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              返回大厅
            </button>
          </div>
        </main>
      </div>
    );
  }
  
  // Calculate price with possible discount
  const calculatePrice = () => {
    let basePrice;
    if (selectedGameData && selectedGameData.price) {
      basePrice = (Number(selectedGameData.price) || 0) * selectedHours;
    } else if (player?.price) {
      basePrice = (Number(player.price) || 0) * selectedHours;
    } else {
      basePrice = 0;
    }
    
    if (discount && discount > 0) {
      return basePrice * (1 - discount / 100);
    }
    return basePrice;
  };

  // Get base price without discount for display
  const getBasePrice = () => {
    if (selectedGameData && selectedGameData.price) {
      return (Number(selectedGameData.price) || 0) * selectedHours;
    } else if (player?.price) {
      return (Number(player.price) || 0) * selectedHours;
    } else {
      return 0;
    }
  };
  
  // Get current price per hour
  const getCurrentPrice = () => {
    if (selectedGameData && selectedGameData.price) {
      return Number(selectedGameData.price) || 0;
    } else if (player?.price) {
      return Number(player.price) || 0;
    } else {
      return 0;
    }
  };
  
  // Handle booking submission
  const handleBooking = async () => {
    try {
      // 验证必填字段
      if (!selectedGame) {
        addNotification({
          type: 'system',
          title: '请选择游戏',
          message: '请先选择一个游戏再进行预约'
        });
        return;
      }
      
      if (!selectedGameData) {
        addNotification({
          type: 'system',
          title: '请选择有效的游戏服务',
          message: '所选游戏服务无效，请重新选择'
        });
        return;
      }
      
      // 获取token和用户信息
      const token = localStorage.getItem('token');
      if (!token) {
        addNotification({
          type: 'system',
          title: '请先登录',
          message: '需要登录后才能进行预约'
        });
        navigate('/login');
        return;
      }
      
      // 解析token获取用户ID
      let userId;
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.id;
      } catch (error) {
        console.error('Token解析失败:', error);
        
        // 使用通知系统显示登录异常消息
        addNotification({
          type: 'system',
          title: '登录状态异常',
          message: '请重新登录'
        });
        
        navigate('/login');
        return;
      }
      
      // 构建订单数据
      const orderData = {
        playerId: player.id,
        gameType: selectedGame,
        serviceTime: `${selectedHours}小时`,
        price: calculatePrice(),
        description: `预约${player.name}${selectedHours}小时，游戏: ${selectedGame}`,
        userId: userId,
        serviceId: selectedGameData.id
      };
      
      // 使用orderService创建订单
      const result = await createOrder(orderData);
      
      // 使用通知系统显示成功消息
      addNotification({
        type: 'order',
        title: '预约成功！',
        message: `订单号: ${result.id}\n您已成功预约${player.name}${selectedHours}小时，游戏: ${selectedGame}，总价: ¥${calculatePrice().toFixed(2)}`
      });
      
      navigate('/user/orders'); // 跳转到订单页面
    } catch (error) {
      console.error('预约失败:', error);
      
      // 使用通知系统显示错误消息
      addNotification({
        type: 'system',
        title: '预约失败',
        message: error instanceof Error ? error.message : '网络错误，请稍后重试'
      });
    }
  };

  
  // Get avatar image
  const getAvatar = () => {
    // 优先使用photo_img，其次使用avatarId映射
    if (player.photo_img) {
      return player.photo_img.startsWith('http') ? player.photo_img : `http://localhost:3000${player.photo_img}`;
    }
    
    const avatarSources: { [key: number]: string } = {
      1: "https://lf-code-agent.coze.cn/obj/x-ai-cn/63685843202/image/region_images/supplies_images/FindGameCompanionPage/1.jpeg",
      2: "https://lf-code-agent.coze.cn/obj/x-ai-cn/63685843202/image/region_images/supplies_images/FindGameCompanionPage/2.jpeg",
      3: "https://lf-code-agent.coze.cn/obj/x-ai-cn/63685843202/image/region_images/supplies_images/FindGameCompanionPage/3.jpeg",
      4: "https://lf-code-agent.coze.cn/obj/x-ai-cn/63685843202/image/region_images/supplies_images/FindGameCompanionPage/4.jpeg"
    };
    
    return avatarSources[player.avatarId || 1] || `https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=user%20avatar&sign=f1f81b57b203e2aa336aa3ec3f6e3f7f`;
  };
  
  // Get status text and style
  const getStatusInfo = () => {
    // 处理status字段，可能是boolean或number
    const isOnline = player.isOnline !== undefined ? player.isOnline : 
                    (typeof player.status === 'boolean' ? player.status : player.status === 1);
    
    if (isOnline) {
      return { text: '在线', className: 'bg-green-100 text-green-800' };
    } else {
      return { text: '离线', className: 'bg-gray-100 text-gray-800' };
    }
  };
  
  const statusInfo = getStatusInfo();
  
  return (
    <div className="bg-theme-background min-h-screen text-theme-text">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <button 
          onClick={() => navigate('/lobby')}
          className="flex items-center text-sm text-purple-600 hover:text-purple-700 mb-6"
        >
          <i className="fa-solid fa-arrow-left mr-1"></i> 返回陪玩列表
        </button>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-6 mb-8">
              {/* Player Info */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <img 
                    src={getAvatar()} 
                    alt={player.name}
                    className="w-24 h-24 rounded-xl object-cover"
                  />
                  <span className={`absolute -bottom-1 -right-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
                    {statusInfo.text}
                  </span>
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{player.name}</h1>
                  <div className="flex items-center text-yellow-500">
                    <i className="fa-solid fa-star mr-1"></i>
                    <span className="text-sm font-medium">{player.rating || 5.0}</span>
                    <span className="text-xs text-gray-500 ml-1">({player.reviews || 0}条评价)</span>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4">{player.description || player.intro || '暂无介绍'}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {(player.games || []).map((game, index) => (
                    <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      {game}
                    </span>
                  ))}
                </div>
                

              </div>
              
              <div className="ml-auto bg-gray-50 p-4 rounded-lg">
                <div className="text-right">
                  <p className="text-sm text-gray-500">当前单价</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ¥{getCurrentPrice().toFixed(2)}
                    <span className="text-sm font-normal text-gray-500">/小时</span>
                  </p>
                </div>
              </div>
            </div>
            
            {/* Booking Form */}
            <div className="border-t border-gray-100 pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">预约信息</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Game Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">选择游戏</label>
                  <select
                    value={selectedGame}
                    onChange={(e) => setSelectedGame(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">请选择游戏</option>
                    {services.map((service, index) => (
                      <option key={index} value={service.game_name}>{service.game_name}</option>
                    ))}
                  </select>
                  {services.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">该陪玩暂未设置可接受的游戏服务</p>
                  )}
                </div>
                
                {/* Service Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">服务时长</label>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-wrap gap-1">
                      {[1, 2, 3, 4, 5, 6].map(hour => {
                        const minHours = selectedGameData?.min_hours || 1;
                        const isDisabled = hour < minHours;
                        return (
                          <button
                            key={hour}
                            onClick={() => !isDisabled && setSelectedHours(hour)}
                            disabled={isDisabled}
                            className={cn(
                              "px-3 py-1 text-xs font-medium rounded transition-colors",
                              isDisabled
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : selectedHours === hour 
                                  ? "bg-purple-600 text-white" 
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            )}
                          >
                            {hour}h
                          </button>
                        );
                      })}
                    </div>
                    {selectedGameData?.min_hours && selectedGameData.min_hours > 1 && (
                      <span className="text-xs text-gray-500 ml-2">
                        最低{selectedGameData.min_hours}小时
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Service Details */}
              {selectedGameData && (
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">服务详情</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">游戏：</span>
                      <span className="text-blue-900 font-medium">{selectedGameData.game_name || selectedGame}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">价格：</span>
                      <span className="text-blue-900 font-medium">¥{selectedGameData.price}/小时</span>
                    </div>
                    {selectedGameData.min_hours && (
                      <div>
                        <span className="text-blue-700">最低时长：</span>
                        <span className="text-blue-900 font-medium">{selectedGameData.min_hours}小时</span>
                      </div>
                    )}
                    {selectedGameData.description && (
                      <div className="col-span-2">
                        <span className="text-blue-700">描述：</span>
                        <span className="text-blue-900">{selectedGameData.description}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Discount Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">优惠码 (可选)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="输入优惠码"
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      onChange={(e) => {
                        // Simple discount code simulation
                        const code = e.target.value.trim();
                        if (code === "NEW5") {
                          setDiscount(5);
                        } else if (code === "SUMMER10") {
                          setDiscount(10);
                        } else if (code === "") {
                          setDiscount(null);
                        } else {
                          setDiscount(-1); // Invalid code
                        }
                      }}
                    />
                    {discount === -1 && (
                      <span className="text-red-500 text-sm flex items-center">
                        <i className="fa-solid fa-exclamation-circle mr-1"></i> 优惠码无效
                      </span>
                    )}
                    {discount && discount > 0 && (
                      <span className="text-green-500 text-sm flex items-center">
                        <i className="fa-solid fa-check-circle mr-1"></i> 优惠{discount}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Price Summary */}
              <div className="bg-gray-50 p-5 rounded-lg mb-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">单价</span>
                    <span>¥{getCurrentPrice().toFixed(2)}/小时</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">时长</span>
                    <span>{selectedHours}小时</span>
                  </div>
                  {discount && discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>优惠</span>
                      <span>-¥{(getBasePrice() * discount / 100).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-gray-200 flex justify-between font-semibold text-lg">
                    <span>总价</span>
                    <span>¥{calculatePrice().toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => navigate('/lobby')}
                  className="px-6 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={handleBooking}
                  className="px-6 py-2.5 bg-theme-primary text-white font-medium rounded-lg hover:bg-theme-primary/90 transition-colors" 
                >
               确认预约
             </button>
           </div>
           
           {/* 评价区域 */}
           <div className="border-t border-gray-100 pt-6 mt-6">
             <h3 className="text-lg font-semibold text-gray-900 mb-4">用户评价</h3>
             
             {player.reviewList && player.reviewList.length > 0 ? (
                <div className="space-y-4">
                  {player.reviewList.map((review: Review) => (
                   <div key={review.id} className="p-4 bg-gray-50 rounded-lg">
                     <div className="flex items-center gap-3 mb-2">
                       <img 
                         src={review.userAvatar} 
                         alt={review.userName}
                         className="w-8 h-8 rounded-full object-cover"
                       />
                       <div>
                         <h4 className="font-medium text-gray-900 text-sm">{review.userName}</h4>
                         <div className="flex items-center text-yellow-400">
                           {[...Array(5)].map((_, i) => (
                             <i 
                               key={i} 
                               className={`fa-solid fa-star ${i < Math.round(review.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                             ></i>
                           ))}
                           <span className="ml-1 text-xs text-gray-500">{review.createdAt}</span>
                         </div>
                       </div>
                     </div>
                     <p className="text-sm text-gray-700">{review.comment}</p>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="text-center py-6 text-gray-500">
                 <i className="fa-solid fa-comment-slash text-2xl mb-2"></i>
                 <p>暂无评价</p>
               </div>
             )}
           </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
