import React, { useState, useEffect } from 'react';
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { API_BASE_URL } from '@/config/api';

interface ApiRequest {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  headers: any;
  body: any;
  query: any;
  ip: string;
  userAgent: string;
  status?: number;
  responseTime?: number;
  responseData?: any;
  error?: string;
}

interface ApiStats {
  total: number;
  success: number;
  errors: number;
  pending: number;
  avgResponseTime: number;
  pathStats: { [key: string]: { count: number; errors: number; avgTime: number } };
}

const ApiMonitor: React.FC = () => {
  const [requests, setRequests] = useState<ApiRequest[]>([]);
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ApiRequest | null>(null);
  const [filters, setFilters] = useState({
    method: '',
    status: '',
    path: '',
    page: 1,
    limit: 20
  });
  const [autoRefresh, setAutoRefresh] = useState(false);

  // 获取API请求记录
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.method) queryParams.append('method', filters.method);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.path) queryParams.append('path', filters.path);
      queryParams.append('page', filters.page.toString());
      queryParams.append('limit', filters.limit.toString());

      const response = await fetch(`${API_BASE_URL}/monitor/requests?${queryParams}`);
      const data = await response.json();
      
      if (data.success) {
        setRequests(data.data.requests);
      }
    } catch (error) {
      console.error('获取API请求记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取统计信息
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/monitor/stats`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('获取统计信息失败:', error);
    }
  };

  // 清空记录
  const clearRecords = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/monitor/clear`, { method: 'DELETE' });
      const data = await response.json();
      
      if (data.success) {
        setRequests([]);
        setStats(null);
        fetchStats();
      }
    } catch (error) {
      console.error('清空记录失败:', error);
    }
  };

  // 获取请求详情
  const fetchRequestDetail = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/monitor/requests/${id}`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedRequest(data.data);
      }
    } catch (error) {
      console.error('获取请求详情失败:', error);
    }
  };

  // 格式化时间
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  // 获取状态颜色
  const getStatusColor = (status?: number) => {
    if (!status) return 'bg-yellow-500';
    if (status < 300) return 'bg-green-500';
    if (status < 400) return 'bg-blue-500';
    if (status < 500) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // 获取状态图标
  const getStatusIcon = (status?: number) => {
    if (!status) return '⏳';
    if (status < 400) return '✅';
    return '❌';
  };

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, [filters]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchRequests();
        fetchStats();
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, filters]);

  return (
    <div className="bg-theme-background min-h-screen text-theme-text">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">API 监控中心</h1>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <span className="mr-2">📊</span>
            {autoRefresh ? '停止自动刷新' : '开启自动刷新'}
          </Button>
          <Button onClick={() => { fetchRequests(); fetchStats(); }}>
            <span className="mr-2">🔄</span>
            刷新
          </Button>
          <Button variant="destructive" onClick={clearRecords}>
            <span className="mr-2">🗑️</span>
            清空记录
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">总请求数</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <span className="text-2xl">📊</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">成功请求</p>
                  <p className="text-2xl font-bold text-green-600">{stats.success}</p>
                </div>
                <span className="text-2xl">✅</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">错误请求</p>
                  <p className="text-2xl font-bold text-red-600">{stats.errors}</p>
                </div>
                <span className="text-2xl">❌</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">待处理</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <span className="text-2xl">⏳</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">平均响应时间</p>
                  <p className="text-2xl font-bold">{stats.avgResponseTime}ms</p>
                </div>
                <span className="text-2xl">⚡</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests">请求记录</TabsTrigger>
          <TabsTrigger value="stats">路径统计</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          {/* 过滤器 */}
          <Card>
            <CardHeader>
              <CardTitle>过滤器</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select value={filters.method} onValueChange={(value) => setFilters({...filters, method: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="请求方法" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全部</SelectItem>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="状态码" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全部</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                    <SelectItem value="400">400</SelectItem>
                    <SelectItem value="401">401</SelectItem>
                    <SelectItem value="404">404</SelectItem>
                    <SelectItem value="500">500</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="路径过滤"
                  value={filters.path}
                  onChange={(e) => setFilters({...filters, path: e.target.value})}
                />

                <Button onClick={() => setFilters({method: '', status: '', path: '', page: 1, limit: 20})}>
                  重置过滤器
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 请求列表 */}
          <Card>
            <CardHeader>
              <CardTitle>API 请求记录</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {loading ? (
                  <div className="text-center py-8">加载中...</div>
                ) : requests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">暂无请求记录</div>
                ) : (
                  requests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => fetchRequestDetail(request.id)}
                    >
                      <div className="flex items-center space-x-4">
                        <Badge variant="outline" className={`${getStatusColor(request.status)} text-white`}>
                          {request.method}
                        </Badge>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(request.status)}
                          <span className="font-mono text-sm">{request.url}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{request.status || 'Pending'}</span>
                        <span>{request.responseTime ? `${request.responseTime}ms` : '-'}</span>
                        <span>{formatTime(request.timestamp)}</span>
                        <span className="text-lg">👁️</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          {/* 路径统计 */}
          <Card>
            <CardHeader>
              <CardTitle>API 路径统计</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.pathStats ? (
                <div className="space-y-2">
                  {Object.entries(stats.pathStats).map(([path, pathStat]) => (
                    <div key={path} className="flex items-center justify-between p-3 border rounded">
                      <span className="font-mono text-sm">{path}</span>
                      <div className="flex items-center space-x-4 text-sm">
                        <span>请求: {pathStat.count}</span>
                        <span className="text-red-600">错误: {pathStat.errors}</span>
                        <span>平均: {Math.round(pathStat.avgTime)}ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">暂无统计数据</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 请求详情模态框 */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">请求详情</h3>
              <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                关闭
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">基本信息</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>方法: {selectedRequest.method}</div>
                  <div>状态: {selectedRequest.status || 'Pending'}</div>
                  <div>URL: {selectedRequest.url}</div>
                  <div>响应时间: {selectedRequest.responseTime || '-'}ms</div>
                  <div>IP: {selectedRequest.ip}</div>
                  <div>时间: {formatTime(selectedRequest.timestamp)}</div>
                </div>
              </div>
              
              {selectedRequest.body && Object.keys(selectedRequest.body).length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">请求体</h4>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                    {JSON.stringify(selectedRequest.body, null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedRequest.responseData && (
                <div>
                  <h4 className="font-semibold mb-2">响应数据</h4>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(selectedRequest.responseData, null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedRequest.error && (
                <div>
                  <h4 className="font-semibold mb-2 text-red-600">错误信息</h4>
                  <pre className="bg-red-50 p-3 rounded text-xs text-red-700">
                    {selectedRequest.error}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  );
};

export default ApiMonitor;