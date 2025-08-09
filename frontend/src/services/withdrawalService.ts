// 提现相关的API服务
import { API_BASE_URL } from '@/config/api';
import { get, put, post } from './api';

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
  type?: 'player' | 'customer_service'; // 区分陪玩和客服提现
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
  status: '已批准' | '已拒绝' | '已打款';
  notes?: string;
}

// 获取提现申请列表
export const getWithdrawals = async (): Promise<WithdrawalRecord[]> => {
  try {
    return await get<WithdrawalRecord[]>('/withdrawals');
  } catch (error) {
    console.error('Error fetching withdrawal requests:', error);
    // 开发环境下返回空数组
    if (process.env.NODE_ENV === 'development') {
      return [];
    }
    throw error;
  }
};

// 获取陪玩提现申请
export const getPlayerWithdrawalRequests = async (): Promise<WithdrawalRequest[]> => {
  try {
    const data = await get<any>('/withdrawals');
    
    // 处理后端返回的数据格式
    if (data.success && data.withdrawals) {
      return data.withdrawals.map((item: any) => ({
        id: item.withdrawal_id,
        playerUid: item.player_id?.toString() || '',
        playerName: item.player_name || `玩家${item.player_id}`,
        amount: Number(item.amount || 0),
        status: item.status === '待审核' ? 'pending' : 
                item.status === '已批准' ? 'approved' : 
                item.status === '已拒绝' ? 'rejected' : 
                item.status === '已打款' ? 'paid' : 'pending',
        createdAt: item.created_at,
        processedAt: item.updated_at,
        processedBy: item.processed_by,
        notes: item.notes,
        qrCodeUrl: '', // 暂时为空，后续可以添加
        type: 'player' // 标记为陪玩提现
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching player withdrawal requests:', error);
    // 开发环境下返回空数组
    if (process.env.NODE_ENV === 'development') {
      return [];
    }
    throw error;
  }
};

// 获取客服提现申请
export const getCustomerServiceWithdrawalRequests = async (): Promise<WithdrawalRequest[]> => {
  try {
    const data = await get<any>('/customer-service/withdrawals');
    
    // 处理后端返回的数据格式
    if (data.success && data.withdrawals) {
      return data.withdrawals.map((item: any) => ({
        id: item.id,
        playerUid: item.cs_phone || '',
        playerName: item.cs_name || `客服${item.cs_phone}`,
        amount: Number(item.amount || 0),
        status: item.status === 'pending' ? 'pending' : 
                item.status === 'approved' ? 'approved' : 
                item.status === 'rejected' ? 'rejected' : 
                item.status === 'completed' ? 'paid' : 'pending',
        createdAt: item.created_at,
        processedAt: item.updated_at,
        processedBy: item.processed_by,
        notes: item.description,
        qrCodeUrl: '', // 暂时为空，后续可以添加
        type: 'customer_service' // 标记为客服提现
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching customer service withdrawal requests:', error);
    // 开发环境下返回空数组
    if (process.env.NODE_ENV === 'development') {
      return [];
    }
    throw error;
  }
};

// 获取所有提现申请（陪玩 + 客服）
export const getWithdrawalRequests = async (): Promise<WithdrawalRequest[]> => {
  try {
    // 检查用户角色
    const userRole = localStorage.getItem('userRole');
    
    if (userRole === 'admin') {
      // 管理员直接调用 /withdrawals API，它会返回所有记录（陪玩+客服）
      const data = await get<any>('/withdrawals');
      
      if (data.success && data.withdrawals) {
        return data.withdrawals.map((item: any) => ({
          id: item.withdrawal_id,
          playerUid: item.user_type === 'customer_service' ? (item.customer_service_phone || item.customer_service_id?.toString() || '') : (item.player_id?.toString() || ''),
          playerName: item.user_type === 'customer_service' ? (item.customer_service_name || `客服${item.customer_service_id}`) : (item.player_name || `玩家${item.player_id}`),
          amount: Number(item.amount || 0),
          status: item.status === '待审核' ? 'pending' : 
                  item.status === '已批准' ? 'approved' : 
                  item.status === '已拒绝' ? 'rejected' : 
                  item.status === '已打款' || item.status === '已完成' ? 'paid' : 'pending',
          createdAt: item.created_at,
          processedAt: item.updated_at,
          processedBy: item.processed_by,
          notes: item.notes,
          qrCodeUrl: '',
          type: item.user_type === 'customer_service' ? 'customer_service' : 'player'
        }));
      }
      return [];
    } else {
      // 非管理员用户分别获取陪玩和客服提现记录
      const [playerWithdrawals, csWithdrawals] = await Promise.all([
        getPlayerWithdrawalRequests(),
        getCustomerServiceWithdrawalRequests()
      ]);
      
      // 合并两种类型的提现申请，按创建时间排序
      const allWithdrawals = [...playerWithdrawals, ...csWithdrawals];
      return allWithdrawals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  } catch (error) {
    console.error('Error fetching all withdrawal requests:', error);
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
    const data = await get<any>('/withdrawals');
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
    const response = await get<any>(`/withdrawals/${withdrawalId}/records`);
    
    // 处理后端返回的数据格式
    if (response.success && response.records) {
      return response.records.map((item: any) => ({
        id: item.id,
        withdrawalId: item.withdrawalId,
        status: item.action === '提交申请' ? 'pending' :
                item.action === '批准申请' ? 'approved' :
                item.action === '拒绝申请' ? 'rejected' :
                item.action === '标记为已打款' ? 'paid' : 'pending',
        processedBy: item.operator,
        processedAt: item.timestamp,
        notes: item.notes || ''
      }));
    }
    
    return [];
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
    const response = await put<any>(`/withdrawals/${withdrawalId}/status`, updateData);
    
    // 处理后端返回的数据格式
    if (response.success && response.withdrawal) {
      const item = response.withdrawal;
      return {
        id: item.withdrawal_id,
        playerUid: item.player_id?.toString() || '',
        playerName: item.player_name || `玩家${item.player_id}`,
        amount: Number(item.amount || 0),
        status: item.status === '待审核' ? 'pending' : 
                item.status === '已批准' ? 'approved' : 
                item.status === '已拒绝' ? 'rejected' : 
                item.status === '已打款' ? 'paid' : 'pending',
        createdAt: item.created_at,
        processedAt: item.updated_at,
        processedBy: item.processed_by,
        notes: item.notes,
        qrCodeUrl: '' // 暂时为空，后续可以添加
      };
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Error updating withdrawal status:', error);
    throw error;
  }
};

// 批准提现申请
export const approveWithdrawal = async (withdrawalId: string, notes?: string): Promise<WithdrawalRequest> => {
  return updateWithdrawalStatus(withdrawalId, { status: '已批准', notes });
};

// 拒绝提现申请
export const rejectWithdrawal = async (withdrawalId: string, notes: string): Promise<WithdrawalRequest> => {
  return updateWithdrawalStatus(withdrawalId, { status: '已拒绝', notes });
};

// 标记提现为已打款
export const markWithdrawalAsPaid = async (withdrawalId: string, notes?: string): Promise<WithdrawalRequest> => {
  return updateWithdrawalStatus(withdrawalId, { status: '已打款', notes });
};

// 获取提现统计信息
export const getWithdrawalStats = async () => {
  try {
    return await get<any>('/withdrawals/stats');
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

// 客服提现相关接口定义
export interface CustomerServiceWithdrawalRequest {
  amount: number;
  description?: string;
}

export interface CustomerServiceWithdrawalRecord {
  id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  description: string;
  created_at: string;
  updated_at: string;
  processed_at?: string;
  processed_by_name?: string;
  reject_reason?: string;
  approval_notes?: string;
}

export interface CustomerServiceEarningsData {
  totalEarnings: number;
  availableBalance: number;
  todayEarnings: number;
  monthEarnings: number;
  todayWorkHours: number;
  processedOrders: number;
  hourlyRate?: number;
}

// 获取客服收益数据
export const getCustomerServiceEarnings = async (): Promise<CustomerServiceEarningsData> => {
  try {
    const data = await get<any>('/customer-service/dashboard');
    
    if (data.success) {
      return {
        totalEarnings: data.earnings?.totalEarnings || 0,
        availableBalance: data.earnings?.availableBalance || 0,
        todayEarnings: data.earnings?.todayEarnings || 0,
        monthEarnings: data.earnings?.monthEarnings || 0,
        todayWorkHours: data.earnings?.todayWorkHours || 0,
        processedOrders: data.earnings?.processedOrders || 0,
        hourlyRate: data.earnings?.hourlyRate || 20
      };
    }
    
    // 返回默认数据
    return {
      totalEarnings: 0,
      availableBalance: 0,
      todayEarnings: 0,
      monthEarnings: 0,
      todayWorkHours: 0,
      processedOrders: 0,
      hourlyRate: 20
    };
  } catch (error) {
    console.error('Error fetching customer service earnings:', error);
    // 开发环境下返回默认数据
    if (process.env.NODE_ENV === 'development') {
      return {
        totalEarnings: 0,
        availableBalance: 0,
        todayEarnings: 0,
        monthEarnings: 0,
        todayWorkHours: 0,
        processedOrders: 0,
        hourlyRate: 20
      };
    }
    throw error;
  }
};

// 获取客服提现记录
export const getCustomerServiceWithdrawals = async (): Promise<{ success: boolean; data: CustomerServiceWithdrawalRecord[] }> => {
  try {
    const data = await get<any>('/customer-service/withdrawal/records');
    
    if (data.success && data.data) {
      const withdrawals = data.data.map((item: any) => ({
        id: item.id,
        amount: Number(item.amount || 0),
        status: item.status || 'pending',
        description: item.description || '',
        created_at: item.created_at,
        updated_at: item.updated_at,
        processed_at: item.processed_at,
        processed_by_name: item.processed_by_name,
        reject_reason: item.reject_reason,
        approval_notes: item.approval_notes
      }));
      
      // 前端额外去重保护：按金额、状态、创建时间去重
      const uniqueWithdrawals = withdrawals.filter((record, index, self) => {
        return index === self.findIndex(r => 
          r.amount === record.amount && 
          r.status === record.status && 
          r.created_at === record.created_at
        );
      });
      
      return {
        success: true,
        data: uniqueWithdrawals
      };
    }
    
    return {
      success: true,
      data: []
    };
  } catch (error) {
    console.error('Error fetching customer service withdrawals:', error);
    // 开发环境下返回空数组
    if (process.env.NODE_ENV === 'development') {
      return {
        success: true,
        data: []
      };
    }
    throw error;
  }
};

// 创建客服提现申请
export const createCustomerServiceWithdrawal = async (
  request: CustomerServiceWithdrawalRequest
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const data = await post<any>('/customer-service/withdrawal', request);
    
    if (data.success) {
      return {
        success: true,
        data: data.withdrawal
      };
    } else {
      return {
        success: false,
        error: data.error || '提现申请失败'
      };
    }
  } catch (error) {
    console.error('Error creating customer service withdrawal:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '提现申请失败，请重试'
    };
  }
};