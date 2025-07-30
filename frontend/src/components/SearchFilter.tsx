import React, { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { getGames } from '@/services/gameService';
import { Game } from '@/types';

interface SearchFilterProps {
  onSearch: (searchTerm: string) => void;
  onGameFilter: (gameId: number | null) => void;
  onPriceRangeChange: (min: number, max: number) => void;
  searchTerm: string;
  selectedGame: number | null;
  priceRange: [number, number];
}

const SearchFilter: React.FC<SearchFilterProps> = ({
  onSearch,
  onGameFilter,
  onPriceRangeChange,
  searchTerm,
  selectedGame,
  priceRange
}) => {
  const [showFilters, setShowFilters] = useState(false);
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
    onPriceRangeChange(min, max);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">寻找您的完美游戏陪玩</h2>
        <p className="text-sm text-gray-600">搜索和筛选我们的专业游戏陪玩</p>
      </div>
      
      <div className="space-y-4">
        {/* 搜索栏 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="搜索陪玩师或游戏..."
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* 筛选按钮 */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Filter className="w-4 h-4" />
            筛选条件
          </button>
          
          {/* 活跃筛选标签 */}
          <div className="flex items-center gap-2">
            {selectedGame && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {games.find(g => g.id === selectedGame)?.name}
                <button
                  onClick={() => onGameFilter(null)}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>

        {/* 筛选面板 */}
        {showFilters && (
          <div className="border-t pt-4 space-y-4">
            {/* 游戏选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                游戏类型
              </label>
              <select
                value={selectedGame || ''}
                onChange={(e) => onGameFilter(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="">所有游戏</option>
                {games.map((game) => (
                  <option key={game.id} value={game.id}>
                    {game.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 价格范围 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                价格范围: ¥{localPriceRange[0]} - ¥{localPriceRange[1]}/小时
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="10"
                  max="200"
                  value={localPriceRange[0]}
                  onChange={(e) => handlePriceChange(Number(e.target.value), localPriceRange[1])}
                  className="flex-1"
                />
                <input
                  type="range"
                  min="10"
                  max="200"
                  value={localPriceRange[1]}
                  onChange={(e) => handlePriceChange(localPriceRange[0], Number(e.target.value))}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchFilter;