import { get, post } from '@/services/api';
import { API_BASE_URL } from '@/config/api';
import { getCurrentUserId } from '@/utils/jwt';

// 定义提现记录接口
export interface WithdrawalRecord {
  id: string;
  amount: number;
  date: string;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
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
  pendingWithdrawals: number;
}

// 获取资金概览
export const getFundsOverview = async (): Promise<FundsOverview> => {
  try {
    let userId = getCurrentUserId();
    
    // 如果JWT解析失败，尝试从localStorage获取用户信息
    if (!userId) {
      const userStr = localStorage.getItem('user');
      if (userStr && userStr !== 'undefined' && userStr !== 'null') {
        try {
          const user = JSON.parse(userStr);
          userId = user.id;
        } catch (error) {
          console.error('Failed to parse user from localStorage:', error);
        }
      }
    }
    
    const token = localStorage.getItem('token');
    
    if (!userId || !token) {
      console.error('getFundsOverview - 用户未登录或token无效');
      throw new Error('用户未登录或token无效');
    }

    // 并行获取陪玩信息和统计数据
    const [playerResponse, statisticsResponse] = await Promise.all([
      // 获取陪玩基本信息（包含真实的money字段）
      fetch(`${API_BASE_URL}/players/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }),
      // 获取统计数据（用于月收入等信息）
      fetch(`${API_BASE_URL}/statistics/player/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
    ]);
    
    console.log('getFundsOverview - player response status:', playerResponse.status);
    console.log('getFundsOverview - statistics response status:', statisticsResponse.status);
    
    if (playerResponse.ok && statisticsResponse.ok) {
      const playerData = await playerResponse.json();
      const statisticsData = await statisticsResponse.json();
      
      console.log('getFundsOverview - player data:', playerData);
      console.log('getFundsOverview - statistics data:', statisticsData);
      
      if (playerData.player && statisticsData.success) {
        // 使用数据库中的真实余额（players.money字段）
        const availableBalance = Number(playerData.player.money || 0);
        const totalWithdrawn = Number(statisticsData.total_withdrawn || 0);
        const withdrawalCount = Number(statisticsData.withdrawal_count || 0);
        const pendingWithdrawals = Number(statisticsData.pending_withdrawals || 0);
        
        const result = {
          availableBalance: Math.max(0, availableBalance), // 使用数据库中的真实余额
          monthlyEarnings: Number(statisticsData.monthlyIncome || statisticsData.monthly_income || 0),
          totalWithdrawals: totalWithdrawn,
          withdrawalCount: withdrawalCount,
          pendingWithdrawals: pendingWithdrawals
        };
        
        console.log('getFundsOverview - returning real data with complete withdrawal info:', result);
        return result;
      } else {
        console.error('getFundsOverview - API returned invalid data');
        throw new Error('API返回无效数据');
      }
    } else {
      const playerError = playerResponse.ok ? null : await playerResponse.text();
      const statisticsError = statisticsResponse.ok ? null : await statisticsResponse.text();
      console.error('getFundsOverview - API request failed:', { playerError, statisticsError });
    }
  } catch (error) {
    console.error('Error fetching funds data from API:', error);
  }
  
  // 返回模拟数据
  console.log('getFundsOverview - returning mock data');
  return {
    availableBalance: 0,
    monthlyEarnings: 0,
    totalWithdrawals: 0,
    withdrawalCount: 0,
    pendingWithdrawals: 0
  };
};

// 获取收益趋势数据
export const getEarningsTrend = async (days: number = 7): Promise<EarningsData[]> => {
  try {
    let userId = getCurrentUserId();
    
    // 如果JWT解析失败，尝试从localStorage获取用户信息
    if (!userId) {
      const userStr = localStorage.getItem('user');
      if (userStr && userStr !== 'undefined' && userStr !== 'null') {
        try {
          const user = JSON.parse(userStr);
          userId = user.id;
        } catch (error) {
          console.error('Failed to parse user from localStorage:', error);
        }
      }
    }
    
    if (!userId) {
      throw new Error('用户未登录或token无效');
    }

    const token = localStorage.getItem('token');
    
    // 并行获取订单数据、礼物数据和抽成率配置
    const [ordersResponse, giftsResponse, commissionResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/orders/player?status=completed`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }),
      fetch(`${API_BASE_URL}/gift-records/player/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }),
      fetch(`${API_BASE_URL}/config/commission-rates`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
    ]);
    
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
    
    // 获取抽成率
    let orderCommissionRate = 10; // 默认10%，与后端统计API保持一致
    if (commissionResponse.ok) {
      const commissionData = await commissionResponse.json();
      if (commissionData.success) {
        orderCommissionRate = Number(commissionData.order_commission_rate || 10);
      }
    }
    
    // 处理订单收入
    if (ordersResponse.ok) {
      const orderData = await ordersResponse.json();
      if (orderData.success && orderData.orders) {
        orderData.orders.forEach((order: any) => {
          if (order.created_at && order.amount) {
            const orderDate = new Date(order.created_at).toISOString().split('T')[0];
            if (earningsMap.has(orderDate)) {
              const totalAmount = Number(order.amount);
              const platformFee = totalAmount * (orderCommissionRate / 100);
              const playerEarning = totalAmount - platformFee; // 陪玩实际收入
              earningsMap.set(orderDate, (earningsMap.get(orderDate) || 0) + playerEarning);
            }
          }
        });
      }
    }
    
    // 处理礼物收入（只计算已结算的礼物）
    if (giftsResponse.ok) {
      const giftData = await giftsResponse.json();
      if (giftData.success && giftData.records) {
        giftData.records
          .filter((gift: any) => gift.is_settled === 1) // 只计算已结算的礼物
          .forEach((gift: any) => {
            if (gift.created_at && gift.total_price && gift.platform_fee !== undefined) {
              const giftDate = new Date(gift.created_at).toISOString().split('T')[0];
              if (earningsMap.has(giftDate)) {
                // 陪玩实际收入 = 总价 - 平台抽成
                const playerEarning = Number(gift.total_price) - Number(gift.platform_fee || 0);
                earningsMap.set(giftDate, (earningsMap.get(giftDate) || 0) + playerEarning);
              }
            }
          });
      }
    }
    
    // 转换为数组格式
    const result: EarningsData[] = [];
    earningsMap.forEach((earnings, date) => {
      result.push({ date, earnings });
    });
    
    return result.sort((a, b) => a.date.localeCompare(b.date));
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
        amount: Number(item.amount) || 0,
        date: item.created_at || item.date,
        status: item.status === '待审核' ? 'pending' : 
                 item.status === '已批准' ? 'approved' : 
                 item.status === '已完成' ? 'completed' : 
                 item.status === '已拒绝' ? 'rejected' : 
                 item.status === 'pending' ? 'pending' :
                item.status === 'approved' ? 'approved' :
                item.status === 'completed' ? 'completed' :
                item.status === 'rejected' ? 'rejected' : 'pending'
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
        status: 'completed'
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
  let userId = getCurrentUserId();
  
  // 如果JWT解析失败，尝试从localStorage获取用户信息
  if (!userId) {
    const userStr = localStorage.getItem('user');
    if (userStr && userStr !== 'undefined' && userStr !== 'null') {
      try {
        const user = JSON.parse(userStr);
        userId = user.id;
      } catch (error) {
        console.error('Failed to parse user from localStorage:', error);
      }
    }
  }
  
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
  originalAmount: number;
  platformFee: number;
  commissionRate: number;
  date: string;
  type: 'order' | 'gift';
}

