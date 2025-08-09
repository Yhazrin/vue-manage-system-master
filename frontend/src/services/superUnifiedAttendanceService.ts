import { API_BASE_URL } from '../config/api';

export interface SuperUnifiedAttendanceRecord {
  id: number;
  customer_service_id: number;
  customer_service_name: string;
  clock_in_time: string | null;
  clock_out_time: string | null;
  work_hours: number;
  date: string;
  status: 'not_clocked' | 'clocked_in' | 'clocked_out';
  earnings?: number;
  hourly_rate?: number;
  available_balance?: number;
  total_earnings?: number;
}

export interface SuperUnifiedAttendanceStatus {
  status: 'not_clocked' | 'clocked_in' | 'clocked_out';
  todayRecord?: SuperUnifiedAttendanceRecord;
}

export interface SuperUnifiedCustomerServiceInfo {
  id: number;
  username: string;
  name: string;
  hourly_rate: number;
  available_balance: number;
  frozen_balance: number;
  total_earnings: number;
  today_status: string;
  today_clock_in_time: string | null;
  today_clock_out_time: string | null;
  today_work_hours: number;
  today_earnings: number;
  total_work_hours: number;
  total_work_days: number;
  withdrawal_pending_amount: number;
  last_withdrawal_time: string | null;
}

