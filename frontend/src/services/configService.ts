// 平台配置相关的API服务
import { get, patch } from '@/services/api';

// 平台配置接口定义
export interface PlatformConfig {
  commission_rate: number;
}

// 分别的抽成率接口定义
export interface CommissionRates {
  order_commission_rate: number;
  gift_commission_rate: number;
}

// 获取平台提成率（保持向后兼容）
export const getCommissionRate = async (): Promise<number> => {
  try {
    const response = await get<{ success: boolean; commission_rate: number }>('/config/commission');
    if (response.success) {
      return response.commission_rate;
    }
    throw new Error('获取提成率失败');
  } catch (error) {
    console.error('获取平台提成率失败:', error);
    throw error;
  }
};

// 获取分别的抽成率
export const getCommissionRates = async (): Promise<CommissionRates> => {
  try {
    const response = await get<{ success: boolean; order_commission_rate: number; gift_commission_rate: number }>('/config/commission-rates');
    if (response.success) {
      return {
        order_commission_rate: response.order_commission_rate,
        gift_commission_rate: response.gift_commission_rate
      };
    }
    throw new Error('获取抽成率失败');
  } catch (error) {
    console.error('获取分别抽成率失败:', error);
    throw error;
  }
};

// 更新平台提成率（保持向后兼容）
export const updateCommissionRate = async (commissionRate: number): Promise<void> => {
  try {
    const response = await patch<{ success: boolean; message: string }>('/config/commission', {
      commission_rate: commissionRate
    });
    if (!response.success) {
      throw new Error(response.message || '更新提成率失败');
    }
  } catch (error) {
    console.error('更新平台提成率失败:', error);
    throw error;
  }
};

// 更新分别的抽成率
export const updateCommissionRates = async (rates: Partial<CommissionRates>): Promise<CommissionRates> => {
  try {
    const response = await patch<{ success: boolean; order_commission_rate: number; gift_commission_rate: number; message?: string }>('/config/commission-rates', rates);
    if (response.success) {
      return {
        order_commission_rate: response.order_commission_rate,
        gift_commission_rate: response.gift_commission_rate
      };
    }
    throw new Error(response.message || '更新抽成率失败');
  } catch (error) {
    console.error('更新分别抽成率失败:', error);
    throw error;
  }
};

// 获取平台趋势数据
export const getTrendData = async (timeRange: string = 'month', periods: number = 7): Promise<any> => {
  return get(`/statistics/trends?timeRange=${timeRange}&periods=${periods}`);
};