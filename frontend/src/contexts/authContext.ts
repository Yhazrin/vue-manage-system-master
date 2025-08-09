import { createContext, useContext } from "react";

export interface UserInfo {
  id: number;
  [key: string]: any;
}

export const AuthContext = createContext({
  isAuthenticated: false,
  userRole: null as 'user' | 'player' | 'admin' | 'customer_service' | null,
  userInfo: null as UserInfo | null,
  setIsAuthenticated: (value: boolean, role?: 'user' | 'player' | 'admin' | 'customer_service', userInfo?: UserInfo) => {},
  logout: () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};