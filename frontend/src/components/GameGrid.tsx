import { useNavigate } from "react-router-dom";
import { useRef } from "react";
import { Game } from "@/types";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import { useGames } from "@/hooks/useGames";
import { buildGameImageUrl } from "@/utils/imageUtils";
 
export default function GameGrid() {
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const { games, loading, error } = useGames();
  

  const handleGameClick = (gameId: number) => {
    // 跳转到陪玩大厅并传递游戏ID作为查询参数
    navigate(`/lobby?game=${gameId}`);
  };
  
  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300; // 每次滚动的距离
      const currentScroll = scrollContainerRef.current.scrollLeft;
      const maxScroll = scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth;
      
      let newScrollPosition;
      if (direction === 'left') {
        newScrollPosition = currentScroll - scrollAmount;
        if (newScrollPosition < 0) newScrollPosition = 0;
      } else {
        newScrollPosition = currentScroll + scrollAmount;
        if (newScrollPosition > maxScroll) newScrollPosition = 0; // 滚动到末尾时回到开始
      }
      
      scrollContainerRef.current.scrollTo({
        left: newScrollPosition,
        behavior: 'smooth'
      });
    }
  };
  
  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };
  

  
  useEffect(() => {
    const container = scrollContainerRef.current;
    
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      checkScrollPosition(); // 初始检查
      
      return () => {
        container.removeEventListener('scroll', checkScrollPosition);
      };
    }
  }, []);
  
  return (
    <div className="relative">
      {/* 左滚动按钮 */}
      <button
        onClick={() => handleScroll('left')}
        disabled={!canScrollLeft}
        className={`absolute left-0 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-theme-surface/80 shadow-md flex items-center justify-center text-theme-text hover:bg-theme-surface transition-all duration-300 ${
          canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-label="滚动到左边"
      >
        <i className="fa-solid fa-chevron-left"></i>
      </button>
      
      {/* 游戏滚动容器 */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto py-2 px-4 scrollbar-hide snap-x snap-mandatory pb-6"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onScroll={checkScrollPosition}
      >
        {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="min-w-[140px] bg-theme-surface rounded-xl overflow-hidden border border-theme-border animate-pulse">
                <div className="relative pb-[100%] bg-theme-background"></div>
                <div className="p-3 text-center">
                  <div className="h-4 bg-theme-background rounded w-3/4 mx-auto mb-2"></div>
                  <div className="h-3 bg-theme-background rounded w-1/2 mx-auto"></div>
                </div>
              </div>
            ))
          ) : error ? (
            <div className="text-center py-10 w-full">
              <p className="text-red-500">加载游戏失败: {error?.message || String(error)}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 text-theme-primary hover:underline"
              >
                重试
              </button>
            </div>
          ) : games?.map(game => {
            return (
          <div 
            key={game.id}
            className="min-w-[140px] bg-theme-surface rounded-xl shadow-sm overflow-hidden border border-theme-border transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer flex-shrink-0 snap-start"
            onClick={() => handleGameClick(game.id)}
          >
            <div className="relative pb-[100%] bg-theme-background">
              <img 
                src={buildGameImageUrl(game.image_url)} 
                alt={game.name}
                className="absolute inset-0 w-full h-full object-cover"
onError={(e) => {
                  // 如果图片加载失败，显示默认图片或占位符
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = `
                    <div class="absolute inset-0 w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                      <span class="text-theme-surface font-bold text-lg">${game.name.charAt(0)}</span>
                    </div>
                  `;
                }}
              />
            </div>
            <div className="p-3 text-center">
              <h3 className="font-medium text-theme-text text-sm line-clamp-1">{game.name}</h3>
              <p className="text-xs text-theme-text/70 mt-1">热门游戏</p>
            </div>
          </div>
        )})}
      </div>
      
      {/* 右滚动按钮 */}
      <button
        onClick={() => handleScroll('right')}
        disabled={!canScrollRight}
        className={`absolute right-0 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-theme-surface/80 shadow-md flex items-center justify-center text-theme-text hover:bg-theme-surface transition-all duration-300 ${
          canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-label="滚动到右边"
      >
        <i className="fa-solid fa-chevron-right"></i>
      </button>
      
      {/* 渐变遮罩 */}
      <div className="absolute top-0 left-0 w-16 h-full bg-gradient-to-r from-theme-background to-transparent pointer-events-none z-0"></div>
      <div className="absolute top-0 right-0 w-16 h-full bg-gradient-to-l from-theme-background to-transparent pointer-events-none z-0"></div>
    </div>
  );
}