import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Header from "@/components/Header";
import SearchFilter from "@/components/SearchFilter";
import PlayerList from "@/components/PlayerList";
import { useNavigate } from 'react-router-dom';
import { usePlayers } from "@/hooks/usePlayers";
import { getGameById } from '@/services/gameService';
import { Game } from '@/types';
import { toast } from 'sonner';

export default function GamePlayersPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [gameLoading, setGameLoading] = useState(true);
  const [gameError, setGameError] = useState<string | null>(null);
  
  const { players, loading, error, fetchPlayers } = usePlayers({ gameId: gameId ? parseInt(gameId) : undefined });
  
  // 获取游戏信息
  const fetchGame = async () => {
    if (!gameId) return;
    
    try {
      setGameLoading(true);
      setGameError(null);
      const gameData = await getGameById(parseInt(gameId));
      setGame(gameData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取游戏信息失败';
      setGameError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setGameLoading(false);
    }
  };
  
  // Filter players by game
  const filteredPlayers = players?.filter(player => 
    game ? player.games.includes(game.name) : false
  ) || [];
  
  useEffect(() => {
    fetchGame();
  }, [gameId]);
  
  useEffect(() => {
    if (gameId) {
      // Fetch players for this game when component mounts
      fetchPlayers();
    }
  }, [fetchPlayers, gameId]);
  
  // 显示游戏加载状态
  if (gameLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">加载游戏信息中...</p>
          </div>
        </div>
      </div>
    );
  }

  // 显示游戏错误状态
  if (gameError || !game) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {gameError ? '加载失败' : '游戏未找到'}
            </h2>
            <p className="text-gray-600 mb-6">
              {gameError || '抱歉，找不到您要查看的游戏。'}
            </p>
            <div className="flex gap-4 justify-center">
              {gameError && (
                <button
                  onClick={fetchGame}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  重试
                </button>
              )}
              <button
                onClick={() => navigate('/')}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                返回首页
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Game Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <img
                src={game.image_url}
                alt={game.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{game.name}</h1>
              <p className="text-gray-600">{game.description || ''}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm text-gray-500">
                  {filteredPlayers.length} 位陪玩可选
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6">
          <SearchFilter />
        </div>

        {/* Players List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">加载中...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">加载失败</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => fetchPlayers()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              重试
            </button>
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无陪玩</h3>
            <p className="text-gray-600">该游戏暂时没有可用的陪玩，请稍后再试。</p>
          </div>
        ) : (
          <PlayerList players={filteredPlayers} />
        )}
      </div>
    </div>
  );
}