import React, { useState, useEffect } from 'react';
import Header from "@/components/Header";
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/api';

interface DataStats {
  orderStats: {
    total: number;
    completed: number;
    completedRevenue: number;
    testOrders: number;
    testRevenue: number;
  };
  giftStats: {
    total: number;
    totalRevenue: number;
    testGifts: number;
    testRevenue: number;
  };
  withdrawalStats: {
    total: number;
    totalAmount: number;
  };
  revenueCalculation: {
    orderRevenue: number;
    giftRevenue: number;
    commissionRate: number;
    theoreticalOrderCommission: number;
    theoreticalGiftCommission: number;
    theoreticalTotal: number;
    actualTotal: number;
    discrepancy: number;
  };
}

interface AnomalousData {
  orders: Array<{
    order_id: string;
    amount: number;
    status: string;
    user_id: number;
    username?: string;
    created_at: string;
    issue: string;
  }>;
  gifts: Array<{
    id: number;
    total_price: number;
    user_id: number;
    username?: string;
    created_at: string;
    issue: string;
  }>;
  withdrawals: Array<{
    id: number;
    amount: number;
    player_id: number;
    player_name?: string;
    created_at: string;
    issue: string;
  }>;
}

export default function AdminDataManagement() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DataStats | null>(null);
  const [anomalousData, setAnomalousData] = useState<AnomalousData | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'anomalous' | 'cleanup'>('overview');

  // 获取数据统计
  const fetchDataStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/data-stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      } else {
        toast.error('获取数据统计失败');
      }
    } catch (error) {
      console.error('获取数据统计失败:', error);
      toast.error('获取数据统计失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取异常数据
  const fetchAnomalousData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/anomalous-data`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnomalousData(data.anomalous);
      } else {
        toast.error('获取异常数据失败');
      }
    } catch (error) {
      console.error('获取异常数据失败:', error);
      toast.error('获取异常数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 清理测试数据
  const cleanupTestData = async (type: 'orders' | 'gifts' | 'users' | 'all') => {
    if (!confirm(`确定要清理${type === 'all' ? '所有' : type}测试数据吗？此操作不可撤销！`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/cleanup-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ type })
      });
      
      if (response.ok) {
        const result = await response.json();
        toast.success(`清理完成：删除了 ${result.deletedCount} 条记录`);
        fetchDataStats();
        fetchAnomalousData();
      } else {
        toast.error('清理数据失败');
      }
    } catch (error) {
      console.error('清理数据失败:', error);
      toast.error('清理数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataStats();
    fetchAnomalousData();
  }, []);

  if (loading && !stats) {
    return (
      <div className="bg-theme-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-theme-primary border-t-transparent rounded-full"></div>
          <p className="mt-2 text-theme-text/70">正在加载数据管理...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-theme-background min-h-screen text-theme-text">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-theme-text mb-2">数据管理</h1>
          <p className="text-theme-text/70">查看和清理系统中的测试数据和异常数据</p>
        </div>

        {/* 标签页导航 */}
        <div className="bg-theme-surface rounded-lg border border-theme-border mb-6">
          <div className="flex border-b border-theme-border">
            {[
              { key: 'overview', label: '数据概览', icon: 'fa-chart-bar' },
              { key: 'anomalous', label: '异常数据', icon: 'fa-exclamation-triangle' },
              { key: 'cleanup', label: '数据清理', icon: 'fa-broom' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-theme-primary text-white border-b-2 border-theme-primary'
                    : 'text-theme-text/70 hover:text-theme-text hover:bg-theme-background'
                }`}
              >
                <i className={`fa-solid ${tab.icon} mr-2`}></i>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* 数据概览 */}
            {activeTab === 'overview' && stats && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* 订单统计 */}
                  <div className="bg-theme-background p-4 rounded-lg border border-theme-border">
                    <h3 className="font-semibold text-theme-text mb-3">
                      <i className="fa-solid fa-file-invoice mr-2 text-theme-primary"></i>
                      订单统计
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-theme-text/70">总订单数：</span>
                        <span className="text-theme-text">{stats.orderStats.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-theme-text/70">已完成：</span>
                        <span className="text-theme-text">{stats.orderStats.completed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-theme-text/70">完成收入：</span>
                        <span className="text-theme-text">¥{stats.orderStats.completedRevenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-theme-accent">
                        <span>测试订单：</span>
                        <span>{stats.orderStats.testOrders}</span>
                      </div>
                      <div className="flex justify-between text-theme-accent">
                        <span>测试收入：</span>
                        <span>¥{stats.orderStats.testRevenue.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* 礼物统计 */}
                  <div className="bg-theme-background p-4 rounded-lg border border-theme-border">
                    <h3 className="font-semibold text-theme-text mb-3">
                      <i className="fa-solid fa-gift mr-2 text-theme-secondary"></i>
                      礼物统计
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-theme-text/70">总记录数：</span>
                        <span className="text-theme-text">{stats.giftStats.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-theme-text/70">总收入：</span>
                        <span className="text-theme-text">¥{stats.giftStats.totalRevenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-theme-accent">
                        <span>测试记录：</span>
                        <span>{stats.giftStats.testGifts}</span>
                      </div>
                      <div className="flex justify-between text-theme-accent">
                        <span>测试收入：</span>
                        <span>¥{stats.giftStats.testRevenue.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* 提现统计 */}
                  <div className="bg-theme-background p-4 rounded-lg border border-theme-border">
                    <h3 className="font-semibold text-theme-text mb-3">
                      <i className="fa-solid fa-money-bill-transfer mr-2 text-theme-accent"></i>
                      提现统计
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-theme-text/70">总记录数：</span>
                        <span className="text-theme-text">{stats.withdrawalStats.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-theme-text/70">总金额：</span>
                        <span className="text-theme-text">¥{stats.withdrawalStats.totalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 收益计算对比 */}
                <div className="bg-theme-background p-6 rounded-lg border border-theme-border">
                  <h3 className="font-semibold text-theme-text mb-4">
                    <i className="fa-solid fa-calculator mr-2 text-theme-primary"></i>
                    收益计算对比
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-theme-text mb-3">理论计算</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-theme-text/70">订单抽成 ({stats.revenueCalculation.commissionRate}%)：</span>
                          <span className="text-theme-text">¥{stats.revenueCalculation.theoreticalOrderCommission.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-theme-text/70">礼物抽成 ({stats.revenueCalculation.commissionRate}%)：</span>
                          <span className="text-theme-text">¥{stats.revenueCalculation.theoreticalGiftCommission.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-medium border-t border-theme-border pt-2">
                          <span className="text-theme-text">理论总计：</span>
                          <span className="text-theme-text">¥{stats.revenueCalculation.theoreticalTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-theme-text mb-3">实际数据</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-theme-text/70">实际平台利润：</span>
                          <span className="text-theme-text">¥{stats.revenueCalculation.actualTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span className={stats.revenueCalculation.discrepancy > 0 ? 'text-theme-error' : 'text-theme-success'}>
                            差异：
                          </span>
                          <span className={stats.revenueCalculation.discrepancy > 0 ? 'text-theme-error' : 'text-theme-success'}>
                            {stats.revenueCalculation.discrepancy > 0 ? '+' : ''}¥{stats.revenueCalculation.discrepancy.toLocaleString()}
                          </span>
                        </div>
                        {Math.abs(stats.revenueCalculation.discrepancy) > 1000 && (
                          <div className="bg-theme-accent/10 border border-theme-accent/20 rounded p-2 mt-2">
                            <p className="text-theme-accent text-xs">
                              <i className="fa-solid fa-exclamation-triangle mr-1"></i>
                              差异较大，建议检查和清理异常数据
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 异常数据 */}
            {activeTab === 'anomalous' && anomalousData && (
              <div className="space-y-6">
                {/* 异常订单 */}
                {anomalousData.orders.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-theme-text mb-3">
                      <i className="fa-solid fa-exclamation-triangle mr-2 text-theme-error"></i>
                      异常订单 ({anomalousData.orders.length})
                    </h3>
                    <div className="bg-theme-background rounded-lg border border-theme-border overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-theme-surface border-b border-theme-border">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-medium text-theme-text">订单ID</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-theme-text">金额</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-theme-text">状态</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-theme-text">用户</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-theme-text">问题</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-theme-text">创建时间</th>
                            </tr>
                          </thead>
                          <tbody>
                            {anomalousData.orders.map((order, index) => (
                              <tr key={order.order_id} className={index % 2 === 0 ? 'bg-theme-background' : 'bg-theme-surface'}>
                                <td className="px-4 py-3 text-sm text-theme-text">{order.order_id}</td>
                                <td className="px-4 py-3 text-sm text-theme-text">¥{order.amount}</td>
                                <td className="px-4 py-3 text-sm text-theme-text">{order.status}</td>
                                <td className="px-4 py-3 text-sm text-theme-text">{order.username || `ID:${order.user_id}`}</td>
                                <td className="px-4 py-3 text-sm text-theme-error">{order.issue}</td>
                                <td className="px-4 py-3 text-sm text-theme-text/70">{new Date(order.created_at).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* 异常礼物 */}
                {anomalousData.gifts.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-theme-text mb-3">
                      <i className="fa-solid fa-exclamation-triangle mr-2 text-theme-error"></i>
                      异常礼物记录 ({anomalousData.gifts.length})
                    </h3>
                    <div className="bg-theme-background rounded-lg border border-theme-border overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-theme-surface border-b border-theme-border">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-medium text-theme-text">ID</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-theme-text">金额</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-theme-text">用户</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-theme-text">问题</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-theme-text">创建时间</th>
                            </tr>
                          </thead>
                          <tbody>
                            {anomalousData.gifts.map((gift, index) => (
                              <tr key={gift.id} className={index % 2 === 0 ? 'bg-theme-background' : 'bg-theme-surface'}>
                                <td className="px-4 py-3 text-sm text-theme-text">{gift.id}</td>
                                <td className="px-4 py-3 text-sm text-theme-text">¥{gift.total_price}</td>
                                <td className="px-4 py-3 text-sm text-theme-text">{gift.username || `ID:${gift.user_id}`}</td>
                                <td className="px-4 py-3 text-sm text-theme-error">{gift.issue}</td>
                                <td className="px-4 py-3 text-sm text-theme-text/70">{new Date(gift.created_at).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {anomalousData.orders.length === 0 && anomalousData.gifts.length === 0 && anomalousData.withdrawals.length === 0 && (
                  <div className="text-center py-8">
                    <i className="fa-solid fa-check-circle text-theme-success text-4xl mb-4"></i>
                    <p className="text-theme-text">未发现异常数据</p>
                  </div>
                )}
              </div>
            )}

            {/* 数据清理 */}
            {activeTab === 'cleanup' && (
              <div className="space-y-6">
                <div className="bg-theme-accent/10 border border-theme-accent/20 rounded-lg p-4">
                  <div className="flex items-start">
                    <i className="fa-solid fa-exclamation-triangle text-theme-accent mt-1 mr-3"></i>
                    <div>
                      <h4 className="font-medium text-theme-accent mb-1">重要提醒</h4>
                      <p className="text-theme-accent text-sm">
                        数据清理操作不可撤销，请在执行前确保已备份数据库。建议先在测试环境中验证清理效果。
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-theme-background p-6 rounded-lg border border-theme-border">
                    <h3 className="font-semibold text-theme-text mb-4">
                      <i className="fa-solid fa-file-invoice mr-2 text-theme-primary"></i>
                      清理测试订单
                    </h3>
                    <p className="text-theme-text/70 text-sm mb-4">
                      删除测试用户的订单和明显的测试订单数据
                    </p>
                    <button
                      onClick={() => cleanupTestData('orders')}
                      disabled={loading}
                      className="w-full px-4 py-2 bg-theme-primary text-white rounded-lg hover:bg-theme-primary/80 disabled:opacity-50 transition-colors"
                    >
                      {loading ? '处理中...' : '清理测试订单'}
                    </button>
                  </div>

                  <div className="bg-theme-background p-6 rounded-lg border border-theme-border">
                    <h3 className="font-semibold text-theme-text mb-4">
                      <i className="fa-solid fa-gift mr-2 text-theme-secondary"></i>
                      清理测试礼物
                    </h3>
                    <p className="text-theme-text/70 text-sm mb-4">
                      删除测试用户的礼物记录和异常礼物数据
                    </p>
                    <button
                      onClick={() => cleanupTestData('gifts')}
                      disabled={loading}
                      className="w-full px-4 py-2 bg-theme-secondary text-white rounded-lg hover:bg-theme-secondary/80 disabled:opacity-50 transition-colors"
                    >
                      {loading ? '处理中...' : '清理测试礼物'}
                    </button>
                  </div>

                  <div className="bg-theme-background p-6 rounded-lg border border-theme-border">
                    <h3 className="font-semibold text-theme-text mb-4">
                      <i className="fa-solid fa-users mr-2 text-theme-success"></i>
                      清理测试用户
                    </h3>
                    <p className="text-theme-text/70 text-sm mb-4">
                      删除测试用户账号及其相关的所有数据
                    </p>
                    <button
                      onClick={() => cleanupTestData('users')}
                      disabled={loading}
                      className="w-full px-4 py-2 bg-theme-success text-white rounded-lg hover:bg-theme-success/80 disabled:opacity-50 transition-colors"
                    >
                      {loading ? '处理中...' : '清理测试用户'}
                    </button>
                  </div>

                  <div className="bg-theme-background p-6 rounded-lg border border-theme-border">
                    <h3 className="font-semibold text-theme-text mb-4">
                      <i className="fa-solid fa-broom mr-2 text-theme-error"></i>
                      全面清理
                    </h3>
                    <p className="text-theme-text/70 text-sm mb-4">
                      执行全面的测试数据清理，包括所有测试相关数据
                    </p>
                    <button
                      onClick={() => cleanupTestData('all')}
                      disabled={loading}
                      className="w-full px-4 py-2 bg-theme-error text-white rounded-lg hover:bg-theme-error/80 disabled:opacity-50 transition-colors"
                    >
                      {loading ? '处理中...' : '全面清理'}
                    </button>
                  </div>
                </div>

                <div className="bg-theme-background p-6 rounded-lg border border-theme-border">
                  <h3 className="font-semibold text-theme-text mb-4">
                    <i className="fa-solid fa-database mr-2 text-theme-primary"></i>
                    手动SQL清理
                  </h3>
                  <p className="text-theme-text/70 text-sm mb-4">
                    如需更精确的控制，可以使用以下SQL脚本：
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="bg-theme-surface border border-theme-border text-theme-text p-3 rounded font-mono">
                      <div>1. verify_revenue_calculation.sql - 验证收益计算</div>
                      <div>2. fix_revenue_discrepancy.sql - 修复收益偏差</div>
                      <div>3. clean_test_data.sql - 全面数据清理</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 刷新按钮 */}
        <div className="flex justify-end">
          <button
            onClick={() => {
              fetchDataStats();
              fetchAnomalousData();
            }}
            disabled={loading}
            className="px-4 py-2 bg-theme-primary text-white rounded-lg hover:bg-theme-primary/80 disabled:opacity-50 transition-colors"
          >
            <i className="fa-solid fa-refresh mr-2"></i>
            {loading ? '刷新中...' : '刷新数据'}
          </button>
        </div>
      </main>
    </div>
  );
}