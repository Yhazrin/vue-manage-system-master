import React from 'react';
import { useAttendance } from '@/contexts/AttendanceContext';
import { useAuth } from '@/contexts/authContext';

const WorkStatusIndicator: React.FC = () => {
  const { isAuthenticated, userRole } = useAuth();
  const { attendanceStatus, currentWorkTime, isWorking } = useAttendance();

  // 只在客服用户登录且正在工作时显示
  if (!isAuthenticated || userRole !== 'customer_service' || !isWorking) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <span className="text-sm font-medium">工作中</span>
        <span className="text-sm font-mono">{currentWorkTime}</span>
      </div>
    </div>
  );
};

export default WorkStatusIndicator;