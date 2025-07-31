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
            status: 'pending'
        });
        
        res.status(201).json({ success: true, order_id: orderId, message: '订单创建成功' });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/orders/player
 * @desc    获取陪玩的订单列表
 * @query   status?, playerId?
 */
router.get('/player', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        console.log('=== /api/orders/player 接口调用开始 ===');
        console.log('当前时间:', new Date().toISOString());
        console.log('用户信息:', JSON.stringify(req.user, null, 2));
        console.log('查询参数:', JSON.stringify(req.query, null, 2));
        console.log('请求头:', JSON.stringify(req.headers, null, 2));
        
        const status = req.query.status as string | undefined;
        const queryPlayerId = req.query.playerId as string | undefined;
        
        if (!req.user?.id) {
            console.log('❌ 用户未登录');
            return res.status(401).json({ success: false, error: '用户未登录' });
        }
        
        let player_id: number;
        
        // 权限检查：陪玩只能查看自己的订单，管理员可以查看指定陪玩的订单
        if (req.user.role === 'player') {
            player_id = req.user.id;
            console.log('✅ 陪玩用户查看自己的订单, playerId:', player_id);
        } else if (req.user.role === 'manager' && queryPlayerId) {
            player_id = parseInt(queryPlayerId);
            console.log('✅ 管理员查看指定陪玩订单, playerId:', player_id);
            if (isNaN(player_id)) {
                console.log('❌ 无效的陪玩ID:', queryPlayerId);
                return res.status(400).json({ success: false, error: '无效的陪玩ID' });
            }
        } else {
            console.log('❌ 权限不足或参数缺失, role:', req.user.role, 'playerId:', queryPlayerId);
            return res.status(403).json({ 
                success: false, 
                error: '权限不足：只有陪玩可以查看自己的订单，管理员可以查看指定陪玩的订单' 
            });
        }
        
        console.log('=== 准备调用 OrderDAO.findByPlayerId ===');
        console.log('参数: player_id =', player_id, ', status =', status);
        
        // 获取陪玩的订单列表
        const orders = await OrderDAO.findByPlayerId(player_id, status as any);
        
        console.log('=== OrderDAO.findByPlayerId 调用完成 ===');
        console.log('返回订单数量:', orders.length);
        
        res.json({ success: true, orders });
    } catch (err) {
        console.error('=== /api/orders/player 接口发生错误 ===');
        console.error('错误详情:', err);
        console.error('错误消息:', (err as any).message);
        console.error('错误堆栈:', (err as any).stack);
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
router.patch('/:order_id/status', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { order_id } = req.params;
        const { status } = req.body;
        
        if (!req.user?.id) {
            return res.status(401).json({ success: false, error: '用户未登录' });
        }
        
        // 获取订单信息以验证权限
        const order = await OrderDAO.findById(order_id);
        if (!order) {
            return res.status(404).json({ success: false, error: '订单不存在' });
        }
        
        // 权限检查：只有相关的陪玩或用户可以更新订单状态
        if (req.user.role === 'player') {
            if (order.player_id !== req.user.id) {
                return res.status(403).json({ success: false, error: '只能操作自己的订单' });
            }
        } else if (req.user.role === 'user') {
            if (order.user_id !== req.user.id) {
                return res.status(403).json({ success: false, error: '只能操作自己的订单' });
            }
        } else if (req.user.role !== 'manager') {
            return res.status(403).json({ success: false, error: '权限不足' });
        }
        
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
