// 认证相关的API服务

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
      role: 'user' | 'player' | 'admin';
      avatar?: string;
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
  phone: string;
  type: 'register' | 'reset_password';
}

export interface SendVerificationCodeResponse {
  success: boolean;
  message: string;
}

// 登录
export async function login(request: LoginRequest): Promise<LoginResponse> {
  try {
    const response = await fetch('/api/auth/login', {
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
    console.error('Login API error:', error);
    
    // 开发环境下的模拟数据
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
    
    throw error;
  }
}

// 注册
export async function register(request: RegisterRequest): Promise<RegisterResponse> {
  try {
    const response = await fetch('/api/auth/register', {
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

// 发送验证码
export async function sendVerificationCode(request: SendVerificationCodeRequest): Promise<SendVerificationCodeResponse> {
  try {
    const response = await fetch('/api/auth/send-verification-code', {
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
    console.error('Send verification code API error:', error);
    
    // 开发环境下的模拟数据
    if (process.env.NODE_ENV === 'development') {
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        message: '验证码已发送，请查收短信（开发环境验证码：123456）',
      };
    }
    
    throw error;
  }
}

// 登出
export async function logout(): Promise<void> {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Logout API error:', error);
    
    // 开发环境下直接清除本地存储
    if (process.env.NODE_ENV === 'development') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return;
    }
    
    throw error;
  }
}

// 验证token
export async function verifyToken(token: string): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/verify-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Verify token API error:', error);
    
    // 开发环境下简单验证token格式
    if (process.env.NODE_ENV === 'development') {
      return token.startsWith('mock_jwt_token_');
    }
    
    return false;
  }
}