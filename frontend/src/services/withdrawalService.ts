// 提现相关的API服务
import { API_BASE_URL } from '@/config/api';

// 提现记录接口定义
export interface WithdrawalRecord {
  id: string;
  userId: string;
  userNickname: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestTime: string;
  processTime?: string;
  processedBy?: string;
  reason?: string;
  bankInfo: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
}

export interface WithdrawalStats {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  totalAmount: number;
  pendingAmount: number;
}

// 提现申请接口
export interface WithdrawalRequest {
  id: string;
  playerUid: string;
  playerName: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
  notes?: string;
  qrCodeUrl: string;
}

// 处理记录接口
export interface ProcessRecord {
  id: string;
  withdrawalId: string;
  status: 'approved' | 'rejected' | 'paid';
  processedBy: string;
  processedAt: string;
  notes?: string;
}

// 更新提现状态请求
export interface UpdateWithdrawalStatusRequest {
  status: 'approved' | 'rejected' | 'paid';
  notes?: string;
}

// 获取提现申请列表
export const getWithdrawals = async (): Promise<WithdrawalRecord[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/withdrawals`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch withdrawal requests');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching withdrawal requests:', error);
    // 开发环境下返回空数组
    if (process.env.NODE_ENV === 'development') {
      return [];
    }
    throw error;
  }
};

// 获取所有提现申请
export const getWithdrawalRequests = async (): Promise<WithdrawalRequest[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/withdrawals`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch withdrawal requests');
    }
    const data = await response.json();
    
    // 处理后端返回的数据格式
    if (data.success && data.withdrawals) {
      return data.withdrawals.map((item: any) => ({
        id: item.withdrawal_id,
        playerUid: item.player_id?.toString() || '',
        playerName: item.player_name || `玩家${item.player_id}`,
        amount: Number(item.amount || 0),
        status: item.status === '待审核' ? 'pending' : 
                item.status === '已通过' ? 'approved' : 
                item.status === '已拒绝' ? 'rejected' : 'pending',
        createdAt: item.created_at,
        processedAt: item.updated_at,
        processedBy: item.processed_by,
        notes: item.notes,
        qrCodeUrl: '' // 暂时为空，后续可以添加
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching withdrawal requests:', error);
    // 开发环境下返回空数组
    if (process.env.NODE_ENV === 'development') {
      return [];
    }
    throw error;
  }
};

// 获取处理记录
export const getProcessRecords = async (): Promise<ProcessRecord[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/withdrawals`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch process records');
    }
    const data = await response.json();
    // 转换后端数据格式为前端需要的ProcessRecord格式
    if (data.success && data.withdrawals) {
      return data.withdrawals.map((item: any) => ({
        id: item.withdrawal_id || item.id,
        withdrawalId: item.withdrawal_id || item.id,
        status: item.status,
        processedBy: item.processed_by || 'system',
        processedAt: item.updated_at || item.created_at,
        notes: item.notes || ''
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching process records:', error);
    // 开发环境下返回空数组
    if (process.env.NODE_ENV === 'development') {
      return [];
    }
    throw error;
  }
};

// 获取特定提现申请的处理记录
export const getWithdrawalProcessRecords = async (withdrawalId: string): Promise<ProcessRecord[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/withdrawals/${withdrawalId}/records`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch withdrawal process records');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching withdrawal process records:', error);
    // 开发环境下返回空数组
    if (process.env.NODE_ENV === 'development') {
      return [];
    }
    throw error;
  }
};

// 更新提现申请状态
export const updateWithdrawalStatus = async (
  withdrawalId: string, 
  updateData: UpdateWithdrawalStatusRequest
): Promise<WithdrawalRequest> => {
  try {
    const response = await fetch(`${API_BASE_URL}/withdrawals/${withdrawalId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(updateData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update withdrawal status');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating withdrawal status:', error);
    throw error;
  }
};

// 批准提现申请
export const approveWithdrawal = async (withdrawalId: string, notes?: string): Promise<WithdrawalRequest> => {
  return updateWithdrawalStatus(withdrawalId, { status: 'approved', notes });
};

// 拒绝提现申请
export const rejectWithdrawal = async (withdrawalId: string, notes: string): Promise<WithdrawalRequest> => {
  return updateWithdrawalStatus(withdrawalId, { status: 'rejected', notes });
};

// 标记提现为已打款
export const markWithdrawalAsPaid = async (withdrawalId: string, notes?: string): Promise<WithdrawalRequest> => {
  return updateWithdrawalStatus(withdrawalId, { status: 'paid', notes });
};

// 获取提现统计信息
export const getWithdrawalStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/withdrawals/stats`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch withdrawal stats');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching withdrawal stats:', error);
    // 开发环境下返回默认统计
    if (process.env.NODE_ENV === 'development') {
      return {
        totalPending: 0,
        totalApproved: 0,
        totalPaid: 0,
        totalRejected: 0,
        totalAmount: 0
      };
    }
    throw error;
  }
};