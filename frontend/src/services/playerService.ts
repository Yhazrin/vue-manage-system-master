import { get, post } from '@/services/api';
import { Player } from '@/types';

// 获取陪玩列表（包含价格信息）
export const getPlayers = async (params?: any): Promise<Player[]> => {
  // 构建查询参数
  const queryParams = new URLSearchParams();
  if (params?.gameId) queryParams.append('gameId', params.gameId.toString());
  if (params?.minPrice) queryParams.append('minPrice', params.minPrice.toString());
  if (params?.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const response = await get<{ success: boolean; total: number; players: Player[] }>(`/players/public${queryString}`);
  const players = response.players || [];
  
  // 为每个陪玩获取服务价格信息
  const playersWithPrices = await Promise.all(
    players.map(async (player) => {
      try {
        const services = await getPlayerServices(player.id);
        // 计算最低价格
        const minPrice = services.length > 0 
          ? Math.min(...services.map((service: any) => service.price))
          : undefined;
        
        return {
          ...player,
          price: minPrice,
          services: services.map((service: any) => service.game_name).filter(Boolean)
        };
      } catch (error) {
        console.error(`Failed to fetch services for player ${player.id}:`, error);
        return player;
      }
    })
  );
  
  return playersWithPrices;
}

// 获取陪玩服务信息
export const getPlayerServices = async (playerId: number) => {
  const response = await get<{ success: boolean; services: any[] }>(`/services/player/${playerId}`);
  return response.services || [];
};

// 获取陪玩详情
export const getPlayerById = async (id: number): Promise<Player> => {
  return get<Player>(`/players/${id}`);
};

// 预约陪玩
export const bookPlayer = async (playerId: number, bookingData: any) => {
  return post(`/bookings`, { playerId, ...bookingData });
};