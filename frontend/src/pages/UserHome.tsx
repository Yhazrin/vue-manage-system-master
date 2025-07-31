import Header from "@/components/Header";
import { useContext, useState, useEffect, useCallback } from "react";
import { AuthContext } from '@/contexts/authContext';
import SearchFilter from "@/components/SearchFilter";
import PlayerList from "@/components/PlayerList";
import { Player } from "@/types";
import { usePlayers } from "@/hooks/usePlayers";
import { debounce } from "@/lib/utils";
import { toast } from 'sonner';
import { getFavoritePlayers, FavoritePlayer } from "@/services/favoriteService";

export default function UserHome() {
  const { logout } = useContext(AuthContext);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGame, setSelectedGame] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([10, 200]);
  const [gameFilterEnabled, setGameFilterEnabled] = useState(false);
  const [priceFilterEnabled, setPriceFilterEnabled] = useState(false);
  const [favorites, setFavorites] = useState<FavoritePlayer[]>([]);
  const [favoritePlayerIds, setFavoritePlayerIds] = useState<Set<number>>(new Set());
  const { players, loading, error, fetchPlayers } = usePlayers();
  
  // 初始加载时获取所有玩家和收藏列表
  useEffect(() => {
    fetchPlayers();
    loadFavorites();
  }, [fetchPlayers]);

  // 加载收藏列表
  const loadFavorites = async () => {
    try {
      const favoriteList = await getFavoritePlayers();
      setFavorites(favoriteList);
      const playerIds = new Set(favoriteList.map(fav => fav.player.id));
      setFavoritePlayerIds(playerIds);
    } catch (err) {
      console.error('Failed to load favorites:', err);
    }
  };

  // 筛选陪玩的函数
  const filterPlayers = useCallback(() => {
    if (!players || !Array.isArray(players)) {
      setFilteredPlayers([]);
      return;
    }

    let filtered = [...players];

    // 搜索筛选 - 支持陪玩名称和游戏名称搜索
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(player =>
        player.name.toLowerCase().includes(searchLower) ||
        (player.game_name && player.game_name.toLowerCase().includes(searchLower)) ||
        (player.intro && player.intro.toLowerCase().includes(searchLower))
      );
    }

    // 游戏筛选 - 只有在启用且选择了游戏时才筛选
    if (gameFilterEnabled && selectedGame) {
      filtered = filtered.filter(player => player.game_id === selectedGame);
    }

    // 价格范围筛选 - 只有在启用时才筛选
    if (priceFilterEnabled) {
      filtered = filtered.filter(player => {
        if (!player.price) return false;
        return player.price >= priceRange[0] && player.price <= priceRange[1];
      });
    }

    setFilteredPlayers(filtered);
  }, [players, searchTerm, selectedGame, priceRange, gameFilterEnabled, priceFilterEnabled]);

  // 防抖的筛选函数
  const debouncedFilter = useCallback(
    debounce(filterPlayers, 300),
    [filterPlayers]
  );

  // 当筛选条件变化时执行筛选
  useEffect(() => {
    debouncedFilter();
  }, [debouncedFilter]);

  // 处理搜索
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  // 处理游戏筛选
  const handleGameFilter = (gameId: number | null, enabled: boolean) => {
    setSelectedGame(gameId);
    setGameFilterEnabled(enabled);
  };

  // 处理价格范围变化
  const handlePriceRangeChange = (min: number, max: number, enabled: boolean) => {
    setPriceRange([min, max]);
    setPriceFilterEnabled(enabled);
  };

  // 处理收藏状态变化
  const handleFavoriteChange = (playerId: number, isFavorite: boolean) => {
    if (isFavorite) {
      setFavoritePlayerIds(prev => new Set([...prev, playerId]));
    } else {
      setFavoritePlayerIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(playerId);
        return newSet;
      });
    }
  };
  
  return (
     <div className="bg-theme-background min-h-screen text-theme-text">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <SearchFilter 
          onSearch={handleSearch}
          onGameFilter={handleGameFilter}
          onPriceRangeChange={handlePriceRangeChange}
          searchTerm={searchTerm}
          selectedGame={selectedGame}
          priceRange={priceRange}
          gameFilterEnabled={gameFilterEnabled}
          priceFilterEnabled={priceFilterEnabled}
        />

         {loading ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
             {Array.from({ length: 6 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="bg-theme-surface rounded-xl overflow-hidden border border-theme-border animate-pulse">
                <div className="relative pb-[100%] bg-theme-background"></div>
                <div className="p-3">
                  <div className="h-4 bg-theme-background rounded w-3/4 mb-2"></div>
                  <div className="flex gap-2 mb-2">
                    <div className="h-3 bg-theme-background rounded w-1/4"></div>
                    <div className="h-3 bg-theme-background rounded w-1/4"></div>
                    <div className="h-3 bg-theme-background rounded w-1/4"></div>
                  </div>
                  <div className="h-4 bg-theme-background rounded w-1/4 mt-2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-red-500">加载陪玩失败: {error}</p>
            <button 
              onClick={fetchPlayers}
              className="mt-2 text-theme-primary hover:underline"
            >
              重试
            </button>
          </div>
        ) : (
          <PlayerList 
            players={filteredPlayers} 
            favoritePlayerIds={favoritePlayerIds}
            onFavoriteChange={handleFavoriteChange}
          />
        )}
        
        {/* 显示筛选结果数量 */}
        <div className="mt-4 text-sm text-theme-text/70">
          找到 {filteredPlayers.length} 位符合条件的陪玩
        </div>
      </main>
    </div>
  );
}