// server/src/routes/statistics.route.ts
import { Router } from 'express';
import { pool } from '../db';

const statisticsRouter = Router();

/**
 * @route   GET /api/statistics/user/:userId
 * @desc    查询指定用户订单统计
 */
statisticsRouter.get('/user/:userId', async (req, res, next) => {
    try {
        const userId = Number(req.params.userId);
        const [[{ user_order_count }]]: any = await pool.execute(
            `SELECT COUNT(*) as user_order_count FROM orders WHERE user_id = ?`,
            [userId]
        );
        res.json({ success: true, userId, user_order_count });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/statistics/player/:playerId
 * @desc    查询指定陪玩收入与订单统计
 */
statisticsRouter.get('/player/:playerId', async (req, res, next) => {
    try {
        const playerId = Number(req.params.playerId);
        const [[{ total_order_count }]]: any = await pool.execute(
            `SELECT COUNT(*) as total_order_count FROM orders WHERE player_id = ?`,
            [playerId]
        );
        const [[{ total_withdrawn }]]: any = await pool.execute(
            `SELECT IFNULL(SUM(amount),0) as total_withdrawn FROM withdrawals WHERE player_id = ? AND status = '已批准'`,
            [playerId]
        );
        // 平台抽成 = SUM(platform_fee)
        const [[{ platform_profit }]]: any = await pool.execute(
            `SELECT IFNULL(SUM(platform_fee),0) as platform_profit FROM withdrawals WHERE player_id = ?`,
            [playerId]
        );
        res.json({ success: true, playerId, total_order_count, total_withdrawn, platform_profit });
    } catch (err) {
        next(err);
    }
});

export default statisticsRouter;