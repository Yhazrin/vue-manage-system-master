import React, { useState, useEffect, useCallback } from 'react';
import Header from "@/components/Header";
import { toast } from "sonner";
import { format } from 'date-fns';
import {
  WithdrawalRequest,
  ProcessRecord,
  getWithdrawalRequests,
  getProcessRecords,
  getWithdrawalProcessRecords,
  approveWithdrawal,
  rejectWithdrawal,
  markWithdrawalAsPaid
} from '@/services/withdrawalService';



// 获取提现状态样式
const getStatusStyle = (status: WithdrawalRequest['status']) => {
  switch(status) {
    case 'pending':
      return { 
        className: "bg-yellow-50 text-yellow-700", 
        label: "待审核" 
      };
    case 'approved':
      return { 
        className: "bg-blue-50 text-blue-700", 
        label: "已审核" 
      };
    case 'paid':
      return { 
        className: "bg-green-50 text-green-700", 
        label: "已打款" 
      };
    case 'rejected':
      return { 
        className: "bg-red-50 text-red-700", 
        label: "已拒绝" 
      };
    default:
      return { 
        className: "bg-gray-50 text-gray-700", 
        label: "未知状态" 
      };
  }
};
  export default function AdminWithdrawalManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [processRecords, setProcessRecords] = useState<ProcessRecord[]>([]);
  
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [processingNotes, setProcessingNotes] = useState("");
  const [currentProcessRecords, setCurrentProcessRecords] = useState<ProcessRecord[]>([]);
  const [processRecordsLoading, setProcessRecordsLoading] = useState(false);
  const [processRecordsError, setProcessRecordsError] = useState<string | null>(null);
  
  // 加载提现数据
  const fetchWithdrawals = async () => {
    await loadWithdrawalData();
  };
  
  const loadWithdrawalData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [withdrawals, records] = await Promise.all([
        getWithdrawalRequests(),
        getProcessRecords()
      ]);
      
      setWithdrawalRequests(withdrawals);
      setProcessRecords(records);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取提现数据失败';
      console.error('Failed to load withdrawal data:', err);
      setError(errorMessage);
      
      // 开发环境下设置空数组
      if (process.env.NODE_ENV === 'development') {
        setWithdrawalRequests([]);
        setProcessRecords([]);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch process records for selected withdrawal
  const fetchProcessRecords = useCallback(async (withdrawalId: string) => {
    try {
      setProcessRecordsLoading(true);
      setProcessRecordsError(null);
      const records = await getWithdrawalProcessRecords(withdrawalId);
      setCurrentProcessRecords(records);
    } catch (error) {
      console.error('Failed to fetch process records:', error);
      const errorMessage = error instanceof Error ? error.message : '获取处理记录失败';
      setProcessRecordsError(errorMessage);
      setCurrentProcessRecords([]);
    } finally {
      setProcessRecordsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    loadWithdrawalData();
  }, []);
  
  // Fetch records when selected withdrawal changes
  useEffect(() => {
    if (selectedWithdrawal) {
      fetchProcessRecords(selectedWithdrawal.id);
    } else {
      setCurrentProcessRecords([]);
    }
  }, [selectedWithdrawal, fetchProcessRecords]);
  
  // 筛选提现申请
  const filteredWithdrawals = activeFilter === 'all' 
    ? withdrawalRequests 
    : withdrawalRequests.filter(request => request.status === activeFilter);
  
  // 处理提现申请
  const handleProcessWithdrawal = async (status: 'approved' | 'rejected' | 'paid') => {
    if (!selectedWithdrawal) return;
    
    try {
      let updatedWithdrawal: WithdrawalRequest;
      
      switch (status) {
        case 'approved':
          updatedWithdrawal = await approveWithdrawal(selectedWithdrawal.id, processingNotes);
          break;
        case 'rejected':
          if (!processingNotes.trim()) {
            toast.error('拒绝提现申请时必须填写拒绝原因');
            return;
          }
          updatedWithdrawal = await rejectWithdrawal(selectedWithdrawal.id, processingNotes);
          break;
        case 'paid':
          updatedWithdrawal = await markWithdrawalAsPaid(selectedWithdrawal.id, processingNotes);
          break;
        default:
          throw new Error('Invalid status');
      }
      
      // 更新本地状态
      setWithdrawalRequests(withdrawalRequests.map(request => 
        request.id === selectedWithdrawal.id ? updatedWithdrawal : request
      ));
      
      // 重新加载处理记录
      await fetchProcessRecords(selectedWithdrawal.id);
      
      // 关闭模态框
      setSelectedWithdrawal(null);
      setProcessingNotes("");
      
      // 显示成功消息
      const statusText = status === 'approved' ? '批准' : status === 'rejected' ? '拒绝' : '标记为已打款';
      toast.success(`提现申请已${statusText}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '处理提现申请失败';
      console.error('Failed to process withdrawal:', err);
      toast.error(errorMessage);
    }
  };
  
  return (
    <div className="bg-theme-background min-h-screen text-theme-text">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">提现管理</h1>
          <p className="text-gray-500">审核陪玩者提现申请并处理打款</p>
        </div>
        
        {/* 筛选器 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setActiveFilter('all')}
              className={`py-1.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === 'all' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              全部申请
            </button>
            <button 
              onClick={() => setActiveFilter('pending')}
              className={`py-1.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === 'pending' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              待审核
            </button>
            <button 
              onClick={() => setActiveFilter('approved')}
              className={`py-1.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === 'approved' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              已审核
            </button>
            <button 
              onClick={() => setActiveFilter('paid')}
              className={`py-1.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === 'paid' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              已打款
            </button>
            <button 
              onClick={() => setActiveFilter('rejected')}
              className={`py-1.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === 'rejected' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              已拒绝
            </button>
          </div>
        </div>
        
        {/* 提现申请列表 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-4"></div>
                <p className="text-gray-500">加载中...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center">
                <i className="fa-solid fa-exclamation-triangle text-red-500 text-2xl mb-4"></i>
                <p className="text-gray-500 mb-4">{error}</p>
                <button 
                  onClick={fetchWithdrawals}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  重试
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">陪玩信息</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">提现金额 (元)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredWithdrawals.length > 0 ? (
                    filteredWithdrawals.map(withdrawal => {
                      const statusInfo = getStatusStyle(withdrawal.status);
                      return (
                        <tr key={withdrawal.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{withdrawal.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="font-medium text-gray-900 text-sm">{withdrawal.playerName}</div>
                              <div className="text-xs text-gray-500">{withdrawal.playerUid}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">¥{withdrawal.amount.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{withdrawal.createdAt}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo.className}`}>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button 
                              onClick={() => setSelectedWithdrawal(withdrawal)}
                              className="text-purple-600 hover:text-purple-900"
                            >
                              查看详情
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <i className="fa-solid fa-file-invoice text-2xl mb-2"></i>
                          <p>没有找到符合条件的提现申请</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* 提现详情模态框 */}
        {selectedWithdrawal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">提现申请详情</h3>
                <button 
                  onClick={() => {
                    setSelectedWithdrawal(null);
                    setProcessingNotes("");
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>
              
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">陪玩信息</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="mb-2">
                        <p className="text-xs text-gray-500">陪玩昵称</p>
                        <p className="font-medium text-gray-900">{selectedWithdrawal.playerName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">陪玩UID</p>
                        <p className="font-medium text-gray-900">{selectedWithdrawal.playerUid}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">提现信息</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="mb-2">
                        <p className="text-xs text-gray-500">申请ID</p>
                        <p className="font-medium text-gray-900">{selectedWithdrawal.id}</p>
                      </div>
                      <div className="mb-2">
                        <p className="text-xs text-gray-500">提现金额</p>
                        <p className="font-medium text-gray-900">¥{selectedWithdrawal.amount.toFixed(2)}</p>
                      </div>
                      <div className="mb-2">
                        <p className="text-xs text-gray-500">申请时间</p>
                        <p className="font-medium text-gray-900">{selectedWithdrawal.createdAt}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">当前状态</p>
                        <div className="mt-1">
                          {(() => {
                            const statusInfo = getStatusStyle(selectedWithdrawal.status);
                            return (
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo.className}`}>
                                {statusInfo.label}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">收款码</h4>
                  <div className="flex justify-center">
                    <img 
                      src={selectedWithdrawal.qrCodeUrl} 
                      alt="Payment QR code"
                      className="w-40 h-40 rounded object-cover border border-gray-100 p-2 bg-white"
                    />
                  </div>
                </div>
                
                {/* 处理记录 */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">处理记录</h4>
                  {processRecordsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mb-2"></div>
                        <p className="text-gray-500 text-sm">加载处理记录中...</p>
                      </div>
                    </div>
                  ) : processRecordsError ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="flex flex-col items-center">
                        <i className="fa-solid fa-exclamation-triangle text-red-500 text-lg mb-2"></i>
                        <p className="text-gray-500 text-sm mb-2">{processRecordsError}</p>
                        <button 
                          onClick={() => fetchProcessRecords(selectedWithdrawal.id)}
                          className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
                        >
                          重试
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {currentProcessRecords
                        .filter(record => record.withdrawalId === selectedWithdrawal.id)
                        .sort((a, b) => new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime())
                        .map(record => (
                          <div key={record.id} className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <div className="font-medium text-gray-900 text-sm">
                                {record.status === 'approved' && '已审核'}
                                {record.status === 'rejected' && '已拒绝'}
                                {record.status === 'paid' && '已打款'}
                              </div>
                              <span className="text-xs text-gray-500">{record.processedAt}</span>
                            </div>
                            <div className="text-xs text-gray-500 mb-1">处理人: {record.processedBy}</div>
                            {record.notes && (
                              <div className="text-xs bg-white p-2 rounded border border-gray-100">
                                {record.notes}
                              </div>
                            )}
                          </div>
                        ))}
                        
                      {currentProcessRecords.filter(record => record.withdrawalId === selectedWithdrawal.id).length === 0 && (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          暂无处理记录
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* 处理操作 */}
                {selectedWithdrawal.status !== 'paid' && selectedWithdrawal.status !== 'rejected' && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">处理操作</h4>
                    
                    {selectedWithdrawal.status === 'pending' && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">拒绝原因 (仅拒绝时填写)</label>
                        <textarea
                          value={processingNotes}
                          onChange={(e) => setProcessingNotes(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                          rows={3}
                          placeholder="请输入拒绝原因..."
                        ></textarea>
                      </div>
                    )}
                    
                    <div className="flex justify-end gap-3">
                      {selectedWithdrawal.status === 'pending' && (
                        <button 
                          onClick={() => handleProcessWithdrawal('rejected')}
                          className="py-2 px-4 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                        >
                          拒绝
                        </button>
                      )}
                      
                      {selectedWithdrawal.status === 'pending' && (
                        <button 
                          onClick={() => handleProcessWithdrawal('approved')}
                          className="py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          批准
                        </button>
                      )}
                      
                      {selectedWithdrawal.status === 'approved' && (
                        <button 
                          onClick={() => handleProcessWithdrawal('paid')}
                          className="py-2 px-4 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                        >
                          标记为已打款
                        </button>
                      )}
                      
                      <button 
                        onClick={() => {
                          setSelectedWithdrawal(null);
                          setProcessingNotes("");
                        }}
                        className="py-2 px-4 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        关闭
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}