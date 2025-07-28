import { get, post } from '@/services/api';

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
  return get<FundsOverview>('/funds/overview');
};

// 获取收益趋势数据
export const getEarningsTrend = async (days: number = 30): Promise<EarningsData[]> => {
  return get<EarningsData[]>(`/funds/earnings-trend?days=${days}`);
};

// 获取提现记录
export const getWithdrawalRecords = async (): Promise<WithdrawalRecord[]> => {
  return get<WithdrawalRecord[]>('/funds/withdrawals');
};

// 申请提现
export const requestWithdrawal = async (amount: number): Promise<WithdrawalRecord> => {
  return post<WithdrawalRecord>('/funds/withdraw', { amount });
};

export interface RecentEarning {
  orderId: string;
  gameName: string;
  amount: number;
  date: string;
}

// 获取最近订单收益
export const getRecentEarnings = async (limit: number = 10): Promise<RecentEarning[]> => {
  return get<RecentEarning[]>(`/funds/recent-earnings?limit=${limit}`);
};