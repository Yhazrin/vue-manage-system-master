import { useState, useCallback } from 'react';
import { getPlayers } from '@/services/playerService';
import { Player } from '@/types';

interface PlayerFilters {
  gameId?: number;
  search?: string;
  sortBy?: string;
}

export function usePlayers(filters?: PlayerFilters) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 调用真实API
      const data = await getPlayers(filters);
      setPlayers(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取陪玩列表失败';
      setError(errorMessage);
      console.error('Error fetching players:', err);
      
      // 在开发环境下，如果API调用失败，返回空数组而不是抛出错误
      if (process.env.NODE_ENV === 'development') {
        setPlayers([]);
        return [];
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [filters]);

  return { players, loading, error, fetchPlayers };
}
