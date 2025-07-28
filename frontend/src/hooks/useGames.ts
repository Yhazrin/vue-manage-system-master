import { useEffect } from 'react';
import { getGames } from '@/services/gameService';
import { useApi } from './useApi';
import { Game } from '@/types';

export function useGames() {
  const { data: games, loading, error, execute } = useApi<Game[]>();

  useEffect(() => {
    execute(() => getGames());
  }, [execute]);

  return { games, loading, error };
}