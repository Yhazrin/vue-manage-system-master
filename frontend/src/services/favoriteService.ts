import { Player } from '../types';
import { apiRequest } from './api';

// 收藏相关接口
export interface FavoritePlayer {
  favoriteId: number;
  favoritedAt: string;
  player: Player;
}

// 获取用户收藏的陪玩列表
export const getFavoritePlayers = async (): Promise<FavoritePlayer[]> => {
  return await apiRequest<FavoritePlayer[]>('/api/favorites');
};

// 添加陪玩到收藏
export const addFavoritePlayer = async (playerId: number): Promise<void> => {
  await apiRequest('/api/favorites', {
    method: 'POST',
    body: JSON.stringify({ playerId }),
  });
};

// 从收藏中移除陪玩
export const removeFavoritePlayer = async (playerId: number): Promise<void> => {
  await apiRequest(`/api/favorites/${playerId}`, {
    method: 'DELETE',
  });
};