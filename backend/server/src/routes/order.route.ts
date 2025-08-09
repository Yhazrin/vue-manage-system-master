// backend/server/src/routes/order.route.ts
import { Router } from 'express';
import { OrderDAO } from '../dao/OrderDao';
import { auth, AuthRequest } from '../middleware/auth';
import { Response, NextFunction } from 'express';
import { pool } from '../db';

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
        
        // 验证必填字段
        if (!player_id || !service_id || !hours || !amount) {
            return res.status(400).json({ 
                success: false, 
                error: '缺少必填字段：player_id, service_id, hours, amount' 
            });
        }
        
        // 验证时长是否符合服务的最低要求
        const { ServiceDAO } = require('../dao/ServiceDao');
        const service = await ServiceDAO.findById(service_id);
        
        if (!service) {
            return res.status(400).json({ 
                success: false, 
                error: '指定的服务不存在' 
            });
        }
        
        // 检查用户提交的时长是否满足最低要求
        const requestedHours = Number(hours);
        const minHours = Number(service.hours);
        
        if (requestedHours < minHours) {
            return res.status(400).json({ 
                success: false, 
                error: `预约时长不能少于${minHours}小时，您当前选择的是${requestedHours}小时` 
            });
        }
        
        // 验证陪玩是否存在且提供该服务
        if (service.player_id !== Number(player_id)) {
            return res.status(400).json({ 
                success: false, 
                error: '该陪玩不提供指定的服务' 
            });
        }
        
        // 生成唯一订单ID (限制在20字符内)
        const timestamp = Date.now().toString().slice(-8); // 取时间戳后8位
        const random = Math.random().toString(36).substr(2, 6); // 6位随机字符
        const order_id = `ORD${timestamp}${random}`; // ORD + 8位时间戳 + 6位随机 = 17字符
        
        console.log('生成的订单ID:', order_id);
        console.log('订单ID长度:', order_id.length);
        console.log('时长验证通过:', { requestedHours, minHours });
        
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
 * @route   GET /api/orders/player/users
 * @desc    陪玩获取用户列表（用于创建订单）
 * @access  仅陪玩可访问
 */
