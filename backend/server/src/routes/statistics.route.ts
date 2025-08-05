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
            // 获取时间范围参数
            const timeRange = req.query.timeRange as string || 'month';
            
            // 根据时间范围构建WHERE条件
            let timeCondition = '';
            switch (timeRange) {
                case 'day':
                    timeCondition = 'AND DATE(created_at) = CURDATE()';
                    break;
                case 'week':
                    timeCondition = 'AND YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)';
                    break;
                case 'month':
                    timeCondition = 'AND YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())';
                    break;
                case 'year':
                    timeCondition = 'AND YEAR(created_at) = YEAR(CURDATE())';
                    break;
                default:
                    timeCondition = ''; // 全部时间
            }

            // 1. 拉取抽成比例
            const commissionRate = await ConfigDAO.getCommissionRate(); // e.g. 10.00

            // 2. 基础统计
            const [[{ total_orders }]]: any = await pool.execute(
                `SELECT COUNT(*) as total_orders FROM orders WHERE 1=1 ${timeCondition}`
            );
            
            // 订单收入（已完成的订单）
            const [[{ order_revenue }]]: any = await pool.execute(
                `SELECT IFNULL(SUM(amount), 0) as order_revenue
                 FROM orders
                 WHERE status = 'completed' ${timeCondition}`
            );
            
            // 礼物收入
            const [[{ gift_revenue }]]: any = await pool.execute(
                `SELECT IFNULL(SUM(total_price), 0) as gift_revenue 
                   FROM gift_records WHERE 1=1 ${timeCondition}`
            );
            
            // 流水总量 = 订单收入 + 礼物收入
            const total_revenue = Number(order_revenue) + Number(gift_revenue);
            
            const [[{ total_users }]]: any = await pool.execute(
                `SELECT COUNT(*) as total_users FROM users`
            );
            const [[{ total_players }]]: any = await pool.execute(
                `SELECT COUNT(*) as total_players FROM players`
            );

            // 3. 订单平台抽成（从已完成的订单中计算，假设平台抽成比例为10%）
            const [[{ order_platform_fee }]]: any = await pool.execute(
                `SELECT IFNULL(SUM(amount * 0.1), 0) as order_platform_fee
                 FROM orders 
                 WHERE status = 'completed' ${timeCondition}`
            );

            // 4. 提现统计（平台抽成 & 玩家到手）
            const [[{ withdraw_platform_fee }]]: any = await pool.execute(
                `SELECT IFNULL(SUM(platform_fee), 0) as withdraw_platform_fee
                 FROM withdrawals WHERE 1=1 ${timeCondition}`
            );
            const [[{ total_withdrawn }]]: any = await pool.execute(
                `SELECT IFNULL(SUM(final_amount), 0) as total_withdrawn
                   FROM withdrawals 
                  WHERE status = '已打款' ${timeCondition}`
            );

            // 5. 打赏统计（总额、平台抽成、到手收入）
            const [[{ total_gift_amount }]]: any = await pool.execute(
                `SELECT IFNULL(SUM(total_price), 0) as total_gift_amount 
                   FROM gift_records WHERE 1=1 ${timeCondition}`
            );
            const [[{ gift_platform_fee }]]: any = await pool.execute(
                `SELECT IFNULL(SUM(platform_fee), 0) as gift_platform_fee 
                   FROM gift_records WHERE 1=1 ${timeCondition}`
            );
            const [[{ gift_net }]]: any = await pool.execute(
                `SELECT IFNULL(SUM(final_amount), 0) as gift_net 
                   FROM gift_records WHERE 1=1 ${timeCondition}`
            );

            // 6. 提现记录数量统计（所有提现记录，不仅仅是待审核的）
            const [[{ total_withdrawal_requests }]]: any = await pool.execute(
                `SELECT COUNT(*) as total_withdrawal_requests FROM withdrawals WHERE 1=1 ${timeCondition}`
            );

            // 7. 礼物类型数量统计
            const [[{ total_gift_types }]]: any = await pool.execute(
                `SELECT COUNT(*) as total_gift_types FROM gifts`
            );

            // 8. 汇总平台总抽成
            const total_platform_profit =
                Number(order_platform_fee) +
                Number(withdraw_platform_fee) +
                Number(gift_platform_fee);

            res.json({
                success: true,
                global: {
                    total_orders,
                    total_revenue, // 流水总量 = 订单收入 + 礼物收入
                    order_revenue, // 订单收入（单独）
                    total_users,
                    total_players,

                    // 提现和到手
                    withdraw_platform_fee,
                    total_withdrawn,
                    total_withdrawal_requests, // 新增：所有提现记录数量

                    // 订单抽成
                    order_platform_fee,

                    // 打赏相关
                    total_gift_amount,
                    gift_platform_fee,
                    gift_net,
                    total_gift_types, // 新增：礼物类型数量

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

            // 总接单金额（订单收入）
            const [[{ order_earnings }]]: any = await pool.execute(
                `SELECT IFNULL(SUM(amount), 0) as order_earnings FROM orders WHERE player_id = ? AND status = 'completed'`,
                [playerId]
            );

            // 总礼物收入（陪玩实际收入，扣除平台抽成后）
            const [[{ gift_earnings }]]: any = await pool.execute(
                `SELECT IFNULL(SUM(total_price - platform_fee), 0) as gift_earnings FROM gift_records WHERE player_id = ?`,
                [playerId]
            );

            // 总收入 = 订单收入 + 礼物收入
            const total_earnings = Number(order_earnings) + Number(gift_earnings);

            // 今日订单数
            const [[{ today_orders }]]: any = await pool.execute(
                `SELECT COUNT(*) as today_orders FROM orders WHERE player_id = ? AND DATE(created_at) = CURDATE()`,
                [playerId]
            );

            // 本月订单收入
            const [[{ monthly_order_income }]]: any = await pool.execute(
                `SELECT IFNULL(SUM(amount), 0) as monthly_order_income FROM orders WHERE player_id = ? AND status = 'completed' AND YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())`,
                [playerId]
            );

            // 本月礼物收入
            const [[{ monthly_gift_income }]]: any = await pool.execute(
                `SELECT IFNULL(SUM(total_price - platform_fee), 0) as monthly_gift_income FROM gift_records WHERE player_id = ? AND YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())`,
                [playerId]
            );

            // 本月总收入 = 本月订单收入 + 本月礼物收入
            const monthly_income = Number(monthly_order_income) + Number(monthly_gift_income);

            // 服务评分 (从评论表计算真实平均评分)
            const [[{ service_rating }]]: any = await pool.execute(
                `SELECT IFNULL(AVG(rating), 0) as service_rating FROM comments WHERE player_id = ? AND rating IS NOT NULL`,
                [playerId]
            );

            // 待处理事项 (待接单的订单数)
            const [[{ pending_tasks }]]: any = await pool.execute(
                `SELECT COUNT(*) as pending_tasks FROM orders WHERE player_id = ? AND status = 'pending'`,
                [playerId]
            );

            // 总提现金额（已打款的提现记录）
            const [[{ total_withdrawn }]]: any = await pool.execute(
                `SELECT IFNULL(SUM(amount), 0) as total_withdrawn FROM withdrawals WHERE player_id = ? AND status = '已打款'`,
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

/**
 * @route   GET /api/statistics/trends
 * @desc    获取平台趋势数据，支持不同时间范围
 * @access  仅顶级管理员可访问
 */
statisticsRouter.get(
    '/trends',
    auth,
    requireTopManager,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const timeRange = req.query.timeRange as string || 'month';
            const periods = parseInt(req.query.periods as string) || 7; // 默认7个时间段
            
            let dateFormat: string;
            let intervalDays: number;
            
            // 根据时间范围设置不同的查询参数
            switch (timeRange) {
                case 'day':
                    dateFormat = '%H:00'; // 按小时分组
                    intervalDays = 1;
                    break;
                case 'week':
                    dateFormat = '%m-%d'; // 按日期分组
                    intervalDays = 7;
                    break;
                case 'month':
                    dateFormat = '%m-%d'; // 按日期分组
                    intervalDays = 30;
                    break;
                case 'year':
                    dateFormat = '%Y-%m'; // 按月分组
                    intervalDays = 365;
                    break;
                default:
                    dateFormat = '%Y-%m';
                    intervalDays = 365;
            }

            // 使用真实数据库查询获取趋势数据
            let dateCondition: string;
            let groupByFormat: string;
            
            // 根据时间范围设置查询条件
            switch (timeRange) {
                case 'day':
                    // 按小时分组，查询最近24小时
                    dateCondition = `created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`;
                    groupByFormat = `DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00')`;
                    break;
                case 'week':
                    // 按天分组，查询最近7天
                    dateCondition = `created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`;
                    groupByFormat = `DATE(created_at)`;
                    break;
                case 'month':
                    // 按天分组，查询最近30天
                    dateCondition = `created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`;
                    groupByFormat = `DATE(created_at)`;
                    break;
                case 'year':
                    // 按月分组，查询最近12个月
                    dateCondition = `created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)`;
                    groupByFormat = `DATE_FORMAT(created_at, '%Y-%m-01')`;
                    break;
                default:
                    dateCondition = `created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`;
                    groupByFormat = `DATE(created_at)`;
            }

            // 查询订单趋势数据
            const [orderTrends]: any = await pool.execute(`
                SELECT 
                    ${groupByFormat} as period,
                    COUNT(*) as orders,
                    IFNULL(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as revenue
                FROM orders 
                WHERE ${dateCondition}
                GROUP BY ${groupByFormat}
                ORDER BY period ASC
            `);

            // 查询用户注册趋势数据
            const [userTrends]: any = await pool.execute(`
                SELECT 
                    ${groupByFormat} as period,
                    COUNT(*) as users
                FROM users 
                WHERE ${dateCondition}
                GROUP BY ${groupByFormat}
                ORDER BY period ASC
            `);

            // 查询陪玩注册趋势数据
            const [playerTrends]: any = await pool.execute(`
                SELECT 
                    ${groupByFormat} as period,
                    COUNT(*) as players
                FROM players 
                WHERE ${dateCondition}
                GROUP BY ${groupByFormat}
                ORDER BY period ASC
            `);

            // 查询礼物趋势数据
            const [giftTrends]: any = await pool.execute(`
                SELECT 
                    ${groupByFormat} as period,
                    COUNT(*) as gifts,
                    IFNULL(SUM(total_price), 0) as gift_revenue
                FROM gift_records 
                WHERE ${dateCondition}
                GROUP BY ${groupByFormat}
                ORDER BY period ASC
            `);

            // 生成完整的时间序列
            const dates = [];
            const now = new Date();
            
            if (timeRange === 'day') {
                // 最近24小时，每小时一个点
                for (let i = 23; i >= 0; i--) {
                    const date = new Date(now);
                    date.setHours(date.getHours() - i, 0, 0, 0);
                    dates.push(date.toISOString().slice(0, 13) + ':00:00');
                }
            } else if (timeRange === 'week') {
                // 最近7天
                for (let i = 6; i >= 0; i--) {
                    const date = new Date(now);
                    date.setDate(date.getDate() - i);
                    dates.push(date.toISOString().split('T')[0]);
                }
            } else if (timeRange === 'month') {
                // 最近30天
                for (let i = 29; i >= 0; i--) {
                    const date = new Date(now);
                    date.setDate(date.getDate() - i);
                    dates.push(date.toISOString().split('T')[0]);
                }
            } else if (timeRange === 'year') {
                // 最近12个月
                for (let i = 11; i >= 0; i--) {
                    const date = new Date(now);
                    date.setMonth(date.getMonth() - i, 1);
                    dates.push(date.toISOString().slice(0, 7) + '-01');
                }
            }

            // 合并数据，确保所有时间段都有数据
            const trendData: any[] = [];
            
            dates.forEach(period => {
                const orderData = orderTrends.find((item: any) => {
                    const itemPeriod = timeRange === 'day' ? 
                        new Date(item.period).toISOString().slice(0, 13) + ':00:00' :
                        timeRange === 'year' ?
                        new Date(item.period).toISOString().slice(0, 7) + '-01' :
                        new Date(item.period).toISOString().split('T')[0];
                    return itemPeriod === period;
                }) || { orders: 0, revenue: 0 };
                
                const userData = userTrends.find((item: any) => {
                    const itemPeriod = timeRange === 'day' ? 
                        new Date(item.period).toISOString().slice(0, 13) + ':00:00' :
                        timeRange === 'year' ?
                        new Date(item.period).toISOString().slice(0, 7) + '-01' :
                        new Date(item.period).toISOString().split('T')[0];
                    return itemPeriod === period;
                }) || { users: 0 };
                
                const playerData = playerTrends.find((item: any) => {
                    const itemPeriod = timeRange === 'day' ? 
                        new Date(item.period).toISOString().slice(0, 13) + ':00:00' :
                        timeRange === 'year' ?
                        new Date(item.period).toISOString().slice(0, 7) + '-01' :
                        new Date(item.period).toISOString().split('T')[0];
                    return itemPeriod === period;
                }) || { players: 0 };
                
                const giftData = giftTrends.find((item: any) => {
                    const itemPeriod = timeRange === 'day' ? 
                        new Date(item.period).toISOString().slice(0, 13) + ':00:00' :
                        timeRange === 'year' ?
                        new Date(item.period).toISOString().slice(0, 7) + '-01' :
                        new Date(item.period).toISOString().split('T')[0];
                    return itemPeriod === period;
                }) || { gifts: 0, gift_revenue: 0 };

                // 格式化显示的日期
                let displayDate = period;
                if (timeRange === 'day') {
                    displayDate = period.slice(11, 16); // 显示 HH:MM
                } else if (timeRange === 'year') {
                    displayDate = period.slice(0, 7); // 显示 YYYY-MM
                } else {
                    displayDate = period.slice(5); // 显示 MM-DD
                }

                trendData.push({
                    date: displayDate,
                    orders: Number(orderData.orders) || 0,
                    revenue: Math.round(Number(orderData.revenue) / 100) / 10, // 转换为千元，保留一位小数
                    users: Number(userData.users) || 0,
                    players: Number(playerData.players) || 0,
                    gifts: Number(giftData.gifts) || 0,
                    gift_revenue: Math.round(Number(giftData.gift_revenue) / 100) / 10 // 转换为千元，保留一位小数
                });
            });

            res.json({
                success: true,
                timeRange,
                periods: trendData.length,
                trends: trendData
            });
        } catch (err) {
            next(err);
        }
    }
);

export default statisticsRouter;
// 修复only_full_group_by问题