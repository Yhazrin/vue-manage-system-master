// 提现状态类型定义 - 统一陪玩和客服提现流程
export type WithdrawalStatus = 'pending' | 'approved' | 'completed' | 'rejected';

// 统一的提现状态标签映射
export const getWithdrawalStatusLabel = (status: WithdrawalStatus): string => {
  const statusLabels: Record<WithdrawalStatus, string> = {
    pending: '待审核',
    approved: '已批准', 
    completed: '已完成',
    rejected: '已拒绝'
  };
  
  return statusLabels[status] || '未知状态';
};

// 统一的提现状态样式映射
export const getWithdrawalStatusStyle = (status: WithdrawalStatus) => {
  const label = getWithdrawalStatusLabel(status);
  
  switch(status) {
    case 'pending':
      return { 
        className: "bg-yellow-50 text-yellow-700", 
        label 
      };
    case 'approved':
      return { 
        className: "bg-blue-50 text-blue-700", 
        label 
      };
    case 'completed':
      return { 
        className: "bg-green-50 text-green-700", 
        label 
      };
    case 'rejected':
      return { 
        className: "bg-red-50 text-red-700", 
        label 
      };
    default:
      return { 
        className: "bg-gray-50 text-gray-700", 
        label: "未知状态" 
      };
  }
};

// 管理端专用的状态样式（使用主题色）
export const getAdminWithdrawalStatusStyle = (status: WithdrawalStatus) => {
  const label = getWithdrawalStatusLabel(status);
  
  switch(status) {
    case 'pending':
      return { 
        className: "bg-theme-accent/10 text-theme-accent", 
        label 
      };
    case 'approved':
      return { 
        className: "bg-blue-50 text-blue-700", 
        label 
      };
    case 'completed':
      return { 
        className: "bg-theme-success/10 text-theme-success", 
        label 
      };
    case 'rejected':
      return { 
        className: "bg-theme-error/10 text-theme-error", 
        label 
      };
    default:
      return { 
        className: "bg-theme-surface text-theme-text", 
        label: "未知状态" 
      };
  }
};

// 状态消息映射（用于WebSocket通知）
export const getWithdrawalStatusMessage = (status: WithdrawalStatus): string => {
  const statusMessages: Record<WithdrawalStatus, string> = {
    pending: '您的提现申请已提交，请等待审核',
    approved: '您的提现申请已通过审核',
    completed: '您的提现已完成，请查收',
    rejected: '您的提现申请已被拒绝'
  };
  
  return statusMessages[status] || '提现状态已更新';
};