router.get('/player/users', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // 权限判断：仅陪玩可访问
        if (req.user?.role !== 'player') {
            return res.status(403).json({ success: false, error: '仅陪玩可访问此接口' });
        }

        // 获取所有普通用户
        const [users]: any = await pool.execute(`
            SELECT id, name, phone_num, photo_img
            FROM users 
            WHERE role = 'user' AND status = 1
            ORDER BY name
        `);

        res.json({ success: true, users });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   POST /api/orders/player/create-completed
 * @desc    陪玩创建已完成订单
 * @body    { order_id, user_id, player_id, game_id, amount, status, service_hours, description }
 */
router.post('/player/create-completed', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        console.log('收到陪玩创建已完成订单请求:', req.body);
        const { 
            order_id, user_id, player_id, game_id, amount, status, service_hours, description,
            is_anonymous, customer_name, customer_phone, customer_note 
        } = req.body;
        
        if (!req.user?.id) {
            return res.status(401).json({ success: false, error: '用户未登录' });
        }
        
        if (req.user?.role !== 'player') {
            return res.status(403).json({ success: false, error: '只有陪玩可以创建已完成订单' });
        }
        
        if (req.user.id !== player_id) {
            return res.status(403).json({ success: false, error: '只能为自己创建订单' });
        }
        
        // 验证必填字段
        if (!order_id || !player_id || !game_id || !amount || !service_hours) {
            return res.status(400).json({ 
                success: false, 
                error: '缺少必填字段：order_id, player_id, game_id, amount, service_hours' 
            });
        }
        
        // 验证用户信息并处理匿名用户自动注册
        let finalUserId = user_id;
        
        if (is_anonymous) {
            // 匿名用户验证
            if (!customer_name || !customer_phone) {
                return res.status(400).json({ 
                    success: false, 
                    error: '匿名用户需要提供客户姓名和电话' 
                });
            }
            
            // 检查是否已存在相同手机号的用户
            const { UserDAO } = require('../dao/UserDao');
            const existingUser = await UserDAO.findByPhone(customer_phone);
            
            if (existingUser) {
                // 如果用户已存在，使用现有用户ID
                finalUserId = existingUser.id;
                console.log(`匿名用户手机号 ${customer_phone} 已存在，使用现有用户ID: ${finalUserId}`);
            } else {
                // 自动创建新用户账号
                const bcrypt = require('bcrypt');
                // 生成默认密码（手机号后6位）
                const defaultPassword = customer_phone.slice(-6);
                const hashedPassword = await bcrypt.hash(defaultPassword, 10);
                
                finalUserId = await UserDAO.create(
                    customer_name,
                    hashedPassword,
                    customer_phone,
                    null, // photo_img
                    'user', // role
                    defaultPassword // plain_passwd
                );
                
                console.log(`为匿名用户自动创建账号: ${customer_name} (${customer_phone}), 用户ID: ${finalUserId}, 默认密码: ${defaultPassword}`);
            }
        } else {
            // 注册用户验证
            if (!user_id) {
                return res.status(400).json({ 
                    success: false, 
                    error: '注册用户需要提供user_id' 
                });
            }
            
            const { UserDAO } = require('../dao/UserDao');
            const user = await UserDAO.findById(user_id);
            if (!user) {
                return res.status(400).json({ 
                    success: false, 
                    error: '指定的用户不存在' 
                });
            }
            finalUserId = user_id;
        }
        
        // 验证游戏是否存在
        const { GameDAO } = require('../dao/GameDao');
        const game = await GameDAO.findById(game_id);
        if (!game) {
            return res.status(400).json({ 
                success: false, 
                error: '指定的游戏不存在' 
            });
        }
        
        // 检查订单ID是否已存在
        const existingOrder = await OrderDAO.findByOrderId(order_id);
        if (existingOrder) {
            return res.status(400).json({ 
                success: false, 
                error: '订单ID已存在，请重试' 
            });
        }
        
        // 创建待审核订单
        const orderId = await OrderDAO.createCompleted({
            order_id,
            user_id: finalUserId,
            player_id,
            game_id,
            amount,
            status: 'pending_review', // 修改为待审核状态
            service_hours,
            description: description || '陪玩服务已完成',
            created_at: new Date(),
            customer_name: is_anonymous ? customer_name : null,
            customer_phone: is_anonymous ? customer_phone : null,
            customer_note: is_anonymous ? customer_note : null
        });
        
        res.status(201).json({ 
            success: true, 
            order_id: orderId, 
            message: '订单创建成功，等待管理员审核' 
        });
    } catch (err) {
        console.error('创建已完成订单失败:', err);
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
        
        // 权限检查：陪玩只能查看自己的订单，管理员和客服可以查看指定陪玩的订单
        if (req.user.role === 'player') {
            player_id = req.user.id;
            console.log('✅ 陪玩用户查看自己的订单, playerId:', player_id);
        } else if ((req.user.role === 'admin' || req.user.role === 'customer_service') && queryPlayerId) {
            player_id = parseInt(queryPlayerId);
            console.log('✅ 管理员或客服查看指定陪玩订单, playerId:', player_id);
            if (isNaN(player_id)) {
                console.log('❌ 无效的陪玩ID:', queryPlayerId);
                return res.status(400).json({ success: false, error: '无效的陪玩ID' });
            }
        } else {
            console.log('❌ 权限不足或参数缺失, role:', req.user.role, 'playerId:', queryPlayerId);
            return res.status(403).json({ 
                success: false, 
                error: '权限不足：只有陪玩可以查看自己的订单，管理员和客服可以查看指定陪玩的订单' 
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
        } else if (req.user.role !== 'admin' && req.user.role !== 'customer_service') {
            return res.status(403).json({ success: false, error: '权限不足' });
        }
        
        // 特殊处理：陪玩接受订单时直接进入in_progress状态
        if (req.user.role === 'player' && status === 'accepted') {
            await OrderDAO.updateStatus(order_id, 'in_progress');
        } else {
            await OrderDAO.updateStatus(order_id, status);
        }
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   PATCH /api/orders/:order_id/payment
 * @desc    更新订单打款状态
 * @body    { is_paid }
 */
router.patch('/:order_id/payment', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { order_id } = req.params;
        const { is_paid } = req.body;
        
        if (!req.user?.id) {
            return res.status(401).json({ success: false, error: '用户未登录' });
        }
        
        // 只有管理员和客服可以更新打款状态
        if (req.user.role !== 'admin' && req.user.role !== 'customer_service') {
            return res.status(403).json({ success: false, error: '只有管理员和客服可以更新打款状态' });
        }
        
        // 获取订单信息以验证订单存在
        const order = await OrderDAO.findById(order_id);
        if (!order) {
            return res.status(404).json({ success: false, error: '订单不存在' });
        }
        
        await OrderDAO.updatePaymentStatus(order_id, is_paid);
        res.json({ success: true, message: '打款状态更新成功' });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   PATCH /api/orders/:order_id/confirm-end
 * @desc    确认结束订单（用户或陪玩）
 * @body    { role: 'user' | 'player' }
 */
router.patch('/:order_id/confirm-end', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { order_id } = req.params;
        
        if (!req.user?.id) {
            return res.status(401).json({ success: false, error: '用户未登录' });
        }
        
        // 获取订单信息以验证权限
        const order = await OrderDAO.findById(order_id);
        if (!order) {
            return res.status(404).json({ success: false, error: '订单不存在' });
        }
        
        // 只有进行中的订单才能确认结束
        if (order.status !== 'in_progress') {
            return res.status(400).json({ success: false, error: '只有进行中的订单才能确认结束' });
        }
        
        // 根据用户角色确认结束
        if (req.user.role === 'user' && order.user_id === req.user.id) {
            await OrderDAO.confirmEndByUser(order_id);
            res.json({ success: true, message: '用户确认结束成功' });
        } else if (req.user.role === 'player' && order.player_id === req.user.id) {
            await OrderDAO.confirmEndByPlayer(order_id);
            res.json({ success: true, message: '陪玩确认结束成功' });
        } else {
            return res.status(403).json({ success: false, error: '只能确认结束自己的订单' });
        }
    } catch (err) {
        next(err);
    }
});

/**
 * @route   PATCH /api/orders/:order_id/service-hours
 * @desc    更新订单实际服务时长
 * @body    { service_hours: number }
 */
router.patch('/:order_id/service-hours', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { order_id } = req.params;
        const { service_hours } = req.body;
        
        if (!req.user?.id) {
            return res.status(401).json({ success: false, error: '用户未登录' });
        }
        
        // 只有管理员、客服和相关陪玩可以更新服务时长
        if (req.user.role !== 'admin' && req.user.role !== 'customer_service' && req.user.role !== 'player') {
            return res.status(403).json({ success: false, error: '权限不足' });
        }
        
        // 获取订单信息以验证权限
        const order = await OrderDAO.findById(order_id);
        if (!order) {
            return res.status(404).json({ success: false, error: '订单不存在' });
        }
        
        // 如果是陪玩，只能更新自己的订单
        if (req.user.role === 'player' && order.player_id !== req.user.id) {
            return res.status(403).json({ success: false, error: '只能更新自己的订单服务时长' });
        }
        
        // 验证服务时长
        if (!service_hours || service_hours <= 0) {
            return res.status(400).json({ success: false, error: '服务时长必须大于0' });
        }
        
        await OrderDAO.updateServiceHours(order_id, service_hours);
        res.json({ 
            success: true, 
            message: '服务时长更新成功',
            service_hours
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   PATCH /api/orders/:order_id/review
 * @desc    审核订单（管理员或客服）
 * @body    { approved: boolean, note?: string }
 */
router.patch('/:order_id/review', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { order_id } = req.params;
        const { approved, note } = req.body;
        
        if (!req.user?.id) {
            return res.status(401).json({ success: false, error: '用户未登录' });
        }
        
        // 只有管理员和客服可以审核订单
        if (req.user.role !== 'admin' && req.user.role !== 'customer_service') {
            return res.status(403).json({ success: false, error: '只有管理员和客服可以审核订单' });
        }
        
        // 获取订单信息以验证订单存在
        const order = await OrderDAO.findById(order_id);
        if (!order) {
            return res.status(404).json({ success: false, error: '订单不存在' });
        }
        
        // 只有待审核的订单才能审核
        if (order.status !== 'pending_review') {
            return res.status(400).json({ success: false, error: '只有待审核的订单才能审核' });
        }
        
        await OrderDAO.reviewOrder(order_id, approved, req.user.id, note);
        
        const action = approved ? '通过' : '拒绝';
        res.json({ 
            success: true, 
            message: `订单审核${action}成功`,
            newStatus: approved ? 'completed' : 'cancelled'
        });
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
