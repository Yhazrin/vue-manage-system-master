import React, { useState, useEffect } from 'react';
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { API_BASE_URL } from '@/config/api';

interface ApiEndpoint {
  name: string;
  path: string;
  method: string;
  description: string;
  status: 'pending' | 'success' | 'error' | 'not-tested';
  responseTime?: number;
  error?: string;
}

const ApiStatus: React.FC = () => {
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([
    // 认证相关
    { name: '用户登录', path: '/users/login', method: 'POST', description: '普通用户登录', status: 'not-tested' },
    { name: '陪玩登录', path: '/players/login', method: 'POST', description: '陪玩用户登录', status: 'not-tested' },
    { name: '管理员登录', path: '/managers/login', method: 'POST', description: '管理员登录', status: 'not-tested' },
    
    // 用户相关
    { name: '获取用户列表', path: '/users', method: 'GET', description: '获取所有用户', status: 'not-tested' },
    { name: '获取用户详情', path: '/users/1', method: 'GET', description: '获取指定用户信息', status: 'not-tested' },
    
    // 陪玩相关
    { name: '获取陪玩列表', path: '/players', method: 'GET', description: '获取所有陪玩', status: 'not-tested' },
    { name: '获取陪玩详情', path: '/players/1', method: 'GET', description: '获取指定陪玩信息', status: 'not-tested' },
    
    // 订单相关
    { name: '获取订单列表', path: '/orders', method: 'GET', description: '获取所有订单', status: 'not-tested' },
    { name: '获取最近订单', path: '/orders?limit=10&sort=created_at&order=desc', method: 'GET', description: '获取最近订单', status: 'not-tested' },
    
    // 统计相关
    { name: '全局统计', path: '/statistics/global', method: 'GET', description: '获取全局统计数据', status: 'not-tested' },
    { name: '用户统计', path: '/statistics/user/1', method: 'GET', description: '获取指定用户统计', status: 'not-tested' },
    { name: '陪玩统计', path: '/statistics/player/1', method: 'GET', description: '获取指定陪玩统计', status: 'not-tested' },
    
    // 游戏相关
    { name: '获取游戏列表', path: '/games', method: 'GET', description: '获取所有游戏', status: 'not-tested' },
    
    // 评论相关
    { name: '获取评论列表', path: '/comments', method: 'GET', description: '获取所有评论', status: 'not-tested' },
    
    // 礼物相关
    { name: '获取礼物列表', path: '/gifts', method: 'GET', description: '获取所有礼物', status: 'not-tested' },
    
    // 提现相关
    { name: '获取提现记录', path: '/withdrawals', method: 'GET', description: '获取提现记录', status: 'not-tested' },
    
    // 服务相关
    { name: '获取服务列表', path: '/services', method: 'GET', description: '获取所有服务', status: 'not-tested' },
    
    // API监控
    { name: 'API监控状态', path: '/monitor/stats', method: 'GET', description: 'API监控统计', status: 'not-tested' },
    { name: 'API请求记录', path: '/monitor/requests', method: 'GET', description: 'API请求记录', status: 'not-tested' },
  ]);

  const [isTestingAll, setIsTestingAll] = useState(false);

  const testEndpoint = async (endpoint: ApiEndpoint): Promise<ApiEndpoint> => {
    const startTime = Date.now();
    
    try {
      setEndpoints(prev => prev.map(ep => 
        ep.path === endpoint.path ? { ...ep, status: 'pending' } : ep
      ));

      const response = await fetch(`${API_BASE_URL}${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          // 添加一个测试token，如果需要的话
          'Authorization': 'Bearer test-token'
        },
        // 对于POST请求，添加测试数据
        body: endpoint.method === 'POST' ? JSON.stringify({
          phone_num: '13900000001',
          passwd: 'test123'
        }) : undefined
      });

      const responseTime = Date.now() - startTime;
      
      if (response.ok || response.status === 401 || response.status === 403) {
        // 401/403 表示端点存在但需要认证，这也算成功
        return {
          ...endpoint,
          status: 'success',
          responseTime,
          error: undefined
        };
      } else {
        return {
          ...endpoint,
          status: 'error',
          responseTime,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        ...endpoint,
        status: 'error',
        responseTime,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  };

  const testSingleEndpoint = async (endpoint: ApiEndpoint) => {
    const result = await testEndpoint(endpoint);
    setEndpoints(prev => prev.map(ep => 
      ep.path === endpoint.path ? result : ep
    ));
  };

  const testAllEndpoints = async () => {
    setIsTestingAll(true);
    
    for (const endpoint of endpoints) {
      const result = await testEndpoint(endpoint);
      setEndpoints(prev => prev.map(ep => 
        ep.path === endpoint.path ? result : ep
      ));
      
      // 添加小延迟避免过快请求
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    setIsTestingAll(false);
  };

  const getStatusBadge = (status: ApiEndpoint['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500">✅ 正常</Badge>;
      case 'error':
        return <Badge className="bg-red-500">❌ 错误</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">⏳ 测试中</Badge>;
      default:
        return <Badge className="bg-gray-500">⚪ 未测试</Badge>;
    }
  };

  const successCount = endpoints.filter(ep => ep.status === 'success').length;
  const errorCount = endpoints.filter(ep => ep.status === 'error').length;
  const totalCount = endpoints.length;

  return (
    <div className="bg-theme-background min-h-screen text-theme-text">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4">API 状态检查</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{successCount}</div>
              <div className="text-sm text-gray-600">正常端点</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{errorCount}</div>
              <div className="text-sm text-gray-600">异常端点</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{totalCount}</div>
              <div className="text-sm text-gray-600">总端点数</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">
                {totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600">可用率</div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-4">
          <Button 
            onClick={testAllEndpoints} 
            disabled={isTestingAll}
            className="mr-2"
          >
            {isTestingAll ? '测试中...' : '测试所有端点'}
          </Button>
          <span className="text-sm text-gray-600">
            API 基础地址: {API_BASE_URL}
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API 端点列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {endpoints.map((endpoint, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{endpoint.name}</span>
                    <Badge variant="outline">{endpoint.method}</Badge>
                    {getStatusBadge(endpoint.status)}
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    {endpoint.path}
                  </div>
                  <div className="text-xs text-gray-500">
                    {endpoint.description}
                  </div>
                  {endpoint.responseTime && (
                    <div className="text-xs text-blue-600 mt-1">
                      响应时间: {endpoint.responseTime}ms
                    </div>
                  )}
                  {endpoint.error && (
                    <div className="text-xs text-red-600 mt-1">
                      错误: {endpoint.error}
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => testSingleEndpoint(endpoint)}
                  disabled={endpoint.status === 'pending'}
                >
                  {endpoint.status === 'pending' ? '测试中...' : '测试'}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      </main>
    </div>
  );
};

export default ApiStatus;