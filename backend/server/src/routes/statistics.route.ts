// server/src/routes/statistics.route.ts
// 修改时间: 2024-01-01
import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { pool } from '../db';
import { auth, AuthRequest } from '../middleware/auth'; // 导入权限中间件
import { ConfigDAO } from "../dao/ConfigDao";

const statisticsRouter = Router();

// 根路径 - 返回可用的统计接口
statisticsRouter.get('/', (req: Request, res: Response) => {
    res.json({
        success: true,
        message: '统计分析API',
        endpoints: {
            global: '/api/statistics/global',
            user: '/api/statistics/user/:userId',
            player: '/api/statistics/player/:playerId'
        }
    });
});

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
 * @route   GET /api/statistics/global
 * @desc    查询全局统计数据（总收入、总抽成、总订单数等）
 * @access  仅 authority 为 1 的管理员可访问
 */
statisticsRouter.get(
    '/global',
    auth,
    requireTopManager,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            // 1. 拉取抽成比例
            const commissionRate = await ConfigDAO.getCommissionRate(); // e.g. 10.00

            // 2. 基础统计
            const [[{ total_orders }]]: any = await pool.execute(
                `SELECT COUNT(*) as total_orders FROM orders`
            );
            const [[{ total_revenue }]]: any = await pool.execute(
                `SELECT IFNULL(SUM(amount), 0) as total_revenue
                 FROM orders
                 WHERE status = 'completed'`
            );
            const [[{ total_users }]]: any = await pool.execute(
                `SELECT COUNT(*) as total_users FROM users`
            );
            const [[{ total_players }]]: any = await pool.execute(
                `SELECT COUNT(*) as total_players FROM players`
            );

            // 3. 订单平台抽成
            const [[{ order_platform_fee }]]: any = await pool.execute(
                `SELECT IFNULL(SUM(amount * ? / 100), 0) as order_platform_fee
                 FROM orders
                 WHERE status = 'completed'`,
                [commissionRate]
            );

            // 4. 提现统计（平台抽成 & 玩家到手）
            const [[{ withdraw_platform_fee }]]: any = await pool.execute(
                `SELECT IFNULL(SUM(platform_fee), 0) as withdraw_platform_fee
                 FROM withdrawals`
            );
            const [[{ total_withdrawn }]]: any = await pool.execute(
                `SELECT IFNULL(SUM(final_amount), 0) as total_withdrawn
                   FROM withdrawals 
                  WHERE status = 'approved'`
            );

            // 5. 打赏统计（总额、平台抽成、到手收入）
            const [[{ total_gift_amount }]]: any = await pool.execute(
                `SELECT IFNULL(SUM(total_price), 0) as total_gift_amount 
                   FROM gift_records`
            );
            const [[{ gift_platform_fee }]]: any = await pool.execute(
                `SELECT IFNULL(SUM(platform_fee), 0) as gift_platform_fee 
                   FROM gift_records`
            );
            const [[{ gift_net }]]: any = await pool.execute(
                `SELECT IFNULL(SUM(final_amount), 0) as gift_net 
                   FROM gift_records`
            );

            // 6. 汇总平台总抽成
            const total_platform_profit =
                Number(order_platform_fee) +
                Number(withdraw_platform_fee) +
                Number(gift_platform_fee);

            res.json({
                success: true,
                global: {
                    total_orders,
                    total_revenue,
                    total_users,
                    total_players,

                    // 提现和到手
                    withdraw_platform_fee,
                    total_withdrawn,

                    // 订单抽成
                    order_platform_fee,

                    // 打赏相关
                    total_gift_amount,
                    gift_platform_fee,
                    gift_net,

                    // 合计平台抽成
                    total_platform_profit
                }
            });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * @route   GET /api/statistics/user/:userId
 * @desc    查询指定用户订单统计
 * @access  仅顶级管理员可访问
 */
statisticsRouter.get(
    '/user/:userId',
    auth,
    requireTopManager,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const userId = Number(req.params.userId);
            if (isNaN(userId)) {
                return res.status(400).json({ success: false, error: '无效的用户ID' });
            }

            const [[{ user_order_count }]]: any = await pool.execute(
                `SELECT COUNT(*) as user_order_count FROM orders WHERE user_id = ?`,
                [userId]
            );

            // 查询用户总消费金额
            const [[{ user_total_spent }]]: any = await pool.execute(
                `SELECT IFNULL(SUM(amount), 0) as user_total_spent FROM orders WHERE user_id = ? AND status = 'completed'`,
                [userId]
            );

            res.json({
                success: true,
                userId,
                user_order_count,
                user_total_spent
            });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * @route   GET /api/statistics/player/:playerId
 * @desc    查询指定陪玩收入与订单统计
 * @access  管理员可访问任意陪玩数据，陪玩只能访问自己的数据
 */
statisticsRouter.get(
    '/player/:playerId',
    auth,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const playerId = Number(req.params.playerId);
            if (isNaN(playerId)) {
                return res.status(400).json({ success: false, error: '无效的陪玩ID' });
            }

            // 权限检查：管理员可以查看任意陪玩数据，陪玩只能查看自己的数据
            if (req.user?.role === 'player' && req.user.id !== playerId) {
                return res.status(403).json({ 
                    success: false, 
                    error: '陪玩只能查看自己的统计数据' 
                });
            }
            
            if (req.user?.role !== 'manager' && req.user?.role !== 'player') {
                return res.status(403).json({ 
                    success: false, 
                    error: '权限不足' 
                });
            }

            // 订单总数
            const [[{ total_order_count }]]: any = await pool.execute(
                `SELECT COUNT(*) as total_order_count FROM orders WHERE player_id = ?`,
                [playerId]
            );

            // 总接单金额
            const [[{ total_earnings }]]: any = await pool.execute(
                `SELECT IFNULL(SUM(amount), 0) as total_earnings FROM orders WHERE player_id = ? AND status = 'completed'`,
                [playerId]
            );

            // 今日订单数
            const [[{ today_orders }]]: any = await pool.execute(
                `SELECT COUNT(*) as today_orders FROM orders WHERE player_id = ? AND DATE(created_at) = CURDATE()`,
                [playerId]
            );

            // 本月收入
            const [[{ monthly_income }]]: any = await pool.execute(
                `SELECT IFNULL(SUM(amount), 0) as monthly_income FROM orders WHERE player_id = ? AND status = 'completed' AND YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())`,
                [playerId]
            );

            // 服务评分 (假设有评分表，这里先返回固定值)
            const service_rating = 4.8;

            // 待处理事项 (待接单的订单数)
            const [[{ pending_tasks }]]: any = await pool.execute(
                `SELECT COUNT(*) as pending_tasks FROM orders WHERE player_id = ? AND status = 'pending'`,
                [playerId]
            );

            // 总提现金额
            const [[{ total_withdrawn }]]: any = await pool.execute(
                `SELECT IFNULL(SUM(amount), 0) as total_withdrawn FROM withdrawals WHERE player_id = ? AND status = 'approved'`,
                [playerId]
            );

            // 平台总抽成
            const [[{ platform_profit }]]: any = await pool.execute(
                `SELECT IFNULL(SUM(platform_fee), 0) as platform_profit FROM withdrawals WHERE player_id = ?`,
                [playerId]
            );

            res.json({
                success: true,
                playerId,
                total_order_count,
                total_earnings,
                total_withdrawn,
                platform_profit,
                // 新增字段用于陪玩工作台
                todayOrders: today_orders,
                monthlyIncome: monthly_income,
                serviceRating: service_rating,
                pendingTasks: pending_tasks
            });
        } catch (err) {
            next(err);
        }
    }
);

export default statisticsRouter;