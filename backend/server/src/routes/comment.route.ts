// backend/server/src/routes/comment.route.ts
import { Router } from 'express';
import { CommentDAO } from '../dao/CommentDao';
import { body, param, validationResult } from 'express-validator';
import { auth, AuthRequest } from '../middleware/auth';
import { Request, Response, NextFunction } from 'express';

const router = Router();

/**
 * @route   POST /api/comments
 * @desc    创建新评论
 * @access  登录用户
 */
router.post(
    '/',
    auth,
    [
        body('player_id').isInt().withMessage('player_id 必须是整数'),
        body('order_id').isString().notEmpty().withMessage('order_id 不能为空'),
        body('content').isString().notEmpty().withMessage('content 不能为空'),
        body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('rating 必须在1到5之间')
    ],
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
        if (req.user?.role !== 'user') return res.status(403).json({ success: false, error: '仅普通用户可发表评论' });

        try {
            const { player_id, order_id, content, rating } = req.body;
            const user_id = req.user.id;
            const id = await CommentDAO.create({ user_id, player_id, order_id, content, rating });
            res.status(201).json({ success: true, id });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * @route   GET /api/comments/:id
 * @desc    获取单个评论
 * @access  登录用户
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
            const comment = await CommentDAO.findById(id);
            if (!comment) return res.status(404).json({ success: false, error: '评论不存在' });
            res.json({ success: true, comment });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * @route   GET /api/comments/order/:orderId
 * @desc    获取指定订单的所有评论
 * @access  登录用户
 */
router.get(
    '/order/:orderId',
    auth,
    [param('orderId').isString().notEmpty().withMessage('orderId 不能为空')],
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
        try {
            const orderId = req.params.orderId;
            const comments = await CommentDAO.findByOrder(orderId);
            res.json({ success: true, comments });
        } catch (err) {
            next(err);
        }
    }
);

export default router;
