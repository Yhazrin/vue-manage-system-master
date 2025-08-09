import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { AuthContext } from '@/contexts/authContext';
import { cn } from '@/lib/utils';
import { login, LoginRequest } from '@/services/authService';

type Role = 'user' | 'player' | 'admin' | 'customer_service';
type LoginMode = 'user' | 'admin'; // 用户端模式 vs 管理端模式

// 角色主题配置
const roleThemes = {
  user: {
    primary: '#6366f1',
    secondary: '#8b5cf6', 
    accent: '#06b6d4',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#0f172a',
    border: '#e2e8f0',
    gradientFrom: '#6366f1',
    gradientTo: '#8b5cf6'
  },
  player: {
    primary: '#10b981',
    secondary: '#06b6d4',
    accent: '#f59e0b',
    background: '#f0fdf4',
    surface: '#ffffff',
    text: '#065f46',
    border: '#d1fae5',
    gradientFrom: '#10b981',
    gradientTo: '#06b6d4'
  },
  admin: {
    primary: '#4f46e5',
    secondary: '#6366f1',
    accent: '#8b5cf6',
    background: '#0f172a', 
    surface: '#1e293b',
    text: '#f1f5f9',
    border: '#334155',
    gradientFrom: '#4f46e5',
    gradientTo: '#6366f1'
  },
  customer_service: {
    primary: '#059669',
    secondary: '#0891b2',
    accent: '#0d9488',
    background: '#0f1419',
    surface: '#1f2937',
    text: '#f9fafb',
    border: '#374151',
    gradientFrom: '#059669',
    gradientTo: '#0891b2'
  }
};

