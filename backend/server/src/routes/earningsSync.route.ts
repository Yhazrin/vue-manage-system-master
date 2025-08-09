/**
 * 收益同步路由
 */

import { Router } from 'express';
import { EarningsSync } from '../dao/EarningsSync';

const router = Router();

/**
 * 同步单个客服的收益
 */
router.post('/sync/:customerServiceId', async (req, res) => {
  try {
    const customerServiceId = parseInt(req.params.customerServiceId);
    
    if (isNaN(customerServiceId)) {
      return res.status(400).json({
        success: false,
        message: '无效的客服ID'
      });
    }
    
    const result = await EarningsSync.syncCustomerServiceEarnings(customerServiceId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
    
  } catch (error) {
    console.error('同步收益失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 同步所有客服的收益
 */
router.post('/sync-all', async (req, res) => {
  try {
    const result = await EarningsSync.syncAllCustomerServiceEarnings();
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
    
  } catch (error) {
    console.error('批量同步收益失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 获取收益同步状态
 */
router.get('/status/:customerServiceId', async (req, res) => {
  try {
    const customerServiceId = parseInt(req.params.customerServiceId);
    
    if (isNaN(customerServiceId)) {
      return res.status(400).json({
        success: false,
        message: '无效的客服ID'
      });
    }
    
    // 这里可以添加获取同步状态的逻辑
    res.json({
      success: true,
      message: '状态获取成功',
      data: {
        customerServiceId,
        lastSyncTime: new Date().toISOString(),
        status: 'ready'
      }
    });
    
  } catch (error) {
    console.error('获取同步状态失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

export default router;