import { useState, useEffect } from 'react';
import Header from "@/components/Header";
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from "sonner";
import {
  getAdminOperationLogs,
  AdminLog
} from '@/services/adminProfileService';

export default function AdminLogs() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterModule, setFilterModule] = useState('');
  const [filterOperation, setFilterOperation] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const navigate = useNavigate();

  const pageSize = 20;

  // 获取操作日志
  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {
        page,
        limit: pageSize
      };
      
      if (filterModule) params.module = filterModule;
      if (filterOperation) params.operation = filterOperation;
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;
      
      const data = await getAdminOperationLogs(params);
      setLogs(data.logs);
      setTotalPages(Math.ceil(data.total / pageSize));
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching operation logs:', error);
      setError('获取操作日志失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 重置筛选条件
  const resetFilters = () => {
    setFilterModule('');
    setFilterOperation('');
    setDateRange({ start: '', end: '' });
    setCurrentPage(1);
    fetchLogs(1);
  };

  // 应用筛选条件
  const applyFilters = () => {
    setCurrentPage(1);
    fetchLogs(1);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  if (loading && logs.length === 0) {
    return (
      <div className="bg-theme-background min-h-screen text-theme-text">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-theme-background min-h-screen text-theme-text">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-theme-text">操作日志</h1>
              <p className="text-theme-text/70 mt-1">查看管理员操作记录和系统日志</p>
            </div>
            <button 
              onClick={() => navigate('/admin/profile')}
              className="py-2 px-4 bg-theme-primary text-white text-sm font-medium rounded-lg hover:bg-theme-primary/80 transition-colors flex items-center"
            >
              <i className="fa-solid fa-arrow-left mr-2"></i> 返回个人主页
            </button>
          </div>
        </div>

        {/* 筛选条件 */}
        <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border p-6 mb-6">
          <h3 className="text-lg font-semibold text-theme-text mb-4">筛选条件</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-theme-text/70 mb-2">操作模块</label>
              <select
                value={filterModule}
                onChange={(e) => setFilterModule(e.target.value)}
                className="w-full px-3 py-2 border border-theme-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary bg-theme-background text-theme-text"
              >
                <option value="">全部模块</option>
                <option value="用户管理">用户管理</option>
                <option value="陪玩管理">陪玩管理</option>
                <option value="订单管理">订单管理</option>
                <option value="礼物管理">礼物管理</option>
                <option value="权限管理">权限管理</option>
                <option value="系统设置">系统设置</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-theme-text/70 mb-2">操作类型</label>
              <select
                value={filterOperation}
                onChange={(e) => setFilterOperation(e.target.value)}
                className="w-full px-3 py-2 border border-theme-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary bg-theme-background text-theme-text"
              >
                <option value="">全部操作</option>
                <option value="创建">创建</option>
                <option value="编辑">编辑</option>
                <option value="删除">删除</option>
                <option value="查看">查看</option>
                <option value="登录">登录</option>
                <option value="登出">登出</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-theme-text/70 mb-2">开始日期</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-3 py-2 border border-theme-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary bg-theme-background text-theme-text"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-theme-text/70 mb-2">结束日期</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-3 py-2 border border-theme-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary bg-theme-background text-theme-text"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-theme-primary text-white text-sm font-medium rounded-lg hover:bg-theme-primary/80 transition-colors"
            >
              <i className="fa-solid fa-search mr-2"></i>筛选
            </button>
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-theme-surface border border-theme-border text-theme-text text-sm font-medium rounded-lg hover:bg-theme-background transition-colors"
            >
              <i className="fa-solid fa-refresh mr-2"></i>重置
            </button>
          </div>
        </div>

        {/* 操作日志列表 */}
        <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-theme-primary/10 rounded-lg flex items-center justify-center mr-3">
                  <i className="fa-solid fa-history text-theme-primary"></i>
                </div>
                <h3 className="text-lg font-semibold text-theme-text">操作记录</h3>
              </div>
              <div className="text-sm text-theme-text/60">
                共 {logs.length} 条记录
              </div>
            </div>
            
            {error ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-theme-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fa-solid fa-exclamation-triangle text-theme-error text-xl"></i>
                </div>
                <p className="text-theme-error mb-4">{error}</p>
                <button 
                  onClick={() => fetchLogs(currentPage)}
                  className="px-4 py-2 bg-theme-primary text-white rounded-lg hover:bg-theme-primary/80 transition-colors"
                >
                  重试
                </button>
              </div>
            ) : logs.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-theme-background">
                        <th className="px-4 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">时间</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">操作</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">模块</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">详情</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">IP地址</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">状态</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border">
                      {logs.map(log => (
                        <tr key={log.id} className="hover:bg-theme-surface/50 hover:border-theme-accent/30 transition-all duration-200">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-theme-text">{log.time}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-theme-text font-medium">{log.operation}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-theme-text/70">{log.module}</td>
                          <td className="px-4 py-3 text-sm text-theme-text/70 max-w-xs truncate" title={log.details}>
                            {log.details || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-theme-text/70">{log.ip}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              log.status === 'success' 
                                ? 'bg-theme-success/10 text-theme-success' 
                                : 'bg-theme-error/10 text-theme-error'
                            }`}>
                              {log.status === 'success' ? '成功' : '失败'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* 分页 */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-theme-border">
                    <div className="text-sm text-theme-text/60">
                      第 {currentPage} 页，共 {totalPages} 页
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => fetchLogs(currentPage - 1)}
                        disabled={currentPage === 1 || loading}
                        className="px-3 py-1 text-sm border border-theme-border rounded hover:bg-theme-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        上一页
                      </button>
                      <button
                        onClick={() => fetchLogs(currentPage + 1)}
                        disabled={currentPage === totalPages || loading}
                        className="px-3 py-1 text-sm border border-theme-border rounded hover:bg-theme-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        下一页
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-theme-background rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fa-solid fa-clock-rotate-left text-theme-text/40 text-xl"></i>
                </div>
                <p className="text-theme-text/60">暂无操作记录</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}