// Login form schema
const loginSchema = z.object({
  identifier: z.string().refine(
    (val) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val) || /^1[3-9]\d{9}$/.test(val),
    { message: '请输入有效的手机号' }
  ),
  password: z.string().min(6, { message: '密码至少6个字符' }),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [activeRole, setActiveRole] = useState<Role>('user');
  const [loginMode, setLoginMode] = useState<LoginMode>('user'); // 用户端 vs 管理端
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();
  const { setIsAuthenticated } = useContext(AuthContext);

  // 根据登录模式获取可用角色
  const getAvailableRoles = (mode: LoginMode): Role[] => {
    return mode === 'user' ? ['user', 'player'] : ['admin', 'customer_service'];
  };

  // 切换登录模式
  const toggleLoginMode = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      const newMode = loginMode === 'user' ? 'admin' : 'user';
      setLoginMode(newMode);
      const availableRoles = getAvailableRoles(newMode);
      setActiveRole(availableRoles[0]); // 设置为新模式的第一个角色
      setIsTransitioning(false);
    }, 150);
  };

  // 鼠标位置追踪
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // 应用角色主题
  useEffect(() => {
    const theme = roleThemes[activeRole];
    
    // 安全检查，确保theme存在
    if (!theme) {
      console.warn(`Theme not found for role: ${activeRole}`);
      return;
    }
    
    // 设置CSS变量
    Object.entries(theme).forEach(([key, value]) => {
      if (key !== 'gradientFrom' && key !== 'gradientTo') {
        document.documentElement.style.setProperty(`--theme-${key}`, value);
      }
    });
    
    // 设置渐变背景变量
    document.documentElement.style.setProperty('--gradient-from', theme.gradientFrom);
    document.documentElement.style.setProperty('--gradient-to', theme.gradientTo);
    
    // 添加角色类到body
    document.body.className = `theme-${activeRole} mode-${loginMode}`;
  }, [activeRole, loginMode]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setError('');
      
      const loginRequest: LoginRequest = {
        identifier: data.identifier,
        password: data.password,
        role: activeRole,
      };
      
      const response = await login(loginRequest);
      
      if (response.success && response.data) {
        // 存储token和用户信息
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('userId', response.data.user.id.toString());
        
        // Set authentication with selected role, 传递用户信息
        setIsAuthenticated(true, activeRole, response.data.user);
        
        // Show login success notification
        const welcomeMessages = {
          user: "欢迎来到游戏陪玩平台！开始寻找您喜爱的游戏陪玩吧！",
          player: "欢迎回来，陪玩！查看您的工作台和最新订单。",
          admin: "欢迎回来，管理员！查看平台数据和管理控制台。",
          customer_service: "欢迎回来，客服！查看客户服务工作台。"
        };
        
        toast.success("登录成功", {
          description: welcomeMessages[activeRole],
          position: "bottom-right",
          duration: 5000,
        });
        
        // Redirect to role-specific home page after login with 1 second delay
        setTimeout(() => {
          switch(activeRole) {
            case 'admin':
              // 所有管理员都重定向到概览页面
              navigate('/admin/overview');
              break;
            case 'player':
              navigate('/player/orders');
              break;
            case 'customer_service':
              navigate('/customer-service/dashboard');
              break;
            default:
              navigate('/user/dashboard');
          }
        }, 1000);
      } else {
        // 检查是否是封禁错误
        if (response.message && response.message.includes('账号已被封禁')) {
          navigate('/banned');
          return;
        }
        setError(response.message || '登录失败，请检查您的账号和密码');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      // 检查是否是封禁错误
      if (err.response && err.response.status === 403 && 
          err.response.data && err.response.data.message && 
          err.response.data.message.includes('账号已被封禁')) {
        navigate('/banned');
        return;
      }
      setError('登录失败，请检查网络连接或稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 login-container">
      {/* 动态背景 */}
      <div className="absolute inset-0 bg-theme-background">
        {/* 流动的渐变背景 */}
        <div className="absolute inset-0 opacity-30">
          <div 
            className="absolute top-0 -left-4 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl animate-blob transition-transform duration-1000 ease-out"
            style={{
              background: `linear-gradient(45deg, var(--gradient-from), var(--gradient-to))`,
              animationDelay: '0s',
              transform: `translate(${mousePosition.x * 0.05}px, ${mousePosition.y * 0.05}px)`
            }}
          ></div>
          <div 
            className="absolute top-0 -right-4 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000 transition-transform duration-1000 ease-out"
            style={{
              background: `linear-gradient(45deg, var(--gradient-to), var(--gradient-from))`,
              animationDelay: '2s',
              transform: `translate(${-mousePosition.x * 0.04}px, ${mousePosition.y * 0.06}px)`
            }}
          ></div>
          <div 
            className="absolute -bottom-8 left-20 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000 transition-transform duration-1000 ease-out"
            style={{
              background: `linear-gradient(45deg, var(--gradient-from), var(--gradient-to))`,
              animationDelay: '4s',
              transform: `translate(${mousePosition.x * 0.03}px, ${-mousePosition.y * 0.04}px)`
            }}
          ></div>
        </div>
        
        {/* 响应式浮动粒子效果 */}
        <div className="absolute inset-0">
          {[...Array(12)].map((_, i) => {
            const baseLeft = Math.random() * 100;
            const baseTop = Math.random() * 100;
            const mouseInfluence = 0.005;
            return (
              <div
                key={`login-particle-${i}`}
                className="absolute w-1.5 h-1.5 rounded-full opacity-10 animate-float transition-transform duration-1000 ease-out"
                style={{
                  backgroundColor: i % 2 === 0 ? 'var(--gradient-from)' : 'var(--gradient-to)',
                  left: `${baseLeft}%`,
                  top: `${baseTop}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${4 + Math.random() * 3}s`,
                  transform: `translate(${(mousePosition.x - 50) * mouseInfluence}px, ${(mousePosition.y - 50) * mouseInfluence}px)`
                }}
              ></div>
            );
          })}
        </div>
        
        {/* 鼠标跟随光晕效果 */}
        <div 
          className="absolute w-64 h-64 rounded-full opacity-5 pointer-events-none transition-all duration-500 ease-out"
          style={{
            background: `radial-gradient(circle, var(--gradient-from) 0%, transparent 60%)`,
            left: `${mousePosition.x}%`,
            top: `${mousePosition.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
        ></div>
      </div>

      {/* 主要内容 */}
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
           <div className="text-theme-primary font-bold text-2xl flex items-center justify-center mb-2">
            <img src="favicon.png" alt="VITA Icon" className="w-8 h-8 mr-2" />
           Vita
          </div>
          <h1 className="text-2xl font-bold text-theme-text">欢迎回来</h1>
          <p className="text-theme-text/70">请选择身份并登录您的账号</p>
        </div>
        
        <div className={`bg-theme-surface/80 backdrop-blur-lg rounded-xl shadow-2xl border border-theme-border/50 overflow-hidden transition-all duration-500 hover:shadow-3xl relative ${isTransitioning ? 'scale-98 opacity-90' : 'scale-100 opacity-100'}`}>

          {/* Role Tabs */}
          <div className="border-b border-theme-border relative role-tab-container">
            <div className="flex relative">
              {/* 滑动指示器 */}
              <div 
                className="absolute bottom-0 h-0.5 bg-theme-primary transition-all duration-700 ease-out rounded-full"
                style={{
                  width: '50%',
                  transform: `translateX(${
                    getAvailableRoles(loginMode).indexOf(activeRole) * 100
                  }%)`,
                  boxShadow: '0 0 3px var(--theme-primary)'
                }}
              ></div>
              
              {/* 滑动背景 */}
              <div 
                className="absolute inset-y-0 bg-theme-primary/8 transition-all duration-700 ease-out rounded-t-lg"
                style={{
                  width: '50%',
                  transform: `translateX(${
                    getAvailableRoles(loginMode).indexOf(activeRole) * 100
                  }%)`,
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              ></div>
              
              {/* 动态渲染角色标签 */}
              {getAvailableRoles(loginMode).map((role) => {
                const roleLabels = {
                  user: '用户',
                  player: '游戏陪玩',
                  admin: '管理员',
                  customer_service: '客服'
                };
                
                return (
                  <button
                    key={role}
                    onClick={() => setActiveRole(role)}
                    disabled={isTransitioning}
                    className={`flex-1 py-3 text-sm font-medium transition-all duration-300 relative z-10 role-tab-button disabled:opacity-50 ${
                      activeRole === role 
                        ? 'text-theme-primary' 
                        : 'text-theme-text/70 hover:text-theme-text'
                    }`}
                  >
                    {roleLabels[role]}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Login Form */}
          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                {error?.message || String(error)}
              </div>
            )}
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-theme-text mb-1">
                  手机号
                </label>
                <input
                  type="text"
                  {...register('identifier')}
                  className={cn(
                    "w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary bg-theme-surface text-theme-text",
                    errors.identifier ? "border-red-300" : "border-theme-border"
                  )}
                  placeholder="手机号"
                />
                {errors.identifier && (
                  <p className="mt-1 text-sm text-red-600">{errors.identifier.message}</p>
                )}
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-theme-text">
                    密码
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-theme-primary hover:text-theme-primary/80"
                  >
                  </Link>
                </div>
                <input
                  type="password"
                  {...register('password')}
                  className={cn(
                    "w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary bg-theme-surface text-theme-text",
                    errors.password ? "border-red-300" : "border-theme-border"
                  )}
                  placeholder="请输入密码"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
              
              {/* Role-specific additional fields could go here */}
              {/* {activeRole === 'player' && (
                <div className="text-xs text-theme-text/70 bg-theme-primary/10 p-3 rounded-lg">
                  <i className="fa-info-circle mr-1"></i> 作为陪玩，登录后您可以设置您的服务内容和价格
                </div>
              )}
              
              {activeRole === 'admin' && (
                <div className="text-xs text-theme-text/70 bg-yellow-500/10 p-3 rounded-lg">
                  <i className="fa-info-circle mr-1"></i> 管理员账号可以管理平台用户和内容
                </div>
              )} */}
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-theme-primary text-white font-medium rounded-lg text-sm hover:bg-theme-primary/90 focus:outline-none focus:ring-2 focus:ring-theme-primary/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? '登录中...' : '登录'}
              </button>
            </form>
            
            {/* 注册链接 - 在管理端模式时淡出 */}
            <div 
              className={`mt-6 text-center text-sm text-theme-text/70 transition-all duration-500 ease-in-out ${
                loginMode === 'admin' 
                  ? 'opacity-0 transform translate-y-2 pointer-events-none' 
                  : 'opacity-100 transform translate-y-0 pointer-events-auto'
              }`}
            >
              <p>
                还没有账号?{' '}
                <Link
                  to="/register"
                  className="font-medium text-theme-primary hover:text-theme-primary/80"
                >
                  立即注册
                </Link>
              </p>
            </div>
          </div>
          
          {/* 模式切换按钮 - 放在卡片右下角 */}
          <div className="absolute bottom-4 right-4 z-20">
            <button
              onClick={toggleLoginMode}
              disabled={isTransitioning}
              className="mode-toggle-btn px-3 py-1.5 text-xs font-medium rounded-full bg-theme-primary/10 text-theme-primary border border-theme-primary/20 hover:bg-theme-primary/20 transition-all duration-300 disabled:opacity-50"
            >
              {loginMode === 'user' ? '管理端' : '用户端'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}