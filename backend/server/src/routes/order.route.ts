// backend/server/src/routes/order.route.ts
import { Router } from 'express';
import { OrderDAO } from '../dao/OrderDao';
import { auth, AuthRequest } from '../middleware/auth';
import { Response, NextFunction } from 'express';

const router = Router();

/**
 * @route   POST /api/orders
 * @desc    创建新订单
 * @body    { player_id, service_id, hours, amount, description }
 */
router.post('/', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        console.log('收到创建订单请求:', req.body);
        const { player_id, service_id, hours, amount, description } = req.body;
        const user_id = req.user?.id;
        
        if (!user_id) {
            return res.status(401).json({ success: false, error: '用户未登录' });
        }
        
        if (req.user?.role !== 'user') {
            return res.status(403).json({ success: false, error: '只有普通用户可以创建订单' });
        }
        
        // 生成唯一订单ID (限制在20字符内)
        const timestamp = Date.now().toString().slice(-8); // 取时间戳后8位
        const random = Math.random().toString(36).substr(2, 6); // 6位随机字符
        const order_id = `ORD${timestamp}${random}`; // ORD + 8位时间戳 + 6位随机 = 17字符
        
        console.log('生成的订单ID:', order_id);
        console.log('订单ID长度:', order_id.length);
        
        // 创建订单
        const orderId = await OrderDAO.create({
            order_id,
            user_id,
            player_id,
            service_id,
            amount,
            status: '进行中'
        });
        
        res.status(201).json({ success: true, order_id: orderId, message: '订单创建成功' });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/orders/player
 * @desc    获取陪玩的订单列表
 * @query   status?
 */
router.get('/player', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const player_id = req.user?.id;
        const status = req.query.status as string | undefined;
        
        if (!player_id) {
            return res.status(401).json({ success: false, error: '用户未登录' });
        }
        
        if (req.user?.role !== 'player') {
            return res.status(403).json({ success: false, error: '只有陪玩可以查看订单' });
        }
        
        // 获取陪玩的订单列表
        const orders = await OrderDAO.findByPlayerId(player_id, status as any);
        res.json({ success: true, orders });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/orders/user
 * @desc    获取用户的订单列表
 * @query   status?
 */
router.get('/user', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const user_id = req.user?.id;
        const status = req.query.status as string | undefined;
        
        if (!user_id) {
            return res.status(401).json({ success: false, error: '用户未登录' });
        }
        
        if (req.user?.role !== 'user') {
            return res.status(403).json({ success: false, error: '只有普通用户可以查看订单' });
        }
        
        // 获取用户的订单列表
        const orders = await OrderDAO.findByUserId(user_id, status as any);
        res.json({ success: true, orders });
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
