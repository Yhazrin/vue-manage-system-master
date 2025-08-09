import { useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { Navigate } from 'react-router-dom';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'player' | 'admin' | 'customer_service';
}

export default function PermissionGuard({ 
  children, 
  requiredRole
}: PermissionGuardProps) {
  const { isAuthenticated, userRole } = useContext(AuthContext);

  // 检查是否已认证
  if (!isAuthenticated) {
    // 根据当前路径决定重定向到哪个登录页
    if (window.location.pathname.startsWith('/customer-service')) {
      return <Navigate to="/customer-service/login" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // 检查角色权限
  if (requiredRole && userRole !== requiredRole) {
    // 客服可以访问管理端页面
    if (requiredRole === 'admin' && userRole === 'customer_service') {
      // 允许客服访问管理端页面
    } else {
      // 根据当前路径决定重定向到哪个登录页
      if (window.location.pathname.startsWith('/customer-service')) {
        return <Navigate to="/customer-service/login" replace />;
      }
      return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
}