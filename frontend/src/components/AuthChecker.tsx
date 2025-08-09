import { useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import axios from 'axios';

const AuthChecker = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useContext(AuthContext);

  useEffect(() => {
    const checkUserStatus = async () => {
      // 如果用户已登录且不在封禁页面，检查用户状态
      if (isAuthenticated && location.pathname !== '/banned' && location.pathname !== '/login') {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            // 发送一个简单的认证请求来检查用户状态
            await axios.get('/api/users/auth/check', {
              headers: {
                Authorization: `Bearer ${token}`
              }
            });
          } catch (error: any) {
            // 如果返回403错误且包含封禁信息，重定向到封禁页面
            if (error.response && error.response.status === 403 && 
                error.response.data && error.response.data.message && 
                error.response.data.message.includes('账号已被封禁')) {
              logout(); // 清除本地存储的认证信息
              navigate('/banned');
            }
          }
        }
      }
    };

    checkUserStatus();
  }, [location.pathname, isAuthenticated, navigate, logout]);

  return null; // 这个组件不渲染任何内容
};

export default AuthChecker;