import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { cn } from '@/lib/utils';
import { register as registerUser, sendVerificationCode, RegisterRequest } from '@/services/authService';
import { toast } from 'sonner';

// Register form schema
const registerSchema = z.object({
  email: z.string().email({ message: '请输入有效的邮箱地址' }),
  phone: z.string().regex(/^1[3-9]\d{9}$/, { message: '请输入有效的手机号' }),
  verifyCode: z.string().length(6, { message: '验证码必须是6位数字' }),
  password: z.string().min(6, { message: '密码至少6个字符' }),
  confirmPassword: z.string(),
  nickname: z.string().min(2, { message: '昵称至少2个字符' }),
  role: z.enum(['user', 'player'], { required_error: '请选择角色' }),
}).refine(data => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [codeButtonText, setCodeButtonText] = useState('获取验证码');
  const [codeButtonDisabled, setCodeButtonDisabled] = useState(false);
  const { setIsAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
  watch,
  formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'user'
    }
  });

  const phone = watch('phone', '');

  const getVerifyCode = async () => {
    if (!phone) {
      setError('请先输入手机号');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      const response = await sendVerificationCode({
        phone,
        type: 'register'
      });
      
      if (response.success) {
        toast.success(response.message);
        
        // Start countdown
        let countdown = 60;
        setCodeButtonDisabled(true);
        
        const timer = setInterval(() => {
          countdown--;
          setCodeButtonText(`${countdown}秒后重新获取`);
          
          if (countdown <= 0) {
            clearInterval(timer);
            setCodeButtonText('获取验证码');
            setCodeButtonDisabled(false);
          }
        }, 1000);
      } else {
        setError(response.message || '获取验证码失败，请稍后重试');
      }
    } catch (err) {
      console.error('Send verification code error:', err);
      setError('获取验证码失败，请检查网络连接或稍后重试');
      setCodeButtonDisabled(false);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setError('');
      
      const registerRequest: RegisterRequest = {
        email: data.email,
        phone: data.phone,
        password: data.password,
        confirmPassword: data.confirmPassword,
        nickname: data.nickname,
        role: data.role,
        verificationCode: data.verifyCode,
      };
      
      const response = await registerUser(registerRequest);
      
      if (response.success) {
        toast.success('注册成功！请登录您的账号');
        navigate('/login');
      } else {
        setError(response.message || '注册失败，请稍后重试');
      }
    } catch (err) {
      console.error('Register error:', err);
      setError('注册失败，请检查网络连接或稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
     <div className="min-h-screen bg-theme-background text-theme-text flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
           <div className="text-purple-600 font-bold text-2xl flex items-center justify-center mb-2">
            <span className="mr-2">🎮</span>
           Vita
          </div>
          <h1 className="text-2xl font-bold text-gray-900">创建账号</h1>
          <p className="text-gray-500">注册成为我们的一员，开始游戏之旅</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                邮箱地址
              </label>
              <input
                type="email"
                {...register('email')}
                className={cn(
                  "w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500",
                  errors.email ? "border-red-300" : "border-gray-300"
                )}
                placeholder="请输入邮箱地址"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                手机号
              </label>
              <input
                type="tel"
                {...register('phone')}
                className={cn(
                  "w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500",
                  errors.phone ? "border-red-300" : "border-gray-300"
                )}
                placeholder="请输入手机号"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                昵称
              </label>
              <input
                type="text"
                {...register('nickname')}
                className={cn(
                  "w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500",
                  errors.nickname ? "border-red-300" : "border-gray-300"
                )}
                placeholder="请输入昵称"
              />
              {errors.nickname && (
                <p className="mt-1 text-sm text-red-600">{errors.nickname.message}</p>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  验证码
                </label>
                <input
                  type="text"
                  {...register('verifyCode')}
                  className={cn(
                    "w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500",
                    errors.verifyCode ? "border-red-300" : "border-gray-300"
                  )}
                  placeholder="请输入验证码"
                />
                {errors.verifyCode && (
                  <p className="mt-1 text-sm text-red-600">{errors.verifyCode.message}</p>
                )}
              </div>
              <div className="col-span-1 flex items-end">
                <button
                  type="button"
                  onClick={getVerifyCode}
                  disabled={codeButtonDisabled || isLoading || !phone}
                  className="w-full py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {codeButtonText}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                设置密码
              </label>
              <input
                type="password"
                {...register('password')}
                className={cn(
                  "w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500",
                  errors.password ? "border-red-300" : "border-gray-300"
                )}
                placeholder="请设置密码"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                确认密码
              </label>
              <input
                type="password"
                {...register('confirmPassword')}
                className={cn(
                  "w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500",
                  errors.confirmPassword ? "border-red-300" : "border-gray-300"
                )}
                placeholder="请再次输入密码"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                选择角色
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50">
                  <input
                    type="radio"
                    value="user"
                    {...register('role')}
                    className="text-purple-600 focus:ring-purple-500 h-4 w-4"
                  />
                  <span className="ml-2 text-sm text-gray-700">普通玩家</span>
                </label>
                <label className="flex items-center p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50">
                  <input
                    type="radio"
                    value="player"
                    {...register('role')}
                    className="text-purple-600 focus:ring-purple-500 h-4 w-4"
                  />
                  <span className="ml-2 text-sm text-gray-700">游戏陪玩</span>
                </label>
              </div>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
               className="w-full py-2.5 px-4 bg-theme-primary text-white font-medium rounded-lg text-sm hover:bg-theme-primary/90 focus:outline-none focus:ring-2 focus:ring-theme-primary/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
            >
              {isLoading ? '注册中...' : '注册'}
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              已有账号?{' '}
              <Link
                to="/login"
                className="font-medium text-purple-600 hover:text-purple-700"
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