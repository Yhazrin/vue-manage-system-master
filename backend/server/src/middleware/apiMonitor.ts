import { Request, Response, NextFunction } from 'express';

// API请求记录接口
export interface ApiRequest {
  id: string;
  timestamp: Date;
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

// 内存中存储API请求记录（生产环境建议使用数据库）
class ApiMonitor {
  private requests: ApiRequest[] = [];
  private maxRecords = 1000; // 最多保存1000条记录

  // 添加请求记录
  addRequest(request: ApiRequest) {
    this.requests.unshift(request);
    if (this.requests.length > this.maxRecords) {
      this.requests = this.requests.slice(0, this.maxRecords);
    }
  }

  // 更新请求响应信息
  updateRequest(id: string, updates: Partial<ApiRequest>) {
    const request = this.requests.find(req => req.id === id);
    if (request) {
      Object.assign(request, updates);
    }
  }

  // 获取所有请求记录
  getAllRequests(): ApiRequest[] {
    return this.requests;
  }

  // 获取统计信息
  getStats() {
    const total = this.requests.length;
    const success = this.requests.filter(req => req.status && req.status < 400).length;
    const errors = this.requests.filter(req => req.status && req.status >= 400).length;
    const pending = this.requests.filter(req => !req.status).length;
    
    const avgResponseTime = this.requests
      .filter(req => req.responseTime)
      .reduce((sum, req) => sum + (req.responseTime || 0), 0) / 
      this.requests.filter(req => req.responseTime).length || 0;

    // 按路径统计
    const pathStats: { [key: string]: { count: number; errors: number; avgTime: number } } = {};
    this.requests.forEach(req => {
      const path = req.url.split('?')[0]; // 去掉查询参数
      if (!pathStats[path]) {
        pathStats[path] = { count: 0, errors: 0, avgTime: 0 };
      }
      pathStats[path].count++;
      if (req.status && req.status >= 400) {
        pathStats[path].errors++;
      }
      if (req.responseTime) {
        pathStats[path].avgTime = (pathStats[path].avgTime + req.responseTime) / 2;
      }
    });

    return {
      total,
      success,
      errors,
      pending,
      avgResponseTime: Math.round(avgResponseTime),
      pathStats
    };
  }

  // 清空记录
  clear() {
    this.requests = [];
  }
}

export const apiMonitor = new ApiMonitor();

// 生成唯一ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// API监控中间件
export const apiMonitorMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const requestId = generateId();

  // 记录请求信息
  const apiRequest: ApiRequest = {
    id: requestId,
    timestamp: new Date(),
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    body: req.body,
    query: req.query,
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    userAgent: req.get('User-Agent') || 'unknown'
  };

  apiMonitor.addRequest(apiRequest);

  // 保存原始的res.json和res.send方法
  const originalJson = res.json;
  const originalSend = res.send;

  // 重写res.json方法
  res.json = function(data: any) {
    const responseTime = Date.now() - startTime;
    // 避免循环引用，只记录简单的响应信息
    let responseData;
    try {
      responseData = typeof data === 'object' ? { success: data.success, message: data.message } : data;
    } catch (error) {
      responseData = 'Response data too complex to serialize';
    }
    
    apiMonitor.updateRequest(requestId, {
      status: res.statusCode,
      responseTime,
      responseData
    });
    return originalJson.call(this, data);
  };

  // 重写res.send方法
  res.send = function(data: any) {
    const responseTime = Date.now() - startTime;
    // 避免循环引用，只记录简单的响应信息
    let responseData;
    try {
      responseData = typeof data === 'string' ? data.substring(0, 100) : 'Binary or complex data';
    } catch (error) {
      responseData = 'Response data too complex to serialize';
    }
    
    apiMonitor.updateRequest(requestId, {
      status: res.statusCode,
      responseTime,
      responseData
    });
    return originalSend.call(this, data);
  };

  // 监听错误
  res.on('error', (error) => {
    const responseTime = Date.now() - startTime;
    apiMonitor.updateRequest(requestId, {
      status: res.statusCode || 500,
      responseTime,
      error: error.message
    });
  });

  next();
};