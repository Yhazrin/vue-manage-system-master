// 认证相关的API服务
import { API_BASE_URL } from '@/config/api';
import { buildAvatarUrl } from '@/utils/imageUtils';

export interface LoginRequest {
  identifier: string; // 邮箱或手机号
  password: string;
  role: 'user' | 'player' | 'admin';
}

export interface RegisterRequest {
  name: string;
  phone_num: string;
  passwd: string;
  role?: string;
  photo_img?: string;
  // 陪玩注册的可选字段
  intro?: string;
  game_id?: number;
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
      // 角色映射：将后端的管理员角色统一映射为前端的 admin
      let mappedRole = request.role;
      if (request.role === 'admin') {
        // 对于管理员登录，无论后端返回什么角色（super_admin, customer_service等），都映射为 admin
        mappedRole = 'admin';
      }
      
      return {
        success: true,
        message: '登录成功',
        data: {
          token: result.token,
          user: {
            id: result.user?.id || result.user?.user_id || 'unknown',
            nickname: result.user?.name || result.user?.nickname || '用户',
            email: result.user?.email || '',
            phone: result.user?.phone_num || request.identifier,
            role: mappedRole, // 使用映射后的角色
            authority: result.user?.authority, // 添加权限等级字段
            avatar: buildAvatarUrl(result.user?.photo_img || result.user?.avatar),
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
        'admin@example.com': { password: 'abc123', role: 'admin' },
        'player@example.com': { password: 'abc123', role: 'player' },
        'user@example.com': { password: 'abc123', role: 'user' },
        '13800138000': { password: 'abc123', role: 'admin' },
        '13800138001': { password: 'abc123', role: 'player' },
        '13800138002': { password: 'abc123', role: 'user' },
      };

      const credential = validCredentials[request.identifier as keyof typeof validCredentials];
      
      if (credential && credential.password === request.password && credential.role === request.role) {
        // 为不同角色分配不同的数字ID
        let mockUserId = 1;
        if (request.role === 'admin') {
          mockUserId = 1;
        } else if (request.role === 'player') {
          mockUserId = 2;
        } else {
          mockUserId = 3;
        }
        
        return {
          success: true,
          message: '登录成功',
          data: {
            token: 'mock_jwt_token_' + Date.now(),
            user: {
              id: mockUserId,
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
    // 根据角色选择正确的API端点
    let endpoint = '';
    let requestBody: any = {};
    
    if (request.role === 'player') {
      // 陪玩注册
      endpoint = `${API_BASE_URL}/players/register`;
      requestBody = {
        name: request.name,
        phone_num: request.phone_num,
        passwd: request.passwd,
        // 陪玩可以有可选字段
        photo_img: request.photo_img || null,
        intro: request.intro || null,
        game_id: request.game_id || null
      };
    } else {
      // 普通用户注册
      endpoint = `${API_BASE_URL}/users/register`;
      requestBody = {
        name: request.name,
        phone_num: request.phone_num,
        passwd: request.passwd,
        role: request.role || 'user',
        photo_img: request.photo_img || null
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
      const errorData = await response.json();
      throw new Error(errorData.message || '注册失败');
    }

    const result = await response.json();
    
    if (result.success) {
      return {
        success: true,
        message: '注册成功',
        data: {
          userId: result.id?.toString() || 'unknown'
        }
      };
    } else {
      return {
        success: false,
        message: result.error || '注册失败'
      };
    }
  } catch (error) {
    console.error('Registration error:', error);
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