import { useState, useCallback, useRef } from 'react';

interface UsePageLoadingOptions {
  minLoadingTime?: number; // 最小加载时间，避免闪烁
  cacheKey?: string; // 缓存键，用于避免重复加载
}

interface UsePageLoadingReturn {
  isLoading: boolean;
  startLoading: () => void;
  finishLoading: () => void;
  isFromCache: boolean;
}

// 简单的内存缓存
const cache = new Map<string, boolean>();

export const usePageLoading = (options: UsePageLoadingOptions = {}): UsePageLoadingReturn => {
  const { minLoadingTime = 100, cacheKey } = options; // 减少最小加载时间
  const [isLoading, setIsLoading] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);
  const loadingStartTime = useRef<number | null>(null);

  const startLoading = useCallback(() => {
    // 检查缓存
    if (cacheKey && cache.has(cacheKey)) {
      setIsFromCache(true);
      return;
    }

    setIsFromCache(false);
    setIsLoading(true);
    loadingStartTime.current = Date.now();
  }, [cacheKey]);

  const finishLoading = useCallback(() => {
    if (isFromCache) {
      return;
    }

    const now = Date.now();
    const elapsed = loadingStartTime.current ? now - loadingStartTime.current : 0;
    const remainingTime = Math.max(0, minLoadingTime - elapsed);

    if (remainingTime > 0) {
      setTimeout(() => {
        setIsLoading(false);
        if (cacheKey) {
          cache.set(cacheKey, true);
        }
      }, remainingTime);
    } else {
      setIsLoading(false);
      if (cacheKey) {
        cache.set(cacheKey, true);
      }
    }
  }, [isFromCache, minLoadingTime, cacheKey]);

  return {
    isLoading,
    startLoading,
    finishLoading,
    isFromCache
  };
};