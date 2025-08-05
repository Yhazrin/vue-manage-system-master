import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { AuthContext } from '@/contexts/authContext';



// 获取提现状态样式
const getStatusStyle = (status: WithdrawalRequest['status']) => {
  switch(status) {
    case 'pending':
      return { 
        className: "bg-theme-accent/10 text-theme-accent", 
        label: "待审核" 
      };
    case 'approved':
      return { 
        className: "bg-theme-success/10 text-theme-success", 
        label: "已完成" 
      };
    case 'paid':
      return { 
        className: "bg-theme-success/10 text-theme-success", 
        label: "已完成" 
      };
    case 'rejected':
      return { 
        className: "bg-theme-error/10 text-theme-error", 
        label: "已拒绝" 
      };
    default:
      return { 
        className: "bg-theme-surface text-theme-text", 
        label: "未知状态" 
      };
  }
};
  export default function AdminWithdrawalManagement() {
  const { isAuthenticated, userRole } = useContext(AuthContext);
  const navigate = useNavigate();
  
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

  // 认证检查
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUserRole = localStorage.getItem('userRole');
    
    if (!isAuthenticated || !token || storedUserRole !== 'admin') {
      toast.error('请先以管理员身份登录');
      navigate('/login');
      return;
    }
  }, [isAuthenticated, userRole, navigate]);
  
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
  
  // 批准提现申请并完成打款
  const handleApproveWithdrawal = async () => {
    if (!selectedWithdrawal) return;
    
    try {
      // 直接标记为已打款，这会触发后端的完整流程：
      // 1. 先从余额扣除金额（已批准状态）
      // 2. 然后更新已提现金额（已打款状态）
      const updatedWithdrawal = await markWithdrawalAsPaid(selectedWithdrawal.id, processingNotes || '审批通过，已完成打款');
      
      // 更新本地状态
      setWithdrawalRequests(withdrawalRequests.map(request => 
        request.id === selectedWithdrawal.id ? updatedWithdrawal : request
      ));
      
      // 重新加载处理记录
      await fetchProcessRecords(selectedWithdrawal.id);
      
      // 关闭模态框
      setSelectedWithdrawal(null);
      setProcessingNotes("");
      
      toast.success('提现申请已批准并完成打款');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '批准提现申请失败';
      console.error('Failed to approve withdrawal:', err);
      toast.error(errorMessage);
    }
  };

  // 拒绝提现申请
  const handleRejectWithdrawal = async () => {
    if (!selectedWithdrawal) return;
    
    if (!processingNotes.trim()) {
      toast.error('拒绝提现申请时必须填写拒绝原因');
      return;
    }
    
    try {
      const updatedWithdrawal = await rejectWithdrawal(selectedWithdrawal.id, processingNotes);
      
      // 更新本地状态
      setWithdrawalRequests(withdrawalRequests.map(request => 
        request.id === selectedWithdrawal.id ? updatedWithdrawal : request
      ));
      
      // 重新加载处理记录
      await fetchProcessRecords(selectedWithdrawal.id);
      
      // 关闭模态框
      setSelectedWithdrawal(null);
      setProcessingNotes("");
      
      toast.success('提现申请已拒绝');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '拒绝提现申请失败';
      console.error('Failed to reject withdrawal:', err);
      toast.error(errorMessage);
    }
  };
  
  return (
    <div className="bg-theme-background min-h-screen text-theme-text">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-theme-text">提现管理</h1>
            <button 
              onClick={() => navigate('/admin/overview')}
              className="py-1.5 px-3 bg-theme-text/60 text-white text-sm font-medium rounded-lg hover:bg-theme-text/70 transition-colors"
            >
              <i className="fa-solid fa-arrow-left mr-1"></i> 返回概览
            </button>
          </div>
          <p className="text-theme-text/70">审核陪玩者提现申请并处理打款</p>
        </div>
        
        {/* 筛选器 */}
        <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setActiveFilter('all')}
              className={`py-1.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === 'all' 
                  ? 'bg-theme-primary text-white' 
                  : 'bg-theme-background text-theme-text hover:bg-theme-primary/10 border border-theme-border'
              }`}
            >
              全部申请
            </button>
            <button 
              onClick={() => setActiveFilter('pending')}
              className={`py-1.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === 'pending' 
                  ? 'bg-theme-primary text-white' 
                  : 'bg-theme-background text-theme-text hover:bg-theme-primary/10 border border-theme-border'
              }`}
            >
              待审核
            </button>
            <button 
              onClick={() => setActiveFilter('approved')}
              className={`py-1.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === 'approved' 
                  ? 'bg-theme-primary text-white' 
                  : 'bg-theme-background text-theme-text hover:bg-theme-primary/10 border border-theme-border'
              }`}
            >
              已完成
            </button>
            <button 
              onClick={() => setActiveFilter('rejected')}
              className={`py-1.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === 'rejected' 
                  ? 'bg-theme-primary text-white' 
                  : 'bg-theme-background text-theme-text hover:bg-theme-primary/10 border border-theme-border'
              }`}
            >
              已拒绝
            </button>
          </div>
        </div>
        
        {/* 提现申请列表 */}
        <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mb-4"></div>
                  <p className="text-theme-text/70">加载中...</p>
                </div>
              </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center">
                  <i className="fa-solid fa-exclamation-triangle text-theme-error text-2xl mb-4"></i>
                  <p className="text-theme-text/70 mb-4">{error}</p>
                  <button 
                    onClick={fetchWithdrawals}
                    className="px-4 py-2 bg-theme-primary text-white rounded-lg hover:bg-theme-primary/80 transition-colors"
                  >
                    重试
                  </button>
                </div>
              </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-theme-background">
                    <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">申请ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">陪玩信息</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">提现金额 (元)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">申请时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border">
                  {filteredWithdrawals.length > 0 ? (
                    filteredWithdrawals.map(withdrawal => {
                      const statusInfo = getStatusStyle(withdrawal.status);
                      return (
                        <tr key={withdrawal.id} className="hover:bg-theme-background">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">{withdrawal.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="font-medium text-theme-text text-sm">{withdrawal.playerName}</div>
                              <div className="text-xs text-theme-text/70">{withdrawal.playerUid}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">¥{(withdrawal.amount || 0).toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">{withdrawal.createdAt}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo.className}`}>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                                onClick={() => setSelectedWithdrawal(withdrawal)}
                                className="text-theme-primary hover:text-theme-primary/80 font-medium"
                              >
                                查看详情
                              </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-theme-text/70">
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
            <div className="bg-theme-surface rounded-xl shadow-lg w-full max-w-2xl overflow-hidden">
              <div className="p-5 border-b border-theme-border flex items-center justify-between">
                <h3 className="font-semibold text-theme-text">提现申请详情</h3>
                <button 
                  onClick={() => {
                    setSelectedWithdrawal(null);
                    setProcessingNotes("");
                  }}
                  className="text-theme-text/70 hover:text-theme-text"
                >
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>
              
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="text-sm font-medium text-theme-text mb-3">陪玩信息</h4>
                    <div className="bg-theme-background p-4 rounded-lg">
                      <div className="mb-2">
                        <p className="text-xs text-theme-text/70">陪玩昵称</p>
                        <p className="font-medium text-theme-text">{selectedWithdrawal.playerName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-theme-text/70">陪玩UID</p>
                        <p className="font-medium text-theme-text">{selectedWithdrawal.playerUid}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-theme-text mb-3">提现信息</h4>
                    <div className="bg-theme-background p-4 rounded-lg">
                      <div className="mb-2">
                        <p className="text-xs text-theme-text/70">申请ID</p>
                        <p className="font-medium text-theme-text">{selectedWithdrawal.id}</p>
                      </div>
                      <div className="mb-2">
                        <p className="text-xs text-theme-text/70">提现金额</p>
                        <p className="font-medium text-theme-text">¥{(selectedWithdrawal.amount || 0).toFixed(2)}</p>
                      </div>
                      <div className="mb-2">
                        <p className="text-xs text-theme-text/70">申请时间</p>
                        <p className="font-medium text-theme-text">{selectedWithdrawal.createdAt}</p>
                      </div>
                      <div>
                        <p className="text-xs text-theme-text/70">当前状态</p>
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
                

                
                {/* 处理记录 */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-theme-text mb-3">处理记录</h4>
                  {processRecordsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-theme-primary mb-2"></div>
                        <p className="text-theme-text/70 text-sm">加载处理记录中...</p>
                      </div>
                    </div>
                  ) : processRecordsError ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="flex flex-col items-center">
                        <i className="fa-solid fa-exclamation-triangle text-theme-error text-lg mb-2"></i>
                        <p className="text-theme-text/70 text-sm mb-2">{processRecordsError}</p>
                        <button 
                          onClick={() => fetchProcessRecords(selectedWithdrawal.id)}
                          className="px-3 py-1 bg-theme-primary text-white text-sm rounded hover:bg-theme-primary/80 transition-colors"
                        >
                          重试
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(Array.isArray(currentProcessRecords) ? currentProcessRecords : [])
                        .filter(record => record.withdrawalId === selectedWithdrawal.id)
                        .sort((a, b) => new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime())
                        .map(record => (
                          <div key={record.id} className="bg-theme-background p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <div className="font-medium text-theme-text text-sm">
                                {record.status === 'approved' && '已批准并完成打款'}
                                {record.status === 'rejected' && '已拒绝'}
                                {record.status === 'paid' && '已批准并完成打款'}
                              </div>
                              <span className="text-xs text-theme-text/70">{record.processedAt}</span>
                            </div>
                            <div className="text-xs text-theme-text/70 mb-1">处理人: {record.processedBy}</div>
                            {record.notes && (
                              <div className="text-xs bg-theme-surface p-2 rounded border border-theme-border">
                                {record.notes}
                              </div>
                            )}
                          </div>
                        ))}
                        
                      {(Array.isArray(currentProcessRecords) ? currentProcessRecords : []).filter(record => record.withdrawalId === selectedWithdrawal.id).length === 0 && (
                        <div className="text-center py-4 text-theme-text/70 text-sm">
                          暂无处理记录
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* 处理操作 */}
                {selectedWithdrawal.status === 'pending' && (
                  <div>
                    <h4 className="text-sm font-medium text-theme-text mb-3">处理操作</h4>
                    
                    <div className="mb-4">
                       <label className="block text-sm font-medium text-theme-text mb-1">处理备注 (拒绝时必填)</label>
                       <textarea
                         value={processingNotes}
                         onChange={(e) => setProcessingNotes(e.target.value)}
                         className="w-full px-4 py-2 border border-theme-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary bg-theme-background text-theme-text"
                         rows={3}
                         placeholder="批准时可选填备注，拒绝时必须填写拒绝原因..."
                       ></textarea>
                     </div>
                    
                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={handleRejectWithdrawal}
                        className="py-2 px-4 bg-theme-error text-white text-sm font-medium rounded-lg hover:bg-theme-error/80 transition-colors"
                      >
                        拒绝
                      </button>
                      
                      <button 
                        onClick={handleApproveWithdrawal}
                        className="py-2 px-4 bg-theme-success text-white text-sm font-medium rounded-lg hover:bg-theme-success/80 transition-colors"
                      >
                        批准并完成打款
                      </button>
                      
                      <button 
                        onClick={() => {
                          setSelectedWithdrawal(null);
                          setProcessingNotes("");
                        }}
                        className="py-2 px-4 bg-theme-background text-theme-text text-sm font-medium rounded-lg hover:bg-theme-primary/10 transition-colors border border-theme-border"
                      >
                        关闭
                      </button>
                    </div>
                  </div>
                )}
                
                {selectedWithdrawal.status !== 'pending' && (
                  <div className="flex justify-end">
                    <button 
                      onClick={() => {
                        setSelectedWithdrawal(null);
                        setProcessingNotes("");
                      }}
                      className="py-2 px-4 bg-theme-background text-theme-text text-sm font-medium rounded-lg hover:bg-theme-primary/10 transition-colors border border-theme-border"
                    >
                      关闭
                    </button>
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