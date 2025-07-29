// backend/server/src/routes/order.route.ts
import { Router } from 'express';
import { OrderDAO } from '../dao/OrderDao';

const router = Router();

/**
 * @route   POST /api/orders
 * @desc    创建新订单
 * @body    { order_id, user_id, player_id, game_id, status }
 */
router.post('/', async (req, res, next) => {
    try {
        const { order_id, user_id, player_id, game_id, service_id } = req.body;
        const id = await OrderDAO.create({ order_id, user_id, player_id, game_id, service_id });
        res.status(201).json({ success: true, order_id: id });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/orders/:order_id
 * @desc    获取单个订单
 */
router.get('/:order_id', async (req, res, next) => {
    try {
        const { order_id } = req.params;
        const order = await OrderDAO.findById(order_id);
        if (!order) return res.status(404).json({ success: false, error: '订单不存在' });
        res.json({ success: true, order });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/orders
 * @desc    分页查询订单列表
 * @query   page, pageSize, status?
 */
router.get('/', async (req, res, next) => {
    try {
        const page = Number(req.query.page) || 1;
        const pageSize = Number(req.query.pageSize) || 20;
        const status = req.query.status as string | undefined;
        const result = await OrderDAO.findAll(page, pageSize, status as any);
        res.json({ success: true, ...result });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   PATCH /api/orders/:order_id/status
 * @desc    更新订单状态
 * @body    { status }
 */
router.patch('/:order_id/status', async (req, res, next) => {
    try {
        const { order_id } = req.params;
        const { status } = req.body;
        await OrderDAO.updateStatus(order_id, status);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   DELETE /api/orders/:order_id
 * @desc    删除订单
 */
router.delete('/:order_id', async (req, res, next) => {
    try {
        const { order_id } = req.params;
        await OrderDAO.deleteById(order_id);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

export default router;
