// backend/server/src/routes/giftRecord.route.ts
import { Router } from 'express';
import { GiftRecordDAO } from '../dao/GiftRecordDao';
import { auth, AuthRequest } from '../middleware/auth'; // 导入权限中间件
import { Request, Response, NextFunction } from "express";
import {body, param, validationResult} from 'express-validator';
import { pool } from '../db';

const router = Router();

// 根路径 - 返回可用的礼物记录接口
router.get('/', (req: Request, res: Response) => {
    res.json({
        success: true,
        message: '礼物记录API',
        endpoints: {
            create: 'POST /api/gift-records',
            getById: 'GET /api/gift-records/:id',
            getByUser: 'GET /api/gift-records/user/:userId'
        }
    });
});

/**
 * @route   POST /api/gift-records
 * @desc    创建打赏记录
 * @body    { player_id, gift_id, quantity, order_id? }
 * @access  登录用户（role = 'user'）
 */
router.post(
    '/',
    auth,
    [
        body('player_id').isInt().withMessage('player_id 必须是整数'),
        body('gift_id').isInt().withMessage('gift_id 必须是整数'),
        body('quantity').isInt({ min: 1 }).withMessage('quantity 必须是大于0的整数'),
        body('order_id').optional().isString().withMessage('order_id 必须是字符串')
    ],
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
        try {
            // 只允许普通用户打赏
            if (req.user?.role !== 'user') {
                return res.status(403).json({ success: false, error: '无权限执行此操作' });
            }

            // 从 token 中获取 user_id，避免前端伪造
            const user_id = req.user.id;
            const { player_id, gift_id, quantity } = req.body;

            // 简单校验必填项
            if (!player_id || !gift_id || !quantity) {
                return res.status(400).json({ success: false, error: 'player_id, gift_id, quantity 为必填项' });
            }

            // DAO 内部会根据 gift_id 拿单价、计算 total_price；
            // 再读 commission_rate、计算 platform_fee、生成 final_amount
            const id = await GiftRecordDAO.create({
                user_id,
                player_id: Number(player_id),
                gift_id: Number(gift_id),
                quantity: Number(quantity)
            });

            res.status(201).json({ success: true, id });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * @route   GET /api/gift-records/:id
 * @desc    查询单条打赏记录
 * @access  登录用户或管理员
 */
router.get(
    '/:id',
    auth,
    [param('id').isInt().withMessage('id 必须是整数')],
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
        try {
            const id = Number(req.params.id);
            const record = await GiftRecordDAO.findById(id);
            if (!record) {
                return res.status(404).json({ success: false, error: '记录不存在' });
            }
            // 只有打赏发起者或管理员可以查看详情
            if (req.user?.role === 'user' && record.user_id !== req.user.id) {
                return res.status(403).json({ success: false, error: '无权限查看此记录' });
            }
            res.json({ success: true, record });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * @route   GET /api/gift-records/all
 * @desc    查询所有礼物记录（管理员专用）
 * @access  仅管理员可访问
 */
router.get(
    '/all',
    auth,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            // 仅管理员可查看所有记录
            if (req.user?.role !== 'manager') {
                return res.status(403).json({ success: false, error: '无权限查看所有礼物记录' });
            }
            
            // 获取所有礼物记录，包含关联信息
            const sql = `
                SELECT 
                    gr.*,
                    u.name as user_name,
                    p.name as player_name,
                    g.name as gift_name,
                    g.price as gift_price
                FROM gift_records gr
                LEFT JOIN users u ON gr.user_id = u.id
                LEFT JOIN players p ON gr.player_id = p.id
                LEFT JOIN gifts g ON gr.gift_id = g.id
                ORDER BY gr.created_at DESC
            `;
            const [rows]: any = await pool.execute(sql);
            res.json({ success: true, records: rows });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * @route   GET /api/gift-records/user/:userId
 * @desc    查询某用户所有打赏记录
 * @access  登录用户本人或管理员
 */
router.get(
    '/user/:userId',
    auth,
    [param('userId').isInt().withMessage('userId 必须是整数')],
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        try {
            const userId = Number(req.params.userId);
            if (isNaN(userId)) {
                return res.status(400).json({ success: false, error: '无效的用户ID' });
            }
            // 仅本人或顶级管理员可查
            if (
                !(req.user?.role === 'manager') &&
                !(req.user?.role === 'user' && req.user.id === userId)
            ) {
                return res.status(403).json({ success: false, error: '无权限查看此用户的打赏记录' });
            }
            const records = await GiftRecordDAO.findAllByUser(userId);
            res.json({ success: true, records });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * @route   GET /api/gift-records/player/:playerId
 * @desc    查询某陪玩收到的所有礼物记录
 * @access  陪玩本人或管理员
 */
router.get(
    '/player/:playerId',
    auth,
    [param('playerId').isInt().withMessage('playerId 必须是整数')],
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        try {
            const playerId = Number(req.params.playerId);
            if (isNaN(playerId)) {
                return res.status(400).json({ success: false, error: '无效的陪玩ID' });
            }
            
            // 仅陪玩本人或管理员可查
            if (
                !(req.user?.role === 'manager') &&
                !(req.user?.role === 'player' && req.user.id === playerId)
            ) {
                return res.status(403).json({ success: false, error: '无权限查看此陪玩的礼物记录' });
            }
            
            // 查询陪玩收到的礼物记录，包含关联信息
            const sql = `
                SELECT 
                    gr.*,
                    u.name as user_name,
                    g.name as gift_name,
                    g.price as gift_price
                FROM gift_records gr
                LEFT JOIN users u ON gr.user_id = u.id
                LEFT JOIN gifts g ON gr.gift_id = g.id
                WHERE gr.player_id = ?
                ORDER BY gr.created_at DESC
            `;
            const [rows]: any = await pool.execute(sql, [playerId]);
            res.json({ success: true, records: rows });
        } catch (err) {
            next(err);
        }
    }
);

export default router;
