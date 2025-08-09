// src/components/RatingStats.tsx
import React, { useState, useEffect } from 'react';
import { 
  getMyRatingStats, 
  MyRatingStats, 
  formatRating, 
  getRatingText, 
  getRatingColorClass 
} from '../services/ratingService';

const RatingStats: React.FC = () => {
  const [stats, setStats] = useState<MyRatingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await getMyRatingStats();
      setStats(data);
    } catch (error) {
      console.error('加载评分统计失败:', error);
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
          <i key={`full-${i}`} className="fa-solid fa-star text-yellow-400"></i>
        ))}
        {hasHalfStar && <i className="fa-solid fa-star-half-stroke text-yellow-400"></i>}
        {[...Array(emptyStars)].map((_, i) => (
          <i key={`empty-${i}`} className="fa-regular fa-star text-gray-300"></i>
        ))}
      </div>
    );
  };

  const renderRatingBar = (star: number, count: number, total: number) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    
    return (
      <div className="flex items-center space-x-3 mb-2">
        <span className="text-sm text-gray-600 w-8 text-theme-text">{star}星</span>
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <span className="text-sm text-gray-500 w-8">{count}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-theme-border rounded mb-2"></div>
        <div className="space-y-2">
          <div className="h-3 bg-theme-border rounded"></div>
          <div className="h-3 bg-theme-border rounded"></div>
          <div className="h-3 bg-theme-border rounded"></div>
        </div>
      </div>
    );
  }

  if (!stats || !stats.success) {
    return (
      <div className="text-center py-4 text-theme-text/70 text-sm">
        暂无评分数据
      </div>
    );
  }

  return (
    <div>
      
      {/* 总体评分 */}
      <div className="bg-theme-background rounded-lg p-3 mb-3 border border-theme-border">
        <div className="text-center">
          <div className="text-2xl font-bold text-theme-text mb-1">
            {formatRating(stats.averageRating)}
          </div>
          <div className="flex justify-center mb-1">
            {renderStars(parseFloat(stats.averageRating))}
          </div>
          <div className={`text-xs font-medium ${getRatingColorClass(parseFloat(stats.averageRating))}`}>
            {getRatingText(parseFloat(stats.averageRating))} · {stats.totalReviews} 条评价
          </div>
        </div>
      </div>

      {/* 统计数据 */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="text-center p-2 bg-theme-background rounded border border-theme-border">
          <div className="text-lg font-bold text-theme-primary">{stats.monthlyReviews}</div>
          <div className="text-xs text-theme-text/70">本月评价</div>
        </div>
        {stats.monthlyAverageRating && parseFloat(stats.monthlyAverageRating) > 0 && (
          <div className="text-center p-2 bg-theme-background rounded border border-theme-border">
            <div className="text-lg font-bold text-theme-text">
              {formatRating(stats.monthlyAverageRating)}
            </div>
            <div className="text-xs text-theme-text/70">本月评分</div>
          </div>
        )}
      </div>

      {/* 星级分布 */}
      <div>
        <h4 className="text-sm font-medium mb-2 text-theme-text">星级分布</h4>
        <div className="space-y-1">
          {[5, 4, 3, 2, 1].map(star => (
            <div key={star} className="flex items-center space-x-2">
              <span className="text-xs w-6 text-theme-text">{star}★</span>
              <div className="flex-1 bg-theme-border rounded-full h-1.5">
                <div 
                  className="bg-theme-primary h-1.5 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${stats.starDistribution[star] || 0}%` 
                  }}
                />
              </div>
              <span className="text-xs text-theme-text/70 w-8 text-right">
                {stats.starDistribution[star] || 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RatingStats;