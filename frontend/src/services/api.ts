// API基础配置
import { API_BASE_URL } from '@/config/api';
import { toast } from 'sonner';

// 请求头配置
const getHeaders = (isFormData: boolean = false) => {
  const headers: HeadersInit = {};
  
  // 只有在非FormData时才设置Content-Type
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  
  // 添加认证token
  const token = localStorage.getItem('token');
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
};

// 基础请求函数
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // 检查是否是FormData请求
  const isFormData = options.body instanceof FormData;
  const headers = getHeaders(isFormData);
  
  // 如果是FormData，不要设置Content-Type，让浏览器自动设置
  const finalHeaders = isFormData 
    ? { Authorization: headers.Authorization } 
    : { ...headers, ...options.headers };
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: finalHeaders,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      
      // 详细记录400错误信息
      if (response.status === 400) {
        console.error('400 Bad Request 详细信息:', {
          url,
          method: options.method || 'GET',
          requestBody: options.body,
          responseData: errorData,
          headers: finalHeaders
        });
      }
      
      const errorMessage = errorData?.message || errorData?.error || `API请求失败: ${response.status}`;
      
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
      
      throw new Error(errorMessage);
    }
    
    // 处理空响应
    if (response.status === 204) {
      return {} as T;
    }
    
    return await response.json();
  } catch (error) {
    console.error('API请求错误:', error);
    throw error;
  }
};

// GET请求
export const get = <T>(endpoint: string, options?: RequestInit) => {
  return apiRequest<T>(endpoint, {
    method: 'GET',
    ...options,
  });
};

// POST请求
export const post = <T>(endpoint: string, data?: any, options?: RequestInit) => {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
    ...options,
  });
};

// PUT请求
export const put = <T>(endpoint: string, data?: any, options?: RequestInit) => {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
    ...options,
  });
};

// PATCH请求
export const patch = <T>(endpoint: string, data?: any, options?: RequestInit) => {
  return apiRequest<T>(endpoint, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });
};

// DELETE请求
export const del = <T>(endpoint: string, options?: RequestInit) => {
  return apiRequest<T>(endpoint, {
    method: 'DELETE',
    ...options,
  });
};

export default { get, post, put, patch, delete: del };