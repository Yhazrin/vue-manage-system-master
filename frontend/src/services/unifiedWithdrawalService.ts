// 统一提现服务 - 支持陪玩和客服提现
import { API_BASE_URL } from '@/config/api';
import { get, put } from './api';

// 统一提现申请接口
export interface UnifiedWithdrawalRequest {
  id: string;
  applicantType: 'player' | 'customer_service'; // 申请人类型
  applicantId: string;
  applicantName: string;
  applicantPhone?: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
  notes?: string;
  description?: string;
  alipayAccount?: string;
}

// 处理记录接口
export interface UnifiedProcessRecord {
  id: string;
  withdrawalId: string;
  withdrawalType: 'player' | 'customer_service';
  status: 'approved' | 'rejected' | 'completed';
  processedBy: string;
  processedAt: string;
  notes?: string;
}

// 获取统一提现申请列表
export const getUnifiedWithdrawalRequests = async (): Promise<UnifiedWithdrawalRequest[]> => {
  try {
    // 直接调用 /withdrawals 接口，它已经包含了所有的提现记录（陪玩+客服）
    const data = await get<any>('/withdrawals');
    
    if (data.success && data.withdrawals) {
      const allWithdrawals = data.withdrawals.map((item: any) => {
        // 根据 user_type 或者是否有 player_id/customer_service_id 来判断类型
        const isCustomerService = item.user_type === 'customer_service' || 
                                 (item.customer_service_id && !item.player_id);
        
        if (isCustomerService) {
          // 客服提现记录
          return {
            id: `cs_${item.withdrawal_id}`,
            applicantType: 'customer_service' as const,
            applicantId: item.customer_service_id?.toString() || '',
            applicantName: item.player_name || `客服${item.customer_service_id}`,
            applicantPhone: item.player_phone || '',
            amount: Number(item.amount || 0),
            status: item.status === '待审核' ? 'pending' : 
                    item.status === '已批准' ? 'approved' : 
                    item.status === '已拒绝' ? 'rejected' : 
                    item.status === '已完成' ? 'completed' : 'pending',
            createdAt: item.created_at,
            processedAt: item.processed_at || item.updated_at,
            processedBy: item.processed_by,
            notes: item.notes || '',
            description: '客服提现申请'
          };
        } else {
          // 陪玩提现记录
          return {
            id: `player_${item.withdrawal_id}`,
            applicantType: 'player' as const,
            applicantId: item.player_id?.toString() || '',
            applicantName: item.player_name || `陪玩${item.player_id}`,
            applicantPhone: item.player_phone || '',
            amount: Number(item.amount || 0),
            status: item.status === '待审核' ? 'pending' : 
                    item.status === '已批准' ? 'approved' : 
                    item.status === '已拒绝' ? 'rejected' : 
                    item.status === '已完成' ? 'completed' : 'pending',
            createdAt: item.created_at,
            processedAt: item.updated_at,
            processedBy: item.processed_by,
            notes: item.notes,
            description: '陪玩提现申请'
          };
        }
      });

      // 按创建时间排序
      allWithdrawals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return allWithdrawals;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching unified withdrawal requests:', error);
    // 开发环境下返回空数组
    if (process.env.NODE_ENV === 'development') {
      return [];
    }
    throw error;
  }
};

// 注意：getPlayerWithdrawals 和 getCustomerServiceWithdrawals 函数已被移除
// 现在统一使用 getUnifiedWithdrawalRequests 函数，它直接调用 /withdrawals 接口
// 避免了重复获取客服提现数据的问题

// 获取统一处理记录
export const getUnifiedProcessRecords = async (): Promise<UnifiedProcessRecord[]> => {
  try {
    // 这里可以根据需要实现统一的处理记录获取
    // 暂时返回空数组
    return [];
  } catch (error) {
    console.error('Error fetching unified process records:', error);
    return [];
  }
};

// 获取特定提现申请的处理记录
export const getUnifiedWithdrawalProcessRecords = async (
  withdrawalId: string, 
  withdrawalType: 'player' | 'customer_service'
): Promise<UnifiedProcessRecord[]> => {
  try {
    let endpoint = '';
    if (withdrawalType === 'player') {
      endpoint = `/withdrawals/${withdrawalId}/records`;
    } else {
      endpoint = `/customer-service/withdrawals/${withdrawalId}/records`;
    }

    const response = await get<any>(endpoint);
    
    if (response.success && response.records) {
      return response.records.map((item: any) => ({
        id: item.id,
        withdrawalId: item.withdrawalId || withdrawalId,
        withdrawalType,
        status: item.action === '提交申请' ? 'pending' :
                item.action === '批准申请' ? 'approved' :
                item.action === '拒绝申请' ? 'rejected' :
                item.action === '标记为已完成' ? 'completed' :
                item.action === '完成提现' ? 'completed' : 'pending',
        processedBy: item.operator || item.processedBy,
        processedAt: item.timestamp || item.processedAt,
        notes: item.notes || ''
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching unified withdrawal process records:', error);
    return [];
  }
};

// 批准陪玩提现申请
export const approvePlayerWithdrawal = async (
  withdrawalId: string, 
  notes?: string
): Promise<UnifiedWithdrawalRequest> => {
  try {
    const response = await put<any>(`/withdrawals/${withdrawalId}/status`, {
      status: '已批准',
      notes: notes || '审批通过'
    });
    
    if (response.success && response.withdrawal) {
      const item = response.withdrawal;
      return {
        id: item.withdrawal_id,
        applicantType: 'player',
        applicantId: item.player_id?.toString() || '',
        applicantName: item.player_name || `陪玩${item.player_id}`,
        applicantPhone: item.player_phone || '',
        amount: Number(item.amount || 0),
        status: 'approved',
        createdAt: item.created_at,
        processedAt: item.updated_at,
        processedBy: item.processed_by,
        notes: item.notes,
        description: '陪玩提现申请'
      };
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Error approving player withdrawal:', error);
    throw error;
  }
};

// 拒绝陪玩提现申请
export const rejectPlayerWithdrawal = async (
  withdrawalId: string, 
  notes: string
): Promise<UnifiedWithdrawalRequest> => {
  try {
    const response = await put<any>(`/withdrawals/${withdrawalId}/status`, {
      status: '已拒绝',
      notes
    });
    
    if (response.success && response.withdrawal) {
      const item = response.withdrawal;
      return {
        id: item.withdrawal_id,
        applicantType: 'player',
        applicantId: item.player_id?.toString() || '',
        applicantName: item.player_name || `陪玩${item.player_id}`,
        applicantPhone: item.player_phone || '',
        amount: Number(item.amount || 0),
        status: 'rejected',
        createdAt: item.created_at,
        processedAt: item.updated_at,
        processedBy: item.processed_by,
        notes: item.notes,
        description: '陪玩提现申请'
      };
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Error rejecting player withdrawal:', error);
    throw error;
  }
};

// 批准客服提现申请
export const approveCustomerServiceWithdrawal = async (
  withdrawalId: string, 
  notes?: string
): Promise<UnifiedWithdrawalRequest> => {
  try {
    const response = await put<any>(`/customer-service/withdrawals/${withdrawalId}/process`, {
      status: 'approved',
      notes: notes || '审批通过'
    });
    
    if (response.success) {
      // 重新获取更新后的记录
      const withdrawals = await getUnifiedWithdrawalRequests();
      const updatedWithdrawal = withdrawals.find(w => w.id === `cs_${withdrawalId}`);
      if (updatedWithdrawal) {
        return updatedWithdrawal;
      }
    }
    
    throw new Error('Failed to approve customer service withdrawal');
  } catch (error) {
    console.error('Error approving customer service withdrawal:', error);
    throw error;
  }
};

// 拒绝客服提现申请
export const rejectCustomerServiceWithdrawal = async (
  withdrawalId: string, 
  notes: string
): Promise<UnifiedWithdrawalRequest> => {
  try {
    const response = await put<any>(`/customer-service/withdrawals/${withdrawalId}/process`, {
      status: 'rejected',
      notes
    });
    
    if (response.success) {
      // 重新获取更新后的记录
      const withdrawals = await getUnifiedWithdrawalRequests();
      const updatedWithdrawal = withdrawals.find(w => w.id === `cs_${withdrawalId}`);
      if (updatedWithdrawal) {
        return updatedWithdrawal;
      }
    }
    
    throw new Error('Failed to reject customer service withdrawal');
  } catch (error) {
    console.error('Error rejecting customer service withdrawal:', error);
    throw error;
  }
};

// 完成客服提现申请（批准并标记为已完成）
export const completeCustomerServiceWithdrawal = async (
  withdrawalId: string, 
  notes?: string
): Promise<UnifiedWithdrawalRequest> => {
  try {
    const response = await put<any>(`/customer-service/withdrawals/${withdrawalId}/process`, {
      status: 'completed',
      notes: notes || '审批通过，已完成打款'
    });
    
    if (response.success) {
      // 重新获取更新后的记录
      const withdrawals = await getUnifiedWithdrawalRequests();
      const updatedWithdrawal = withdrawals.find(w => w.id === `cs_${withdrawalId}`);
      if (updatedWithdrawal) {
        return updatedWithdrawal;
      }
    }
    
    throw new Error('Failed to complete customer service withdrawal');
  } catch (error) {
    console.error('Error completing customer service withdrawal:', error);
    throw error;
  }
};

// 统一的获取提现申请函数（支持筛选）
export const getUnifiedWithdrawals = async (
  statusFilter: string = 'all',
  typeFilter: string = 'all'
): Promise<UnifiedWithdrawalRequest[]> => {
  try {
    let withdrawals = await getUnifiedWithdrawalRequests();
    
    // 状态筛选
    if (statusFilter !== 'all') {
      withdrawals = withdrawals.filter(w => w.status === statusFilter);
    }
    
    // 类型筛选
    if (typeFilter !== 'all') {
      withdrawals = withdrawals.filter(w => w.applicantType === typeFilter);
    }
    
    return withdrawals;
  } catch (error) {
    console.error('Error fetching unified withdrawals with filters:', error);
    return [];
  }
};

// 统一的批准提现申请函数
export const approveWithdrawal = async (
  withdrawalId: string,
  withdrawalType: 'player' | 'customer_service',
  notes?: string
): Promise<UnifiedWithdrawalRequest> => {
  // 提取真实的withdrawal ID（去除前缀）
  const realWithdrawalId = withdrawalId.replace(/^(player_|cs_)/, '');
  
  if (withdrawalType === 'player') {
    return approvePlayerWithdrawal(realWithdrawalId, notes);
  } else {
    return approveCustomerServiceWithdrawal(realWithdrawalId, notes);
  }
};

// 统一的拒绝提现申请函数
export const rejectWithdrawal = async (
  withdrawalId: string,
  withdrawalType: 'player' | 'customer_service',
  notes: string
): Promise<UnifiedWithdrawalRequest> => {
  // 提取真实的withdrawal ID（去除前缀）
  const realWithdrawalId = withdrawalId.replace(/^(player_|cs_)/, '');
  
  if (withdrawalType === 'player') {
    return rejectPlayerWithdrawal(realWithdrawalId, notes);
  } else {
    return rejectCustomerServiceWithdrawal(realWithdrawalId, notes);
  }
};