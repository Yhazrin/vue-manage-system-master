import { get, post, put, del } from '@/services/api';

// 管理员接口
export interface Admin {
  id: string;
  username: string;
  phone?: string;
  password?: string;
  role: 'super_admin' | 'shareholder' | 'customer_service';
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin?: string;
  operationCount: number;
}

// 管理员凭据接口（包含密码）
export interface AdminCredentials {
  id: string;
  username: string;
  name?: string; // 添加姓名字段
  phone?: string;
  password: string;
  role: 'super_admin' | 'shareholder' | 'customer_service';
  status: 'active' | 'inactive';
  createdAt: string;
}

// 操作日志接口
export interface OperationLog {
  id: string;
  adminId: string;
  adminName: string;
  adminRole: string;
  operation: string;
  module: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

// 创建管理员请求接口
export interface CreateAdminRequest {
  username: string;
  phone?: string;
  role: 'customer_service';
  password?: string;
}

// 更新管理员请求接口
export interface UpdateAdminRequest {
  status?: 'active' | 'inactive';
  role?: 'customer_service';
}

// 获取管理员列表
export const getAdmins = async (): Promise<Admin[]> => {
  return await get('/managers');
};

// 获取管理员账号密码（仅超级管理员）
export const getAdminCredentials = async (): Promise<AdminCredentials[]> => {
  return await get('/managers/credentials');
};

// 创建管理员
export const createAdmin = async (admin: CreateAdminRequest): Promise<Admin> => {
  return await post('/managers', admin);
};

// 更新管理员
export const updateAdmin = async (id: string, admin: UpdateAdminRequest): Promise<Admin> => {
  return await put(`/managers/${id}`, admin);
};

// 删除管理员
export const deleteAdmin = async (id: string): Promise<void> => {
  return await del(`/managers/${id}`);
};

// 切换管理员状态
export const toggleAdminStatus = async (id: string): Promise<Admin> => {
  return await put(`/managers/${id}/toggle-status`, {});
};

// 获取操作日志
export const getOperationLogs = async (): Promise<OperationLog[]> => {
  return await get('/managers/operation-logs');
};

// 根据管理员ID获取操作日志
export const getOperationLogsByAdminId = async (adminId: string): Promise<OperationLog[]> => {
  return await get(`/managers/operation-logs/admin/${adminId}`);
};

// 根据模块获取操作日志
export const getOperationLogsByModule = async (module: string): Promise<OperationLog[]> => {
  return await get(`/managers/operation-logs/module/${module}`);
};

// 根据日期范围获取操作日志
export const getOperationLogsByDateRange = async (startDate: string, endDate: string): Promise<OperationLog[]> => {
  return await get(`/managers/operation-logs/date-range?start=${startDate}&end=${endDate}`);
};

// 客服打卡记录接口
export interface AttendanceRecord {
  id: string;
  adminId: string;
  adminName: string;
  clockInTime: string;
  clockOutTime?: string;
  workDuration?: number; // 工作时长（分钟）
  date: string;
  status: 'working' | 'completed';
}

// 客服时薪设置接口
export interface CustomerServiceSalary {
  adminId: string;
  adminName: string;
  hourlyRate: number; // 时薪（元/小时）
  minimumSettlementHours?: number; // 最低结算时间（小时）
  monthlyHours?: number; // 本月工时
  monthlyEarnings?: number; // 本月收入
  updatedAt: string;
  updatedBy: string;
}

// 全局时薪设置接口
export interface GlobalHourlyRateSetting {
  id?: number;
  hourly_rate: number; // 全局时薪（元/小时）
  updated_by: string; // 更新者用户名
  created_at?: string;
  updated_at?: string;
}

// 获取客服打卡记录
export const getAttendanceRecords = async (): Promise<AttendanceRecord[]> => {
  return await get('/managers/attendance');
};

// 根据管理员ID获取打卡记录
export const getAttendanceRecordsByAdminId = async (adminId: string): Promise<AttendanceRecord[]> => {
  return await get(`/managers/attendance/admin/${adminId}`);
};

// 获取客服时薪设置
export const getCustomerServiceSalaries = async (): Promise<CustomerServiceSalary[]> => {
  return await get('/managers/salaries');
};

// 更新客服时薪
export const updateCustomerServiceSalary = async (adminId: string, hourlyRate: number, minimumSettlementHours?: number): Promise<CustomerServiceSalary> => {
  const payload: any = { hourlyRate };
  if (minimumSettlementHours !== undefined) {
    payload.minimumSettlementHours = minimumSettlementHours;
  }
  return await put(`/managers/salaries/${adminId}`, payload);
};

// 获取全局时薪设置
export const getGlobalHourlyRate = async (): Promise<GlobalHourlyRateSetting | null> => {
  try {
    const response = await get('/managers/global-hourly-rate');
    return response as GlobalHourlyRateSetting;
  } catch (error) {
    console.error('获取全局时薪设置失败:', error);
    return null;
  }
};

// 设置全局时薪
export const setGlobalHourlyRate = async (hourlyRate: number): Promise<void> => {
  return await post('/managers/global-hourly-rate', { hourly_rate: hourlyRate });
};

// 修改管理员密码（管理员管理页面使用）
export const updateAdminPassword = async (adminId: string, newPassword: string): Promise<void> => {
  return await put(`/managers/${adminId}/password`, { password: newPassword });
};