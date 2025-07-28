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

// 获取所有提现申请
export const getWithdrawalRequests = async (): Promise<WithdrawalRequest[]> => {
  try {
    const response = await fetch('/api/admin/withdrawals');
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

// 获取处理记录
export const getProcessRecords = async (): Promise<ProcessRecord[]> => {
  try {
    const response = await fetch('/api/admin/withdrawal/records');
    if (!response.ok) {
      throw new Error('Failed to fetch process records');
    }
    return await response.json();
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
    const response = await fetch(`/api/admin/withdrawals/${withdrawalId}/records`);
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
    const response = await fetch(`/api/admin/withdrawals/${withdrawalId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
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
    const response = await fetch('/api/admin/withdrawals/stats');
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