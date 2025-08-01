// JWT工具函数
export interface JWTPayload {
  id: number;
  phone_num: string;
  role: string;
  iat: number;
  exp: number;
}

// 从JWT token中解析用户信息
export const parseJWT = (token: string): JWTPayload | null => {
  try {
    // JWT token格式: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // 解码payload部分
    const payload = parts[1];
    const decoded = atob(payload);
    return JSON.parse(decoded) as JWTPayload;
  } catch (error) {
    console.error('Error parsing JWT:', error);
    return null;
  }
};

// 获取当前用户ID
export const getCurrentUserId = (): number | null => {
  const token = localStorage.getItem('token');
  if (!token) {
    return null;
  }

  const payload = parseJWT(token);
  return payload?.id || null;
};

// 检查token是否过期
export const isTokenExpired = (token: string): boolean => {
  const payload = parseJWT(token);
  if (!payload) {
    return true;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
};

// 获取当前用户角色
export const getCurrentUserRole = (): string | null => {
  const token = localStorage.getItem('token');
  if (!token) {
    return null;
  }

  const payload = parseJWT(token);
  return payload?.role || null;
};