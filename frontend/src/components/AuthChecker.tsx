import { useEffect, useContext, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import axios from 'axios';

const AuthChecker = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, userRole, logout } = useContext(AuthContext);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkUserStatus = async () => {
      // 如果用户已登录且不在封禁页面和登录页面，检查用户状态
      if (isAuthenticated && location.pathname !== '/banned' && 
          !location.pathname.includes('/login')) {
        const token = localStorage.getItem('token');
        if (token && userRole) {
          try {
            // 根据用户角色选择不同的状态检查端点
            let checkEndpoint = '';
            switch (userRole) {
              case 'user':
              case 'player':
                checkEndpoint = '/api/users/auth/check';
                break;
              case 'customer_service':
                checkEndpoint = '/api/customer-service/auth/check';
                break;
              case 'admin':
                // 管理员暂时不需要状态检查，因为管理员不会被封禁
                return;
              default:
                return;
            }

            // 发送认证请求来检查用户状态
            await axios.get(checkEndpoint, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            });
          } catch (error: any) {
            console.log('AuthChecker检测到错误:', error.response?.data);
            // 如果返回403错误且包含封禁信息，重定向到封禁页面
            if (error.response && error.response.status === 403) {
              const errorMessage = error.response.data?.error || '';
              console.log('检测到403错误:', errorMessage);
              
              // 检查是否是封禁或禁用相关的错误
              if (errorMessage.includes('账号已被封禁') || 
                  errorMessage.includes('账户已被禁用') ||
                  errorMessage.includes('请联系管理员') ||
                  error.response.data?.banned === true) {
                console.log('检测到账户被禁用，重定向到封禁页面');
                logout(); // 清除本地存储的认证信息
                navigate('/banned');
              }
            }
          }
        }
      }
    };

    // 立即检查一次
    checkUserStatus();

    // 设置定时检查（每5秒检查一次）
    if (isAuthenticated && userRole && userRole !== 'admin') {
      intervalRef.current = setInterval(checkUserStatus, 5000);
    }

    // 清理定时器
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [location.pathname, isAuthenticated, userRole, navigate, logout]);

  return null; // 这个组件不渲染任何内容
};

export default AuthChecker;