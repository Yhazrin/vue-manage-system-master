import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Player } from "@/types";
import { useState, useEffect } from "react";
import { addFavoritePlayer, removeFavoritePlayer } from "@/services/favoriteService";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { buildAvatarUrl } from '@/utils/imageUtils';
import { getPlayerRatingSummary, PlayerRatingSummary, formatRating } from '@/services/ratingService';
import RatingDetail from './RatingDetail';

interface PlayerCardProps {
  player: Player;
  className?: string;
  isFavorite?: boolean;
  onFavoriteChange?: (playerId: number, isFavorite: boolean) => void;
}

export default function PlayerCard({ player, className, isFavorite = false, onFavoriteChange }: PlayerCardProps) {
  const [isLocalFavorite, setIsLocalFavorite] = useState(isFavorite);
  const [isLoading, setIsLoading] = useState(false);
  const [ratingData, setRatingData] = useState<PlayerRatingSummary | null>(null);
  const [showRatingDetail, setShowRatingDetail] = useState(false);

  useEffect(() => {
    setIsLocalFavorite(isFavorite);
  }, [isFavorite]);

  // 加载评分数据
  useEffect(() => {
    const loadRatingData = async () => {
      try {
        const data = await getPlayerRatingSummary(player.id);
        setRatingData(data);
      } catch (error) {
        console.error('加载评分数据失败:', error);
      }
    };

    loadRatingData();
  }, [player.id]);

  // 处理收藏/取消收藏
  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      
      if (isLocalFavorite) {
        await removeFavoritePlayer(player.id);
        setIsLocalFavorite(false);
        toast.success('已取消收藏');
        onFavoriteChange?.(player.id, false);
      } else {
        await addFavoritePlayer(player.id);
        setIsLocalFavorite(true);
        toast.success('已添加到收藏');
        onFavoriteChange?.(player.id, true);
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
      toast.error('操作失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };
  // Get status color based on online status
  const getStatusColor = () => {
    // 后端返回的online_status是number(0/1)或boolean
    const isOnline = player.online_status === 1 || player.online_status === true;
    return isOnline ? 'bg-theme-success' : 'bg-theme-text/30';
  };
  
  // Get status text based on online status
  const getStatusText = () => {
    const isOnline = player.online_status === 1 || player.online_status === true;
    return isOnline ? '在线' : '离线';
  };
  
  // Get avatar image or placeholder
  const getAvatar = () => {
    // 使用后端返回的photo_img字段，如果没有则使用默认头像
    if (player.photo_img) {
      return (
        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
          <img 
            src={buildAvatarUrl(player.photo_img)} 
            alt={player.name}
            className="w-full h-full object-cover"
          />
        </div>
      );
    }
    
    // 使用默认头像或首字母
    return (
      <div className="w-12 h-12 rounded-full bg-theme-background flex items-center justify-center text-theme-text/70 font-medium flex-shrink-0">
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
    <Link to={`/booking/${player.id}`} className={cn("block bg-theme-surface rounded-lg border border-theme-border shadow-sm overflow-hidden transition-shadow hover:shadow-md", className)}>
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
            <i className="fa-solid fa-star text-theme-warning mr-1"></i>
            <span>
              {ratingData && ratingData.success 
                ? formatRating(ratingData.averageRating) 
                : (player.rating || '5.0')
              }
            </span>
          </div>
          <span className="mx-1">
            ({ratingData && ratingData.success 
              ? ratingData.totalReviews 
              : (player.reviews || 0)
            }条评价)
          </span>
          {ratingData && ratingData.success && ratingData.totalReviews > 0 && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowRatingDetail(true);
              }}
              className="ml-1 text-theme-primary hover:underline"
            >
              详情
            </button>
          )}
        </div>
          </div>
        </div>
        
        {/* Player Description */}
        <p className="text-sm text-theme-text mb-4 line-clamp-2 text-balance">
          {player.intro || '这位陪玩还没有填写个人介绍'}
        </p>
        
        {/* Services */}
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-theme-text mb-2">可提供的服务</h4>
          <div className="flex flex-wrap gap-2">
            {(() => {
              // 合并games和services数组，并去除重复项
              const allServices = new Set<string>();
              
              // 添加games数组中的项目
              if (player.games && player.games.length > 0) {
                player.games.forEach(game => allServices.add(game));
              }
              // 由于 Player 类型上不存在 game_name 属性，移除该判断分支
// 由于 Player 类型上不存在 game_name 属性，移除该行代码
// allServices.add(player.game_name);
              
              
              // 添加services数组中的项目
              if (player.services && player.services.length > 0) {
                player.services.forEach(service => allServices.add(service));
              }
              
              // 显示合并后的服务
              if (allServices.size > 0) {
                return Array.from(allServices).map((service, index) => (
                  <span 
                    key={index} 
                    className="px-2 py-1 bg-theme-primary/10 text-theme-primary text-xs rounded-full"
                  >
                    {service}
                  </span>
                ));
              } else {
                return <span className="text-xs text-theme-text/70">暂未设置服务</span>;
              }
            })()}
          </div>
        </div>
        
        {/* Price and Actions */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <div className="text-theme-primary font-bold text-lg">
            {player.price ? (
              <>¥{player.price}<span className="text-sm font-normal">/小时</span></>
            ) : (
              <span className="text-sm text-theme-text/70">价格待定</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleFavoriteToggle}
              disabled={isLoading}
              className={cn(
                "w-8 h-8 flex items-center justify-center transition-colors rounded-full",
                isLocalFavorite 
                  ? "text-theme-error hover:text-theme-error/80" 
                  : "text-theme-text/30 hover:text-theme-error",
                isLoading && "opacity-50 cursor-not-allowed"
              )}
            >
              <Heart 
                className={cn(
                  "w-4 h-4",
                  isLocalFavorite && "fill-current"
                )}
              />
            </button>
            <span className="px-4 py-1.5 bg-theme-primary text-white text-xs font-medium rounded-lg">
              立即预约
            </span>
          </div>
        </div>
      </div>
      
      {/* 评分详情弹窗 */}
      <RatingDetail
        playerId={player.id}
        isOpen={showRatingDetail}
        onClose={() => setShowRatingDetail(false)}
      />
    </Link>
  );
}