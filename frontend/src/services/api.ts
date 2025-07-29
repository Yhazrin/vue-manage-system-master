// API基础配置
import { API_BASE_URL } from '@/config/api';

// 请求头配置
const getHeaders = () => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
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
  const headers = getHeaders();
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `API请求失败: ${response.status}`);
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
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });
};

// PUT请求
export const put = <T>(endpoint: string, data?: any, options?: RequestInit) => {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
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

export default { get, post, put, delete: del };