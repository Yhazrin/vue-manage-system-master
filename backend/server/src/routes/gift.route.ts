// backend/server/src/routes/gift.route.ts
import { Router } from 'express';
import { GiftDAO } from '../dao/GiftDao';

const router = Router();

/**
 * @route   POST /api/gifts
 * @desc    创建新礼物
 * @body    { id, name, price, image_url }
 */
router.post('/', async (req, res, next) => {
    try {
        const { name, price, image_url } = req.body;
        const newId = await GiftDAO.create({ name, price, image_url });
        res.status(201).json({ success: true, id: newId });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/gifts/:id
 * @desc    查询单个礼物
 */
router.get('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const gift = await GiftDAO.findById(id);
        if (!gift) return res.status(404).json({ success: false, error: '礼物不存在' });
        res.json({ success: true, gift });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/gifts
 * @desc    查询所有礼物
 */
router.get('/', async (req, res, next) => {
    try {
        const gifts = await GiftDAO.findAll();
        res.json({ success: true, gifts });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   DELETE /api/gifts/:id
 * @desc    删除礼物
 */
router.delete('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        await GiftDAO.deleteById(id);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

export default router;
