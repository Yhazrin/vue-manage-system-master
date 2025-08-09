import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import superUnifiedAttendanceService from '@/services/superUnifiedAttendanceService';
import type { SuperUnifiedAttendanceStatus } from '@/services/superUnifiedAttendanceService';
import { useAuth } from '@/contexts/authContext';

// 为了兼容性，创建类型别名
type AttendanceStatus = SuperUnifiedAttendanceStatus;

interface AttendanceContextType {
  attendanceStatus: AttendanceStatus;
  currentWorkTime: string;
  isWorking: boolean;
  refreshAttendanceStatus: () => Promise<void>;
  updateAttendanceStatus: (status: AttendanceStatus) => void;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

interface AttendanceProviderProps {
  children: ReactNode;
}

export const AttendanceProvider: React.FC<AttendanceProviderProps> = ({ children }) => {
  const { isAuthenticated, userRole } = useAuth();
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>({ status: 'not_clocked' });
  const [currentWorkTime, setCurrentWorkTime] = useState<string>('00:00:00');
  const [workStartTime, setWorkStartTime] = useState<Date | null>(null);

  const isWorking = attendanceStatus.status === 'clocked_in';
  const isCustomerService = isAuthenticated && userRole === 'customer_service';

  // 计算工作时长的通用函数
  const calculateWorkTimeWithStartTime = (startTime: Date) => {
    if (!isCustomerService || !startTime) {
      setCurrentWorkTime('00:00:00');
      return;
    }
    
    const now = new Date();
    const diffMs = now.getTime() - startTime.getTime();
    const diffSeconds = Math.max(0, Math.floor(diffMs / 1000)); // 确保不为负数
    
    const hours = Math.floor(diffSeconds / 3600);
    const minutes = Math.floor((diffSeconds % 3600) / 60);
    const seconds = diffSeconds % 60;
    
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    setCurrentWorkTime(timeString);
  };

  // 计算实时工作时长
  const calculateWorkTime = useCallback(() => {
    if (!isCustomerService || !workStartTime || attendanceStatus.status !== 'clocked_in') {
      setCurrentWorkTime('00:00:00');
      return;
    }
    
    calculateWorkTimeWithStartTime(workStartTime);
  }, [isCustomerService, workStartTime, attendanceStatus.status]);

  // 获取打卡状态
  const refreshAttendanceStatus = async () => {
    if (!isCustomerService) {
      return;
    }
    
    try {
      const status = await superUnifiedAttendanceService.getTodayStatus();
      setAttendanceStatus(status);
      
      // 如果正在工作，设置工作开始时间
      if (status.status === 'clocked_in' && status.todayRecord?.clock_in_time) {
        const startTime = new Date(status.todayRecord.clock_in_time);
        setWorkStartTime(startTime);
        // 立即计算一次时间
        calculateWorkTimeWithStartTime(startTime);
      } else {
        setWorkStartTime(null);
        setCurrentWorkTime('00:00:00');
      }
    } catch (error) {
      console.error('获取打卡状态失败:', error);
    }
  };

  // 更新考勤状态（用于打卡后立即更新）
  const updateAttendanceStatus = useCallback((newStatus: AttendanceStatus) => {
    setAttendanceStatus(newStatus);
    
    // 根据状态启动或停止计时器
    if (newStatus.status === 'clocked_in' && newStatus.workStartTime) {
      setWorkStartTime(new Date(newStatus.workStartTime));
    } else {
      setWorkStartTime(null);
      setCurrentWorkTime('00:00:00');
    }
  }, []);

  // 初始化时获取状态
  useEffect(() => {
    if (isCustomerService) {
      refreshAttendanceStatus();
    }
  }, [isCustomerService]);

  // 设置定时器，每秒更新工作时长
  useEffect(() => {
    if (!isCustomerService || attendanceStatus.status !== 'clocked_in' || !workStartTime) {
      return;
    }
    
    const timer = setInterval(calculateWorkTime, 1000);
    
    // 立即计算一次
    calculateWorkTime();
    
    return () => {
      clearInterval(timer);
    };
  }, [isCustomerService, workStartTime, attendanceStatus.status, calculateWorkTime]);

  const value: AttendanceContextType = {
    attendanceStatus,
    currentWorkTime,
    isWorking,
    refreshAttendanceStatus,
    updateAttendanceStatus
  };

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = (): AttendanceContextType => {
  const context = useContext(AttendanceContext);
  if (context === undefined) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};