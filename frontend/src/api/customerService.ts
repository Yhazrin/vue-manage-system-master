import { get, post, put, del } from '../services/api';

export interface CustomerServiceLoginData {
  phone_num: string;
  password: string;
}

export interface CustomerServiceInfo {
  id: number;
  username: string;
  name: string;
  phone_num: string;
  email?: string;
  photo_img?: string;
  status: number;
  created_at: string;
  last_login?: string;
  total_earnings?: number;
  plain_passwd?: string;
  name?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface EarningsData {
  totalEarnings: number;
  todayEarnings: number;
  monthlyEarnings: number;
  todayWorkHours: number;
  handledOrders: number;
  recentEarnings: any[];
}

export const customerServiceApi = {
  // 客服登录
  login: (data: CustomerServiceLoginData) => 
    post('/customer-service/login', data),

  // 获取个人资料
  getProfile: () => 
    get('/customer-service/profile'),

  // 更新个人资料
  updateProfile: (data: Partial<CustomerServiceInfo>) => 
    put('/customer-service/profile', data),

  // 修改密码
  changePassword: (data: ChangePasswordData) => 
    put('/customer-service/change-password', data),

  // 获取收益信息
  getEarnings: () => 
    get('/customer-service/earnings'),

  // 管理员相关接口
  admin: {
    // 创建客服
    createCustomerService: (data: any) => 
      post('/customer-service', data),

    // 获取客服列表
    getCustomerServiceList: (params?: any) => 
      get('/customer-service', { params }),

    // 更新客服状态
    updateCustomerServiceStatus: (id: number, status: boolean) => 
      put(`/customer-service/${id}/status`, { status }),

    // 更新客服权限
    updateCustomerServicePermissions: (id: number, permissions: string[]) => 
      put(`/customer-service/${id}/permissions`, { permissions }),

    // 删除客服
    deleteCustomerService: (id: number) => 
      del(`/customer-service/${id}`),

    // 管理员修改客服密码
    updateCustomerServicePassword: (id: number, password: string) => 
      put(`/customer-service/${id}/password`, { password }),
  }
};