// src/components/RatingDetail.tsx
import React, { useState, useEffect } from 'react';
import { 
  getPlayerRatingStats, 
  PlayerRatingDetail, 
  formatRating, 
  getRatingText, 
  getRatingColorClass 
} from '../services/ratingService';

interface RatingDetailProps {
  playerId: number;
  isOpen: boolean;
  onClose: () => void;
}

const RatingDetail: React.FC<RatingDetailProps> = ({ playerId, isOpen, onClose }) => {
  const [ratingData, setRatingData] = useState<PlayerRatingDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && playerId) {
      loadRatingData();
    }
  }, [isOpen, playerId]);

  const loadRatingData = async () => {
    setLoading(true);
    try {
      const data = await getPlayerRatingStats(playerId);
      setRatingData(data);
    } catch (error) {
      console.error('加载评分数据失败:', error);
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
          <i key={`full-${i}`} className="fa-solid fa-star text-yellow-400 text-sm"></i>
        ))}
        {hasHalfStar && <i className="fa-solid fa-star-half-stroke text-yellow-400 text-sm"></i>}
        {[...Array(emptyStars)].map((_, i) => (
          <i key={`empty-${i}`} className="fa-regular fa-star text-gray-300 text-sm"></i>
        ))}
      </div>
    );
  };

  const renderRatingBar = (star: number, count: number, total: number) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    
    return (
      <div className="flex items-center space-x-3 mb-2">
        <span className="text-sm text-gray-600 w-8">{star}星</span>
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">评分详情</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            <i className="fa-solid fa-times"></i>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : ratingData ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 评分概览 */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">评分概览</h3>
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-gray-800 mb-2">
                  {formatRating(ratingData.stats.averageRating)}
                </div>
                <div className="flex justify-center mb-2">
                  {renderStars(parseFloat(ratingData.stats.averageRating))}
                </div>
                <div className={`text-sm font-medium ${getRatingColorClass(parseFloat(ratingData.stats.averageRating))}`}>
                  {getRatingText(parseFloat(ratingData.stats.averageRating))}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  基于 {ratingData.stats.totalReviews} 条评价
                </div>
              </div>

              {/* 星级分布 */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map(star => (
                  <div key={star}>
                    {renderRatingBar(
                      star, 
                      ratingData.stats.starCounts[star as keyof typeof ratingData.stats.starCounts], 
                      ratingData.stats.totalReviews
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 月度趋势 */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">月度趋势</h3>
              <div className="space-y-3">
                {ratingData.monthlyTrends.slice(0, 6).map((trend, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <div>
                      <div className="font-medium text-gray-800">{trend.month}</div>
                      <div className="text-sm text-gray-500">{trend.review_count} 条评价</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-800">
                        {formatRating(trend.avg_rating)}
                      </div>
                      <div className="flex justify-end">
                        {renderStars(trend.avg_rating)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 最近评论 */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4">最近评论</h3>
              <div className="space-y-4">
                {ratingData.recentComments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <img
                        src={comment.user_avatar || '/default-avatar.png'}
                        alt={comment.user_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-gray-800">{comment.user_name}</span>
                          <div className="flex">
                            {renderStars(comment.rating)}
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {ratingData.recentComments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    暂无评论
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            加载评分数据失败
          </div>
        )}
      </div>
    </div>
  );
};

export default RatingDetail;