// backend/server/src/routes/service.route.ts
import { Router } from 'express';
import { ServiceDAO } from '../dao/ServiceDao';
import { body, param, query, validationResult } from 'express-validator';
import { auth, AuthRequest } from '../middleware/auth';
import { Request, Response, NextFunction } from 'express';

const router = Router();

/**
 * @route   GET /api/services/player/:playerId
 * @desc    获取指定陪玩的服务列表（公开接口）
 * @access  公开
 */
router.get(
    '/player/:playerId',
    [param('playerId').isInt().withMessage('playerId 必须是整数')],
    async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        try {
            const playerId = Number(req.params.playerId);
            const services = await ServiceDAO.findByPlayerId(playerId);
            res.json({ success: true, services });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * @route   GET /api/services/my
 * @desc    获取当前陪玩的服务列表
 * @access  陪玩用户
 */
router.get(
    '/my',
    auth,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        // 只有陪玩才能查看自己的服务
        if (req.user?.role !== 'player') {
            return res.status(403).json({ success: false, error: '仅陪玩可查看自己的服务' });
        }

        try {
            const player_id = req.user.id;
            const services = await ServiceDAO.findByPlayerId(player_id);
            res.json({ success: true, services });
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
 * @route   POST /api/services
 * @desc    创建新的陪玩服务
 * @access  陪玩用户
 */
router.post(
    '/',
    auth,
    [
        body('game_id').isInt().withMessage('game_id 必须是整数'),
        body('price').isFloat({ min: 0 }).withMessage('price 必须是非负数'),
        body('hours').isInt({ min: 1 }).withMessage('hours 必须大于0')
    ],
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        // 只有陪玩才能创建服务
        if (req.user?.role !== 'player') {
            return res.status(403).json({ success: false, error: '仅陪玩可创建服务' });
        }

        try {
            const { game_id, price, hours } = req.body;
            const player_id = req.user.id; // 使用当前登录陪玩的ID
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
 * @route   PUT /api/services/:id
 * @desc    更新服务
 * @access  陪玩（自己的服务）或管理员
 */
router.put(
    '/:id',
    auth,
    [
        param('id').isInt().withMessage('id 必须是整数'),
        body('game_id').optional().isInt().withMessage('game_id 必须是整数'),
        body('price').optional().isFloat({ min: 0 }).withMessage('price 必须是非负数'),
        body('hours').optional().isInt({ min: 1 }).withMessage('hours 必须大于0')
    ],
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        try {
            const id = Number(req.params.id);
            const service = await ServiceDAO.findById(id);
            
            if (!service) {
                return res.status(404).json({ success: false, error: '服务不存在' });
            }

            // 检查权限：管理员可以更新任何服务，陪玩只能更新自己的服务
            if (req.user?.role !== 'manager' && 
                (req.user?.role !== 'player' || service.player_id !== req.user.id)) {
                return res.status(403).json({ success: false, error: '无权限更新此服务' });
            }

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
 * @access  陪玩（自己的服务）或管理员
 */
router.delete(
    '/:id',
    auth,
    [param('id').isInt().withMessage('id 必须是整数')],
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        try {
            const id = Number(req.params.id);
            const service = await ServiceDAO.findById(id);
            
            if (!service) {
                return res.status(404).json({ success: false, error: '服务不存在' });
            }

            // 检查权限：管理员可以删除任何服务，陪玩只能删除自己的服务
            if (req.user?.role !== 'manager' && 
                (req.user?.role !== 'player' || service.player_id !== req.user.id)) {
                return res.status(403).json({ success: false, error: '无权限删除此服务' });
            }

            await ServiceDAO.deleteById(id);
            res.json({ success: true });
        } catch (err) {
            next(err);
        }
    }
);


export default router;