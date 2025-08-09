import { useState } from 'react';
import { toast } from 'sonner';
import { fetchJson } from '@/utils/fetchWrapper';
import { API_BASE_URL } from '@/config/api';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType: 'user' | 'player';
}

export default function ChangePasswordModal({ isOpen, onClose, userType }: ChangePasswordModalProps) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    if (!formData.currentPassword) {
      toast.error('请输入当前密码');
      return false;
    }
    if (!formData.newPassword) {
      toast.error('请输入新密码');
      return false;
    }
    if (formData.newPassword.length < 6) {
      toast.error('新密码长度至少6位');
      return false;
    }
    if (formData.newPassword === formData.currentPassword) {
      toast.error('新密码不能与当前密码相同');
      return false;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('两次输入的新密码不一致');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const endpoint = userType === 'user' 
        ? `${API_BASE_URL}/users/change-password`
        : `${API_BASE_URL}/players/change-password`;

      const response = await fetchJson(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      if (response.success) {
        toast.success('密码修改成功');
        handleClose();
      } else {
        toast.error(response.message || '密码修改失败');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error instanceof Error ? error.message : '密码修改失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswords({
      current: false,
      new: false,
      confirm: false
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-theme-surface rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-theme-text">修改密码</h2>
            <button
              onClick={handleClose}
              className="text-theme-text/70 hover:text-theme-text transition-colors"
            >
              <i className="fa-solid fa-times text-lg"></i>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 当前密码 */}
            <div>
              <label className="block text-sm font-medium text-theme-text mb-2">
                当前密码 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 pr-10 border border-theme-border rounded-lg bg-theme-background text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent"
                  placeholder="请输入当前密码"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-theme-text/70 hover:text-theme-text"
                >
                  <i className={`fa-solid ${showPasswords.current ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            {/* 新密码 */}
            <div>
              <label className="block text-sm font-medium text-theme-text mb-2">
                新密码 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 pr-10 border border-theme-border rounded-lg bg-theme-background text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent"
                  placeholder="请输入新密码（至少6位）"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-theme-text/70 hover:text-theme-text"
                >
                  <i className={`fa-solid ${showPasswords.new ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            {/* 确认新密码 */}
            <div>
              <label className="block text-sm font-medium text-theme-text mb-2">
                确认新密码 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 pr-10 border border-theme-border rounded-lg bg-theme-background text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent"
                  placeholder="请再次输入新密码"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-theme-text/70 hover:text-theme-text"
                >
                  <i className={`fa-solid ${showPasswords.confirm ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            {/* 密码强度提示 */}
            {formData.newPassword && (
              <div className="text-xs text-theme-text/70">
                <p>密码要求：</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li className={formData.newPassword.length >= 6 ? 'text-green-600' : 'text-red-500'}>
                    至少6位字符
                  </li>
                  <li className={formData.newPassword !== formData.currentPassword ? 'text-green-600' : 'text-red-500'}>
                    与当前密码不同
                  </li>
                  <li className={formData.newPassword === formData.confirmPassword && formData.confirmPassword ? 'text-green-600' : 'text-red-500'}>
                    两次输入一致
                  </li>
                </ul>
              </div>
            )}

            {/* 按钮组 */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-theme-border text-theme-text rounded-lg hover:bg-theme-background transition-colors"
                disabled={loading}
              >
                取消
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-theme-primary text-white rounded-lg hover:bg-theme-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    修改中...
                  </div>
                ) : (
                  '确认修改'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}