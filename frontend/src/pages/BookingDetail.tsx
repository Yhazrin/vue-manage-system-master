import { useState, useEffect } from 'react';
  import { useParams, useNavigate } from 'react-router-dom';
  import Header from "@/components/Header";
  import { Player, Review } from "@/types";
  import { cn } from "@/lib/utils";
  import { getPlayerById } from '@/services/playerService';
  import { usePlayers } from '@/hooks/usePlayers';
  

export default function BookingDetail() {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const [selectedHours, setSelectedHours] = useState(1);
  const [discount, setDiscount] = useState<number | null>(null);
  
  // Find the player based on ID
  const { players } = usePlayers();
  const player = players.find(p => p.id === parseInt(playerId || ''));
  
  if (!player) {
    return (
      <div className="bg-theme-background min-h-screen text-theme-text">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">陪玩不存在</h1>
            <p className="text-gray-500 mb-6">找不到对应的陪玩信息，请返回重试</p>
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
    const basePrice = player.price * selectedHours;
    if (discount) {
      return basePrice * (1 - discount / 100);
    }
    return basePrice;
  };
  
  // Handle booking submission
  const handleBooking = () => {
    // In a real application, this would submit to an API
    alert(`预约成功！您已成功预约${player.name}${selectedHours}小时，总价: ¥${calculatePrice().toFixed(2)}`);
    navigate('/lobby');
  };
  
  // Get avatar image
  const getAvatar = () => {
    const avatarSources: { [key: number]: string } = {
      1: "https://lf-code-agent.coze.cn/obj/x-ai-cn/63685843202/image/region_images/supplies_images/FindGameCompanionPage/1.jpeg",
      2: "https://lf-code-agent.coze.cn/obj/x-ai-cn/63685843202/image/region_images/supplies_images/FindGameCompanionPage/2.jpeg",
      3: "https://lf-code-agent.coze.cn/obj/x-ai-cn/63685843202/image/region_images/supplies_images/FindGameCompanionPage/3.jpeg",
      4: "https://lf-code-agent.coze.cn/obj/x-ai-cn/63685843202/image/region_images/supplies_images/FindGameCompanionPage/4.jpeg"
    };
    
    return avatarSources[player.avatarId] || `https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=user%20avatar&sign=f1f81b57b203e2aa336aa3ec3f6e3f7f`;
  };
  
  // Get status text and style
  const getStatusInfo = () => {
    switch (player.status) {
      case 'online':
        return { text: '在线', className: 'bg-green-100 text-green-800' };
      case 'busy':
        return { text: '忙碌', className: 'bg-yellow-100 text-yellow-800' };
      case 'offline':
        return { text: '离线', className: 'bg-gray-100 text-gray-800' };
      default:
        return { text: '未知', className: 'bg-gray-100 text-gray-800' };
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
                    <span className="text-sm font-medium">{player.rating}</span>
                    <span className="text-xs text-gray-500 ml-1">({player.reviews}条评价)</span>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4">{player.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {player.games.map((game, index) => (
                    <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      {game}
                    </span>
                  ))}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {player.services.map((service, index) => (
                    <span key={index} className="px-3 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">
                      {service}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="ml-auto bg-gray-50 p-4 rounded-lg">
                <div className="text-right">
                  <p className="text-sm text-gray-500">单价</p>
                  <p className="text-2xl font-bold text-gray-900">¥{player.price}<span className="text-sm font-normal text-gray-500">/小时</span></p>
                </div>
              </div>
            </div>
            
            {/* Booking Form */}
            <div className="border-t border-gray-100 pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">预约信息</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Service Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">服务时长</label>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5, 6].map(hour => (
                        <button
                          key={hour}
                          onClick={() => setSelectedHours(hour)}
                          className={cn(
                            "w-12 h-12 flex items-center justify-center rounded-lg text-sm font-medium transition-colors",
                            selectedHours === hour 
                              ? "bg-purple-600 text-white" 
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          )}
                        >
                          {hour}小时
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
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
                    <span>¥{player.price.toFixed(2)}/小时</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">时长</span>
                    <span>{selectedHours}小时</span>
                  </div>
                  {discount && discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>优惠</span>
                      <span>-¥{(player.price * selectedHours * discount / 100).toFixed(2)}</span>
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
