import { useState, useEffect } from 'react';
import Header from "@/components/Header";
import { useNavigate } from 'react-router-dom';
import PlayerCard from "@/components/PlayerCard";
import { getFavoritePlayers, FavoritePlayer } from '@/services/favoriteService';
import { toast } from 'sonner';

export default function UserFavorites() {
  const [favorites, setFavorites] = useState<FavoritePlayer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // 加载收藏数据
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getFavoritePlayers();
      setFavorites(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载收藏失败';
      setError(errorMessage);
      console.error('Error loading favorites:', err);
      
      // 在开发环境下提供空数组
      if (process.env.NODE_ENV === 'development') {
        setFavorites([]);
      }
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="bg-theme-background min-h-screen text-theme-text">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-theme-background min-h-screen text-theme-text">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">收藏的陪玩</h1>
            <button 
              onClick={() => navigate('/user/profile')}
              className="py-1.5 px-3 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              <i className="fa-solid fa-arrow-left mr-1"></i> 返回个人主页
            </button>
          </div>
          <div className="text-center py-10">
            <p className="text-red-500 mb-4">加载失败: {error}</p>
            <button 
              onClick={loadFavorites}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              重试
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-theme-background min-h-screen text-theme-text">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">收藏的陪玩</h1>
          <button 
            onClick={() => navigate('/user/profile')}
            className="py-1.5 px-3 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
          >
            <i className="fa-solid fa-arrow-left mr-1"></i> 返回个人主页
          </button>
        </div>
        
        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map(player => (
              <PlayerCard 
                key={player.id} 
                player={player} 
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 text-2xl mb-4">
              <i className="fa-heart"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无收藏</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-6">您还没有收藏任何陪玩，快去大厅寻找心仪的陪玩吧</p>
            <button 
              onClick={() => navigate('/lobby')}
              className="px-6 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              <i className="fa-solid fa-search mr-1"></i> 寻找陪玩
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
