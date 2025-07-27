// backend/server/src/routes/withdrawal.route.ts
import { Router } from 'express';
import { WithdrawalDAO } from '../dao/WithdrawalDao';

const router = Router();

/**
 * @route   POST /api/withdrawals
 * @desc    发起提现申请
 * @body    { withdrawal_id, player_id, amount, platform_fee, status }
 */
router.post('/', async (req, res, next) => {
    try {
        const { withdrawal_id, player_id, amount, platform_fee, status } = req.body;
        const id = await WithdrawalDAO.create({ withdrawal_id, player_id, amount, platform_fee, status });
        res.status(201).json({ success: true, withdrawal_id: id });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/withdrawals/:id
 * @desc    查询单条提现记录
 */
router.get('/:id', async (req, res, next) => {
    try {
        const id = req.params.id;
        const wd = await WithdrawalDAO.findById(id);
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
router.get('/', async (req, res, next) => {
    try {
        const page     = Number(req.query.page) || 1;
        const pageSize = Number(req.query.pageSize) || 20;
        const status   = req.query.status as string | undefined;
        const result = await WithdrawalDAO.findAll(page, pageSize, status as any);
        res.json({ success: true, ...result });
    } catch (err) {
        next(err);
    }
});

export default router;