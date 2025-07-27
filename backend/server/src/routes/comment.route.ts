// backend/server/src/routes/comment.route.ts
import { Router } from 'express';
import { CommentDAO } from '../dao/CommentDao';

const router = Router();

/**
 * @route   POST /api/comments
 * @desc    创建新评论
 * @body    { user_id, player_id, order_id, content, rating }
 */
router.post('/', async (req, res, next) => {
    try {
        const { user_id, player_id, order_id, content, rating } = req.body;
        const id = await CommentDAO.create({ user_id, player_id, order_id, content, rating });
        res.status(201).json({ success: true, id });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/comments/:id
 * @desc    获取单个评论
 */
router.get('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const comment = await CommentDAO.findById(id);
        if (!comment) return res.status(404).json({ success: false, error: '评论不存在' });
        res.json({ success: true, comment });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/comments/order/:orderId
 * @desc    获取指定订单的所有评论
 */
router.get('/order/:orderId', async (req, res, next) => {
    try {
        const orderId = req.params.orderId;
        const comments = await CommentDAO.findByOrder(orderId);
        res.json({ success: true, comments });
    } catch (err) {
        next(err);
    }
});

export default router;
