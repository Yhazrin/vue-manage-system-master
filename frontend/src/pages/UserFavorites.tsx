import { useState, useEffect, useContext } from 'react';
import Header from "@/components/Header";
import { useNavigate } from 'react-router-dom';
import PlayerCard from "@/components/PlayerCard";
import { getFavoritePlayers, FavoritePlayer } from '@/services/favoriteService';
import { getPlayers, getPlayerServices } from '@/services/playerService';
import { toast } from 'sonner';
import { AuthContext } from '@/contexts/authContext';
import { checkAuthStatus, handleAuthError } from '@/utils/authUtils';
import { Player } from '@/types';

export default function UserFavorites() {
  const [favoritePlayers, setFavoritePlayers] = useState<Player[]>([]);
  const [favoritePlayerIds, setFavoritePlayerIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { isAuthenticated, userRole } = useContext(AuthContext);

  // 检查认证状态
  useEffect(() => {
    const authCheck = checkAuthStatus(isAuthenticated);
    if (!authCheck.isValid) {
      if (authCheck.message) {
        toast.error(authCheck.message);
      }
      if (authCheck.shouldRedirect) {
        navigate('/login');
        return;
      }
    }
    
    loadFavorites();
  }, [isAuthenticated, navigate]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 1. 获取收藏列表（只包含基本信息）
      const favoriteList = await getFavoritePlayers();
      const favoriteIds = new Set(favoriteList.map(fav => fav.player.id));
      setFavoritePlayerIds(favoriteIds);
      
      // 2. 获取所有陪玩的完整信息（使用大厅页面的逻辑）
      const allPlayers = await getPlayers();
      
      // 3. 筛选出收藏的陪玩，并确保包含完整信息
      const favoritePlayersWithFullInfo = allPlayers.filter(player => 
        favoriteIds.has(player.id)
      );
      
      // 4. 为每个收藏的陪玩获取评论统计信息
      const playersWithRatings = await Promise.all(
        favoritePlayersWithFullInfo.map(async (player) => {
          try {
            // 获取评论数据来计算评分和评论数
            const response = await fetch(`http://localhost:3000/api/comments/player/${player.id}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json',
              }
            });
            
            if (response.ok) {
              const commentsData = await response.json();
              const comments = commentsData.data || [];
              const reviewCount = comments.length;
              const averageRating = reviewCount > 0 
                ? comments.reduce((sum: number, comment: any) => sum + comment.rating, 0) / reviewCount
                : 5.0;
              
              return {
                ...player,
                rating: parseFloat(averageRating.toFixed(1)),
                reviews: reviewCount
              };
            } else {
              // 如果获取评论失败，使用默认值
              return {
                ...player,
                rating: 5.0,
                reviews: 0
              };
            }
          } catch (error) {
            console.error(`Failed to fetch comments for player ${player.id}:`, error);
            return {
              ...player,
              rating: 5.0,
              reviews: 0
            };
          }
        })
      );
      
      setFavoritePlayers(playersWithRatings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载收藏失败';
      setError(errorMessage);
      console.error('Error loading favorites:', err);
      
      // 处理认证错误
      if (handleAuthError(err, navigate)) {
        return;
      }
      
      // 在开发环境下提供空数组
      if (process.env.NODE_ENV === 'development') {
        setFavoritePlayers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // 处理收藏状态变化
  const handleFavoriteChange = (playerId: number, isFavorite: boolean) => {
    if (!isFavorite) {
      // 从收藏列表中移除
      setFavoritePlayers(prev => prev.filter(player => player.id !== playerId));
      setFavoritePlayerIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(playerId);
        return newSet;
      });
      toast.success('已从收藏中移除');
    }
  };
  
  if (loading) {
    return (
      <div className="bg-theme-background min-h-screen text-theme-text">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-theme-surface rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 bg-theme-surface rounded-xl"></div>
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
            <h1 className="text-2xl font-bold text-theme-text">收藏的陪玩</h1>
            <button 
              onClick={() => navigate('/user/profile')}
              className="py-1.5 px-3 bg-theme-primary text-white text-sm font-medium rounded-lg hover:bg-theme-primary/90 transition-colors"
            >
              <i className="fa-solid fa-arrow-left mr-1"></i> 返回个人主页
            </button>
          </div>
          <div className="text-center py-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-theme-error/10 text-theme-error text-2xl mb-4">
              <i className="fa-solid fa-exclamation-triangle"></i>
            </div>
            <h3 className="text-lg font-medium text-theme-text mb-2">加载失败</h3>
            <p className="text-theme-error mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={loadFavorites}
                className="px-4 py-2 bg-theme-primary text-white rounded-lg hover:bg-theme-primary/90 transition-colors"
              >
                <i className="fa-solid fa-refresh mr-1"></i> 重试
              </button>
              {error.includes('401') || error.includes('登录') ? (
                <button 
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 bg-theme-secondary text-white rounded-lg hover:bg-theme-secondary/90 transition-colors"
                >
                  <i className="fa-solid fa-sign-in-alt mr-1"></i> 重新登录
                </button>
              ) : null}
            </div>
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
          <h1 className="text-2xl font-bold text-theme-text">收藏的陪玩</h1>
          <button 
            onClick={() => navigate('/user/profile')}
            className="py-1.5 px-3 bg-theme-primary text-white text-sm font-medium rounded-lg hover:bg-theme-primary/90 transition-colors"
          >
            <i className="fa-solid fa-arrow-left mr-1"></i> 返回个人主页
          </button>
        </div>
        
        {favoritePlayers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favoritePlayers.map(player => (
              <PlayerCard 
                key={player.id} 
                player={player}
                isFavorite={favoritePlayerIds.has(player.id)}
                onFavoriteChange={handleFavoriteChange}
              />
            ))}
          </div>
        ) : (
          <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-theme-background text-theme-text/40 text-2xl mb-4">
              <i className="fa-heart"></i>
            </div>
            <h3 className="text-lg font-medium text-theme-text mb-2">暂无收藏</h3>
            <p className="text-theme-text/70 max-w-sm mx-auto mb-6">您还没有收藏任何陪玩，快去大厅寻找心仪的陪玩吧</p>
            <button 
              onClick={() => navigate('/lobby')}
              className="px-6 py-2.5 bg-theme-primary text-white font-medium rounded-lg hover:bg-theme-primary/90 transition-colors"
            >
              <i className="fa-solid fa-search mr-1"></i> 寻找陪玩
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
