import { useState, useRef } from 'react';
import { toast } from 'sonner';

interface AvatarUploadProps {
  currentAvatar: string;
  onAvatarChange: (file: File) => Promise<void>;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export default function AvatarUpload({ 
  currentAvatar, 
  onAvatarChange, 
  size = 'md',
  disabled = false 
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    // 验证文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过5MB');
      return;
    }

    // 创建预览
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      setUploading(true);
      await onAvatarChange(file);
      toast.success('头像上传成功');
    } catch (error) {
      console.error('Avatar upload failed:', error);
      toast.error('头像上传失败，请重试');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="relative">
      <div 
        className={`${sizeClasses[size]} rounded-full overflow-hidden border-4 border-white shadow-lg cursor-pointer group ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={handleClick}
      >
        <img 
          src={previewUrl || currentAvatar} 
          alt="头像"
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        
        {/* 上传遮罩 */}
        {!disabled && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
            <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                <i className="fa-solid fa-camera text-lg"></i>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 上传按钮 */}
      {!disabled && (
        <button
          onClick={handleClick}
          disabled={uploading}
          className="absolute -bottom-2 -right-2 w-8 h-8 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <i className="fa-solid fa-plus text-sm"></i>
          )}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />
    </div>
  );
}