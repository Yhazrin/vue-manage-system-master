import { createContext } from "react";

export const AuthContext = createContext({
  isAuthenticated: false,
  userRole: null as 'user' | 'player' | 'admin' | null,
  setIsAuthenticated: (value: boolean, role?: 'user' | 'player' | 'admin') => {},
  logout: () => {},
});