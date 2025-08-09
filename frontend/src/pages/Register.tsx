import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import { register as registerService, RegisterRequest } from '@/services/authService';
import { toast } from 'sonner';

// Register form schema - 匹配后端API要求
const registerSchema = z.object({
  name: z.string()
    .min(2, '用户名至少2个字符')
    .max(50, '用户名不能超过50个字符')
    .regex(/^[a-zA-Z0-9\u4e00-\u9fa5_]+$/, '用户名只能包含字母、数字、中文和下划线'),
  phone_num: z.string()
    .regex(/^1[3-9]\d{9}$/, '请输入正确的手机号'),
  passwd: z.string()
    .min(6, '密码至少6个字符')
    .regex(/^(?=.*[a-zA-Z])(?=.*\d)/, '密码必须包含字母和数字'),
  confirmPassword: z.string(),
  role: z.enum(['user', 'player'], {
    required_error: '请选择角色',
  }),
}).refine((data) => data.passwd === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const [isLoading, setIsLoading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'user'
    }
  });

  const selectedRole = watch('role');

  // 鼠标位置追踪
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // 应用主题样式
  useEffect(() => {
    const root = document.documentElement;
    // 使用用户主题配色
    root.style.setProperty('--theme-primary', '#3b82f6');
    root.style.setProperty('--theme-primary-dark', '#2563eb');
    root.style.setProperty('--theme-background', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
    root.style.setProperty('--theme-surface', '#ffffff');
    root.style.setProperty('--theme-text', '#1f2937');
    root.style.setProperty('--theme-border', '#e5e7eb');
    root.style.setProperty('--gradient-from', '#3b82f6');
    root.style.setProperty('--gradient-to', '#8b5cf6');
  }, []);



  const onSubmit = async (data: z.infer<typeof registerSchema>) => {
    setIsLoading(true);
    try {
      const registerRequest: RegisterRequest = {
        name: data.name,
        phone_num: data.phone_num,
        passwd: data.passwd,
        role: data.role,
      };

      const result = await registerService(registerRequest);
      
      if (result.success) {
        toast.success('注册成功！');
        navigate('/login');
      } else {
        toast.error(result.message || '注册失败');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || '注册失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 register-container">
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
                key={`register-particle-${i}`}
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
          <h1 className="text-2xl font-bold text-theme-text">创建账号</h1>
          <p className="text-theme-text/70">注册成为我们的一员，开始游戏之旅</p>
        </div>
        
        <div className="bg-theme-surface/80 backdrop-blur-lg rounded-xl shadow-2xl border border-theme-border/50 overflow-hidden transition-all duration-500 hover:shadow-3xl">
          <div className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-theme-text mb-1">
                用户名
              </label>
              <input
                type="text"
                {...register('name')}
                className={cn(
                  "w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary bg-theme-surface text-theme-text",
                  errors.name ? "border-theme-error" : "border-theme-border"
                )}
                placeholder="请输入用户名"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-theme-error">{errors.name.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-theme-text mb-1">
                手机号
              </label>
              <input
                type="tel"
                {...register('phone_num')}
                className={cn(
                  "w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary bg-theme-surface text-theme-text",
                  errors.phone_num ? "border-theme-error" : "border-theme-border"
                )}
                placeholder="请输入手机号"
              />
              {errors.phone_num && (
                <p className="mt-1 text-sm text-theme-error">{errors.phone_num.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-theme-text mb-1">
                设置密码
              </label>
              <input
                type="password"
                {...register('passwd')}
                className={cn(
                  "w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary bg-theme-surface text-theme-text",
                  errors.passwd ? "border-theme-error" : "border-theme-border"
                )}
                placeholder="请设置密码"
              />
              {errors.passwd && (
                <p className="mt-1 text-sm text-theme-error">{errors.passwd.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-theme-text mb-1">
                确认密码
              </label>
              <input
                type="password"
                {...register('confirmPassword')}
                className={cn(
                  "w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary bg-theme-surface text-theme-text",
                  errors.confirmPassword ? "border-theme-error" : "border-theme-border"
                )}
                placeholder="请再次输入密码"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-theme-error">{errors.confirmPassword.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-theme-text mb-3">
                选择角色
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={cn(
                  "relative flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all",
                  selectedRole === 'user' 
                    ? "border-theme-primary bg-theme-primary/10" 
                    : "border-theme-border hover:border-theme-primary/50"
                )}>
                  <input
                    type="radio"
                    {...register('role')}
                    value="user"
                    className="sr-only"
                  />
                  <div className="text-center">
                    <div className="text-lg mb-1">👤</div>
                    <div className="text-sm font-medium text-theme-text">普通用户</div>
                    <div className="text-xs text-theme-text/70">享受游戏服务</div>
                  </div>
                  {selectedRole === 'user' && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-theme-primary rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </label>

                <label className={cn(
                  "relative flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all",
                  selectedRole === 'player' 
                    ? "border-theme-primary bg-theme-primary/10" 
                    : "border-theme-border hover:border-theme-primary/50"
                )}>
                  <input
                    type="radio"
                    {...register('role')}
                    value="player"
                    className="sr-only"
                  />
                  <div className="text-center">
                    <div className="text-lg mb-1">🎮</div>
                    <div className="text-sm font-medium text-theme-text">游戏陪玩</div>
                    <div className="text-xs text-theme-text/70">提供陪玩服务</div>
                  </div>
                  {selectedRole === 'player' && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-theme-primary rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </label>
              </div>
              {errors.role && (
                <p className="mt-1 text-sm text-theme-error">{errors.role.message}</p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-theme-primary hover:bg-theme-primary/90 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '注册中...' : '立即注册'}
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm text-theme-text/70">
            <p>
              已有账号?{' '}
              <Link
                to="/login"
                className="font-medium text-theme-primary hover:text-theme-primary/80"
              >
                立即登录
              </Link>
            </p>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}