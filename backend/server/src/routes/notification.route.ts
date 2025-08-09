// backend/server/src/routes/notification.route.ts
import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { auth, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';

const router = Router();

// 通知数据存储（简单内存存储，实际项目中应使用数据库）
interface Notification {
  id: string;
  title: string;
  content: string;
  recipient: 'all' | 'players' | 'users';
  createdAt: string;
  createdBy: string;
  status: 'sent' | 'draft' | 'scheduled';
  readCount?: number;
  totalRecipients?: number;
}

let notifications: Notification[] = [];
let notificationIdCounter = 1;

// 发送通知
router.post('/', 
  auth,
  [
    body('title').notEmpty().withMessage('标题不能为空'),
    body('content').notEmpty().withMessage('内容不能为空'),
    body('recipient').isIn(['all', 'players', 'users']).withMessage('接收者类型无效')
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '参数验证失败',
          errors: errors.array()
        });
      }

      const { title, content, recipient, scheduledAt } = req.body;
      
      // 检查权限（只有管理员和客服可以发送通知）
      if (req.user?.role !== 'admin' && req.user?.role !== 'customer_service') {
        return res.status(403).json({
          success: false,
          message: '权限不足'
        });
      }

      const notification: Notification = {
        id: `notification_${notificationIdCounter++}`,
        title,
        content,
        recipient,
        createdAt: new Date().toISOString(),
        createdBy: req.user.id.toString(),
        status: scheduledAt ? 'scheduled' : 'sent',
        readCount: 0,
        totalRecipients: recipient === 'all' ? 100 : (recipient === 'players' ? 50 : 50) // 模拟数据
      };

      notifications.push(notification);

      console.log('📢 新通知已创建:', notification);

      res.json({
        success: true,
        message: '通知发送成功',
        data: notification
      });
    } catch (error) {
      console.error('发送通知失败:', error);
      res.status(500).json({
        success: false,
        message: '发送通知失败'
      });
    }
  }
);

// 获取通知列表
router.get('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // 检查权限（只有管理员和客服可以查看所有通知）
    if (req.user?.role !== 'admin' && req.user?.role !== 'customer_service') {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    const total = notifications.length;
    const paginatedNotifications = notifications
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(offset, offset + limit);

    res.json({
      success: true,
      data: {
        notifications: paginatedNotifications,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取通知列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取通知列表失败'
    });
  }
});

// 获取通知详情
router.get('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // 检查权限
    if (req.user?.role !== 'admin' && req.user?.role !== 'customer_service') {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    const notification = notifications.find(n => n.id === id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '通知不存在'
      });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('获取通知详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取通知详情失败'
    });
  }
});

// 删除通知
router.delete('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // 检查权限
    if (req.user?.role !== 'admin' && req.user?.role !== 'customer_service') {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    const index = notifications.findIndex(n => n.id === id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '通知不存在'
      });
    }

    notifications.splice(index, 1);

    res.json({
      success: true,
      message: '通知删除成功'
    });
  } catch (error) {
    console.error('删除通知失败:', error);
    res.status(500).json({
      success: false,
      message: '删除通知失败'
    });
  }
});

export default router;