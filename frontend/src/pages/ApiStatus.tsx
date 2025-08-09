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
    { name: '客服登录', path: '/customer-service/login', method: 'POST', description: '客服登录', status: 'not-tested' },
    
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

      // 根据不同端点准备不同的请求体
      let requestBody = undefined;
      if (endpoint.method === 'POST') {
        if (endpoint.path === '/customer-service/login') {
          // 客服登录使用 password 字段和实际存在的账号
          requestBody = JSON.stringify({
            phone_num: '13800000999',
            password: 'abc123'
          });
        } else if (endpoint.path === '/users/login') {
           // 用户登录使用实际存在的用户手机号
           requestBody = JSON.stringify({
             phone_num: '15900000001',
             passwd: 'test123abc'
           });
         } else if (endpoint.path === '/players/login') {
           // 陪玩登录使用实际存在的陪玩手机号
           requestBody = JSON.stringify({
             phone_num: '15800000001',
             passwd: 'test123abc'
           });
         } else if (endpoint.path === '/managers/login') {
           // 管理员登录使用实际存在的管理员手机号
           requestBody = JSON.stringify({
             phone_num: '13800000001',
             passwd: 'test123abc'
           });
         }
      }

      const response = await fetch(`${API_BASE_URL}${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          // 添加一个测试token，如果需要的话
          'Authorization': 'Bearer test-token'
        },
        body: requestBody
      });

      const responseTime = Date.now() - startTime;
      
      if (response.ok || response.status === 400 || response.status === 401 || response.status === 403) {
        // 200: 成功
        // 400: 验证错误，表示端点存在但参数不正确
        // 401/403: 表示端点存在但需要认证，这也算成功
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
        return <Badge className="bg-green-500 dark:bg-green-600">✅ 正常</Badge>;
      case 'error':
        return <Badge className="bg-red-500 dark:bg-red-600">❌ 错误</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 dark:bg-yellow-600">⏳ 测试中</Badge>;
      default:
        return <Badge className="bg-theme-text/60">⚪ 未测试</Badge>;
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
          <h1 className="text-3xl font-bold mb-4 text-theme-text">API 状态检查</h1>
          <p className="text-theme-text/70">实时监控系统 API 接口状态</p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{successCount}</div>
              <div className="text-sm text-theme-text/60">正常端点</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{errorCount}</div>
              <div className="text-sm text-theme-text/60">异常端点</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalCount}</div>
              <div className="text-sm text-theme-text/60">总端点数</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0}%
              </div>
              <div className="text-sm text-theme-text/60">可用率</div>
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
          <span className="text-sm text-theme-text/70">
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
              <div key={index} className="flex items-center justify-between p-4 border border-theme-border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-theme-text">{endpoint.name}</span>
                    <Badge variant="outline">{endpoint.method}</Badge>
                    {getStatusBadge(endpoint.status)}
                  </div>
                  <div className="text-sm text-theme-text/70 mb-1">
                    {endpoint.path}
                  </div>
                  <div className="text-xs text-theme-text/60">
                    {endpoint.description}
                  </div>
                  {endpoint.responseTime && (
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      响应时间: {endpoint.responseTime}ms
                    </div>
                  )}
                  {endpoint.error && (
                    <div className="text-xs text-red-600 dark:text-red-400 mt-1">
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