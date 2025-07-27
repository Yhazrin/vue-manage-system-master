// server/src/routes/player.route.ts
import { Router } from 'express';
import bcrypt from 'bcrypt';
import { PlayerDAO } from '../dao/PlayerDao';

const router = Router();

/**
 * @route   POST /api/players
 * @desc    创建新玩家（注册）
 * @body    { name, passwd, phone_num, game_id?, QR_img?, intro? }
 * // 请求体：姓名、密码、手机号、可选游戏ID、二维码图片、简介
 * @return  { success: boolean, id: number, name: string }
 * // 返回：创建成功标识与新玩家ID 和姓名
 */
router.post('/', async (req, res, next) => {
    try {
        const { name, passwd, phone_num, game_id, QR_img, intro } = req.body;
        // 密码哈希
        const hash = await bcrypt.hash(passwd, 10);
        // 调用 PlayerDAO 创建玩家，返回新玩家ID
        const id = await PlayerDAO.create(
            name,
            hash,
            phone_num,
            game_id,
            QR_img,
            intro
        );
        const newPlayer = await PlayerDAO.findById(id);
        // 响应 201（创建成功），返回ID和姓名
        res.status(201).json({ success: true, id, name: newPlayer?.name });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/players/:id
 * @desc    查询单个玩家
 */
router.get('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);  // 从 URL 参数获取玩家ID并转为数字（与用户路由一致）
        const player = await PlayerDAO.findById(id);  // 调用 DAO 查询玩家
        if (!player) return res.status(404).json({ success: false, error: '玩家不存在' });  // 未找到时返回404
        res.json({ success: true, player });  // 返回玩家信息
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/players
 * @desc    分页查询玩家列表
 * @query   page, pageSize, status?, keyword?
 */
router.get('/', async (req, res, next) => {
    try {
        // 解析分页参数（默认页码1，每页20条，与用户路由一致）
        const page = Number(req.query.page) || 1;
        const pageSize = Number(req.query.pageSize) || 20;
        // 解析状态参数（字符串转布尔值，未提供则为undefined）
        const status = req.query.status !== undefined
            ? req.query.status === 'true'
            : undefined;
        // 解析搜索关键词（可选）
        const keyword = req.query.keyword as string | undefined;
        // 调用 DAO 分页查询玩家列表（带筛选条件）
        const result = await PlayerDAO.findAll(page, pageSize, status, keyword);
        res.json({ success: true, ...result });  // 返回查询结果（总数+玩家列表）
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/players/game/:gameId
 * @desc    查询某游戏下的所有玩家
 */
router.get('/game/:gameId', async (req, res, next) => {
    try {
        const gameId = Number(req.params.gameId);  // 解析游戏ID
        const players = await PlayerDAO.findByGameId(gameId);  // 调用 DAO 查询该游戏下的玩家
        res.json({ success: true, players });  // 返回玩家列表
    } catch (err) {
        next(err);
    }
});

/**
 * @route   PATCH /api/players/:id
 * @desc    更新玩家基础信息（name, phone_num, intro）
 * @body    Partial<{ name, phone_num, intro }>
 */
router.patch('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);  // 获取玩家ID
        await PlayerDAO.updateById(id, req.body);  // 调用 DAO 更新基础信息（部分更新）
        res.json({ success: true });  // 返回更新成功标识
    } catch (err) {
        next(err);
    }
});

/**
 * @route   PATCH /api/players/:id/status
 * @desc    更新在线状态
 * @body    { status: boolean }
 */
router.patch('/:id/status', async (req, res, next) => {
    try {
        const id = Number(req.params.id);  // 获取玩家ID
        const { status } = req.body;  // 获取状态参数
        await PlayerDAO.updateStatus(id, status);  // 调用 DAO 更新状态
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   PATCH /api/players/:id/financials
 * @desc    更新余额和提现金额
 * @body    { money: number, profit: number }
 */
router.patch('/:id/financials', async (req, res, next) => {
    try {
        const id = Number(req.params.id);  // 获取玩家ID
        const { money, profit } = req.body;  // 获取财务参数
        await PlayerDAO.updateFinancials(id, money, profit);  // 调用 DAO 更新财务信息
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   PATCH /api/players/:id/voice
 * @desc    更新录音文件路径
 * @body    { voice: string }
 */
router.patch('/:id/voice', async (req, res, next) => {
    try {
        const id = Number(req.params.id);  // 获取玩家ID
        const { voice } = req.body;  // 获取录音路径
        await PlayerDAO.updateVoice(id, voice);  // 调用 DAO 更新录音路径
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   DELETE /api/players/:id
 * @desc    删除玩家
 */
router.delete('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);  // 获取玩家ID
        await PlayerDAO.deleteById(id);  // 调用 DAO 删除玩家记录
        res.json({ success: true });  // 返回删除成功标识
    } catch (err) {
        next(err);
    }
});

export default router;
