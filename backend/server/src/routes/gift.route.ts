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
    (req: Request, res: Response, next: NextFunction) => {
        console.log('🎁 POST /api/gifts 被调用');
        console.log('请求方法:', req.method);
        console.log('请求路径:', req.path);
        console.log('Content-Type:', req.headers['content-type']);
        console.log('请求体:', req.body);
        next();
    },
    auth,
    (req: Request, res: Response, next: NextFunction) => {
        console.log('🎁 通过认证中间件');
        // 使文件上传变为可选
        giftUpload.single('image')(req, res, (err) => {
            if (err) {
                console.error('🎁 文件上传错误:', err);
                // 如果是文件上传错误但不是必需的，继续处理
                if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    console.log('🎁 忽略意外文件错误，继续处理');
                    return next();
                }
                return res.status(400).json({ success: false, error: '文件上传失败: ' + err.message });
            }
            console.log('🎁 通过文件上传中间件，文件:', req.file ? req.file.filename : '无');
            next();
        });
    },
    [
        body('name').isString().notEmpty().withMessage('礼物名称不能为空'),
        body('price').isFloat({ min: 0.01 }).withMessage('礼物价格必须大于0')
    ],
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        console.log('🎁 开始处理礼物创建请求');
        console.log('用户信息:', { id: req.user?.id, role: req.user?.role });
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('❌ 参数验证失败:', errors.array());
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        if (req.user?.role !== 'manager') {
            console.log('❌ 权限不足，用户角色:', req.user?.role);
            return res.status(403).json({ success: false, error: '仅管理员可创建礼物' });
        }

        try {
            const { name, price, imageUrl } = req.body;
            console.log('🎁 创建礼物请求数据:', { name, price, imageUrl, hasFile: !!req.file });
            
            // 检查礼物名称是否已存在
            const existingGifts = await GiftDAO.findByNameLike(name);
            const exactMatch = existingGifts.find(g => g.name.toLowerCase() === name.toLowerCase());
            if (exactMatch) {
                console.log('❌ 礼物名称已存在:', name);
                return res.status(400).json({ success: false, error: `礼物名称"${name}"已存在` });
            }
            
            // 优先使用上传的文件，如果没有文件则使用前端传来的imageUrl
            let image_url = imageUrl || null;
            if (req.file) {
                image_url = `/uploads/gift/images/${req.file.filename}`;
                console.log('🎁 使用上传文件作为图片:', image_url);
            } else {
                console.log('🎁 使用提供的图片URL:', image_url);
            }
            
            console.log('🎁 准备插入数据库:', { name, price, image_url });
            const id = await GiftDAO.create({ name, price, image_url });
            console.log('✅ 礼物创建成功，ID:', id);
            
            const gift = await GiftDAO.findById(id);
            // 将数据库字段映射为前端期望的字段
            const mappedGift = {
                id: gift!.id,
                name: gift!.name,
                price: gift!.price,
                imageUrl: gift!.image_url || '',
                createdAt: gift!.created_at || new Date().toISOString()
            };
            res.status(201).json({ success: true, gift: mappedGift, message: '礼物创建成功' });
        } catch (err) {
            console.error('🎁 礼物创建失败:', err);
            
            // 处理特定的数据库错误
            if (err instanceof Error) {
                if (err.message.includes('Duplicate entry')) {
                    return res.status(400).json({ success: false, error: '礼物名称已存在' });
                }
            }
            
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
        // 将数据库字段映射为前端期望的字段
        const mappedGifts = gifts.map(gift => ({
            id: gift.id,
            name: gift.name,
            price: gift.price,
            imageUrl: gift.image_url || '',
            createdAt: gift.created_at || new Date().toISOString()
        }));
        res.json({ success: true, gifts: mappedGifts });
    } catch (err) {
        next(err);
    }
});

// ===== 更新礼物（管理员） =====
router.put(
    '/:id',
    auth,
    giftUpload.single('image'),
    [
        param('id').isInt().withMessage('id 必须为正整数'),
        body('name').optional().isString().notEmpty().withMessage('礼物名称不能为空'),
        body('price').optional().isFloat({ min: 0.01 }).withMessage('礼物价格必须大于0')
    ],
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        console.log('🎁 PUT /api/gifts/:id 被调用');
        console.log('请求参数:', req.params);
        console.log('请求体:', req.body);
        console.log('用户信息:', { id: req.user?.id, role: req.user?.role });
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('❌ 参数验证失败:', errors.array());
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        if (req.user?.role !== 'manager') {
            console.log('❌ 权限不足，用户角色:', req.user?.role);
            return res.status(403).json({ success: false, error: '仅管理员可更新礼物' });
        }

        try {
            const id = Number(req.params.id);
            console.log('准备更新礼物，ID:', id);
            
            // 检查礼物是否存在
            const existingGift = await GiftDAO.findById(id);
            if (!existingGift) {
                console.log('❌ 礼物不存在，ID:', id);
                return res.status(404).json({ success: false, error: '礼物不存在' });
            }
            
            console.log('找到礼物:', existingGift);
            
            const { name, price, imageUrl } = req.body;
            
            // 如果更新名称，检查是否与其他礼物重名
            if (name && name !== existingGift.name) {
                const existingGifts = await GiftDAO.findByNameLike(name);
                const exactMatch = existingGifts.find(g => g.id !== id && g.name.toLowerCase() === name.toLowerCase());
                if (exactMatch) {
                    console.log('❌ 礼物名称已存在:', name);
                    return res.status(400).json({ success: false, error: `礼物名称"${name}"已存在` });
                }
            }
            
            let image_url: string | undefined;
            if (req.file) {
                image_url = `/uploads/gift/images/${req.file.filename}`;
                console.log('🎁 使用新上传的文件:', image_url);
            } else if (imageUrl !== undefined) {
                image_url = imageUrl;
                console.log('🎁 使用提供的图片URL:', image_url);
            }
            
            console.log('🎁 准备更新数据:', { name, price, image_url });
            await GiftDAO.update(id, { name, price, image_url });
            
            const updated = await GiftDAO.findById(id);
            // 将数据库字段映射为前端期望的字段
            const mappedGift = {
                id: updated!.id,
                name: updated!.name,
                price: updated!.price,
                imageUrl: updated!.image_url || '',
                createdAt: updated!.created_at || new Date().toISOString()
            };
            
            console.log('✅ 礼物更新成功:', mappedGift);
            res.json({ success: true, gift: mappedGift, message: '礼物更新成功' });
        } catch (err) {
            console.error('🎁 礼物更新失败:', err);
            
            // 处理特定的数据库错误
            if (err instanceof Error) {
                if (err.message.includes('Duplicate entry')) {
                    return res.status(400).json({ success: false, error: '礼物名称已存在' });
                }
            }
            
            next(err);
        }
    }
);

/**
 * @route   DELETE /api/gifts/:id
 * @desc    删除礼物
 * @access  管理员
 */
router.delete(
    '/:id',
    auth,
    [param('id').isInt().withMessage('id 必须为正整数')],
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        console.log('🎁 DELETE /api/gifts/:id 被调用');
        console.log('请求参数:', req.params);
        console.log('用户信息:', { id: req.user?.id, role: req.user?.role });
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('❌ 参数验证失败:', errors.array());
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        if (req.user?.role !== 'manager') {
            console.log('❌ 权限不足，用户角色:', req.user?.role);
            return res.status(403).json({ success: false, error: '仅管理员可删除礼物' });
        }

        try {
            const id = Number(req.params.id);
            console.log('准备删除礼物，ID:', id);
            
            // 检查礼物是否存在
            const gift = await GiftDAO.findById(id);
            if (!gift) {
                console.log('❌ 礼物不存在，ID:', id);
                return res.status(404).json({ success: false, error: '礼物不存在' });
            }
            
            console.log('找到礼物:', gift);
            
            await GiftDAO.deleteById(id);
            console.log('✅ 礼物删除成功，ID:', id);
            res.json({ success: true, message: '礼物删除成功' });
        } catch (err) {
            console.error('🎁 礼物删除失败:', err);
            
            // 处理特定的业务错误
            if (err instanceof Error && err.message.includes('存在相关的送礼记录')) {
                return res.status(400).json({ 
                    success: false, 
                    error: '无法删除礼物：该礼物已被用户赠送，存在相关的送礼记录' 
                });
            }
            
            next(err);
        }
    }
);

export default router;
