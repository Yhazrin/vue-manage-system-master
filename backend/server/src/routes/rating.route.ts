// src/routes/rating.route.ts
import { Router, Response, NextFunction } from 'express';
import { pool } from '../db';
import { auth, AuthRequest } from '../middleware/auth';

const ratingRouter = Router();

/**
 * @route   GET /api/ratings/player/:playerId/stats
 * @desc    获取陪玩的详细评分统计
 * @access  公开访问（用于显示陪玩详情）
 */
ratingRouter.get(
    '/player/:playerId/stats',
    async (req, res: Response, next: NextFunction) => {
        try {
            const playerId = Number(req.params.playerId);
            if (isNaN(playerId)) {
                return res.status(400).json({ success: false, error: '无效的陪玩ID' });
            }

            // 获取评分统计
            const [[ratingStats]]: any = await pool.execute(`
                SELECT 
                    COUNT(*) as total_reviews,
                    IFNULL(AVG(rating), 0) as average_rating,
                    IFNULL(SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END), 0) as five_star_count,
                    IFNULL(SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END), 0) as four_star_count,
                    IFNULL(SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END), 0) as three_star_count,
                    IFNULL(SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END), 0) as two_star_count,
                    IFNULL(SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END), 0) as one_star_count
                FROM comments 
                WHERE player_id = ? AND rating IS NOT NULL
            `, [playerId]);

            // 计算评分分布百分比
            const totalReviews = ratingStats.total_reviews || 0;
            const ratingDistribution = totalReviews > 0 ? {
                5: Math.round((ratingStats.five_star_count / totalReviews) * 100),
                4: Math.round((ratingStats.four_star_count / totalReviews) * 100),
                3: Math.round((ratingStats.three_star_count / totalReviews) * 100),
                2: Math.round((ratingStats.two_star_count / totalReviews) * 100),
                1: Math.round((ratingStats.one_star_count / totalReviews) * 100)
            } : { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

            // 获取最近的评论
            const [recentComments]: any = await pool.execute(`
                SELECT 
                    c.id,
                    c.content,
                    c.rating,
                    c.created_at,
                    u.name as user_name,
                    u.photo_img as user_avatar
                FROM comments c
                LEFT JOIN users u ON c.user_id = u.id
                WHERE c.player_id = ? AND c.rating IS NOT NULL
                ORDER BY c.created_at DESC
                LIMIT 10
            `, [playerId]);

            // 获取月度评分趋势（最近6个月）
            const [monthlyTrends]: any = await pool.execute(`
                SELECT 
                    DATE_FORMAT(created_at, '%Y-%m') as month,
                    AVG(rating) as avg_rating,
                    COUNT(*) as review_count
                FROM comments 
                WHERE player_id = ? 
                    AND rating IS NOT NULL 
                    AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
                GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                ORDER BY month ASC
            `, [playerId]);

            res.json({
                success: true,
                playerId,
                stats: {
                    totalReviews,
                    averageRating: Number(ratingStats.average_rating).toFixed(1),
                    ratingDistribution,
                    starCounts: {
                        5: ratingStats.five_star_count,
                        4: ratingStats.four_star_count,
                        3: ratingStats.three_star_count,
                        2: ratingStats.two_star_count,
                        1: ratingStats.one_star_count
                    }
                },
                recentComments,
                monthlyTrends
            });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * @route   GET /api/ratings/player/:playerId/summary
 * @desc    获取陪玩的评分摘要（用于列表显示）
 * @access  公开访问
 */
ratingRouter.get(
    '/player/:playerId/summary',
    async (req, res: Response, next: NextFunction) => {
        try {
            const playerId = Number(req.params.playerId);
            if (isNaN(playerId)) {
                return res.status(400).json({ success: false, error: '无效的陪玩ID' });
            }

            const [[summary]]: any = await pool.execute(`
                SELECT 
                    COUNT(*) as total_reviews,
                    IFNULL(AVG(rating), 0) as average_rating,
                    IFNULL(SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END), 0) as positive_reviews
                FROM comments 
                WHERE player_id = ? AND rating IS NOT NULL
            `, [playerId]);

            const positiveRate = summary.total_reviews > 0 
                ? Math.round((summary.positive_reviews / summary.total_reviews) * 100)
                : 0;

            res.json({
                success: true,
                playerId,
                totalReviews: summary.total_reviews,
                averageRating: Number(summary.average_rating).toFixed(1),
                positiveRate
            });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * @route   GET /api/ratings/top-players
 * @desc    获取评分最高的陪玩排行榜
 * @access  公开访问
 */
ratingRouter.get(
    '/top-players',
    async (req, res: Response, next: NextFunction) => {
        try {
            const limit = Math.min(Number(req.query.limit) || 10, 50); // 最多50个

            const [topPlayers]: any = await pool.execute(`
                SELECT 
                    p.id,
                    p.name,
                    p.photo_img,
                    COUNT(c.id) as total_reviews,
                    AVG(c.rating) as average_rating,
                    SUM(CASE WHEN c.rating >= 4 THEN 1 ELSE 0 END) as positive_reviews
                FROM players p
                LEFT JOIN comments c ON p.id = c.player_id AND c.rating IS NOT NULL
                WHERE p.status = 1
                GROUP BY p.id, p.name, p.photo_img
                HAVING total_reviews >= 5  -- 至少5个评价才能上榜
                ORDER BY average_rating DESC, total_reviews DESC
                LIMIT ?
            `, [limit]);

            const rankedPlayers = topPlayers.map((player: any, index: number) => ({
                rank: index + 1,
                playerId: player.id,
                name: player.name,
                avatar: player.photo_img,
                totalReviews: player.total_reviews,
                averageRating: Number(player.average_rating).toFixed(1),
                positiveRate: player.total_reviews > 0 
                    ? Math.round((player.positive_reviews / player.total_reviews) * 100)
                    : 0
            }));

            res.json({
                success: true,
                topPlayers: rankedPlayers
            });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * @route   GET /api/ratings/my-stats
 * @desc    获取当前陪玩的评分统计（需要登录）
 * @access  仅陪玩可访问
 */
ratingRouter.get(
    '/my-stats',
    auth,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (req.user?.role !== 'player') {
                return res.status(403).json({ 
                    success: false, 
                    error: '只有陪玩用户可以查看自己的评分统计' 
                });
            }

            const playerId = req.user.id;

            // 获取详细统计
            const [[stats]]: any = await pool.execute(`
                SELECT 
                    COUNT(*) as total_reviews,
                    IFNULL(AVG(rating), 0) as average_rating,
                    IFNULL(SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END), 0) as five_star_count,
                    IFNULL(SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END), 0) as four_star_count,
                    IFNULL(SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END), 0) as three_star_count,
                    IFNULL(SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END), 0) as two_star_count,
                    IFNULL(SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END), 0) as one_star_count
                FROM comments 
                WHERE player_id = ? AND rating IS NOT NULL
            `, [playerId]);

            // 获取本月新增评价
            const [[monthlyStats]]: any = await pool.execute(`
                SELECT 
                    COUNT(*) as monthly_reviews,
                    IFNULL(AVG(rating), 0) as monthly_avg_rating
                FROM comments 
                WHERE player_id = ? 
                    AND rating IS NOT NULL 
                    AND YEAR(created_at) = YEAR(CURDATE()) 
                    AND MONTH(created_at) = MONTH(CURDATE())
            `, [playerId]);

            // 获取排名
            const [[ranking]]: any = await pool.execute(`
                SELECT COUNT(*) + 1 as player_rank
                FROM (
                    SELECT p.id, AVG(c.rating) as avg_rating
                    FROM players p
                    LEFT JOIN comments c ON p.id = c.player_id AND c.rating IS NOT NULL
                    WHERE p.status = 1
                    GROUP BY p.id
                    HAVING COUNT(c.id) >= 5 AND avg_rating > (
                        SELECT AVG(rating) 
                        FROM comments 
                        WHERE player_id = ? AND rating IS NOT NULL
                    )
                ) as better_players
            `, [playerId]);

            res.json({
                success: true,
                playerId,
                totalReviews: stats.total_reviews,
                averageRating: Number(stats.average_rating).toFixed(1),
                monthlyReviews: monthlyStats.monthly_reviews,
                monthlyAverageRating: Number(monthlyStats.monthly_avg_rating).toFixed(1),
                ranking: stats.total_reviews >= 5 ? ranking.player_rank : null,
                starDistribution: {
                    5: stats.five_star_count,
                    4: stats.four_star_count,
                    3: stats.three_star_count,
                    2: stats.two_star_count,
                    1: stats.one_star_count
                }
            });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * @route   POST /api/ratings/submit
 * @desc    提交评分
 * @access  需要登录
 */
ratingRouter.post(
    '/submit',
    auth,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { playerId, orderId, rating, content } = req.body;
            const userId = req.user?.id;

            // 验证必需参数
            if (!playerId || !orderId || !rating || !content) {
                return res.status(400).json({
                    success: false,
                    error: '缺少必需参数'
                });
            }

            // 验证评分范围
            if (rating < 1 || rating > 5) {
                return res.status(400).json({
                    success: false,
                    error: '评分必须在1-5之间'
                });
            }

            // 检查是否已经评价过
            const [existingRating]: any = await pool.execute(`
                SELECT id FROM comments 
                WHERE player_id = ? AND order_id = ? AND user_id = ?
            `, [playerId, orderId, userId]);

            if (existingRating.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: '您已经对此订单进行过评价'
                });
            }

            // 验证订单是否存在且属于该用户
            const [orderCheck]: any = await pool.execute(`
                SELECT id, status FROM orders 
                WHERE id = ? AND user_id = ? AND player_id = ?
            `, [orderId, userId, playerId]);

            if (orderCheck.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: '订单不存在或无权限评价'
                });
            }

            // 插入评价
            const [result]: any = await pool.execute(`
                INSERT INTO comments (player_id, order_id, user_id, rating, content, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())
            `, [playerId, orderId, userId, rating, content]);

            res.json({
                success: true,
                message: '评价提交成功',
                commentId: result.insertId
            });

        } catch (err) {
            next(err);
        }
    }
);

export default ratingRouter;