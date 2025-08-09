import { Router, Request, Response, NextFunction } from 'express';
import { AttendanceDao } from '../dao/AttendanceDao';
import { auth, AuthRequest } from '../middleware/auth';

const router = Router();

// 权限中间件：只允许客服访问打卡功能
const requireCustomerService = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'customer_service') {
    return res.status(403).json({
      success: false,
      error: '仅客服可访问此功能'
    });
  }
  next();
};

// 获取今日打卡状态
router.get('/today-status', auth, requireCustomerService, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const customerServiceId = req.user!.id;
    const status = await AttendanceDao.getTodayAttendanceStatus(customerServiceId);
    
    res.json(status);
  } catch (error) {
    console.error('获取今日打卡状态失败:', error);
    res.status(500).json({
      success: false,
      error: '获取今日打卡状态失败'
    });
  }
});

// 上班打卡
router.post('/clock-in', auth, requireCustomerService, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const customerServiceId = req.user!.id;
    const customerServiceName = req.user!.username || `客服${customerServiceId}`;
    
    const record = await AttendanceDao.clockIn(customerServiceId, customerServiceName);
    
    res.json(record);
  } catch (error) {
    console.error('上班打卡失败:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : '上班打卡失败'
    });
  }
});

// 下班打卡
router.post('/clock-out', auth, requireCustomerService, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const customerServiceId = req.user!.id;
    
    const record = await AttendanceDao.clockOut(customerServiceId);
    
    res.json(record);
  } catch (error) {
    console.error('下班打卡失败:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : '下班打卡失败'
    });
  }
});

// 获取个人打卡记录
router.get('/records', auth, requireCustomerService, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const customerServiceId = req.user!.id;
    
    const result = await AttendanceDao.getAttendanceRecords(customerServiceId, page, pageSize);
    
    res.json(result);
  } catch (error) {
    console.error('获取打卡记录失败:', error);
    res.status(500).json({
      success: false,
      error: '获取打卡记录失败'
    });
  }
});

// 管理员获取所有打卡记录
router.get('/all-records', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // 只有管理员可以查看所有记录
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: '仅管理员可访问此功能'
      });
    }
    
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    
    // 修复参数传递：getAttendanceRecords(customerServiceId?, startDate?, endDate?, page, pageSize)
    const result = await AttendanceDao.getAttendanceRecords(undefined, undefined, undefined, page, pageSize);
    
    res.json(result);
  } catch (error) {
    console.error('获取所有打卡记录失败:', error);
    res.status(500).json({
      success: false,
      error: '获取所有打卡记录失败'
    });
  }
});

// 管理员删除打卡记录
router.delete('/records/:id', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // 只有管理员可以删除记录
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: '仅管理员可访问此功能'
      });
    }
    
    const recordId = Number(req.params.id);
    if (!recordId || isNaN(recordId)) {
      return res.status(400).json({
        success: false,
        error: '无效的记录ID'
      });
    }
    
    const result = await AttendanceDao.deleteAttendanceRecord(recordId);
    
    res.json(result);
  } catch (error) {
    console.error('删除打卡记录失败:', error);
    res.status(500).json({
      success: false,
      error: '删除打卡记录失败'
    });
  }
});

export default router;