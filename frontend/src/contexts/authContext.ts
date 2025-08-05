import { createContext } from "react";

export interface UserInfo {
  id: number;
  authority?: number; // 管理员权限等级：1=超级管理员，2=客服，3=股东
  [key: string]: any;
}

export const AuthContext = createContext({
  isAuthenticated: false,
  userRole: null as 'user' | 'player' | 'admin' | null,
  userInfo: null as UserInfo | null,
  setIsAuthenticated: (value: boolean, role?: 'user' | 'player' | 'admin', userInfo?: UserInfo) => {},
  logout: () => {},
});