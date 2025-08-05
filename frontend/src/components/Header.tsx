import { cn } from "@/lib/utils";
import NotificationDropdown from './NotificationDropdown';
import { useContext, useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from '@/contexts/authContext';
import { useTheme } from '@/hooks/useTheme';
import type { ThemeColors } from '@/hooks/useTheme';

export default function Header() {
  const { isAuthenticated, userRole, logout, userInfo } = useContext(AuthContext);
  const { 
    setThemeMode, 
    availableThemes, 
    lastPresetTheme,
    fontSize,
    setFontSizeMode,
    availableFontSizes,
    currentFontSizeConfig
  } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Role-specific navigation items
  const getNavItems = () => {
    switch(userRole) {
      case 'user':
            return [
             { label: '主页', path: '/', icon: '🏠' },
             { label: '大厅', path: '/lobby', icon: '🏢' },
             { label: '我的订单', path: '/user/orders', icon: '📝' },
             { label: '我的收藏', path: '/user/favorites', icon: '❤️' },
           ];
      case 'player':
         return [
           { label: '服务管理', path: '/player/services', icon: '⚙️' },
           { label: '订单管理', path: '/player/orders', icon: '📝' },
           { label: '资金提现', path: '/player/funds', icon: '💰' },
           { label: '陪玩指导', path: '/player/guide', icon: '📋' },
         ];
           case 'admin':
              // 检查是否为客服（authority = 2）
              if (userInfo && userInfo.authority === 2) {
                // 客服只能访问这些页面，屏蔽提现管理
                return [
                  { label: '订单管理', path: '/admin/orders', icon: '📋' },
                  { label: '用户/陪玩管理', path: '/admin/users', icon: '👥' },
                  { label: '礼物管理', path: '/admin/gifts', icon: '🎁' },
                  { label: '上下班打卡', path: '/admin/attendance', icon: '⏰' },
                  { label: '收益提现', path: '/admin/customer-service-funds', icon: '💰' },
                ];
              } else {
                // 超级管理员和股东可以访问所有页面
                return [
                  { label: '数据概览', path: '/admin/overview', icon: '📊' },
                  { label: '订单管理', path: '/admin/orders', icon: '📋' },
                  { label: '用户/陪玩管理', path: '/admin/users', icon: '👥' },
                  { label: '礼物管理', path: '/admin/gifts', icon: '🎁' },
                  { label: '游戏管理', path: '/admin/games', icon: '🎮' },
                  { label: '提现管理', path: '/admin/withdrawals', icon: '💰' },
                  { label: '客服管理', path: '/admin/permissions', icon: '🔑' },
                //  { label: '通知管理', path: '/admin/notifications', icon: '🔔' },
                //label: '数据管理', path: '/admin/data-management', icon: '🗄️' },
                  { label: 'API监控', path: '/admin/api-monitor', icon: '📡' },
                  { label: 'API状态', path: '/admin/api-status', icon: '🔍' },
                ];
              }
      default:
        return [];
    }
  };
  
  // Get user initials for avatar
  const getUserInitials = () => {
    switch(userRole) {
      case 'user': return '用';
      case 'player': return '陪';
      case 'admin': return '管';
      default: return '未';
    }
  };

  // Check if current path is active
  const isActivePath = (path: string) => {
    return location.pathname === path;
  };
  
  return (
     <header className={`border-b border-theme-border sticky top-0 z-10 bg-theme-surface`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="text-theme-primary font-bold text-xl flex items-center">
              <img src="/favicon.png" alt="VITA Icon" className="w-8 h-8 mr-2" />
                     Vita
            </div>
          </div>
          
          {/* Navigation and User Menu */}
          {isAuthenticated && userRole ? (
            <div className="flex items-center space-x-6">
              {/* Role-specific Navigation */}
               <nav className="flex items-center space-x-8">
                 {getNavItems().map((item, index) => (
                   <Link 
                     key={index}
                     to={item.path}
                     className={cn(
                       "relative text-sm font-medium transition-all duration-300 flex items-center group",
                       isActivePath(item.path) 
                         ? "text-theme-primary" 
                         : "text-theme-text hover:text-theme-primary"
                     )}
                    >
                      {item.label}
                      {/* 下划线指示器 */}
                      <span 
                        className={cn(
                          "absolute -bottom-4 left-0 h-0.5 bg-theme-primary transition-all duration-300 ease-out",
                          isActivePath(item.path) 
                            ? "w-full opacity-100" 
                            : "w-0 opacity-0 group-hover:w-full group-hover:opacity-100"
                        )}
                      />
                    </Link>
                 ))}
               </nav>
              
               {/* Removed mobile menu button as per user request */}
              
               {/* Theme Toggle Button */}
                {/* <NotificationDropdown /> */}
                <button 
                  onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-theme-surface text-theme-text hover:bg-theme-primary/10 transition-colors focus:outline-none mr-2 border border-theme-border"
                  aria-label="Toggle theme"
                >
                  <i className="fa-solid fa-palette"></i>
                </button>
               
               {/* Theme Menu */}
               {isThemeMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-80 bg-theme-surface rounded-lg shadow-lg border border-theme-border z-10 animate-in fade-in slide-in-from-top-5 duration-150">
                    <div className="p-4 border-b border-theme-border">
                     <h3 className="font-semibold text-theme-text text-sm">主题设置</h3>
                   </div>
                   
                   <div className="p-4">
                     <h4 className="font-medium text-theme-text text-xs mb-3">预设主题</h4>
                      <div className="grid grid-cols-2 gap-2 mb-6">
                         {availableThemes.map(themeOption => (
                           <button
                             key={themeOption}
                             onClick={() => setThemeMode(themeOption)}
                              className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                                lastPresetTheme === themeOption 
                                  ? 'bg-theme-primary/20 text-theme-primary' 
                                 : 'bg-theme-background text-theme-text hover:bg-theme-primary/10'
                             }`}
                           >
                             {themeOption === 'light' && '浅色模式'}
                             {themeOption === 'dark' && '深色模式'}
                             {themeOption === 'cyberpunk' && '赛博朋克'}
                             {themeOption === 'pastel' && '淡雅风格'}
                           </button>
                         ))}
                      </div>

                      {/* 字体大小设置 */}
                      <div className="border-t border-theme-border pt-4">
                        <h4 className="font-medium text-theme-text text-xs mb-3 flex items-center">
                          <i className="fa-solid fa-font mr-2 text-theme-primary"></i>
                          字体大小
                        </h4>
                        <div className="space-y-2">
                          {availableFontSizes.map(fontSizeOption => (
                            <button
                              key={fontSizeOption}
                              onClick={() => setFontSizeMode(fontSizeOption)}
                              className={`w-full p-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between ${
                                fontSize === fontSizeOption 
                                  ? 'bg-theme-primary/20 text-theme-primary border border-theme-primary/30' 
                                  : 'bg-theme-background text-theme-text hover:bg-theme-primary/10 border border-transparent'
                              }`}
                            >
                              <span>
                                {fontSizeOption === 'small' && '小号字体'}
                                {fontSizeOption === 'medium' && '标准字体'}
                                {fontSizeOption === 'large' && '大号字体'}
                                {fontSizeOption === 'extra-large' && '超大字体'}
                              </span>
                              <span className="text-xs opacity-70">
                                {fontSizeOption === 'small' && '14px'}
                                {fontSizeOption === 'medium' && '16px'}
                                {fontSizeOption === 'large' && '18px'}
                                {fontSizeOption === 'extra-large' && '20px'}
                              </span>
                              {fontSize === fontSizeOption && (
                                <i className="fa-solid fa-check text-theme-primary ml-2"></i>
                              )}
                            </button>
                          ))}
                        </div>
                        

                      </div>
                        
                   </div>
                 </div>
               )}
               
               {/* User Avatar with Dropdown */}
               <div className="relative" ref={menuRef}>
                  <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-theme-primary/10 text-theme-primary font-medium hover:bg-theme-primary/20 transition-colors focus:outline-none border-2 border-white shadow-sm"
                    aria-label="User menu"
                  >
                    {getUserInitials()}
                 </button>
                
                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-theme-surface rounded-lg shadow-lg border border-theme-border z-20 animate-in fade-in slide-in-from-top-5 duration-150">
                    <div className="py-1">
                       <Link
                         to={userRole === 'user' ? '/user/profile' : userRole === 'player' ? '/player/profile' : '/admin/profile'}
                         className="block px-4 py-2 text-sm text-theme-text hover:bg-theme-primary/10 hover:text-theme-primary transition-colors"
                         onClick={() => setIsMenuOpen(false)}
                       >
                         <i className="fa-solid fa-user mr-2"></i>个人主页
                       </Link>
                      <button
                        onClick={() => {
                          logout();
                          setIsMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-theme-text hover:bg-theme-primary/10 hover:text-theme-primary transition-colors"
                      >
                        <i className="fa-solid fa-sign-out-alt mr-2"></i>退出登录
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-sm text-theme-text hover:text-theme-primary transition-colors">
                登录
              </Link>
              <Link 
                to="/register" 
                className="px-3 py-1.5 bg-theme-primary text-white text-xs font-semibold rounded hover:bg-theme-primary/80 transition-colors"
              >
                注册
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}