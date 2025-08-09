// server/src/routes/game.route.ts
import {NextFunction, Router, Request} from 'express';
import { GameDAO } from '../dao/GameDao';
import { PlayerDAO } from '../dao/PlayerDao';
import { auth, AuthRequest } from "../middleware/auth";
import { body, param, validationResult } from "express-validator";
import { Response } from "express";
import { createUpload } from '../utils/upload'; // 导入创建上传实例的函数

// 创建游戏上传实例
const gameUpload = createUpload('game');
import * as path from 'path';

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
    // 启用文件上传中间件
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
        console.log('🎮 POST /api/games 被调用');
        console.log('请求体:', req.body);
        console.log('上传的文件:', req.file);
        console.log('Content-Type:', req.headers['content-type']);
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
        if (req.user?.role !== 'admin' && req.user?.role !== 'customer_service') return res.status(403).json({ success: false, error: '仅管理员和客服可创建游戏' });
        try {
            const { name, image_url } = req.body;

            if (!name) {
                return res.status(400).json({ success: false, error: '游戏名称不能为空' });
            }

            let finalImageUrl = image_url || null;
            
            // 如果有上传的文件，使用文件路径
            if (req.file) {
                console.log('✅ 检测到上传文件:', req.file.filename);
                console.log('文件保存路径:', req.file.path);
                // 生成相对于后端uploads的路径
                finalImageUrl = `/uploads/game/images/${req.file.filename}`;
            } else {
                console.log('❌ 没有检测到上传文件');
            }

            console.log('最终图片URL:', finalImageUrl);

            const gameId = await GameDAO.create({ name, image_url: finalImageUrl });
            const game = await GameDAO.findById(gameId);
            
            const responseGame = {
                ...game,
                image_url: game?.image_url || ''
            };
            
            res.json({ success: true, game: responseGame });
        } catch (err) {
            console.error('🎮 游戏创建失败:', err);
            next(err);
        }
    }
);

// 更新游戏的处理函数
const updateGameHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    if (req.user?.role !== 'admin' && req.user?.role !== 'customer_service') return res.status(403).json({ success: false, error: '仅管理员和客服可更新游戏' });
    try {
        const id = Number(req.params.id);
        const { name, image_url } = req.body;
        
        // 构建更新数据对象，只包含有值的字段
        const updateData: { name?: string; image_url?: string } = {};
        
        if (name !== undefined && name !== null && name.trim() !== '') {
            updateData.name = name;
        }
        
        if (req.file) {
            // 生成相对于后端uploads的路径
            updateData.image_url = `/uploads/game/images/${req.file.filename}`;
        } else if (image_url !== undefined && image_url !== null) {
            updateData.image_url = image_url;
        }
        
        await GameDAO.updateById(id, updateData);
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
};

/**
 * @route   PATCH /api/games/:id
 * @desc    更新游戏
 * @access  管理员
 */
router.patch(
    '/:id',
    (req: Request, res: Response, next: NextFunction) => {
        console.log('🔥🔥🔥 PATCH路由被调用！🔥🔥🔥');
        console.log('请求方法:', req.method);
        console.log('请求路径:', req.path);
        console.log('请求参数:', req.params);
        console.log('请求体:', req.body);
        next();
    },
    auth,
    gameUpload.single('image'), // 启用文件上传
    [
        param('id').isInt().withMessage('id 必须是整数'),
        body('name').optional().isString().notEmpty().withMessage('name 不能为空'),
        body('image_url').optional().isString().withMessage('image_url 必须是字符串')
    ],
    updateGameHandler
);

/**
 * @route   PUT /api/games/:id
 * @desc    更新游戏 (与PATCH功能相同)
 * @access  管理员
 */
router.put(
    '/:id',
    auth,
    gameUpload.single('image'), // 启用文件上传
    [
        param('id').isInt().withMessage('id 必须是整数'),
        body('name').optional().isString().notEmpty().withMessage('name 不能为空'),
        body('image_url').optional().isString().withMessage('image_url 必须是字符串')
    ],
    updateGameHandler
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
        if (req.user?.role !== 'admin' && req.user?.role !== 'customer_service') return res.status(403).json({ success: false, error: '仅管理员和客服可删除游戏' });
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