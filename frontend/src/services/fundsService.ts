import { get, post } from '@/services/api';
import { API_BASE_URL } from '@/config/api';

// 定义提现记录接口
export interface WithdrawalRecord {
  id: string;
  amount: number;
  date: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
}

// 定义收益数据接口
export interface EarningsData {
  date: string;
  earnings: number;
}

// 定义资金概览接口
export interface FundsOverview {
  availableBalance: number;
  monthlyEarnings: number;
  totalWithdrawals: number;
  withdrawalCount: number;
}

// 获取资金概览
export const getFundsOverview = async (): Promise<FundsOverview> => {
  try {
    // 尝试从统计API获取数据
    const response = await fetch(`${API_BASE_URL}/statistics/player/${localStorage.getItem('userId') || '1'}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        // 计算可用余额 = 总收入 - 已提现金额
        const availableBalance = (data.total_earnings || 0) - (data.total_withdrawn || 0);
        
        return {
          availableBalance: Math.max(0, availableBalance), // 确保不为负数
          monthlyEarnings: data.monthlyIncome || 0,
          totalWithdrawals: data.total_withdrawn || 0,
          withdrawalCount: data.withdrawalCount || 0 // 这个字段后端可能没有，使用默认值
        };
      }
    }
  } catch (error) {
    console.error('Error fetching funds data from API:', error);
  }
  
  // 返回模拟数据
  return {
    availableBalance: 2580.50,
    monthlyEarnings: 1250.00,
    totalWithdrawals: 8900.00,
    withdrawalCount: 12
  };
};

// 获取收益趋势数据 (暂时返回模拟数据，因为后端没有这个API)
export const getEarningsTrend = async (days: number = 30): Promise<EarningsData[]> => {
  // 生成模拟的收益趋势数据
  const mockData: EarningsData[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    mockData.push({
      date: date.toISOString().split('T')[0],
      earnings: Math.random() * 200 + 50 // 50-250之间的随机收益
    });
  }
  
  return Promise.resolve(mockData);
};

// 获取提现记录
export const getWithdrawalRecords = async (): Promise<WithdrawalRecord[]> => {
  try {
    const response = await get<any>('/withdrawals');
    
    // 转换后端数据格式为前端需要的格式
    if (response.success && response.withdrawals) {
      return response.withdrawals.map((item: any) => ({
        id: item.withdrawal_id || item.id,
        amount: item.amount,
        date: item.created_at || item.date,
        status: item.status === '待审核' ? 'pending' : 
                item.status === '已批准' ? 'approved' : 
                item.status === '已支付' ? 'paid' : 'rejected'
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching withdrawal records:', error);
    // 返回模拟数据
    return [
      {
        id: '1',
        amount: 500,
        date: '2024-01-15',
        status: 'paid'
      },
      {
        id: '2', 
        amount: 300,
        date: '2024-01-10',
        status: 'approved'
      }
    ];
  }
};

// 申请提现
export const requestWithdrawal = async (amount: number): Promise<WithdrawalRecord> => {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    throw new Error('用户未登录');
  }
  
  const response = await post<any>('/withdrawals', { 
    withdrawal_id: `WD${Date.now()}`,
    player_id: parseInt(userId),
    amount 
  });
  
  if (response.success) {
    return {
      id: response.withdrawal_id,
      amount,
      date: new Date().toISOString(),
      status: 'pending'
    };
  }
  
  throw new Error('提现申请失败');
};

export interface RecentEarning {
  orderId: string;
  gameName: string;
  amount: number;
  date: string;
}

// 获取最近订单收益 (暂时返回模拟数据，因为后端没有这个具体API)
export const getRecentEarnings = async (limit: number = 10): Promise<RecentEarning[]> => {
  // 返回模拟的最近收益数据
  const mockEarnings: RecentEarning[] = [
    {
      orderId: 'ORD001',
      gameName: '王者荣耀',
      amount: 120,
      date: '2024-01-15 14:30'
    },
    {
      orderId: 'ORD002',
      gameName: '英雄联盟',
      amount: 80,
      date: '2024-01-15 10:15'
    },
    {
      orderId: 'ORD003',
      gameName: '和平精英',
      amount: 150,
      date: '2024-01-14 20:45'
    }
  ];
  
  return Promise.resolve(mockEarnings.slice(0, limit));
};