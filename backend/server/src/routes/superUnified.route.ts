/**
 * 超级统一客服系统路由
 * 基于单表设计的简化API接口
 */

import { Router } from 'express';
import SuperUnifiedService from '../services/SuperUnifiedService';

const router = Router();

/**
 * 客服上班打卡
 * POST /api/super-unified/clock-in
 */
router.post('/clock-in', async (req, res) => {
  try {
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: '客服ID不能为空'
      });
    }

    const result = await SuperUnifiedService.clockIn(customerId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('上班打卡接口错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 客服下班打卡
 * POST /api/super-unified/clock-out
 */
router.post('/clock-out', async (req, res) => {
  try {
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: '客服ID不能为空'
      });
    }

    const result = await SuperUnifiedService.clockOut(customerId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('下班打卡接口错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 获取客服完整信息
 * GET /api/super-unified/customer-service/:id
 */
router.get('/customer-service/:id', async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);

    if (!customerId || isNaN(customerId)) {
      return res.status(400).json({
        success: false,
        message: '无效的客服ID'
      });
    }

    const result = await SuperUnifiedService.getCustomerServiceInfo(customerId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }

  } catch (error) {
    console.error('获取客服信息接口错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 获取客服历史记录
 * GET /api/super-unified/customer-service/:id/history
 */
router.get('/customer-service/:id/history', async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit as string) || 50;

    if (!customerId || isNaN(customerId)) {
      return res.status(400).json({
        success: false,
        message: '无效的客服ID'
      });
    }

    const result = await SuperUnifiedService.getCustomerServiceHistory(customerId, limit);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('获取客服历史接口错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 提现申请已移至客服路由 /customer-service/withdrawal
// 避免重复提现申请问题

/**
 * 获取所有客服列表
 * GET /api/super-unified/customer-services
 */
router.get('/customer-services', async (req, res) => {
  try {
    const result = await SuperUnifiedService.getAllCustomerServices();
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('获取客服列表接口错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 重置接口已移除 - 生产环境不提供重置功能

/**
 * 获取系统统计信息
 * GET /api/super-unified/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const allCustomerServices = await SuperUnifiedService.getAllCustomerServices();
    
    if (!allCustomerServices.success) {
      return res.status(400).json(allCustomerServices);
    }

    const customerServices = allCustomerServices.data || [];
    
    // 计算统计信息
    const stats = {
      totalCustomerServices: customerServices.length,
      onlineCustomerServices: customerServices.filter(cs => cs.is_online).length,
      todayWorking: customerServices.filter(cs => cs.today_status === 'clocked_in').length,
      todayCompleted: customerServices.filter(cs => cs.today_status === 'clocked_out').length,
      totalEarningsToday: customerServices.reduce((sum, cs) => sum + parseFloat(cs.today_total_earnings || 0), 0),
      totalAvailableBalance: customerServices.reduce((sum, cs) => sum + parseFloat(cs.available_balance || 0), 0),
      totalEarningsThisMonth: customerServices.reduce((sum, cs) => sum + parseFloat(cs.current_month_earnings || 0), 0)
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('获取统计信息接口错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

export default router;