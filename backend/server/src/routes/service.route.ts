// backend/server/src/routes/service.route.ts
import { Router } from 'express';
import { ServiceDAO } from '../dao/ServiceDao';

const router = Router();

/**
 * @route   POST /api/services
 * @desc    创建新的陪玩服务
 * @body    { player_id, game_id, price, hours }
 */
router.post('/', async (req, res, next) => {
    try {
        const { player_id, game_id, price, hours } = req.body;
        const id = await ServiceDAO.create({ player_id, game_id, price, hours });
        res.status(201).json({ success: true, id });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/services/:id
 * @desc    查询单个服务
 */
router.get('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const svc = await ServiceDAO.findById(id);
        if (!svc) return res.status(404).json({ success: false, error: '服务不存在' });
        res.json({ success: true, service: svc });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/services
 * @desc    分页查询服务列表
 * @query   page, pageSize
 *           （可后续加 player_id、game_id 过滤参数）
 */
router.get('/', async (req, res, next) => {
    try {
        const page     = Number(req.query.page) || 1;
        const pageSize = Number(req.query.pageSize) || 20;
        const result = await ServiceDAO.findAll(page, pageSize);
        res.json({ success: true, ...result });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   PATCH /api/services/:id
 * @desc    更新服务（单价或时长）
 * @body    Partial<{ price, hours }>
 */
router.patch('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        await ServiceDAO.updateById(id, req.body);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   DELETE /api/services/:id
 * @desc    删除服务
 */
router.delete('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        await ServiceDAO.deleteById(id);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

export default router;