class SuperUnifiedAttendanceService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // 获取当前客服ID（从localStorage或其他地方获取）
  private getCurrentCustomerServiceId(): number {
    // 从localStorage获取用户信息
    const userInfo = localStorage.getItem('user');
    if (userInfo) {
      try {
        const parsed = JSON.parse(userInfo);
        if (parsed.id) {
          return parsed.id;
        }
      } catch (error) {
        console.error('解析用户信息失败:', error);
      }
    }
    
    // 如果没有用户信息，尝试从userId获取
    const userId = localStorage.getItem('userId');
    if (userId) {
      const id = parseInt(userId, 10);
      if (!isNaN(id)) {
        return id;
      }
    }
    
    console.warn('无法获取当前客服ID，请确保已正确登录');
    throw new Error('无法获取当前客服ID，请重新登录');
  }

  // 获取客服完整信息
  async getCustomerServiceInfo(): Promise<SuperUnifiedCustomerServiceInfo> {
    try {
      const customerId = this.getCurrentCustomerServiceId();
      const response = await fetch(`${API_BASE_URL}/super-unified/customer-service/${customerId}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`获取客服信息失败: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return data.data;
      }
      
      throw new Error(data.message || '获取客服信息失败');
    } catch (error) {
      console.error('获取客服信息失败:', error);
      throw error;
    }
  }

  // 获取今日考勤状态
  async getTodayStatus(): Promise<SuperUnifiedAttendanceStatus> {
    try {
      const customerInfo = await this.getCustomerServiceInfo();
      
      const status: SuperUnifiedAttendanceStatus = {
        status: customerInfo.today_status as 'not_clocked' | 'clocked_in' | 'clocked_out',
        todayRecord: customerInfo.today_clock_in_time ? {
          id: customerInfo.id,
          customer_service_id: customerInfo.id,
          customer_service_name: customerInfo.name,
          clock_in_time: customerInfo.today_clock_in_time,
          clock_out_time: customerInfo.today_clock_out_time,
          work_hours: customerInfo.today_work_hours,
          hourly_rate: customerInfo.hourly_rate,
          earnings: customerInfo.today_earnings,
          available_balance: customerInfo.available_balance,
          total_earnings: customerInfo.total_earnings,
          status: customerInfo.today_status as 'not_clocked' | 'clocked_in' | 'clocked_out',
          date: new Date().toISOString().split('T')[0]
        } : undefined
      };
      
      return status;
    } catch (error) {
      console.error('获取考勤状态失败:', error);
      throw error;
    }
  }

  // 上班打卡
  async clockIn(): Promise<SuperUnifiedAttendanceRecord> {
    try {
      const customerId = this.getCurrentCustomerServiceId();
      const response = await fetch(`${API_BASE_URL}/super-unified/clock-in`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ customerId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `上班打卡失败: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // 重新获取客服信息以获取最新状态
        const customerInfo = await this.getCustomerServiceInfo();
        
        return {
          id: customerInfo.id,
          customer_service_id: customerInfo.id,
          customer_service_name: customerInfo.name,
          clock_in_time: customerInfo.today_clock_in_time,
          clock_out_time: customerInfo.today_clock_out_time,
          work_hours: customerInfo.today_work_hours,
          hourly_rate: customerInfo.hourly_rate,
          earnings: customerInfo.today_earnings,
          available_balance: customerInfo.available_balance,
          total_earnings: customerInfo.total_earnings,
          status: customerInfo.today_status as 'not_clocked' | 'clocked_in' | 'clocked_out',
          date: new Date().toISOString().split('T')[0]
        };
      }
      
      throw new Error(data.message || '上班打卡失败');
    } catch (error) {
      console.error('上班打卡失败:', error);
      throw error;
    }
  }

  // 下班打卡
  async clockOut(): Promise<SuperUnifiedAttendanceRecord> {
    try {
      const customerId = this.getCurrentCustomerServiceId();
      const response = await fetch(`${API_BASE_URL}/super-unified/clock-out`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ customerId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `下班打卡失败: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // 重新获取客服信息以获取最新状态
        const customerInfo = await this.getCustomerServiceInfo();
        
        return {
          id: customerInfo.id,
          customer_service_id: customerInfo.id,
          customer_service_name: customerInfo.name,
          clock_in_time: customerInfo.today_clock_in_time,
          clock_out_time: customerInfo.today_clock_out_time,
          work_hours: customerInfo.today_work_hours,
          hourly_rate: customerInfo.hourly_rate,
          earnings: customerInfo.today_earnings,
          available_balance: customerInfo.available_balance,
          total_earnings: customerInfo.total_earnings,
          status: customerInfo.today_status as 'not_clocked' | 'clocked_in' | 'clocked_out',
          date: new Date().toISOString().split('T')[0]
        };
      }
      
      throw new Error(data.message || '下班打卡失败');
    } catch (error) {
      console.error('下班打卡失败:', error);
      throw error;
    }
  }

  // 获取历史记录
  async getHistoryRecords(limit: number = 50): Promise<any[]> {
    try {
      const customerId = this.getCurrentCustomerServiceId();
      const response = await fetch(`${API_BASE_URL}/super-unified/customer-service/${customerId}/history?limit=${limit}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`获取历史记录失败: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return data.data || [];
      }
      
      throw new Error(data.message || '获取历史记录失败');
    } catch (error) {
      console.error('获取历史记录失败:', error);
      throw error;
    }
  }

  // requestWithdrawal方法已移除，避免重复提现申请
  // 请使用 withdrawalService.createCustomerServiceWithdrawal 进行提现申请

  // 格式化时间
  formatTime(timeString: string | null): string {
    if (!timeString) return '--:--:--';
    
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('zh-CN', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      return '--:--:--';
    }
  }

  // 格式化工作时长
  formatWorkHours(hours: number): string {
    if (!hours || hours <= 0) return '00:00:00';
    
    // 精确到分钟级别，与后端计算保持一致
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
  }

  // 获取状态文本
  getStatusText(status: string): string {
    switch (status) {
      case 'not_clocked':
        return '未打卡';
      case 'clocked_in':
        return '工作中';
      case 'clocked_out':
        return '已下班';
      default:
        return '未知状态';
    }
  }

  // 重置今日打卡状态 - 已移除，投入生产使用
  // 生产环境不提供重置功能

  // 获取考勤记录（兼容旧接口）
  async getAttendanceRecords(page: number = 1, limit: number = 10): Promise<{ records: SuperUnifiedAttendanceRecord[]; total: number }> {
    try {
      const records = await this.getHistoryRecords(limit);
      return {
        records: records.map(record => ({
          id: record.id,
          customer_service_id: record.customer_service_id,
          customer_service_name: record.customer_service_name || record.name,
          clock_in_time: record.clock_in_time,
          clock_out_time: record.clock_out_time,
          work_hours: record.work_hours || 0,
          date: record.date || record.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          status: record.status || (record.clock_out_time ? 'clocked_out' : (record.clock_in_time ? 'clocked_in' : 'not_clocked')),
          earnings: record.earnings || 0,
          hourly_rate: record.hourly_rate,
          available_balance: record.available_balance,
          total_earnings: record.total_earnings
        })),
        total: records.length
      };
    } catch (error) {
      console.error('获取考勤记录失败:', error);
      return { records: [], total: 0 };
    }
  }

  // 格式化日期
  formatDate(dateString: string | null): string {
    if (!dateString) return '--';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return '--';
    }
  }

  // 获取状态颜色
  getStatusColor(status: string): string {
    switch (status) {
      case 'not_clocked':
        return '#8c8c8c';
      case 'clocked_in':
        return '#52c41a';
      case 'clocked_out':
        return '#1890ff';
      default:
        return '#8c8c8c';
    }
  }
}

export default new SuperUnifiedAttendanceService();