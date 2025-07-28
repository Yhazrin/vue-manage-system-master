import { get } from '@/services/api';
import { Game } from '@/types';

// 获取游戏列表
export const getGames = async (): Promise<Game[]> => {
  return get<Game[]>('/games');
};

// 获取游戏详情
export const getGameById = async (id: number): Promise<Game> => {
  return get<Game>(`/games/${id}`);
};

// 获取特定游戏的陪玩列表
export const getPlayersByGameId = async (gameId: number) => {
  return get(`/games/${gameId}/players`);
};