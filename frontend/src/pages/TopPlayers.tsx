// src/pages/TopPlayers.tsx
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { getTopPlayers, TopPlayer, formatRating, getRatingColorClass } from '@/services/ratingService';
import { buildAvatarUrl } from '@/utils/imageUtils';
import { Link } from 'react-router-dom';

const TopPlayers: React.FC = () => {
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTopPlayers();
  }, []);

  const loadTopPlayers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTopPlayers(20);
      if (data.success) {
        setTopPlayers(data.topPlayers);
      } else {
        setError('加载排行榜失败');
      }
    } catch (err) {
      console.error('加载排行榜失败:', err);
      setError('加载排行榜失败');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <i key={`full-${i}`} className="fa-solid fa-star text-yellow-400 dark:text-yellow-300 text-sm"></i>
        ))}
        {hasHalfStar && <i className="fa-solid fa-star-half-stroke text-yellow-400 dark:text-yellow-300 text-sm"></i>}
        {[...Array(emptyStars)].map((_, i) => (
          <i key={`empty-${i}`} className="fa-regular fa-star text-theme-text/30 text-sm"></i>
        ))}
      </div>
    );
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <i className="fa-solid fa-crown text-yellow-500 dark:text-yellow-400 text-xl"></i>;
      case 2:
        return <i className="fa-solid fa-medal text-theme-text/60 text-xl"></i>;
      case 3:
        return <i className="fa-solid fa-award text-orange-500 dark:text-orange-400 text-xl"></i>;
      default:
        return <span className="text-lg font-bold text-theme-text/70">#{rank}</span>;
    }
  };

  const getRankBgColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200 dark:from-yellow-900/20 dark:to-yellow-800/20 dark:border-yellow-700/30';
      case 2:
        return 'bg-gradient-to-r from-theme-surface to-theme-background border-theme-border';
      case 3:
        return 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 dark:from-orange-900/20 dark:to-orange-800/20 dark:border-orange-700/30';
      default:
        return 'bg-theme-surface border-theme-border';
    }
  };

  return (
    <div className="bg-theme-background min-h-screen text-theme-text">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-theme-text mb-2">陪玩评分排行榜</h1>
          <p className="text-theme-text/70">基于用户真实评价的陪玩排行榜</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="bg-theme-surface rounded-lg p-6 border border-theme-border animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-theme-text/20 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-theme-text/20 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-theme-text/20 rounded w-1/3"></div>
                  </div>
                  <div className="h-6 bg-theme-text/20 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-500 dark:text-red-400 mb-4">
              <i className="fa-solid fa-exclamation-triangle text-4xl"></i>
            </div>
            <h3 className="text-lg font-medium text-theme-text mb-2">加载失败</h3>
            <p className="text-theme-text/70 mb-4">{error}</p>
            <button
              onClick={loadTopPlayers}
              className="px-4 py-2 bg-theme-primary text-white rounded-lg hover:bg-theme-primary/90 transition-colors"
            >
              重试
            </button>
          </div>
        ) : topPlayers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-theme-text/40 mb-4">
              <i className="fa-solid fa-trophy text-4xl"></i>
            </div>
            <h3 className="text-lg font-medium text-theme-text mb-2">暂无排行榜数据</h3>
            <p className="text-theme-text/70">还没有足够的评价数据来生成排行榜</p>
          </div>
        ) : (
          <div className="space-y-4">
            {topPlayers.map((player) => (
              <Link
                key={player.playerId}
                to={`/booking/${player.playerId}`}
                className={`block rounded-lg p-6 border transition-all duration-200 hover:shadow-md ${getRankBgColor(player.rank)}`}
              >
                <div className="flex items-center space-x-4">
                  {/* 排名图标 */}
                  <div className="flex-shrink-0 w-12 flex justify-center">
                    {getRankIcon(player.rank)}
                  </div>

                  {/* 陪玩头像 */}
                  <div className="flex-shrink-0">
                    <img
                      src={buildAvatarUrl(player.avatar)}
                      alt={player.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-theme-surface shadow-sm"
                    />
                  </div>

                  {/* 陪玩信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-semibold text-theme-text truncate">
                        {player.name}
                      </h3>
                      {player.rank <= 3 && (
                        <span className="px-2 py-1 bg-theme-primary/10 text-theme-primary text-xs font-medium rounded-full">
                          TOP {player.rank}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-theme-text/70">
                      <div className="flex items-center space-x-1">
                        {renderStars(parseFloat(player.averageRating))}
                        <span className={`font-medium ${getRatingColorClass(parseFloat(player.averageRating))}`}>
                          {formatRating(player.averageRating)}
                        </span>
                      </div>
                      <span>•</span>
                      <span>{player.totalReviews} 条评价</span>
                      <span>•</span>
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        {player.positiveRate}% 好评率
                      </span>
                    </div>
                  </div>

                  {/* 评分详情 */}
                  <div className="flex-shrink-0 text-right">
                    <div className={`text-2xl font-bold ${getRatingColorClass(parseFloat(player.averageRating))}`}>
                      {formatRating(player.averageRating)}
                    </div>
                    <div className="text-xs text-theme-text/50">
                      综合评分
                    </div>
                  </div>

                  {/* 箭头图标 */}
                  <div className="flex-shrink-0 text-theme-text/40">
                    <i className="fa-solid fa-chevron-right"></i>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* 说明文字 */}
        {topPlayers.length > 0 && (
          <div className="mt-8 p-4 bg-theme-primary/5 rounded-lg border border-theme-primary/20">
            <div className="flex items-start space-x-2">
              <i className="fa-solid fa-info-circle text-theme-primary mt-0.5"></i>
              <div className="text-sm text-theme-text">
                <p className="font-medium mb-1">排行榜说明：</p>
                <ul className="space-y-1 text-theme-text/80">
                  <li>• 排行榜基于用户真实评价计算，至少需要5条评价才能上榜</li>
                  <li>• 综合评分考虑平均评分和评价数量</li>
                  <li>• 数据每小时更新一次</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TopPlayers;