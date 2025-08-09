import { API_BASE_URL } from '../config/api';

export interface AttendanceRecord {
  id: number;
  admin_id: number;
  admin_name: string;
  clock_in_time: string | null;
  clock_out_time: string | null;
  work_hours: number;
  date: string;
  status: 'not_clocked' | 'clocked_in' | 'clocked_out';
  created_at: string;
  updated_at: string;
  earnings?: number;
  hourly_rate?: number;
}

export interface AttendanceStatus {
  status: 'not_clocked' | 'clocked_in' | 'clocked_out';
  todayRecord?: AttendanceRecord;
}

export interface AttendanceStats {
  totalEarnings: number;
  attendanceDays: number;
  averageWorkHours: number;
}

export interface AttendanceResponse {
  records: AttendanceRecord[];
  total: number;
  stats: AttendanceStats;
}

class AttendanceService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // 获取今日考勤状态
  async getTodayStatus(): Promise<AttendanceStatus> {
    try {
      const response = await fetch(`${API_BASE_URL}/customer-service/attendance/status`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`获取考勤状态失败: ${response.status}`);
      }

      const data = await response.json();
      
      // 转换后端数据格式到前端期望的格式
      if (data.success) {
        const result: AttendanceStatus = {
          status: data.status,
          todayRecord: data.todayRecord ? {
            id: data.todayRecord.id,
            admin_id: data.todayRecord.customer_service_id,
            admin_name: data.todayRecord.customer_service_name,
            clock_in_time: data.todayRecord.clock_in_time,
            clock_out_time: data.todayRecord.clock_out_time,
            work_hours: data.todayRecord.work_duration ? data.todayRecord.work_duration / 60 : 0,
            hourly_rate: data.todayRecord.hourly_rate,
            earnings: data.todayRecord.total_earnings,
            status: data.todayRecord.status,
            date: data.todayRecord.created_at ? data.todayRecord.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
            created_at: data.todayRecord.created_at,
            updated_at: data.todayRecord.updated_at
          } : undefined
        };
        return result;
      }
      
      throw new Error('获取考勤状态失败');
    } catch (error) {
      console.error('获取考勤状态失败:', error);
      throw error;
    }
  }

  // 上班打卡
  async clockIn(): Promise<AttendanceRecord> {
    try {
      const response = await fetch(`${API_BASE_URL}/customer-service/attendance/check-in`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || `上班打卡失败: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return data.record;
      } else {
        throw new Error(data.message || '上班打卡失败');
      }
    } catch (error) {
      console.error('上班打卡失败:', error);
      throw error;
    }
  }

  // 下班打卡
  async clockOut(): Promise<AttendanceRecord> {
    try {
      const response = await fetch(`${API_BASE_URL}/customer-service/attendance/check-out`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || `下班打卡失败: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return data.record;
      } else {
        throw new Error(data.message || '下班打卡失败');
      }
    } catch (error) {
      console.error('下班打卡失败:', error);
      throw error;
    }
  }

  // 获取打卡记录
  async getAttendanceRecords(page: number = 1, pageSize: number = 10): Promise<AttendanceResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/customer-service/attendance/records?page=${page}&pageSize=${pageSize}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`获取打卡记录失败: ${response.status}`);
      }

      const data = await response.json();
      
      // 转换后端数据格式到前端期望的格式
      if (data.success && data.records) {
        const records = data.records.map((record: any) => ({
          id: record.id,
          admin_id: record.adminId || record.customerServiceId,
          admin_name: record.adminName || record.customerServiceName,
          clock_in_time: record.checkInTime,
          clock_out_time: record.checkOutTime,
          work_hours: record.workDuration ? record.workDuration / 60 : 0,
          hourly_rate: record.hourlyRate,
          earnings: record.totalEarnings,
          status: record.status,
          date: record.createdAt ? record.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
          created_at: record.createdAt,
          updated_at: record.updatedAt
        }));
        
        return {
          records,
          total: data.total || records.length,
          stats: data.stats || {
            totalEarnings: 0,
            averageWorkHours: 0,
            totalDays: 0
          }
        };
      }
      
      return {
        records: [],
        total: 0,
        stats: {
          totalEarnings: 0,
          averageWorkHours: 0,
          totalDays: 0
        }
      };
    } catch (error) {
      console.error('获取打卡记录失败:', error);
      throw error;
    }
  }

  // 管理员获取所有打卡记录
  async getAllAttendanceRecords(page: number = 1, pageSize: number = 10, startDate?: string, endDate?: string): Promise<AttendanceResponse> {
    try {
      // 使用正确的API端点
      let url = `${API_BASE_URL}/attendance/all-records?page=${page}&pageSize=${pageSize}`;
      
      if (startDate) {
        url += `&startDate=${startDate}`;
      }
      
      if (endDate) {
        url += `&endDate=${endDate}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`获取所有打卡记录失败: ${response.status}`);
      }

      const data = await response.json();
      
      // 转换后端数据格式到前端期望的格式
      if (data.records) {
        const records = data.records.map((record: any) => ({
          id: record.id || `${record.customer_service_id}_${record.date}`,
          admin_id: record.customer_service_id,
          admin_name: record.customer_service_name,
          clock_in_time: record.clock_in_time,
          clock_out_time: record.clock_out_time,
          work_hours: record.work_hours || 0,
          hourly_rate: record.hourly_rate || 20,
          earnings: record.total_earnings || 0,
          total_earnings: record.total_earnings || 0,
          status: record.status,
          date: record.date,
          created_at: record.created_at,
          updated_at: record.updated_at
        }));
        
        return {
          records,
          total: data.total || records.length,
          stats: data.stats || {
            totalEarnings: records.reduce((sum, r) => sum + (r.earnings || 0), 0),
            averageWorkHours: records.length > 0 ? records.reduce((sum, r) => sum + (r.work_hours || 0), 0) / records.length : 0,
            attendanceDays: records.length
          }
        };
      }
      
      return {
        records: [],
        total: 0,
        stats: {
          totalEarnings: 0,
          averageWorkHours: 0,
          attendanceDays: 0
        }
      };
    } catch (error) {
      console.error('获取所有打卡记录失败:', error);
      throw error;
    }
  }

  // 格式化时间显示
  formatTime(timeString: string | null): string {
    if (!timeString) return '--:--:--';
    try {
      const date = new Date(timeString);
      if (isNaN(date.getTime())) return '--:--:--';
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      return '--:--:--';
    }
  }

  // 格式化日期显示
  formatDate(dateString: string | null): string {
    if (!dateString) return '--';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '--';
      return date.toLocaleDateString('zh-CN');
    } catch (error) {
      return '--';
    }
  }

  // 计算工作时长（小时）
  calculateWorkHours(clockInTime: string | null, clockOutTime: string | null): number {
    if (!clockInTime || !clockOutTime) return 0;
    
    try {
      const startTime = new Date(clockInTime);
      const endTime = new Date(clockOutTime);
      
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) return 0;
      
      const diffMs = endTime.getTime() - startTime.getTime();
      return Math.max(0, diffMs / (1000 * 60 * 60)); // 转换为小时
    } catch (error) {
      return 0;
    }
  }
}

export default new AttendanceService();