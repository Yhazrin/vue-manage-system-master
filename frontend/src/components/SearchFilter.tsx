import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { getGames } from '@/services/gameService';
import { Game } from '@/types';

interface SearchFilterProps {
  onSearch: (searchTerm: string) => void;
  onGameFilter: (gameId: number | null, enabled: boolean) => void;
  onPriceRangeChange: (min: number, max: number, enabled: boolean) => void;
  searchTerm: string;
  selectedGame: number | null;
  priceRange: [number, number];
  gameFilterEnabled: boolean;
  priceFilterEnabled: boolean;
}

const SearchFilter: React.FC<SearchFilterProps> = ({
  onSearch,
  onGameFilter,
  onPriceRangeChange,
  searchTerm,
  selectedGame,
  priceRange,
  gameFilterEnabled,
  priceFilterEnabled
}) => {
  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>(priceRange);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);

  // 获取游戏列表
  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        const gameList = await getGames();
        setGames(gameList);
      } catch (error) {
        console.error('获取游戏列表失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  const handlePriceChange = (min: number, max: number) => {
    setLocalPriceRange([min, max]);
    onPriceRangeChange(min, max, priceFilterEnabled);
  };

  const handleGameFilterToggle = (enabled: boolean) => {
    onGameFilter(selectedGame, enabled);
  };

  const handlePriceFilterToggle = (enabled: boolean) => {
    onPriceRangeChange(localPriceRange[0], localPriceRange[1], enabled);
  };
  
  return (
    <div className="bg-theme-surface rounded-lg shadow-sm p-6 mb-6 border border-theme-border">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-theme-text mb-1">寻找您的完美游戏陪玩</h2>
        <p className="text-sm text-theme-text/70">搜索和筛选我们的专业游戏陪玩</p>
      </div>
      
      <div className="space-y-4">
        {/* 搜索栏 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-text/50 w-4 h-4" />
          <input
            type="text"
            placeholder="搜索陪玩师或游戏..."
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-theme-border rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-transparent bg-theme-background text-theme-text placeholder-theme-text/50"
          />
        </div>

        {/* 筛选条件行 */}
        <div className="flex items-center gap-6">
          {/* 左侧：游戏筛选 */}
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="gameFilter"
                checked={gameFilterEnabled}
                onChange={(e) => handleGameFilterToggle(e.target.checked)}
                className="w-4 h-4 text-theme-primary bg-theme-background border-theme-border rounded focus:ring-theme-primary focus:ring-2"
              />
              <label htmlFor="gameFilter" className="ml-2 text-sm font-medium text-theme-text">
                游戏筛选
              </label>
            </div>
            <select
              value={selectedGame || ''}
              onChange={(e) => onGameFilter(e.target.value ? Number(e.target.value) : null, gameFilterEnabled)}
              className={`flex-1 px-3 py-2 border border-theme-border rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-transparent bg-theme-background text-theme-text ${
                !gameFilterEnabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={loading || !gameFilterEnabled}
            >
              <option value="">所有游戏</option>
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.name}
                </option>
              ))}
            </select>
          </div>

          {/* 右侧：价格区间筛选 */}
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="priceFilter"
                checked={priceFilterEnabled}
                onChange={(e) => handlePriceFilterToggle(e.target.checked)}
                className="w-4 h-4 text-theme-primary bg-theme-background border-theme-border rounded focus:ring-theme-primary focus:ring-2"
              />
              <label htmlFor="priceFilter" className="ml-2 text-sm font-medium text-theme-text">
                价格筛选
              </label>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <input
                type="number"
                min="10"
                max="200"
                value={localPriceRange[0]}
                onChange={(e) => handlePriceChange(Number(e.target.value), localPriceRange[1])}
                className={`w-20 px-2 py-1 border border-theme-border rounded text-sm bg-theme-background text-theme-text ${
                  !priceFilterEnabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={!priceFilterEnabled}
                placeholder="最低"
              />
              <span className="text-theme-text/70">-</span>
              <input
                type="number"
                min="10"
                max="200"
                value={localPriceRange[1]}
                onChange={(e) => handlePriceChange(localPriceRange[0], Number(e.target.value))}
                className={`w-20 px-2 py-1 border border-theme-border rounded text-sm bg-theme-background text-theme-text ${
                  !priceFilterEnabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={!priceFilterEnabled}
                placeholder="最高"
              />
              <span className="text-sm text-theme-text/70">元/小时</span>
            </div>
          </div>
        </div>

        {/* 筛选状态显示 */}
        <div className="flex items-center gap-2 text-sm text-theme-text/70">
          {gameFilterEnabled && selectedGame && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-theme-primary/10 text-theme-primary rounded-full text-xs">
              游戏: {games.find(g => g.id === selectedGame)?.name}
            </span>
          )}
          {priceFilterEnabled && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-theme-primary/10 text-theme-primary rounded-full text-xs">
              价格: ¥{localPriceRange[0]} - ¥{localPriceRange[1]}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchFilter;