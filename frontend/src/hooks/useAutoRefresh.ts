import { useState, useEffect, useRef, useCallback } from 'react';

interface UseAutoRefreshOptions<T> {
  /** 刷新间隔（毫秒），默认30秒 */
  interval?: number;
  /** 数据获取函数 */
  fetchData: () => Promise<T>;
  /** 数据比较函数，用于判断数据是否发生变化 */
  compareData?: (oldData: T, newData: T) => boolean;
  /** 是否启用自动刷新，默认true */
  enabled?: boolean;
  /** 是否在页面不可见时暂停刷新，默认true */
  pauseWhenHidden?: boolean;
  /** 错误处理函数 */
  onError?: (error: Error) => void;
  /** 数据更新回调 */
  onDataUpdate?: (newData: T, hasChanged: boolean) => void;
}

interface UseAutoRefreshReturn<T> {
  /** 当前数据 */
  data: T | null;
  /** 是否正在加载 */
  loading: boolean;
  /** 错误信息 */
  error: Error | null;
  /** 手动刷新 */
  refresh: () => Promise<void>;
  /** 暂停自动刷新 */
  pause: () => void;
  /** 恢复自动刷新 */
  resume: () => void;
  /** 是否已暂停 */
  isPaused: boolean;
  /** 最后更新时间 */
  lastUpdated: Date | null;
}

/**
 * 自动刷新Hook
 * 支持智能数据更新和防闪烁机制
 */
export function useAutoRefresh<T>({
  interval = 100000, // 默认30秒
  fetchData,
  compareData,
  enabled = true,
  pauseWhenHidden = true,
  onError,
  onDataUpdate
}: UseAutoRefreshOptions<T>): UseAutoRefreshReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoad = useRef(true);
  const isVisible = useRef(true);

  // 默认数据比较函数
  const defaultCompareData = useCallback((oldData: T, newData: T): boolean => {
    return JSON.stringify(oldData) !== JSON.stringify(newData);
  }, []);

  const actualCompareData = compareData || defaultCompareData;

  // 页面可见性检测
  useEffect(() => {
    if (!pauseWhenHidden) return;

    const handleVisibilityChange = () => {
      const wasVisible = isVisible.current;
      isVisible.current = !document.hidden;
      
      // 只有当页面从不可见变为可见时才刷新，避免页面刷新时的重复刷新
      if (isVisible.current && !wasVisible && !isPaused && enabled) {
        // 页面重新可见时立即刷新一次
        refresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [pauseWhenHidden, isPaused, enabled]);

  // 防止并发请求的ref
  const isRefreshing = useRef(false);
  const lastRefreshTime = useRef(0);
  const MIN_REFRESH_INTERVAL = 1000; // 最小请求间隔1秒

  // 暂停自动刷新
  const pause = useCallback(() => {
    setIsPaused(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // 恢复自动刷新
  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  // 数据获取函数
  const refresh = useCallback(async () => {
    const now = Date.now();
    if (isPaused || !enabled || (pauseWhenHidden && !isVisible.current) || isRefreshing.current) {
      return;
    }
    
    // 检查最小请求间隔
    if (now - lastRefreshTime.current < MIN_REFRESH_INTERVAL) {
      console.log('请求过于频繁，跳过此次刷新');
      return;
    }

    try {
      isRefreshing.current = true;
      lastRefreshTime.current = now;
      
      // 只在初始加载时显示loading状态，避免闪烁
      if (isInitialLoad.current) {
        setLoading(true);
      }
      
      setError(null);
      const newData = await fetchData();
      
      // 检查数据是否发生变化
      setData(prevData => {
        const hasChanged = prevData === null || actualCompareData(prevData, newData);
        
        if (hasChanged) {
          setLastUpdated(new Date());
          // 调用数据更新回调
          onDataUpdate?.(newData, hasChanged);
          return newData;
        }
        
        return prevData;
      });
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
      
      // 如果是网络资源不足错误，暂停自动刷新一段时间
      if (error.message.includes('ERR_INSUFFICIENT_RESOURCES')) {
        console.warn('检测到资源不足错误，暂停自动刷新30秒');
        pause();
        setTimeout(() => {
          resume();
        }, 30000); // 30秒后恢复
      }
    } finally {
      isRefreshing.current = false;
      if (isInitialLoad.current) {
        setLoading(false);
        isInitialLoad.current = false;
      }
    }
  }, [fetchData, actualCompareData, isPaused, enabled, pauseWhenHidden, onError, onDataUpdate, pause, resume]); // 移除data依赖

  // 设置定时器
  useEffect(() => {
    if (!enabled || isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // 立即执行一次
    refresh();

    // 设置定时器
    intervalRef.current = setInterval(() => {
      if (isVisible.current || !pauseWhenHidden) {
        refresh();
      }
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, isPaused, interval, pauseWhenHidden]); // 移除refresh依赖，避免循环

  // 单独处理refresh函数的更新
  useEffect(() => {
    if (enabled && !isPaused && intervalRef.current) {
      // 如果定时器已经在运行，不需要重新设置
      return;
    }
  }, [refresh]);

  return {
    data,
    loading,
    error,
    refresh,
    pause,
    resume,
    isPaused,
    lastUpdated
  };
}

/**
 * 专门用于订单数据的自动刷新Hook
 */
export function useOrderAutoRefresh<T>(
  fetchOrders: () => Promise<T>,
  options?: Omit<UseAutoRefreshOptions<T>, 'fetchData'>
) {
  return useAutoRefresh({
    ...options,
    fetchData: fetchOrders,
    interval: options?.interval || 15000, // 订单数据15秒刷新一次
    compareData: options?.compareData || ((oldData: T, newData: T) => {
      // 对于订单数组，比较长度和最新订单的状态
      if (Array.isArray(oldData) && Array.isArray(newData)) {
        if (oldData.length !== newData.length) return true;
        
        // 比较前几个订单的关键字段
        const compareCount = Math.min(5, oldData.length);
        for (let i = 0; i < compareCount; i++) {
          const oldOrder = oldData[i] as any;
          const newOrder = newData[i] as any;
          if (oldOrder?.id !== newOrder?.id || 
              oldOrder?.status !== newOrder?.status ||
              oldOrder?.updated_at !== newOrder?.updated_at) {
            return true;
          }
        }
        return false;
      }
      return JSON.stringify(oldData) !== JSON.stringify(newData);
    })
  });
}

/**
 * 专门用于通知数据的自动刷新Hook
 */
export function useNotificationAutoRefresh<T>(
  fetchNotifications: () => Promise<T>,
  options?: Omit<UseAutoRefreshOptions<T>, 'fetchData'>
) {
  return useAutoRefresh({
    ...options,
    fetchData: fetchNotifications,
    interval: options?.interval || 10000, // 通知数据10秒刷新一次
  });
}