// src/routes/config.route.ts
import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { auth, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import { ConfigDAO } from '../dao/ConfigDao';

const router = Router();

// 权限中间件：仅允许 authority 为 1 的管理员访问
const requireTopManager = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'manager' || req.user.authority !== 1) {
        return res.status(403).json({
            success: false,
            error: '仅顶级管理员可访问此统计数据'
        });
    }
    next();
};

/**
 * @route  PATCH /api/config/commission
 * @desc   修改平台抽成比例
 * @body   { commission_rate }
 * @access 顶级管理员
 */
router.patch(
    '/commission',
    auth,
    requireTopManager,
    body('commission_rate').isFloat({ min: 0, max: 100 }),
    async (req: any, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        try {
            const rate = parseFloat(req.body.commission_rate);
            await ConfigDAO.updateCommissionRate(rate);
            res.json({ success: true, commission_rate: rate });
        } catch (err) {
            next(err);
        }
    }
);

export default router;
