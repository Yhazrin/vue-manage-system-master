// server/src/routes/game.route.ts
import {NextFunction, Router, Request} from 'express';
import { GameDAO } from '../dao/GameDao';
import { PlayerDAO } from '../dao/PlayerDao';
import { auth, AuthRequest } from "../middleware/auth";
import { body, param, validationResult } from "express-validator";
import { Response } from "express";
import { gameUpload } from '../utils/upload'; // 导入游戏上传实例
import path from 'path';

const router = Router();

/**
 * @route   GET /api/games/search
 * @desc    模糊搜索游戏并返回该游戏的陪玩列表
 * @query   { keyword: string }
 */
router.get('/search', async (req, res, next) => {
    try {
        const keyword = (req.query.keyword as string)?.trim();
        if (!keyword) {
            return res.status(400).json({ success: false, error: 'keyword is required' });
        }
        const games = await GameDAO.findByName(keyword);
        const results = await Promise.all(
            games.map(async game => {
                const players = await PlayerDAO.findByGameId(game.id);
                return { ...game, players };
            })
        );
        res.json({ success: true, results });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   POST /api/games
 * @desc    创建新游戏
 * @access  管理员
 */
router.post(
    '/',
    auth,
    (req: Request, res: Response, next: NextFunction) => {
        // 使文件上传变为可选
        gameUpload.single('image')(req, res, (err) => {
            if (err) {
                console.error('文件上传错误:', err);
                // 如果是文件上传错误但不是必需的，继续处理
                if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    return next();
                }
                return res.status(400).json({ success: false, error: '文件上传失败' });
            }
            next();
        });
    },
    [
        body('name').isString().notEmpty().withMessage('name 不能为空'),
        body('image_url').optional().isString().withMessage('image_url 必须是字符串')
    ],
    async (req: AuthRequest, res: Response, next:NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
        if (req.user?.role !== 'manager') return res.status(403).json({ success: false, error: '仅管理员可创建游戏' });
        try {
            const { name, image_url } = req.body;
            // 优先使用上传的文件，如果没有文件则使用前端传来的image_url
            const imageUrl = req.file ? req.file.path : (image_url || null);
            const id = await GameDAO.create({ name, image_url: imageUrl });
            // 返回创建的游戏详情
            const game = await GameDAO.findById(id);
            const mappedGame = {
                id: game!.id,
                name: game!.name,
                image_url: game!.image_url || ''
            };
            res.status(201).json({ success: true, game: mappedGame });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * @route   GET /api/games/:id
 * @desc    查询单个游戏
 */
router.get('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const game = await GameDAO.findById(id);
        if (!game) return res.status(404).json({ success: false, error: '游戏不存在' });
        res.json({ success: true, game });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/games
 * @desc    查询游戏列表（支持模糊搜索）
 * @query   keyword?: string
 */
router.get('/', async (req, res, next) => {
    try {
        const keyword = (req.query.keyword as string)?.trim();
        const games = keyword
            ? await GameDAO.findByName(keyword)
            : await GameDAO.findAll();
        res.json({ success: true, games });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   PATCH /api/games/:id
 * @desc    更新游戏
 * @access  管理员
 */
router.patch(
    '/:id',
    auth,
    gameUpload.single('image'),
    [
        param('id').isInt().withMessage('id 必须是整数'),
        body('name').optional().isString().notEmpty().withMessage('name 不能为空'),
        body('image_url').optional().isString().withMessage('image_url 必须是字符串')
    ],
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
        if (req.user?.role !== 'manager') return res.status(403).json({ success: false, error: '仅管理员可更新游戏' });
        try {
            const id = Number(req.params.id);
            const { name, image_url } = req.body;
            let imageUrl: string | undefined;
            if (req.file) {
                imageUrl = req.file.path;
            } else if (image_url) {
                imageUrl = image_url;
            }
            await GameDAO.updateById(id, { name, image_url: imageUrl });
            // 返回更新后的游戏详情
            const updated = await GameDAO.findById(id);
            const mappedGame = {
                id: updated!.id,
                name: updated!.name,
                image_url: updated!.image_url || ''
            };
            res.json({ success: true, game: mappedGame });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * @route   DELETE /api/games/:id
 * @desc    删除游戏
 * @access  管理员
 */
router.delete(
    '/:id',
    auth,
    [param('id').isInt().withMessage('id 必须是整数')],
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
        if (req.user?.role !== 'manager') return res.status(403).json({ success: false, error: '仅管理员可删除游戏' });
        try {
            const id = Number(req.params.id);
            await GameDAO.deleteById(id);
            res.json({ success: true });
        } catch (err) {
            next(err);
        }
    }
);

export default router;