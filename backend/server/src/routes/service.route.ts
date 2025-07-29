// backend/server/src/routes/service.route.ts
import { Router } from 'express';
import { ServiceDAO } from '../dao/ServiceDao';
import { body, param, query, validationResult } from 'express-validator';
import { auth, AuthRequest } from '../middleware/auth';
import { Request, Response, NextFunction } from 'express';

const router = Router();

/**
 * @route   POST /api/services
 * @desc    创建新的陪玩服务
 * @access  登录用户
 */
router.post(
    '/',
    auth,
    [
        body('player_id').isInt().withMessage('player_id 必须是整数'),
        body('game_id').isInt().withMessage('game_id 必须是整数'),
        body('price').isFloat({ min: 0 }).withMessage('price 必须是非负数'),
        body('hours').isInt({ min: 1 }).withMessage('hours 必须大于0')
    ],
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        // 只有普通用户才能创建服务
        if (req.user?.role !== 'user') {
            return res.status(403).json({ success: false, error: '仅普通用户可创建服务' });
        }

        try {
            const { player_id, game_id, price, hours } = req.body;
            const id = await ServiceDAO.create({ player_id, game_id, price, hours });
            res.status(201).json({ success: true, id });
        } catch (err) {
            next(err);
        }
    }
);

/**
* @route   GET /api/services/:id
* @desc    查询单个服务
* @access  管理员、用户、玩家
*/
router.get(
    '/:id',
    auth,
    [param('id').isInt().withMessage('id 必须是整数')],
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        try {
            const id = Number(req.params.id);
            const svc = await ServiceDAO.findById(id);
            if (!svc) return res.status(404).json({ success: false, error: '服务不存在' });
            res.json({ success: true, service: svc });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * @route   GET /api/services
 * @desc    分页查询服务列表
 * @access  管理员
 */
router.get(
    '/',
    auth,
    [
        query('page').optional().isInt({ min: 1 }).withMessage('page 必须是大于0的整数'),
        query('pageSize').optional().isInt({ min: 1 }).withMessage('pageSize 必须是大于0的整数')
    ],
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        // 只有管理员才能查询服务列表
        if (req.user?.role !== 'manager') {
            return res.status(403).json({ success: false, error: '仅管理员可查询服务列表' });
        }

        try {
            const page = Number(req.query.page) || 1;
            const pageSize = Number(req.query.pageSize) || 20;
            const result = await ServiceDAO.findAll(page, pageSize);
            res.json({ success: true, ...result });
        } catch (err) {
            next(err);
        }
    }
);


/**
 * @route   PATCH /api/services/:id
 * @desc    更新服务
 * @access  管理员
 */
router.patch(
    '/:id',
    auth,
    [
        param('id').isInt().withMessage('id 必须是整数'),
        body('price').optional().isFloat({ min: 0 }).withMessage('price 必须是非负数'),
        body('hours').optional().isInt({ min: 1 }).withMessage('hours 必须大于0')
    ],
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        if (req.user?.role !== 'manager') {
            return res.status(403).json({ success: false, error: '仅管理员可更新服务' });
        }

        try {
            const id = Number(req.params.id);
            await ServiceDAO.updateById(id, req.body);
            res.json({ success: true });
        } catch (err) {
            next(err);
        }
    }
);


/**
 * @route   DELETE /api/services/:id
 * @desc    删除服务
 * @access  管理员
 */
router.delete(
    '/:id',
    auth,
    [param('id').isInt().withMessage('id 必须是整数')],
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        if (req.user?.role !== 'manager') {
            return res.status(403).json({ success: false, error: '仅管理员可删除服务' });
        }

        try {
            const id = Number(req.params.id);
            await ServiceDAO.deleteById(id);
            res.json({ success: true });
        } catch (err) {
            next(err);
        }
    }
);


export default router;