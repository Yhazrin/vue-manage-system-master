import React, { useState } from 'react';
import { createOrder } from '@/services/orderService';
import { toast } from 'sonner';

const TestNotificationPage: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleCreateTestOrder = async () => {
    setLoading(true);
    try {
      const orderData = {
        playerId: 'player_1',
        gameType: '王者荣耀',
        serviceTime: '2小时',
        price: 88,
        description: '测试订单 - 需要高手带飞'
      };

      await createOrder(orderData);
      toast.success('测试订单创建成功！陪玩应该会收到通知。');
    } catch (error) {
      console.error('创建测试订单失败:', error);
      toast.error('创建测试订单失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          通知系统测试
        </h1>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">测试说明</h3>
            <p className="text-sm text-blue-700">
              点击下方按钮创建测试订单，陪玩端会收到实时通知弹窗。
              请确保陪玩订单管理页面已打开。
            </p>
          </div>
          
          <button
            onClick={handleCreateTestOrder}
            disabled={loading}
            className="w-full py-3 px-4 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '创建中...' : '创建测试订单'}
          </button>
          
          <div className="text-center">
            <a
              href="/player/orders"
              className="text-purple-600 hover:text-purple-700 text-sm underline"
            >
              前往陪玩订单管理页面
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestNotificationPage;