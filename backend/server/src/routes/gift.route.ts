// backend/server/src/routes/gift.route.ts
import { Router } from 'express';
import { GiftDAO } from '../dao/GiftDao';
import { body, param, query, validationResult } from 'express-validator';
import { auth, AuthRequest } from '../middleware/auth';
import { Request, Response, NextFunction } from "express";
import { giftUpload } from '../utils/upload'; // 导入礼物上传实例
import path from 'path';

const router = Router();

/**
 * @route   POST /api/gifts
 * @desc    创建礼物
 * @access  管理员
 */
router.post(
    '/',
    auth,
    giftUpload.single('image'),
    [
        body('name').isString().notEmpty().withMessage('name 不能为空'),
        body('price').isFloat({ min: 0 }).withMessage('price 必须是非负数')
    ],
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        if (req.user?.role !== 'manager') return res.status(403).json({ success: false, error: '仅管理员可创建礼物' });

        try {
            const { name, price } = req.body;
            const image_url = req.file ? req.file.path : null;
            const id = await GiftDAO.create({ name, price, image_url });
            res.status(201).json({ success: true, id });
        } catch (err) {
            next(err);
        }
    }
);

// ===== 按名称模糊搜索礼物 =====
router.get(
    '/search',
    auth,
    [query('name').isString().notEmpty().withMessage('name 参数必填')],
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        try {
            const { name } = req.query as { name: string };
            const gifts = await GiftDAO.findByNameLike(name);
            res.json({ success: true, gifts });
        } catch (err) {
            next(err);
        }
    }
);

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

// ===== 更新礼物（管理员） =====
router.patch(
    '/:id',
    auth,
    giftUpload.single('image'),
    [
        param('id').isInt().withMessage('id 必须为正整数'),
        body('name').optional().isString().withMessage('name 必须是字符串'),
        body('price').optional().isFloat({ min: 0 }).withMessage('price 必须是非负数')
    ],
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        if (req.user?.role !== 'manager')
            return res.status(403).json({ success: false, error: '仅管理员可更新礼物' });

        try {
            const id = Number(req.params.id);
            const { name, price } = req.body;
            let image_url: string | undefined;
            if (req.file) {
                image_url = path.join('uploads/gift/images', req.file.filename);
            }
            await GiftDAO.update(id, { name, price, image_url });
            const updated = await GiftDAO.findById(id);
            res.json({ success: true, gift: updated });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * @route   DELETE /api/gifts/:id
 * @desc    删除礼物
 */
router.delete(
    '/:id',
    auth,
    [param('id').isInt().withMessage('id 必须为正整数')],
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        if (req.user?.role !== 'manager')
            return res.status(403).json({ success: false, error: '仅管理员可删除礼物' });

        try {
            const id = Number(req.params.id);
            await GiftDAO.deleteById(id);
            res.json({ success: true });
        } catch (err) {
            next(err);
        }
    }
);

export default router;
