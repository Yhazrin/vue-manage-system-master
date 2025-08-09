// src/routes/config.route.ts
import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { auth, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import { ConfigDAO } from '../dao/ConfigDao';

const router = Router();

// 权限中间件：仅允许管理员和客服访问
const requireManager = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'customer_service') {
        return res.status(403).json({
            success: false,
            error: '仅管理员和客服可访问此功能'
        });
    }
    next();
};

/**
 * @route  GET /api/config/commission
 * @desc   获取当前平台抽成比例（保持向后兼容）
 * @access 顶级管理员
 */
router.get(
    '/commission',
    auth,
    requireManager,
    async (req: any, res, next) => {
        try {
            const commission_rate = await ConfigDAO.getCommissionRate();
            res.json({ success: true, commission_rate });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * @route  GET /api/config/commission-rates
 * @desc   获取分别的订单抽成和礼物抽成比例
 * @access 顶级管理员
 */
router.get(
    '/commission-rates',
    auth,
    requireManager,
    async (req: any, res, next) => {
        try {
            const rates = await ConfigDAO.getCommissionRates();
            res.json({ success: true, ...rates });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * @route  PATCH /api/config/commission
 * @desc   修改平台抽成比例（保持向后兼容）
 * @body   { commission_rate }
 * @access 顶级管理员
 */
router.patch(
    '/commission',
    auth,
    requireManager,
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

/**
 * @route  PATCH /api/config/commission-rates
 * @desc   分别修改订单抽成和礼物抽成比例
 * @body   { order_commission_rate?, gift_commission_rate? }
 * @access 顶级管理员
 */
router.patch(
    '/commission-rates',
    auth,
    requireManager,
    body('order_commission_rate').optional().isFloat({ min: 0, max: 100 }),
    body('gift_commission_rate').optional().isFloat({ min: 0, max: 100 }),
    async (req: any, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        try {
            const { order_commission_rate, gift_commission_rate } = req.body;
            
            // 如果两个都提供了，同时更新
            if (order_commission_rate !== undefined && gift_commission_rate !== undefined) {
                await ConfigDAO.updateCommissionRates(
                    parseFloat(order_commission_rate), 
                    parseFloat(gift_commission_rate)
                );
            } 
            // 只更新订单抽成
            else if (order_commission_rate !== undefined) {
                await ConfigDAO.updateOrderCommissionRate(parseFloat(order_commission_rate));
            }
            // 只更新礼物抽成
            else if (gift_commission_rate !== undefined) {
                await ConfigDAO.updateGiftCommissionRate(parseFloat(gift_commission_rate));
            }
            else {
                return res.status(400).json({ 
                    success: false, 
                    error: '至少需要提供 order_commission_rate 或 gift_commission_rate' 
                });
            }
            
            // 返回更新后的抽成率
            const rates = await ConfigDAO.getCommissionRates();
            res.json({ success: true, ...rates });
        } catch (err) {
            next(err);
        }
    }
);

export default router;
