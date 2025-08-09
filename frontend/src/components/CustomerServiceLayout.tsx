import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';

const CustomerServiceLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-theme-background">
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <div className="p-6">
        <Outlet />
      </div>
    </div>
  );
};

export default CustomerServiceLayout;