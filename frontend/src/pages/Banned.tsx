import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Banned() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // 清除所有认证信息
    localStorage.removeItem('token');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    localStorage.removeItem('user');
    
    // 跳转到登录页
    navigate('/login');
  };

  const handleAppeal = () => {
    // 处理申请解封逻辑
    alert('申请解封功能暂未开放，请联系客服');
  };

  return (
    <div className="min-h-screen bg-theme-background flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-theme-surface rounded-lg shadow-lg p-8 text-center border border-theme-border">
        <div className="mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-ban text-red-600 text-2xl"></i>
          </div>
          <h1 className="text-2xl font-bold text-theme-text mb-2">账户已被封禁</h1>
          <p className="text-theme-text/70">您的账户因违反平台规定已被暂时封禁</p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-red-800 mb-2">封禁详情</h3>
          <div className="text-sm text-red-700 space-y-1">
            <p><span className="font-medium">封禁原因：</span>违反平台服务条款</p>
            <p><span className="font-medium">封禁时间：</span>2024年1月15日</p>
            <p><span className="font-medium">解封时间：</span>2024年2月15日</p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleAppeal}
            className="w-full py-2.5 px-4 bg-theme-primary text-white font-medium rounded-lg hover:bg-theme-primary/90 transition-colors"
          >
            申请解封
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-4 border border-theme-border text-theme-text font-medium rounded-lg hover:bg-theme-background transition-colors"
          >
            退出登录
          </button>
        </div>

        <div className="mt-6 text-xs text-theme-text/60">
          <p>如有疑问，请联系客服：400-123-4567</p>
        </div>
      </div>
    </div>
  );
}