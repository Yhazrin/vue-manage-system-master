// server/src/routes/player.route.ts
import { Router } from 'express';
import bcrypt from 'bcrypt';
import { PlayerDAO } from '../dao/PlayerDao';
import { signToken } from '../middleware/auth';  // 如果需要身份验证，可以启用
import { auth } from '../middleware/auth';  // 引入身份验证中间件
import multer from 'multer'; // 引入 multer 用于处理文件上传
import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express'; // 导入类型定义

const router = Router();

// ---------- multer 配置（头像上传） ----------
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // 判断是用户还是玩家，分别存储不同的目录
        const directory = req.body.type === 'player' ? 'players/' : 'users/';
        cb(null, `uploads/${directory}`);  // 上传到不同的目录：uploads/players 或 uploads/users
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`); // 文件名加时间戳防重名
    }
});

const upload = multer({ storage });

/**
 * @route   POST /api/players
 * @desc    创建新玩家（注册）
 * @body    { name, passwd, phone_num, game_id?, QR_img?, intro?, photo_img? }
 * // 请求体：姓名、密码、手机号、可选游戏ID、二维码图片、简介
 * @return  { success: boolean, id: number, name: string }
 * // 返回：创建成功标识与新玩家ID 和姓名
 */
router.post('/register', async (req, res, next) => {
    try {
        const { name, passwd, phone_num, game_id, QR_img, intro, photo_img } = req.body;
        // 密码哈希
        const hash = await bcrypt.hash(passwd, 10);
        // 调用 PlayerDAO 创建玩家，返回新玩家ID
        const id = await PlayerDAO.create(
            name,
            hash,
            phone_num,
            game_id,
            QR_img,
            intro,
            photo_img
        );
        const newPlayer = await PlayerDAO.findById(id);
        // 响应 201（创建成功），返回ID和姓名
        res.status(201).json({ success: true, id, name: newPlayer?.name });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   POST /api/players/login
 * @desc    玩家登录
 * @body    { phone_num, passwd }
 */
router.post('/login', async (req, res, next) => {
    try {
        const { phone_num, passwd } = req.body;
        const player = await PlayerDAO.findByPhoneNum(phone_num);
        if (!player) return res.status(404).json({ success: false, error: '玩家不存在' });
        const match = await bcrypt.compare(passwd, player.passwd);
        if (!match) return res.status(401).json({ success: false, error: '密码错误' });
        // 签发JWT Token，角色可以传'player'
        const token = signToken(player.id, player.phone_num, 'player');
        // 返回token（和player信息，如果需要也可以一并返回）
        res.json({ success: true, token }); // 或者 { success: true, token, player }
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
 * @route   PATCH /api/players/:id/qr
 * @desc    更新二维码图片路径
 * @body    { QR_img: string }
 */
router.patch('/:id/qr', async (req, res, next) => {
    try {
        const id = Number(req.params.id);  // 获取玩家ID
        const {QR_img} = req.body;  // 获取二维码图片路径
        await PlayerDAO.updateQR(id, QR_img);  // 调用 DAO 更新二维码图片路径
        res.json({success: true});
    } catch (err) {
        next(err);
    }
});

/**
 * @route   PATCH /api/players/:id/password
 * @desc    修改密码
 * @body    { passwd: string }
 */
router.patch('/:id/password', async (req, res, next) => {
    try {
        const id = Number(req.params.id);  // 获取用户 ID
        // 加密新密码后更新到数据库
        const hash = await bcrypt.hash(req.body.passwd, 10);
        await PlayerDAO.updatePassword(id, hash);
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

/**
 * @route   GET /api/players/count
 * @desc    获取玩家总数
 */
router.get('/count', async (req, res, next) => {
    try {
        const count = await PlayerDAO.countAll();  // 调用 DAO 获取玩家总数
        res.json({success: true, count});  // 返回总数
    } catch (err) {
        next(err);
    }
});

export default router;