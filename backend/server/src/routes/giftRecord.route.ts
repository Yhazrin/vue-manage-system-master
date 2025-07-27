// backend/server/src/routes/giftRecord.route.ts
import { Router } from 'express';
import { GiftRecordDAO } from '../dao/GiftRecordDao';

const router = Router();

/**
 * @route   POST /api/gift-records
 * @desc    创建打赏记录
 * @body    { user_id, player_id, gift_id, quantity, total_price, order_id? }
 */
router.post('/', async (req, res, next) => {
    try {
        const { user_id, player_id, gift_id, quantity, total_price, order_id } = req.body;
        const id = await GiftRecordDAO.create({ user_id, player_id, gift_id, quantity, total_price, order_id });
        res.status(201).json({ success: true, id });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/gift-records/:id
 * @desc    查询单条打赏记录
 */
router.get('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const record = await GiftRecordDAO.findById(id);
        if (!record) return res.status(404).json({ success: false, error: '记录不存在' });
        res.json({ success: true, record });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/gift-records/user/:userId
 * @desc    查询某用户所有打赏记录
 */
router.get('/user/:userId', async (req, res, next) => {
    try {
        const userId = Number(req.params.userId);
        const records = await GiftRecordDAO.findAllByUser(userId);
        res.json({ success: true, records });
    } catch (err) {
        next(err);
    }
});

export default router;
