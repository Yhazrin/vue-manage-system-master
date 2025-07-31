import { useState } from 'react';
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
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'user'
    }
  });

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
     <div className="min-h-screen bg-theme-background text-theme-text flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
           <div className="text-theme-primary font-bold text-2xl flex items-center justify-center mb-2">
            <span className="mr-2">🎮</span>
           Vita
          </div>
          <h1 className="text-2xl font-bold text-theme-text">创建账号</h1>
          <p className="text-theme-text/70">注册成为我们的一员，开始游戏之旅</p>
        </div>
        
        <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border p-6">
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
                  errors.name ? "border-red-300" : "border-theme-border"
                )}
                placeholder="请输入用户名"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
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
                  errors.phone_num ? "border-red-300" : "border-theme-border"
                )}
                placeholder="请输入手机号"
              />
              {errors.phone_num && (
                <p className="mt-1 text-sm text-red-600">{errors.phone_num.message}</p>
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
                  errors.passwd ? "border-red-300" : "border-theme-border"
                )}
                placeholder="请设置密码"
              />
              {errors.passwd && (
                <p className="mt-1 text-sm text-red-600">{errors.passwd.message}</p>
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
                  errors.confirmPassword ? "border-red-300" : "border-theme-border"
                )}
                placeholder="请再次输入密码"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-theme-text mb-1">
                选择角色
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center p-3 border border-theme-border rounded-lg cursor-pointer transition-colors hover:bg-theme-background">
                  <input
                    type="radio"
                    value="user"
                    {...register('role')}
                    className="text-theme-primary focus:ring-theme-primary h-4 w-4"
                  />
                  <span className="ml-2 text-sm text-theme-text">普通用户</span>
                </label>
                <label className="flex items-center p-3 border border-theme-border rounded-lg cursor-pointer transition-colors hover:bg-theme-background">
                  <input
                    type="radio"
                    value="player"
                    {...register('role')}
                    className="text-theme-primary focus:ring-theme-primary h-4 w-4"
                  />
                  <span className="ml-2 text-sm text-theme-text">游戏陪玩</span>
                </label>
              </div>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
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
  );
}