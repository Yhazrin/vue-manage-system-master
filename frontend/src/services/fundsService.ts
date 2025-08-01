import { get, post } from '@/services/api';
import { API_BASE_URL } from '@/config/api';
import { getCurrentUserId } from '@/utils/jwt';

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
    // 从JWT token中获取用户ID
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error('用户未登录或token无效');
    }

    // 尝试从统计API获取数据
    const response = await fetch(`${API_BASE_URL}/statistics/player/${userId}`, {
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
          monthlyEarnings: Number(data.monthlyIncome) || 0,
          totalWithdrawals: Number(data.total_withdrawn) || 0,
          withdrawalCount: Number(data.withdrawalCount) || 0 // 这个字段后端可能没有，使用默认值
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

// 获取收益趋势数据
export const getEarningsTrend = async (days: number = 30): Promise<EarningsData[]> => {
  try {
    // 获取陪玩的已完成订单
    const response = await fetch(`${API_BASE_URL}/orders/player?status=completed`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.orders) {
        // 按日期分组计算收益
        const earningsMap = new Map<string, number>();
        const today = new Date();
        
        // 初始化最近days天的数据
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          earningsMap.set(dateStr, 0);
        }
        
        // 计算每天的收益
        data.orders.forEach((order: any) => {
          if (order.created_at && order.amount) {
            const orderDate = new Date(order.created_at).toISOString().split('T')[0];
            if (earningsMap.has(orderDate)) {
              earningsMap.set(orderDate, (earningsMap.get(orderDate) || 0) + Number(order.amount));
            }
          }
        });
        
        // 转换为数组格式
        const result: EarningsData[] = [];
        earningsMap.forEach((earnings, date) => {
          result.push({ date, earnings });
        });
        
        return result.sort((a, b) => a.date.localeCompare(b.date));
      }
    }
  } catch (error) {
    console.error('Error fetching earnings trend:', error);
  }
  
  // 如果API调用失败，返回空数据
  const emptyData: EarningsData[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    emptyData.push({
      date: date.toISOString().split('T')[0],
      earnings: 0
    });
  }
  
  return emptyData;
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
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('用户未登录或token无效');
  }
  
  const response = await post<any>('/withdrawals', { 
    withdrawal_id: `WD${Date.now()}`,
    player_id: userId,
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

// 获取最近订单收益
export const getRecentEarnings = async (limit: number = 10): Promise<RecentEarning[]> => {
  try {
    // 获取陪玩的已完成订单
    const response = await fetch(`${API_BASE_URL}/orders/player?status=completed`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.orders) {
        // 按创建时间排序，取最近的订单
        const recentOrders = data.orders
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, limit);
        
        // 转换为前端需要的格式
        return recentOrders.map((order: any) => ({
          orderId: order.order_id,
          gameName: order.game_name || '游戏陪玩',
          amount: Number(order.amount || 0),
          date: new Date(order.created_at).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
        }));
      }
    }
  } catch (error) {
    console.error('Error fetching recent earnings:', error);
  }
  
  // 如果API调用失败，返回空数组
  return [];
};