// 获取最近订单收益
export const getRecentEarnings = async (limit: number = 10): Promise<RecentEarning[]> => {
  try {
    let userId = getCurrentUserId();
    
    // 如果JWT解析失败，尝试从localStorage获取用户信息
    if (!userId) {
      const userStr = localStorage.getItem('user');
      if (userStr && userStr !== 'undefined' && userStr !== 'null') {
        try {
          const user = JSON.parse(userStr);
          userId = user.id;
        } catch (error) {
          console.error('Failed to parse user from localStorage:', error);
        }
      }
    }
    
    if (!userId) {
      throw new Error('用户未登录或token无效');
    }

    // 并行获取订单数据、礼物数据和抽成率配置
    const [ordersResponse, giftsResponse, commissionResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/orders/player?status=completed`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }),
      fetch(`${API_BASE_URL}/gift-records/player/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }),
      fetch(`${API_BASE_URL}/config/commission-rates`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
    ]);
    
    const allEarnings: RecentEarning[] = [];
    
    // 获取抽成率
    let orderCommissionRate = 10; // 默认10%
    let giftCommissionRate = 30; // 默认30%
    if (commissionResponse.ok) {
      const commissionData = await commissionResponse.json();
      if (commissionData.success) {
        orderCommissionRate = Number(commissionData.order_commission_rate || 10);
        giftCommissionRate = Number(commissionData.gift_commission_rate || 30);
      }
    }
    
    // 处理订单收益
    if (ordersResponse.ok) {
      const orderData = await ordersResponse.json();
      if (orderData.success && orderData.orders) {
        const orderEarnings = orderData.orders.map((order: any) => {
          const originalAmount = Number(order.amount || 0);
          const platformFee = originalAmount * (orderCommissionRate / 100);
          const playerEarning = originalAmount - platformFee; // 陪玩实际收入
          
          return {
            orderId: order.order_id,
            gameName: order.game_name || '游戏陪玩',
            amount: playerEarning,
            originalAmount: originalAmount,
            platformFee: platformFee,
            commissionRate: orderCommissionRate,
            date: new Date(order.created_at).toLocaleString('zh-CN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            }),
            type: 'order' as const,
            timestamp: new Date(order.created_at).getTime()
          };
        });
        allEarnings.push(...orderEarnings);
      }
    }
    
    // 处理礼物收益（只显示已结算的礼物）
    if (giftsResponse.ok) {
      const giftData = await giftsResponse.json();
      if (giftData.success && giftData.records) {
        const giftEarnings = giftData.records
          .filter((gift: any) => gift.is_settled === 1) // 只显示已结算的礼物
          .map((gift: any) => {
            const originalAmount = Number(gift.total_price || 0);
            const platformFee = Number(gift.platform_fee || 0);
            const playerEarning = originalAmount - platformFee; // 陪玩实际收入
            
            return {
              orderId: gift.order_id || `GIFT-${gift.id}`,
              gameName: `礼物收入 - ${gift.gift_name || '未知礼物'}`,
              amount: playerEarning,
              originalAmount: originalAmount,
              platformFee: platformFee,
              commissionRate: giftCommissionRate,
              date: new Date(gift.created_at).toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              }),
              type: 'gift' as const,
              timestamp: new Date(gift.created_at).getTime()
            };
          });
        allEarnings.push(...giftEarnings);
      }
    }
    
    // 按时间排序，取最近的记录
    return allEarnings
      .sort((a: any, b: any) => b.timestamp - a.timestamp)
      .slice(0, limit)
      .map(({ timestamp, ...earning }) => earning); // 移除timestamp字段，保留type字段
  } catch (error) {
    console.error('Error fetching recent earnings:', error);
  }
  
  // 如果API调用失败，返回空数组
  return [];
};