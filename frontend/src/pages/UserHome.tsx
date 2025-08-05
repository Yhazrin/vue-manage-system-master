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
import { useLocation } from "react-router-dom";

export default function UserHome() {
  const { logout } = useContext(AuthContext);
  const location = useLocation();
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

  // 处理URL查询参数，支持从首页热门游戏跳转时自动筛选
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const gameParam = searchParams.get('game');
    
    if (gameParam) {
      const gameId = parseInt(gameParam, 10);
      if (!isNaN(gameId) && selectedGame !== gameId) {
        console.log('从URL参数设置游戏筛选:', gameId);
        setSelectedGame(gameId);
        setGameFilterEnabled(true);
        
        // 只在首次设置或游戏ID变化时显示提示信息
        toast.success(`已为您筛选游戏ID为 ${gameId} 的陪玩`);
      }
    }
  }, [location.search]);

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

    // 搜索筛选 - 支持陪玩名称、游戏名称和介绍搜索
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(player => {
        // 搜索陪玩名称
        if (player.name.toLowerCase().includes(searchLower)) return true;
        
        // 搜索介绍
        if (player.intro && player.intro.toLowerCase().includes(searchLower)) return true;
        
        // 搜索陪玩提供的所有游戏服务
        if (player.games && Array.isArray(player.games)) {
          return player.games.some(gameName => 
            gameName && gameName.toLowerCase().includes(searchLower)
          );
        }
        
        // 搜索服务中的游戏名称（备用）
        if (player.services && Array.isArray(player.services)) {
          return player.services.some(service => 
            service.game_name && service.game_name.toLowerCase().includes(searchLower)
          );
        }
        
        return false;
      });
    }

    // 游戏筛选 - 检查陪玩是否提供指定游戏的服务
    if (gameFilterEnabled && selectedGame) {
      filtered = filtered.filter(player => {
        // 检查陪玩的主要游戏ID
        if (player.game_id === selectedGame) return true;
        
        // 检查陪玩提供的服务中是否包含该游戏
        if (player.services && Array.isArray(player.services)) {
          return player.services.some(service => service.game_id === selectedGame);
        }
        
        return false;
      });
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
            <p className="text-theme-error">加载陪玩失败: {error?.message || String(error)}</p>
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