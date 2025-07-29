import { get, post } from '@/services/api';
import { Player } from '@/types';

// 获取陪玩列表
export const getPlayers = async (params?: any): Promise<Player[]> => {
  // 构建查询参数
  const queryParams = new URLSearchParams();
  if (params?.gameId) queryParams.append('gameId', params.gameId.toString());
  if (params?.minPrice) queryParams.append('minPrice', params.minPrice.toString());
  if (params?.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return get<Player[]>(`/players/public${queryString}`);
}


// 获取陪玩详情
export const getPlayerById = async (id: number): Promise<Player> => {
  return get<Player>(`/players/${id}`);
};

// 预约陪玩
export const bookPlayer = async (playerId: number, bookingData: any) => {
  return post(`/bookings`, { playerId, ...bookingData });
};