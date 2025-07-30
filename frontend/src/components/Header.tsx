import { cn } from "@/lib/utils";
import NotificationDropdown from './NotificationDropdown';
import { useContext, useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from '@/contexts/authContext';
import { useTheme } from '@/hooks/useTheme';
import type { ThemeColors } from '@/hooks/useTheme';

export default function Header() {
  const { isAuthenticated, userRole, logout } = useContext(AuthContext);
  const { setThemeMode, availableThemes, themeColors, updateCustomColor, lastPresetTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
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
           { label: '工作台', path: '/player/dashboard', icon: '📊' },
           { label: '服务管理', path: '/player/services', icon: '⚙️' },
           { label: '订单管理', path: '/player/orders', icon: '📝' },
           { label: '资金提现', path: '/player/funds', icon: '💰' },
           { label: '陪玩指导', path: '/player/guide', icon: '📋' },
         ];
           case 'admin':
              return [
                { label: '控制台', path: '/admin/dashboard', icon: '⚙️' },
                { label: '数据概览', path: '/admin/overview', icon: '📊' },
                { label: '统计分析', path: '/admin/statistics', icon: '📈' },
                { label: '订单管理', path: '/admin/orders', icon: '📋' },
                { label: '用户/陪玩管理', path: '/admin/users', icon: '👥' },
                { label: '礼物管理', path: '/admin/gifts', icon: '🎁' },
                { label: '提现管理', path: '/admin/withdrawals', icon: '💰' },
            { label: '权限管理', path: '/admin/permissions', icon: '🔑' },
            { label: '通知管理', path: '/admin/notifications', icon: '🔔' },
            { label: 'API监控', path: '/admin/api-monitor', icon: '📡' },
            { label: 'API状态', path: '/admin/api-status', icon: '🔍' },
          ];
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
  
  return (
     <header className={`border-b border-theme-border sticky top-0 z-10 ${
       themeColors.background === '#ffffff' ? 'bg-gray-100' : 
       themeColors.background === '#0f172a' ? 'bg-gray-800' : 
       themeColors.background === '#000000' ? 'bg-gray-900' : 
       'bg-gray-50'
     }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="text-theme-primary font-bold text-xl flex items-center">
              <span className="mr-2">🎮</span>
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
                     className="text-sm font-medium text-theme-text hover:text-theme-primary transition-colors flex items-center"
                    >
                      {item.label}
                    </Link>
                 ))}
               </nav>
              
               {/* Removed mobile menu button as per user request */}
              
               {/* Theme Toggle Button */}
                <NotificationDropdown />
                <button 
                  onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors focus:outline-none mr-2"
                  aria-label="Toggle theme"
                >
                  <i className="fa-solid fa-palette"></i>
                </button>
               
               {/* Theme Menu */}
               {isThemeMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-72 bg-white rounded-lg shadow-lg border border-gray-100 z-10 animate-in fade-in slide-in-from-top-5 duration-150">
                    <div className="p-4 border-b border-gray-100">
                     <h3 className="font-semibold text-gray-900 text-sm">主题设置</h3>
                   </div>
                   
                   <div className="p-4">
                     <h4 className="font-medium text-gray-900 text-xs mb-3">预设主题</h4>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                         {availableThemes.map(themeOption => (
                           <button
                             key={themeOption}
                             onClick={() => setThemeMode(themeOption)}
                              className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                                lastPresetTheme === themeOption 
                                  ? 'bg-purple-100 text-purple-700' 
                                 : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                             }`}
                           >
                             {themeOption === 'light' && '浅色模式'}
                             {themeOption === 'dark' && '深色模式'}
                             {themeOption === 'cyberpunk' && '赛博朋克'}
                             {themeOption === 'pastel' && '淡雅风格'}
                           </button>
                         ))}
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
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-20 animate-in fade-in slide-in-from-top-5 duration-150">
                    <div className="py-1">
                       <Link
                         to={userRole === 'user' ? '/user/profile' : userRole === 'player' ? '/player/profile' : '/admin/profile'}
                         className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-purple-600 transition-colors"
                         onClick={() => setIsMenuOpen(false)}
                       >
                         <i className="fa-solid fa-user mr-2"></i>个人主页
                       </Link>
                      <button
                        onClick={() => {
                          logout();
                          setIsMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-purple-600 transition-colors"
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
              <Link to="/login" className="text-sm text-gray-600 hover:text-purple-600 transition-colors">
                登录
              </Link>
              <Link 
                to="/register" 
                className="px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded hover:bg-purple-700 transition-colors"
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