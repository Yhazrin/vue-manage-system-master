// backend/server/src/routes/withdrawal.route.ts
import { Router } from 'express';
import { WithdrawalDAO } from '../dao/WithdrawalDao';
import { auth, AuthRequest } from '../middleware/auth'; // 导入权限中间件

const router = Router();

/**
 * @route   POST /api/withdrawals
 * @desc    发起提现申请
 * @body    { withdrawal_id, player_id, amount, platform_fee, status }
 * @access  玩家本人可访问
 */
router.post(
    '/',
    auth,
    async (req: AuthRequest, res, next) => {
        try {
            const { withdrawal_id, player_id, amount } = req.body;

            // 可选：校验一下，确保只能给自己的 player_id 提现
            if (req.user?.role !== 'player' || req.user.id !== Number(player_id)) {
                return res.status(403).json({ success: false, error: '无权限给该玩家申请提现' });
            }

            // DAO 里已经会去读 commission_rate、算 platform_fee、把 status 设为 '待审核'
            await WithdrawalDAO.create({ withdrawal_id, player_id, amount });

            res.status(201).json({ success: true, withdrawal_id });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * @route   GET /api/withdrawals/:id
 * @desc    查询单条提现记录
 */
router.get('/:id', auth, async (req: AuthRequest, res, next) => {
    try {
        // 验证权限：只允许管理员(manager)和玩家(player)访问
        if (!['manager', 'player'].includes(req.user?.role || '')) {
            return res.status(403).json({ success: false, error: '没有访问权限' });
        }

        const id = req.params.id;
        const wd = await WithdrawalDAO.findById(id);

        // 玩家只能查看自己的提现记录（如果需要更细粒度控制）
        if (req.user?.role === 'player' && wd?.player_id !== req.user.id) {
            return res.status(403).json({ success: false, error: '无权查看他人提现记录' });
        }


        if (!wd) return res.status(404).json({ success: false, error: '提现记录不存在' });
        res.json({ success: true, withdrawal: wd });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/withdrawals
 * @desc    分页查询提现记录列表
 * @query   page, pageSize, status?
 */
router.get('/', auth, async (req: AuthRequest, res, next) => {
    try {
        // 验证权限：只允许管理员和玩家访问
        if (!['manager', 'player'].includes(req.user?.role || '')) {
            return res.status(403).json({ success: false, error: '没有访问权限' });
        }

        const page     = Number(req.query.page) || 1;
        const pageSize = Number(req.query.pageSize) || 20;
        const status   = req.query.status as string | undefined;
        let result;
        // 玩家只能查看自己的记录，管理员可以查看所有
        if (req.user?.role === 'player') {
            result = await WithdrawalDAO.findByPlayerId(req.user.id, page, pageSize, status as any);
        } else {
            result = await WithdrawalDAO.findAll(page, pageSize, status as any);
        }
        res.json({ success: true, ...result });
    } catch (err) {
        next(err);
    }
});

export default router;