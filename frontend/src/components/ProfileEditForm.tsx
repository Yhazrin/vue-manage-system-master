import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getGames } from '@/services/gameService';
import { Game } from '@/types';

interface ProfileField {
  key: string;
  label: string;
  value: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'number' | 'select';
  editable: boolean;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

interface ProfileEditFormProps {
  fields: ProfileField[];
  onSave: (data: Record<string, string>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function ProfileEditForm({ 
  fields, 
  onSave, 
  onCancel, 
  loading = false 
}: ProfileEditFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>(
    fields.reduce((acc, field) => {
      acc[field.key] = field.value;
      return acc;
    }, {} as Record<string, string>)
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [games, setGames] = useState<Game[]>([]);

  // 获取游戏列表
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const gameList = await getGames();
        setGames(gameList);
      } catch (error) {
        console.error('Error fetching games:', error);
      }
    };

    fetchGames();
  }, []);

  const validateField = (field: ProfileField, value: string): string | null => {
    if (field.required && !value.trim()) {
      return `${field.label}不能为空`;
    }

    if (field.maxLength && value.length > field.maxLength) {
      return `${field.label}不能超过${field.maxLength}个字符`;
    }

    if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return '请输入有效的邮箱地址';
    }

    if (field.type === 'tel' && value && !/^1[3-9]\d{9}$/.test(value)) {
      return '请输入有效的手机号码';
    }

    return null;
  };

  const handleInputChange = (field: ProfileField, value: string) => {
    setFormData(prev => ({ ...prev, [field.key]: value }));
    
    // 清除该字段的错误
    if (errors[field.key]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field.key];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证所有字段
    const newErrors: Record<string, string> = {};
    fields.forEach(field => {
      if (field.editable) {
        const error = validateField(field, formData[field.key]);
        if (error) {
          newErrors[field.key] = error;
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      // 只提交可编辑且有变化的字段
      const changedData: Record<string, string> = {};
      fields.forEach(field => {
        if (field.editable && formData[field.key] !== field.value) {
          changedData[field.key] = formData[field.key];
        }
      });

      if (Object.keys(changedData).length === 0) {
        toast.info('没有需要保存的更改');
        onCancel();
        return;
      }

      await onSave(changedData);
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map(field => (
          <div key={field.key} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            {field.editable ? (
              <>
                {field.type === 'textarea' ? (
                  <textarea
                    value={formData[field.key]}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    placeholder={field.placeholder}
                    maxLength={field.maxLength}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none ${
                      errors[field.key] ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                ) : field.key === 'game_id' ? (
                  <select
                    value={formData[field.key]}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors[field.key] ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">请选择游戏</option>
                    {games.map(game => (
                      <option key={game.id} value={game.id.toString()}>
                        {game.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    value={formData[field.key]}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    placeholder={field.placeholder}
                    maxLength={field.maxLength}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors[field.key] ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                )}
                
                {field.maxLength && (
                  <div className="text-xs text-gray-500 text-right">
                    {formData[field.key].length}/{field.maxLength}
                  </div>
                )}
                
                {errors[field.key] && (
                  <p className="text-sm text-red-500">{errors[field.key]}</p>
                )}
              </>
            ) : (
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                {field.value || '未设置'}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
          <span>{loading ? '保存中...' : '保存更改'}</span>
        </button>
      </div>
    </form>
  );
}