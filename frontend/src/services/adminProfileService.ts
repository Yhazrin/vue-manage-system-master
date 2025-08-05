// 管理员个人资料相关的API服务
import { API_BASE_URL } from '@/config/api';

// 管理员资料接口定义
export interface AdminProfileData {
  id: string;
  nickname: string;
  uid: string;
  avatar: string;
  role: string;
  permissions: string[];
  joinDate: string;
  lastLogin: string;
  loginCount: number;
  lastLoginIp: string;
  tenureDuration: number; // 任职时长（年）
}

// 管理员操作日志接口
export interface AdminLog {
  id: string;
  operation: string;
  module: string;
  time: string;
  ip: string;
  details?: string;
  status: 'success' | 'failed';
}

export interface UpdateAdminProfileRequest {
  nickname?: string;
  avatar?: string;
}

export interface ChangeAdminPasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateAdminPasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// 获取管理员资料
export const getAdminProfile = async (): Promise<AdminProfileData> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ 从后端获取的真实管理员资料:', data);
    
    return data;
  } catch (error) {
    console.error('❌ 获取管理员资料失败:', error);
    throw error;
  }
};

// 更新管理员资料
export const updateAdminProfile = async (data: UpdateAdminProfileRequest): Promise<AdminProfileData> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to update admin profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating admin profile:', error);
    
    // 开发环境下的模拟
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 模拟更新成功，返回更新后的数据
      const currentProfile = await getAdminProfile();
      return {
        ...currentProfile,
        ...data,
        lastLogin: new Date().toISOString().slice(0, 19).replace('T', ' ')
      };
    }
    
    throw error;
  }
};

// 修改管理员密码
export const changeAdminPassword = async (data: ChangeAdminPasswordRequest): Promise<void> => {
  try {
    if (data.newPassword !== data.confirmPassword) {
      throw new Error('新密码和确认密码不匹配');
    }

    const response = await fetch(`${API_BASE_URL}/admin/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to change password');
    }
  } catch (error) {
    console.error('Error changing admin password:', error);
    
    // 开发环境下的模拟
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟密码验证
      if (data.currentPassword !== 'adminpassword') {
        throw new Error('当前密码不正确');
      }
      
      return;
    }
    
    throw error;
  }
};

// 更新管理员密码（用于安全设置页面）
export const updateAdminPassword = async (data: UpdateAdminPasswordRequest): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/managers/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '密码修改失败');
    }
  } catch (error: any) {
    console.error('Error updating admin password:', error);
    
    // 开发环境下的模拟
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟密码验证
      if (data.currentPassword !== 'admin123') {
        throw new Error('当前密码不正确');
      }
      
      if (data.newPassword.length < 6) {
        throw new Error('新密码长度至少为6位');
      }
      
      return;
    }
    
    throw error;
  }
};

// 获取管理员操作日志
export const getAdminOperationLogs = async (params: {
  page?: number;
  limit?: number;
  module?: string;
  startDate?: string;
  endDate?: string;
} = {}): Promise<{
  logs: AdminLog[];
  total: number;
  page: number;
  limit: number;
}> => {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.module) queryParams.append('module', params.module);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    const response = await fetch(`${API_BASE_URL}/admin/operation-logs?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch operation logs');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching operation logs:', error);
    
    // 开发环境下的模拟数据
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockLogs: AdminLog[] = [
        { 
          id: "LOG001", 
          operation: "订单状态修改", 
          module: "订单管理", 
          time: "2024-01-15 10:45:00", 
          ip: "192.168.1.101",
          details: "修改订单 #12345 状态为已完成",
          status: 'success'
        },
        { 
          id: "LOG002", 
          operation: "新增客服账号", 
          module: "权限管理", 
          time: "2024-01-15 09:15:00", 
          ip: "192.168.1.100",
          details: "创建客服账号 CS001",
          status: 'success'
        },
        { 
          id: "LOG003", 
          operation: "提现申请处理", 
          module: "提现管理", 
          time: "2024-01-14 16:30:00", 
          ip: "192.168.1.100",
          details: "审批提现申请 #WD789",
          status: 'success'
        },
        { 
          id: "LOG004", 
          operation: "数据导出", 
          module: "统计分析", 
          time: "2024-01-13 14:20:00", 
          ip: "192.168.1.100",
          details: "导出用户数据报表",
          status: 'success'
        },
        { 
          id: "LOG005", 
          operation: "用户封禁", 
          module: "用户管理", 
          time: "2024-01-12 19:10:00", 
          ip: "192.168.1.100",
          details: "封禁用户 #US12345",
          status: 'success'
        }
      ];
      
      // 根据模块筛选
      let filteredLogs = mockLogs;
      if (params.module) {
        filteredLogs = filteredLogs.filter(log => log.module === params.module);
      }
      
      const page = params.page || 1;
      const limit = params.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      return {
        logs: filteredLogs.slice(startIndex, endIndex),
        total: filteredLogs.length,
        page,
        limit
      };
    }
    
    throw error;
  }
};

// 获取管理员权限列表
export const getAdminPermissions = async (): Promise<{
  permissions: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
  }>;
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/permissions`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch admin permissions');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching admin permissions:', error);
    
    // 开发环境下的模拟数据
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return {
        permissions: [
          { id: 'user_management', name: '用户管理', description: '管理用户账户和信息', category: '用户' },
          { id: 'order_management', name: '订单管理', description: '管理订单和交易', category: '订单' },
          { id: 'financial_management', name: '财务管理', description: '管理财务和支付', category: '财务' },
          { id: 'system_settings', name: '系统设置', description: '管理系统配置', category: '系统' },
          { id: 'permission_management', name: '权限管理', description: '管理管理员权限', category: '权限' },
          { id: 'data_statistics', name: '数据统计', description: '查看和导出统计数据', category: '数据' }
        ]
      };
    }
    
    throw error;
  }
};