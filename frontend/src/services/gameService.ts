import { get } from '@/services/api';
import { Game } from '@/types';

// API响应接口
interface ApiResponse<T> {
  success: boolean;
  games?: T;
  game?: Game;
  players?: any[];
  error?: string;
}

// 获取游戏列表
export const getGames = async (): Promise<Game[]> => {
  const response = await get<ApiResponse<Game[]>>('/games');
  if (response.success && response.games) {
    return response.games;
  }
  throw new Error(response.error || '获取游戏列表失败');
};

// 获取游戏详情
export const getGameById = async (id: number): Promise<Game> => {
  const response = await get<ApiResponse<Game>>(`/games/${id}`);
  if (response.success && response.game) {
    return response.game;
  }
  throw new Error(response.error || '获取游戏详情失败');
};

// 获取特定游戏的陪玩列表
export const getPlayersByGameId = async (gameId: number) => {
  const response = await get<ApiResponse<any[]>>(`/games/${gameId}/players`);
  if (response.success && response.players) {
    return response.players;
  }
  throw new Error(response.error || '获取陪玩列表失败');
};