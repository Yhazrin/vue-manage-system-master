import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from "@/components/Header";
import { Player, Review } from "@/types";
import { cn } from "@/lib/utils";
import { getPlayers, getPlayerServices } from '@/services/playerService';
import { useNotifications } from '@/components/NotificationManager';
  // 导入orderService
  import { createOrder } from '@/services/orderService';
import { getPlayerComments } from '@/services/commentService';
import { buildAvatarUrl, buildVoiceUrl } from '@/utils/imageUtils';

function BookingDetail() {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [selectedHours, setSelectedHours] = useState(1);
  const [customHours, setCustomHours] = useState<string>('');
  const [useCustomHours, setUseCustomHours] = useState(false);
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
        
        // 获取陪玩的评论信息
        try {
          const commentsResponse = await getPlayerComments(parseInt(playerId));
          
          if (commentsResponse.success && commentsResponse.comments && commentsResponse.comments.length > 0) {
            // 转换评论数据格式以匹配前端Review接口
            const reviewList: Review[] = commentsResponse.comments.map((comment: any) => ({
              id: comment.id,
              userAvatar: buildAvatarUrl(comment.user_avatar),
              userName: comment.user_name || '匿名用户',
              rating: comment.rating,
              createdAt: new Date(comment.created_at).toLocaleDateString(),
              comment: comment.content
            }));
            
            // 设置陪玩信息，包含评论列表
            setPlayer({
              ...foundPlayer,
              reviewList,
              rating: reviewList.length > 0 ? 
                reviewList.reduce((sum, review) => sum + review.rating, 0) / reviewList.length : 
                foundPlayer.rating,
              reviews: reviewList.length
            });
          } else {
            // 没有评论时，设置空的评论列表
            setPlayer({
              ...foundPlayer,
              reviewList: [],
              reviews: 0
            });
          }
        } catch (commentError) {
          console.error('获取评论信息失败:', commentError);
          // 即使评论获取失败，也设置基础陪玩信息和空的评论列表
          setPlayer({
            ...foundPlayer,
            reviewList: [],
            reviews: 0
          });
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
          <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mx-auto mb-4"></div>
            <p className="text-theme-text/70">加载中...</p>
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
          <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border p-8 text-center">
            <h1 className="text-2xl font-bold text-theme-text mb-4">
              {error === '陪玩不存在' ? '陪玩不存在' : '加载失败'}
            </h1>
            <p className="text-theme-text/70 mb-6">
              {error === '陪玩不存在' ? '找不到对应的陪玩信息，请返回重试' : error || '获取陪玩信息失败，请重试'}
            </p>
            <button 
              onClick={() => navigate('/lobby')}
              className="px-6 py-2 bg-theme-primary text-white font-medium rounded-lg hover:bg-theme-primary/90 transition-colors"
            >
              返回大厅
            </button>
          </div>
        </main>
      </div>
    );
  }
  
  // Calculate price
  const calculatePrice = () => {
    return getBasePrice();
  };

  // Get base price without discount for display
  const getBasePrice = () => {
    const hours = useCustomHours ? (Number(customHours) || 0) : selectedHours;
    if (selectedGameData && selectedGameData.price) {
      return (Number(selectedGameData.price) || 0) * hours;
    } else if (player?.price) {
      return (Number(player.price) || 0) * hours;
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
      
      // 验证自定义时长
      if (useCustomHours) {
        const customHoursNum = Number(customHours);
        const minHours = selectedGameData?.min_hours || 1;
        
        if (!customHours || customHoursNum <= 0) {
          addNotification({
            type: 'system',
            title: '请输入有效的服务时长',
            message: '请输入大于0的服务时长'
          });
          return;
        }
        
        if (customHoursNum < minHours) {
          addNotification({
            type: 'system',
            title: '服务时长不足',
            message: `该服务最低时长为${minHours}小时，请重新选择`
          });
          return;
        }
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
      const finalHours = useCustomHours ? (Number(customHours) || 0) : selectedHours;
      const orderData = {
        player_id: player.id,
        gameType: selectedGame,
        serviceTime: `${finalHours}小时`,
        amount: calculatePrice(),
        description: `预约${player.name}${finalHours}小时，游戏: ${selectedGame}`,
        userId: userId,
        service_id: selectedGameData.id
      };
      
      // 使用orderService创建订单
      const result = await createOrder({
        player_id: orderData.player_id,
        service_id: orderData.service_id,
        hours: finalHours,
        amount: orderData.amount,
        description: orderData.description
      });
      
      // 使用通知系统显示成功消息
      addNotification({
        type: 'order',
        title: '预约成功！',
        message: `订单号: ${result.order_id}\n您已成功预约${player.name}${finalHours}小时，游戏: ${selectedGame}，总价: ¥${calculatePrice().toFixed(1)}`
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
    return buildAvatarUrl(player.photo_img, player.avatarId);
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
          className="flex items-center text-sm text-theme-primary hover:text-theme-primary/80 mb-6"
        >
          <i className="fa-solid fa-arrow-left mr-1"></i> 返回陪玩列表
        </button>
        
        <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border overflow-hidden mb-6">
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
                  <h1 className="text-2xl font-bold text-theme-text">{player.name}</h1>
                  <div className="flex items-center text-yellow-500">
                    <i className="fa-solid fa-star mr-1"></i>
                    <span className="text-sm font-medium">{player.rating || 5.0}</span>
                    <span className="text-xs text-theme-text/70 ml-1">({player.reviews || 0}条评价)</span>
                  </div>
                </div>
                
                <p className="text-theme-text/80 mb-4">{player.description || player.intro || '暂无介绍'}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {(player.games || []).map((game, index) => (
                    <span key={index} className="px-3 py-1 bg-theme-accent/20 text-theme-text text-xs rounded-full">
                      {game}
                    </span>
                  ))}
                </div>
                
                {/* 录音介绍 */}
                {player.voice && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-theme-text mb-2">录音介绍</h3>
                    <audio 
                      controls 
                      className="w-full max-w-md"
                      preload="metadata"
                    >
                      <source src={buildVoiceUrl(player.voice)} type="audio/mpeg" />
                      <source src={buildVoiceUrl(player.voice)} type="audio/wav" />
                      <source src={buildVoiceUrl(player.voice)} type="audio/ogg" />
                      您的浏览器不支持音频播放
                    </audio>
                  </div>
                )}
              </div>
              
              <div className="ml-auto bg-theme-accent/10 p-4 rounded-lg">
                <div className="text-right">
                  <p className="text-sm text-theme-text/70">当前单价</p>
                  <p className="text-2xl font-bold text-theme-text">
                    ¥{getCurrentPrice().toFixed(1)}
                    <span className="text-sm font-normal text-theme-text/70">/小时</span>
                  </p>
                </div>
              </div>
            </div>
            
            {/* Booking Form */}
            <div className="border-t border-theme-border pt-6">
              <h2 className="text-lg font-semibold text-theme-text mb-4">预约信息</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Game Selection */}
                <div>
                  <label className="block text-sm font-medium text-theme-text mb-2">选择游戏</label>
                  <select
                    value={selectedGame}
                    onChange={(e) => setSelectedGame(e.target.value)}
                    className="w-full px-4 py-2 border border-theme-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary bg-theme-surface text-theme-text"
                  >
                    <option value="">请选择游戏</option>
                    {services.map((service, index) => (
                      <option key={index} value={service.game_name}>{service.game_name}</option>
                    ))}
                  </select>
                  {services.length === 0 && (
                    <p className="text-sm text-theme-text/70 mt-1">该陪玩暂未设置可接受的游戏服务</p>
                  )}
                </div>
                
                {/* Service Duration */}
                <div>
                  <label className="block text-sm font-medium text-theme-text mb-2">服务时长</label>
                  <div className="space-y-3">
                    {/* 预设时长选择 */}
                    <div className="flex items-center gap-2">
                      <div className="flex flex-wrap gap-1">
                        {[1, 2, 3, 4, 5, 6].map(hour => {
                          const minHours = selectedGameData?.min_hours || 1;
                          const isDisabled = hour < minHours;
                          return (
                            <button
                              key={hour}
                              onClick={() => {
                                if (!isDisabled) {
                                  setSelectedHours(hour);
                                  setUseCustomHours(false);
                                  setCustomHours('');
                                }
                              }}
                              disabled={isDisabled}
                              className={cn(
                                "px-3 py-1 text-xs font-medium rounded transition-colors",
                                isDisabled
                                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                  : (!useCustomHours && selectedHours === hour)
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
                        <span className="text-xs text-theme-text/70 ml-2">
                          最低{selectedGameData.min_hours}小时
                        </span>
                      )}
                    </div>
                    
                    {/* 自定义时长输入 */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-theme-text/80">或指定时长：</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={selectedGameData?.min_hours || 1}
                          max="24"
                          value={customHours}
                          onChange={(e) => {
                            const value = e.target.value;
                            setCustomHours(value);
                            if (value && Number(value) > 0) {
                              setUseCustomHours(true);
                            } else {
                              setUseCustomHours(false);
                            }
                          }}
                          placeholder="输入小时数"
                          className={cn(
                            "w-20 px-2 py-1 text-sm border border-theme-border rounded focus:outline-none focus:ring-2 focus:ring-theme-primary bg-theme-surface text-theme-text",
                            useCustomHours ? "border-theme-primary" : ""
                          )}
                        />
                        <span className="text-sm text-theme-text/70">小时</span>
                      </div>
                      {useCustomHours && customHours && Number(customHours) < (selectedGameData?.min_hours || 1) && (
                        <span className="text-xs text-red-500">
                          不能低于最低时长{selectedGameData?.min_hours || 1}小时
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Service Details */}
              {selectedGameData && (
                <div className="bg-theme-accent/10 p-4 rounded-lg mb-6">
                  <h3 className="text-sm font-medium text-theme-text mb-2">服务详情</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-theme-text/70">游戏：</span>
                      <span className="text-theme-text font-medium">{selectedGameData.game_name || selectedGame}</span>
                    </div>
                    <div>
                      <span className="text-theme-text/70">价格：</span>
                      <span className="text-theme-text font-medium">¥{selectedGameData.price}/小时</span>
                    </div>
                    {selectedGameData.min_hours && (
                      <div>
                        <span className="text-theme-text/70">最低时长：</span>
                        <span className="text-theme-text font-medium">{selectedGameData.min_hours}小时</span>
                      </div>
                    )}
                    {selectedGameData.description && (
                      <div className="col-span-2">
                        <span className="text-theme-text/70">描述：</span>
                        <span className="text-theme-text">{selectedGameData.description}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              

              
              {/* Price Summary */}
              <div className="bg-theme-accent/10 p-5 rounded-lg mb-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-theme-text/70">单价</span>
                    <span className="text-theme-text">¥{getCurrentPrice().toFixed(1)}/小时</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-theme-text/70">时长</span>
                    <span className="text-theme-text">{useCustomHours ? (Number(customHours) || 0) : selectedHours}小时</span>
                  </div>
                  <div className="pt-3 border-t border-theme-border flex justify-between font-semibold text-lg">
                    <span className="text-theme-text">总价</span>
                    <span className="text-theme-text">¥{calculatePrice().toFixed(1)}</span>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => navigate('/lobby')}
                  className="px-6 py-2.5 border border-theme-border text-theme-text font-medium rounded-lg hover:bg-theme-accent/10 transition-colors"
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
           <div className="border-t border-theme-border pt-6 mt-6">
             <h3 className="text-lg font-semibold text-theme-text mb-4">用户评价</h3>
             
             {player.reviewList && player.reviewList.length > 0 ? (
                <div className="space-y-4">
                  {player.reviewList.map((review: Review) => (
                   <div key={review.id} className="p-4 bg-theme-accent/10 rounded-lg">
                     <div className="flex items-center gap-3 mb-2">
                       <img 
                         src={review.userAvatar} 
                         alt={review.userName}
                         className="w-8 h-8 rounded-full object-cover"
                       />
                       <div>
                         <h4 className="font-medium text-theme-text text-sm">{review.userName}</h4>
                         <div className="flex items-center text-yellow-400">
                           {[...Array(5)].map((_, i) => (
                             <i 
                               key={i} 
                               className={`fa-solid fa-star ${i < Math.round(review.rating) ? 'text-yellow-400' : 'text-theme-text/30'}`}
                             ></i>
                           ))}
                           <span className="ml-1 text-xs text-theme-text/70">{review.createdAt}</span>
                         </div>
                       </div>
                     </div>
                     <p className="text-sm text-theme-text/80">{review.comment}</p>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="text-center py-6 text-theme-text/70">
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

export default BookingDetail;
