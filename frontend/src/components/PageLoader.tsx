import React from 'react';

interface PageLoaderProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
}

const PageLoader: React.FC<PageLoaderProps> = ({ 
  message = '加载中...', 
  size = 'medium',
  fullScreen = true 
}) => {
  const sizeClasses = {
    small: 'w-6 h-6 border-2',
    medium: 'w-8 h-8 border-4',
    large: 'w-12 h-12 border-4'
  };

  const containerClasses = fullScreen 
    ? 'fixed inset-0 bg-theme-background/80 backdrop-blur-sm z-40 flex items-center justify-center'
    : 'flex items-center justify-center p-8';

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <div 
          className={`animate-spin inline-block ${sizeClasses[size]} border-theme-primary border-t-transparent rounded-full`} 
          role="status"
        >
          <span className="sr-only">{message}</span>
        </div>
        <p className="mt-3 text-theme-text/70 text-sm font-medium">{message}</p>
      </div>
    </div>
  );
};

export default PageLoader;