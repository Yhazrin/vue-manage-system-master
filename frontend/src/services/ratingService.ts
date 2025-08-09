// src/services/ratingService.ts
import { get } from './api';

export interface RatingStats {
  totalReviews: number;
  averageRating: string;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  starCounts: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface RecentComment {
  id: number;
  content: string;
  rating: number;
  created_at: string;
  user_name: string;
  user_avatar: string;
}

export interface MonthlyTrend {
  month: string;
  avg_rating: number;
  review_count: number;
}

export interface PlayerRatingDetail {
  success: boolean;
  playerId: number;
  stats: RatingStats;
  recentComments: RecentComment[];
  monthlyTrends: MonthlyTrend[];
}

export interface PlayerRatingSummary {
  success: boolean;
  playerId: number;
  totalReviews: number;
  averageRating: string;
  positiveRate: number;
}

export interface TopPlayer {
  rank: number;
  playerId: number;
  name: string;
  avatar: string;
  totalReviews: number;
  averageRating: string;
  positiveRate: number;
}

export interface MyRatingStats {
  success: boolean;
  playerId: number;
  totalReviews: number;
  averageRating: string;
  monthlyReviews: number;
  monthlyAverageRating: string;
  ranking: number | null;
  starDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

/**
 * 获取陪玩的详细评分统计
 */
export const getPlayerRatingStats = async (playerId: number): Promise<PlayerRatingDetail> => {
  return await get<PlayerRatingDetail>(`/ratings/player/${playerId}/stats`);
};

/**
 * 获取陪玩的评分摘要（用于列表显示）
 */
export const getPlayerRatingSummary = async (playerId: number): Promise<PlayerRatingSummary> => {
  return await get<PlayerRatingSummary>(`/ratings/player/${playerId}/summary`);
};

/**
 * 获取评分最高的陪玩排行榜
 */
export const getTopPlayers = async (limit: number = 10): Promise<{ success: boolean; topPlayers: TopPlayer[] }> => {
  return await get<{ success: boolean; topPlayers: TopPlayer[] }>(`/ratings/top-players?limit=${limit}`);
};

/**
 * 获取当前陪玩的评分统计（需要登录）
 */
export const getMyRatingStats = async (): Promise<MyRatingStats> => {
  return await get<MyRatingStats>('/ratings/my-stats');
};

/**
 * 提交评分
 */
export const submitRating = async (data: {
  playerId: number;
  orderId: number;
  rating: number;
  comment: string;
}): Promise<{ success: boolean; commentId?: number; error?: string }> => {
  try {
    const response = await get<{ commentId: number }>('/ratings/submit', {
      method: 'POST',
      body: JSON.stringify({
        playerId: data.playerId,
        orderId: data.orderId,
        rating: data.rating,
        content: data.comment
      })
    });

    return {
      success: true,
      commentId: response.commentId
    };
  } catch (error) {
    console.error('提交评分失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '提交评分失败'
    };
  }
};

/**
 * 格式化评分显示
 */
export const formatRating = (rating: string | number): string => {
  const num = typeof rating === 'string' ? parseFloat(rating) : rating;
  return num.toFixed(1);
};

/**
 * 获取评分对应的文字描述
 */
export const getRatingText = (rating: number): string => {
  if (rating >= 4.5) return '优秀';
  if (rating >= 4.0) return '很好';
  if (rating >= 3.5) return '良好';
  if (rating >= 3.0) return '一般';
  if (rating >= 2.0) return '较差';
  return '很差';
};

/**
 * 获取评分对应的颜色类名
 */
export const getRatingColorClass = (rating: number): string => {
  if (rating >= 4.5) return 'text-green-600';
  if (rating >= 4.0) return 'text-green-500';
  if (rating >= 3.5) return 'text-yellow-500';
  if (rating >= 3.0) return 'text-yellow-600';
  if (rating >= 2.0) return 'text-orange-500';
  return 'text-red-500';
};

/**
 * 生成星级评分的HTML
 */
export const generateStarRating = (rating: number, maxStars: number = 5): string => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0);
  
  let stars = '';
  
  // 满星
  for (let i = 0; i < fullStars; i++) {
    stars += '<i class="fa-solid fa-star text-yellow-400"></i>';
  }
  
  // 半星
  if (hasHalfStar) {
    stars += '<i class="fa-solid fa-star-half-stroke text-yellow-400"></i>';
  }
  
  // 空星
  for (let i = 0; i < emptyStars; i++) {
    stars += '<i class="fa-regular fa-star text-gray-300"></i>';
  }
  
  return stars;
};