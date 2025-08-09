import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('userRole');
      window.location.href = '/customer-service/login';
    }
    return Promise.reject(error);
  }
);

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: any;
}

export interface CustomerServiceInfo {
  id: number;
  username: string;
  name: string;
  phone: string;
  email: string;
  avatar?: string;
  hourly_rate: number;
  status: 'active' | 'inactive';
  role: string;
  created_at: string;
  total_earnings?: number;
  total_work_hours?: number;
  processed_orders?: number;
}

export interface Order {
  id: number;
  user_id: number;
  player_id: number;
  game_id: number;
  service_type: string;
  duration: number;
  total_price: number;
  status: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    username: string;
    name: string;
  };
  player?: {
    id: number;
    username: string;
    name: string;
  };
  game?: {
    id: number;
    name: string;
  };
}

export const customerServiceApi = {
  // 登录
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    try {
      // 将前端的username字段映射为后端期望的phone_num字段
      const requestData = {
        phone_num: data.username,
        password: data.password
      };
      const response = await api.post('/customer-service/login', requestData);
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || '登录失败'
      };
    }
  },

  // 获取个人资料
  getProfile: async (): Promise<{ success: boolean; data?: CustomerServiceInfo; message?: string }> => {
    try {
      const response = await api.get('/customer-service/profile');
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || '获取个人资料失败'
      };
    }
  },

  // 更新个人资料
  updateProfile: async (data: Partial<CustomerServiceInfo>): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await api.put('/customer-service/profile', data);
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || '更新个人资料失败'
      };
    }
  },

  // 修改密码
  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await api.put('/customer-service/change-password', data);
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || '修改密码失败'
      };
    }
  },

  // 获取订单列表
  getOrders: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<{ success: boolean; data?: { orders: Order[]; total: number }; message?: string }> => {
    try {
      const response = await api.get('/customer-service/orders', { params });
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || '获取订单列表失败'
      };
    }
  },

  // 获取订单详情
  getOrderDetail: async (orderId: number): Promise<{ success: boolean; data?: Order; message?: string }> => {
    try {
      const response = await api.get(`/customer-service/orders/${orderId}`);
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || '获取订单详情失败'
      };
    }
  },

  // 处理订单
  processOrder: async (orderId: number, action: string, note?: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await api.post(`/customer-service/orders/${orderId}/process`, { action, note });
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || '处理订单失败'
      };
    }
  },

  // 获取工作台统计数据
  getDashboardStats: async (): Promise<{ success: boolean; data?: any; message?: string }> => {
    try {
      const response = await api.get('/customer-service/dashboard/stats');
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || '获取统计数据失败'
      };
    }
  },

  // 管理员接口
  admin: {
    // 获取客服列表
    getCustomerServiceList: async (): Promise<{ success: boolean; data?: CustomerServiceInfo[]; message?: string }> => {
      try {
        const response = await api.get('/customer-service');
        return response;
      } catch (error: any) {
        return {
          success: false,
          message: error.response?.data?.message || '获取客服列表失败'
        };
      }
    },

    // 创建客服
    createCustomerService: async (data: { username: string; name: string }): Promise<{ success: boolean; message?: string }> => {
      try {
        const response = await api.post('/customer-service', data);
        return response;
      } catch (error: any) {
        return {
          success: false,
          message: error.response?.data?.message || '创建客服失败'
        };
      }
    },

    // 删除客服
    deleteCustomerService: async (id: number): Promise<{ success: boolean; message?: string }> => {
      try {
        const response = await api.delete(`/customer-service/${id}`);
        return response;
      } catch (error: any) {
        return {
          success: false,
          message: error.response?.data?.message || '删除客服失败'
        };
      }
    },

    // 更新客服密码
    updateCustomerServicePassword: async (id: number, password: string): Promise<{ success: boolean; message?: string }> => {
      try {
        const response = await api.put(`/customer-service/${id}/password`, { password });
        return response;
      } catch (error: any) {
        return {
          success: false,
          message: error.response?.data?.message || '更新客服密码失败'
        };
      }
    },

    // 更新客服状态
    updateCustomerServiceStatus: async (id: number, status: string): Promise<{ success: boolean; message?: string }> => {
      try {
        const response = await api.put(`/customer-service/${id}/status`, { status });
        return response;
      } catch (error: any) {
        return {
          success: false,
          message: error.response?.data?.message || '更新客服状态失败'
        };
      }
    }
  }
};

export default customerServiceApi;