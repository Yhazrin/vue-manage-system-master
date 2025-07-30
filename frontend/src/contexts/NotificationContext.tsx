import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface NotificationContextType {
  displayedNotificationIds: Set<string>;
  addDisplayedNotification: (id: string) => void;
  addDisplayedNotifications: (ids: string[]) => void;
  clearDisplayedNotifications: () => void;
  isNotificationDisplayed: (id: string) => boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const STORAGE_KEY = 'displayed_notification_ids';
const STORAGE_EXPIRY_KEY = 'displayed_notification_ids_expiry';
const EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24小时

// 从localStorage获取已显示的通知ID
const getStoredDisplayedIds = (): Set<string> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const expiry = localStorage.getItem(STORAGE_EXPIRY_KEY);
    
    if (!stored || !expiry) {
      return new Set();
    }
    
    const expiryTime = parseInt(expiry, 10);
    const now = Date.now();
    
    // 检查是否过期
    if (now > expiryTime) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_EXPIRY_KEY);
      return new Set();
    }
    
    const ids = JSON.parse(stored);
    return new Set(Array.isArray(ids) ? ids : []);
  } catch (error) {
    console.error('Error reading displayed notification IDs from storage:', error);
    return new Set();
  }
};

// 保存已显示的通知ID到localStorage
const saveDisplayedIds = (ids: Set<string>) => {
  try {
    const idsArray = Array.from(ids);
    const expiry = Date.now() + EXPIRY_TIME;
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(idsArray));
    localStorage.setItem(STORAGE_EXPIRY_KEY, expiry.toString());
  } catch (error) {
    console.error('Error saving displayed notification IDs to storage:', error);
  }
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [displayedNotificationIds, setDisplayedNotificationIds] = useState<Set<string>>(() => 
    getStoredDisplayedIds()
  );

  // 监听localStorage变化，实现跨标签页同步
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setDisplayedNotificationIds(getStoredDisplayedIds());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 监听页面可见性变化，当页面重新可见时同步状态
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setDisplayedNotificationIds(getStoredDisplayedIds());
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const addDisplayedNotification = useCallback((id: string) => {
    setDisplayedNotificationIds(prev => {
      const newSet = new Set(prev);
      newSet.add(id);
      saveDisplayedIds(newSet);
      return newSet;
    });
  }, []);

  const addDisplayedNotifications = useCallback((ids: string[]) => {
    setDisplayedNotificationIds(prev => {
      const newSet = new Set(prev);
      ids.forEach(id => newSet.add(id));
      saveDisplayedIds(newSet);
      return newSet;
    });
  }, []);

  const clearDisplayedNotifications = useCallback(() => {
    setDisplayedNotificationIds(new Set());
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_EXPIRY_KEY);
  }, []);

  const isNotificationDisplayed = useCallback((id: string) => {
    return displayedNotificationIds.has(id);
  }, [displayedNotificationIds]);

  const value: NotificationContextType = {
    displayedNotificationIds,
    addDisplayedNotification,
    addDisplayedNotifications,
    clearDisplayedNotifications,
    isNotificationDisplayed,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};