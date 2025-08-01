import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { cn } from '@/lib/utils';
import { login, LoginRequest } from '@/services/authService';

// Login form schema
const loginSchema = z.object({
  identifier: z.string().refine(
    (val) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val) || /^1[3-9]\d{9}$/.test(val),
    { message: '请输入有效的邮箱或手机号' }
  ),
  password: z.string().min(6, { message: '密码至少6个字符' }),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeRole, setActiveRole] = useState<'user' | 'player' | 'admin'>('user');
  const { setIsAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

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
        
        // Set authentication with selected role
        setIsAuthenticated(true, activeRole);
        
        // Show login success notification
        const welcomeMessages = {
          user: "欢迎来到游戏陪玩平台！开始寻找您喜爱的游戏陪玩吧！",
          player: "欢迎回来，陪玩！查看您的工作台和最新订单。",
          admin: "欢迎回来，管理员！查看平台数据和管理控制台。"
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
              navigate('/admin/dashboard');
              break;
            case 'player':
              navigate('/player/dashboard');
              break;
            default:
              navigate('/user/dashboard');
          }
        }, 1000);
      } else {
        setError(response.message || '登录失败，请检查您的账号和密码');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('登录失败，请检查网络连接或稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
           <div className="text-theme-primary font-bold text-2xl flex items-center justify-center mb-2">
            <img src="/VITA.png" alt="VITA Icon" className="w-8 h-8 mr-2" />
           Vita
          </div>
          <h1 className="text-2xl font-bold text-theme-text">欢迎回来</h1>
          <p className="text-theme-text/70">请选择身份并登录您的账号</p>
        </div>
        
        <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border overflow-hidden">
          {/* Role Tabs */}
          <div className="border-b border-theme-border">
            <div className="flex">
              <button
                onClick={() => setActiveRole('user')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeRole === 'user' 
                    ? 'text-theme-primary border-b-2 border-theme-primary' 
                    : 'text-theme-text/70 hover:text-theme-text'
                }`}
              >
                普通玩家
              </button>
              <button
                onClick={() => setActiveRole('player')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeRole === 'player' 
                    ? 'text-theme-primary border-b-2 border-theme-primary' 
                    : 'text-theme-text/70 hover:text-theme-text'
                }`}
              >
                游戏陪玩
              </button>
              <button
                onClick={() => setActiveRole('admin')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeRole === 'admin' 
                    ? 'text-theme-primary border-b-2 border-theme-primary' 
                    : 'text-theme-text/70 hover:text-theme-text'
                }`}
              >
                管理员
              </button>
            </div>
          </div>
          
          {/* Login Form */}
          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-theme-text mb-1">
                  邮箱/手机号
                </label>
                <input
                  type="text"
                  {...register('identifier')}
                  className={cn(
                    "w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary bg-theme-surface text-theme-text",
                    errors.identifier ? "border-red-300" : "border-theme-border"
                  )}
                  placeholder="请输入邮箱或手机号"
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
                    忘记密码?
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
              {activeRole === 'player' && (
                <div className="text-xs text-theme-text/70 bg-theme-primary/10 p-3 rounded-lg">
                  <i className="fa-info-circle mr-1"></i> 作为陪玩，登录后您可以设置您的服务内容和价格
                </div>
              )}
              
              {activeRole === 'admin' && (
                <div className="text-xs text-theme-text/70 bg-yellow-500/10 p-3 rounded-lg">
                  <i className="fa-info-circle mr-1"></i> 管理员账号可以管理平台用户和内容
                </div>
              )}
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-theme-primary text-white font-medium rounded-lg text-sm hover:bg-theme-primary/90 focus:outline-none focus:ring-2 focus:ring-theme-primary/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? '登录中...' : '登录'}
              </button>
            </form>
            
            <div className="mt-6 text-center text-sm text-theme-text/70">
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
        </div>
      </div>
    </div>
  );
}