// 认证相关的工具函数
import { toast } from 'sonner';

export interface AuthCheckResult {
  isValid: boolean;
  shouldRedirect: boolean;
  message?: string;
}

/**
 * 检查用户认证状态
 * @param isAuthenticated 认证状态
 * @param requireAuth 是否需要认证
 * @returns 认证检查结果
 */
export const checkAuthStatus = (
  isAuthenticated: boolean, 
  requireAuth: boolean = true
): AuthCheckResult => {
  if (!requireAuth) {
    return { isValid: true, shouldRedirect: false };
  }

  if (!isAuthenticated) {
    return {
      isValid: false,
      shouldRedirect: true,
      message: '请先登录'
    };
  }

  const token = localStorage.getItem('token');
  if (!token) {
    return {
      isValid: false,
      shouldRedirect: true,
      message: '登录已过期，请重新登录'
    };
  }

  return { isValid: true, shouldRedirect: false };
};

/**
 * 处理API认证错误
 * @param error 错误对象
 * @param navigate 导航函数
 * @returns 是否是认证错误
 */
export const handleAuthError = (
  error: any, 
  navigate: (path: string) => void
): boolean => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  if (errorMessage.includes('401') || errorMessage.includes('未授权') || errorMessage.includes('Unauthorized')) {
    toast.error('登录已过期，请重新登录');
    clearAuthData();
    navigate('/login');
    return true;
  }
  
  return false;
};

/**
 * 清除认证数据
 */
export const clearAuthData = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('userRole');
  localStorage.removeItem('user');
};

/**
 * 检查token是否有效（简单检查）
 * @param token JWT token
 * @returns 是否有效
 */
export const isTokenValid = (token: string): boolean => {
  if (!token) return false;
  
  try {
    // 简单的JWT格式检查
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // 检查payload是否可以解析
    const payload = JSON.parse(atob(parts[1]));
    
    // 检查是否过期
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
};

/**
 * 获取token中的用户信息
 * @param token JWT token
 * @returns 用户信息或null
 */
export const getUserFromToken = (token: string): any | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
};