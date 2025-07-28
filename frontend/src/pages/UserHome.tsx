import Header from "@/components/Header";
import { useContext, useState, useEffect, useCallback } from "react";
import { AuthContext } from '@/contexts/authContext';
import SearchFilter from "@/components/SearchFilter";
import PlayerList from "@/components/PlayerList";
import { Player } from "@/types";
import { usePlayers } from "@/hooks/usePlayers";
import { debounce } from "@/lib/utils";
import { toast } from 'sonner';

export default function UserHome() {
  const { logout } = useContext(AuthContext);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([10, 50]);
  const { players, loading, error, fetchPlayers } = usePlayers();
  
  // 初始加载时获取所有玩家
  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);
  
  // 页面加载后显示欢迎通知已移除

  // 添加防抖处理价格范围变化
  const debouncedPriceChange = useCallback(
    debounce((min: number, max: number) => {
      if (players) {
        const filtered = players.filter(player => 
          player.price >= min && player.price <= max
        );
        setFilteredPlayers(filtered);
      }
    }, 300), // 300ms防抖
    [players]
  );
  
  // 当玩家数据或价格范围变化时筛选玩家
  useEffect(() => {
    debouncedPriceChange(priceRange[0], priceRange[1]);
  }, [priceRange, debouncedPriceChange]);

  
  // 处理价格范围变化
  const handlePriceChange = (minPrice: number, maxPrice: number) => {
    setPriceRange([minPrice, maxPrice]);
  };
  
  return (
     <div className="bg-theme-background min-h-screen text-theme-text">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
            <SearchFilter onPriceChange={handlePriceChange} />
             {/* 右下角浮动通知 - 使用sonner实现 */}
             {(() => {
               return null;
             })()}

         {loading ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
             {Array.from({ length: 6 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="bg-gray-100 rounded-xl overflow-hidden border border-gray-200 animate-pulse">
                <div className="relative pb-[100%] bg-gray-200"></div>
                <div className="p-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="flex gap-2 mb-2">
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-1/4 mt-2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-red-500">加载陪玩失败: {error}</p>
            <button 
              onClick={fetchPlayers}
              className="mt-2 text-purple-600 hover:underline"
            >
              重试
            </button>
          </div>
        ) : (
          <PlayerList players={filteredPlayers} />
        )}
        
        {/* 显示筛选结果数量 */}
        <div className="mt-4 text-sm text-gray-500">
          找到 {filteredPlayers.length} 位符合条件的陪玩
        </div>
      </main>
    </div>
  );
}