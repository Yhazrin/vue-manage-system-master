import { toast } from 'sonner';

// 通用的fetch包装器，用于统一处理认证错误
export const fetchWrapper = async (url: string, options: RequestInit = {}): Promise<Response> => {
  // 自动添加认证头
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // 处理401认证错误
  if (response.status === 401) {
    console.warn('认证失败，清除本地认证数据');
    localStorage.removeItem('token');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    localStorage.removeItem('user');
    
    // 如果当前不在登录页，则跳转到登录页
    if (!window.location.pathname.includes('/login')) {
      toast.error('登录已过期，请重新登录');
      window.location.href = '/login';
    }
  }

  return response;
};

// 便捷方法
export const fetchJson = async <T = any>(url: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetchWrapper(url, options);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || errorData?.error || `请求失败: ${response.status}`);
  }

  return response.json();
};