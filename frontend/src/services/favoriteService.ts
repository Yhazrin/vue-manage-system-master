// 收藏相关的API服务
import { apiRequest } from '@/services/api';
import { Player } from '@/types';

export interface FavoritePlayer {
  favoriteId: number;
  favoritedAt: string;
  player: Player;
}

// 获取用户收藏列表
export const getFavoritePlayers = async (): Promise<FavoritePlayer[]> => {
  const response = await apiRequest<{ data: FavoritePlayer[] }>('/favorites/list');
  return response.data;
};

// 添加收藏
export const addFavoritePlayer = async (playerId: number): Promise<void> => {
  await apiRequest('/favorites', {
    method: 'POST',
    body: JSON.stringify({ playerId })
  });
};

// 移除收藏
export const removeFavoritePlayer = async (playerId: number): Promise<void> => {
  await apiRequest(`/favorites/${playerId}`, {
    method: 'DELETE'
  });
};