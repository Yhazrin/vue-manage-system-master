import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Player } from "@/types";

interface PlayerCardProps {
  player: Player;
  className?: string;
}

export default function PlayerCard({ player, className }: PlayerCardProps) {
  // Get status color based on online status
  const getStatusColor = () => {
    switch (player.status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-300';
      default: return 'bg-gray-300';
    }
  };
  
  // Get status text based on online status
  const getStatusText = () => {
    switch (player.status) {
      case 'online': return '在线';
      case 'busy': return '忙碌';
      case 'offline': return '离线';
      default: return '离线';
    }
  };
  
  // Get avatar image or placeholder
  const getAvatar = () => {
    const avatarSources: { [key: number]: string } = {
      1: "https://lf-code-agent.coze.cn/obj/x-ai-cn/63685843202/image/region_images/supplies_images/FindGameCompanionPage/1.jpeg",
      2: "https://lf-code-agent.coze.cn/obj/x-ai-cn/63685843202/image/region_images/supplies_images/FindGameCompanionPage/2.jpeg",
      3: "https://lf-code-agent.coze.cn/obj/x-ai-cn/63685843202/image/region_images/supplies_images/FindGameCompanionPage/3.jpeg",
      4: "https://lf-code-agent.coze.cn/obj/x-ai-cn/63685843202/image/region_images/supplies_images/FindGameCompanionPage/4.jpeg"
    };
    
    const src = avatarSources[player.avatarId];
    
    if (src) {
      return (
        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
          <img 
            src={src} 
            alt={player.name}
            className="w-full h-full object-cover"
          />
        </div>
      );
    }
    
    // Placeholder if no image available
    return (
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-medium flex-shrink-0">
        {player.name.charAt(0)}
      </div>
    );
  };

  // 礼物类型定义
  interface Gift {
    id: number;
    name: string;
    price: number;
    imageUrl: string;
  }

  // 模拟礼物数据
  const gifts: Gift[] = [
    { id: 1, name: "玫瑰花束", price: 199, imageUrl: "https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=rose%20bouquet%20gift%2C%203D%20rendering%2C%20red%20color%2C%20white%20background&sign=b6263cc487a3ca4ca001b2f2284b6751" },
    { id: 2, name: "巧克力礼盒", price: 99, imageUrl: "https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=chocolate%20gift%20box%2C%203D%20rendering%2C%20gold%20and%20brown%2C%20white%20background&sign=0e4ec83080d4411507a3230cf72ea5a8" },
    { id: 3, name: "爱心", price: 52, imageUrl: "https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=heart%20gift%2C%203D%20rendering%2C%20red%20color%2C%20shiny%2C%20white%20background&sign=826f0e6bbe6cb53f91f247fc9bd4b9c9" },
    { id: 4, name: "跑车", price: 599, imageUrl: "https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=sports%20car%20gift%2C%203D%20rendering%2C%20red%20color%2C%20shiny%2C%20white%20background&sign=be9f70c0bd988d0e3ea95c122976b446" },
  ];
  
  return (
     <div className={cn("bg-theme-surface rounded-lg border border-theme-border shadow-sm overflow-hidden transition-shadow hover:shadow-md", className)}>
      <div className="p-5">
        {/* Player Header */}
        <div className="flex items-start gap-3 mb-4">
          {getAvatar()}
          
          <div>
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-theme-text text-sm">{player.name}</h3>
          <span className={`w-2 h-2 rounded-full ${getStatusColor()}`}></span>
          <span className="text-xs text-theme-text/80">{getStatusText()}</span>
        </div>
     <div className="flex items-center text-xs text-theme-text/80">
          <div className="flex items-center">
            <i className="fa-solid fa-star text-yellow-400 mr-1"></i>
            <span>{player.rating}</span>
          </div>
          <span className="mx-1">({player.reviews}条评价)</span>
        </div>
          </div>
        </div>
        
        {/* Player Description */}
               <p className="text-sm text-theme-text mb-4 line-clamp-2 text-balance">{player.description}</p>
        
        {/* Games */}
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-gray-900 mb-2">Games</h4>
          <div className="flex flex-wrap gap-2">
            {player.games.map((game, index) => (
              <span 
                key={index} 
                className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-full"
              >
                {game}
              </span>
            ))}
          </div>
        </div>
        
        {/* Services */}
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-900 mb-2">Services</h4>
          <div className="flex flex-wrap gap-2">
            {player.services.map((service, index) => (
              <span 
                key={index} 
                className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-full"
              >
                {service}
              </span>
            ))}
          </div>
        </div>
        
        {/* Price and Actions */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <div className="text-purple-600 font-bold text-lg">
            ${player.price}<span className="text-sm font-normal">/小时</span>
          </div>
          
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-pink-500 transition-colors">
                ♡
              </button>
              <Link to={`/booking/${player.id}`} className="px-4 py-1.5 bg-theme-primary text-white text-xs font-medium rounded-lg hover:bg-theme-primary/90 transition-colors">
                立即预约
              </Link>
            </div>
        </div>
      </div>
    </div>
  );
}