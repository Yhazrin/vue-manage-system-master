import { get, post, put, del } from '@/services/api';

// 管理员接口
export interface Admin {
  id: string;
  username: string;
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