// 认证相关的API服务
import { API_BASE_URL } from '@/config/api';

export interface LoginRequest {
  identifier: string; // 邮箱或手机号
  password: string;
  role: 'user' | 'player' | 'admin';
}

export interface RegisterRequest {
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  nickname: string;
  role: 'user' | 'player';
  verificationCode: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: {
      id: string;
      nickname: string;
      email: string;
      phone: string;
      role: string;
      avatar: string;
    };
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data?: {
    userId: string;
  };
}

export interface SendVerificationCodeRequest {
  contact: string; // 邮箱或手机号
  type: 'email' | 'sms';
}

export interface SendVerificationCodeResponse {
  success: boolean;
  message: string;
}

// 登录
export async function login(request: LoginRequest): Promise<LoginResponse> {
  try {
    // 根据角色选择正确的API端点
    let endpoint = '';
    let requestBody: any = {};
    
    if (request.role === 'admin') {
      endpoint = `${API_BASE_URL}/managers/login`;
      requestBody = {
        phone_num: request.identifier,
        passwd: request.password
      };
    } else if (request.role === 'player') {
      endpoint = `${API_BASE_URL}/players/login`;
      requestBody = {
        phone_num: request.identifier,
        passwd: request.password
      };
    } else {
      endpoint = `${API_BASE_URL}/users/login`;
      requestBody = {
        phone_num: request.identifier,
        passwd: request.password
      };
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      return {
        success: true,
        message: '登录成功',
        data: {
          token: result.token,
          user: {
            id: result.user?.id || 'unknown',
            nickname: result.user?.name || '用户',
            email: result.user?.email || '',
            phone: result.user?.phone_num || request.identifier,
            role: request.role,
            avatar: result.user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + request.identifier,
          },
        },
      };
    } else {
      return {
        success: false,
        message: result.error || '登录失败',
      };
    }
  } catch (error) {
    console.error('Login API error:', error);
    
    // 开发环境下的模拟数据（作为后备）
    if (process.env.NODE_ENV === 'development') {
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 模拟登录验证
      const validCredentials = {
        'admin@example.com': { password: '123456', role: 'admin' },
        'player@example.com': { password: '123456', role: 'player' },
        'user@example.com': { password: '123456', role: 'user' },
        '13800138000': { password: '123456', role: 'admin' },
        '13800138001': { password: '123456', role: 'player' },
        '13800138002': { password: '123456', role: 'user' },
      };

      const credential = validCredentials[request.identifier as keyof typeof validCredentials];
      
      if (credential && credential.password === request.password && credential.role === request.role) {
        return {
          success: true,
          message: '登录成功',
          data: {
            token: 'mock_jwt_token_' + Date.now(),
            user: {
              id: 'user_' + Date.now(),
              nickname: request.role === 'admin' ? '系统管理员' : request.role === 'player' ? '游戏陪玩' : '普通用户',
              email: request.identifier.includes('@') ? request.identifier : 'user@example.com',
              phone: request.identifier.includes('@') ? '13800138000' : request.identifier,
              role: request.role,
              avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + request.identifier,
            },
          },
        };
      } else {
        return {
          success: false,
          message: '用户名、密码或角色不正确',
        };
      }
    }
    
    return {
      success: false,
      message: '网络错误，请稍后重试',
    };
  }
}

// 注册
export async function register(request: RegisterRequest): Promise<RegisterResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Register API error:', error);
    
    // 开发环境下的模拟数据
    if (process.env.NODE_ENV === 'development') {
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟注册验证
      if (request.password !== request.confirmPassword) {
        return {
          success: false,
          message: '两次输入的密码不一致',
        };
      }
      
      if (request.verificationCode !== '123456') {
        return {
          success: false,
          message: '验证码错误',
        };
      }
      
      // 模拟邮箱或手机号已存在的情况
      const existingAccounts = ['admin@example.com', 'player@example.com', '13800138000'];
      if (existingAccounts.includes(request.email) || existingAccounts.includes(request.phone)) {
        return {
          success: false,
          message: '该邮箱或手机号已被注册',
        };
      }
      
      return {
        success: true,
        message: '注册成功',
        data: {
          userId: 'user_' + Date.now(),
        },
      };
    }
    
    throw error;
  }
}

// 发送验证码 - 暂时移除，后端未实现
export async function sendVerificationCode(phoneNumber: string): Promise<{ success: boolean; message: string }> {
    // 模拟发送验证码
    return {
        success: true,
        message: '验证码已发送'
    };
}

// 登出 - 暂时移除，后端未实现
export async function logout(): Promise<{ success: boolean; message: string }> {
    // 清除本地存储的token
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    return {
        success: true,
        message: '登出成功'
    };
}

// 验证token - 暂时移除，后端未实现
export async function verifyToken(token: string): Promise<{ success: boolean; user?: any }> {
    // 简单的token验证逻辑
    if (token && token.length > 0) {
        return {
            success: true,
            user: { id: 1, name: 'Test User' }
        };
    }
    return {
        success: false
    };
}