import React, { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  duration?: number;
}

const PageTransition: React.FC<PageTransitionProps> = ({ 
  children, 
  duration = 150 
}) => {
  return (
    <div 
      className="page-transition animate-in fade-in duration-150"
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--theme-background)'
      }}
    >
      {children}
    </div>
  );
};

export default PageTransition;