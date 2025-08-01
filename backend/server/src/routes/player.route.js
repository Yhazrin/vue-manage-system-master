"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server/src/routes/player.route.ts
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const express_validator_1 = require("express-validator");
// 导入共享工具
const upload_1 = require("../utils/upload"); // 复用共享multer配置（玩家专用）
const validators_1 = require("../utils/validators"); // 复用验证规则
const loginHandler_1 = require("../utils/loginHandler"); // 复用登录逻辑
// 导入业务依赖
const PlayerDao_1 = require("../dao/PlayerDao");
const auth_1 = require("../middleware/auth"); // 权限中间件（带类型）
const router = (0, express_1.Router)();
/**
 * @route   POST /api/players
 * @desc    创建新玩家（注册）
 * @body    { name, passwd, phone_num, game_id?, QR_img?, intro?, photo_img? }
 * // 请求体：姓名、密码、手机号、可选游戏ID、二维码图片、简介
 * @return  { success: boolean, id: number, name: string }
 * // 返回：创建成功标识与新玩家ID 和姓名
 */
router.post('/register', [
    // 手机号验证：格式+唯一性（玩家角色）
    validators_1.phoneValidator,
    (0, validators_1.phoneUniqueValidator)('player'),
    // 密码验证：长度+复杂度
    validators_1.passwordValidator,
    // 姓名验证
    validators_1.nameValidator
], 
// 处理多文件上传（头像和二维码）
upload_1.playerUpload.fields([
    { name: 'photo_img', maxCount: 1 }, // 头像（可选）
    { name: 'QR_img', maxCount: 1 } // 二维码（可选）
]), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        // 验证请求数据
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        // 提取请求数据（包含文件路径）
        const { name, passwd, phone_num, game_id, intro } = req.body;
        const files = req.files;
        const photo_img = ((_b = (_a = files === null || files === void 0 ? void 0 : files['photo_img']) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.path) || null; // 头像路径
        const QR_img = ((_d = (_c = files === null || files === void 0 ? void 0 : files['QR_img']) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.path) || null; // 二维码路径
        // 密码加密
        const hash = yield bcrypt_1.default.hash(passwd, 10);
        // 创建玩家
        const id = yield PlayerDao_1.PlayerDAO.create(name, hash, phone_num, game_id, QR_img, intro, photo_img);
        const newPlayer = yield PlayerDao_1.PlayerDAO.findById(id);
        res.status(201).json({ success: true, id, name: newPlayer === null || newPlayer === void 0 ? void 0 : newPlayer.name });
    }
    catch (err) {
        next(err);
    }
}));
/**
 * @route   POST /api/players/login
 * @desc    玩家登录
 * @body    { phone_num, passwd }
 */
router.post('/login', [
    validators_1.phoneValidator, // 复用手机号格式验证
    validators_1.passwordValidator // 复用密码验证
], 
// 复用通用登录逻辑（传入玩家DAO和角色）
(0, loginHandler_1.createLoginHandler)(PlayerDao_1.PlayerDAO.findByPhoneNum, 'player'));
/**
 * @route   GET /api/players/public
 * @desc    公开的陪玩列表（用于用户浏览，不需要认证）
 * @access  公开访问
 */
router.get('/public', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 解析分页参数
        const page = Number(req.query.page) || 1;
        const pageSize = Number(req.query.pageSize) || 20;
        // 只显示在线的陪玩
        const status = true;
        // 解析搜索关键词（可选）
        const keyword = req.query.keyword;
        // 调用 DAO 分页查询玩家列表
        const result = yield PlayerDao_1.PlayerDAO.findAll(page, pageSize, status, keyword);
        // 获取所有游戏信息用于映射
        const { GameDAO } = require('../dao/GameDao');
        const games = yield GameDAO.findAll();
        const gameMap = new Map(games.map((game) => [game.id, game.name]));
        // 过滤敏感信息，只返回公开信息，并添加游戏名称
        const safePlayers = result.players.map(player => ({
            id: player.id,
            name: player.name,
            photo_img: player.photo_img,
            intro: player.intro,
            status: player.status,
            voice: player.voice,
            game_id: player.game_id,
            games: player.game_id ? [gameMap.get(player.game_id) || '未知游戏'] : [],
            services: [], // 暂时为空，后续可以从services表获取
            // 隐藏敏感字段：如手机号、财务信息等
        }));
        res.json({
            success: true,
            total: result.total,
            players: safePlayers
        });
    }
    catch (err) {
        next(err);
    }
}));
/**
 * @route   GET /api/players
 * @desc    查询玩家列表（分页+筛选）- 管理员完整访问
 * @access  仅管理员可访问
 */
router.get('/', auth_1.auth, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // 如果是普通用户或陪玩，重定向到公开接口
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'manager') {
            // 解析分页参数
            const page = Number(req.query.page) || 1;
            const pageSize = Number(req.query.pageSize) || 20;
            // 只显示在线的陪玩
            const status = true;
            // 解析搜索关键词（可选）
            const keyword = req.query.keyword;
            // 调用 DAO 分页查询玩家列表
            const result = yield PlayerDao_1.PlayerDAO.findAll(page, pageSize, status, keyword);
            // 获取所有游戏信息用于映射
            const { GameDAO } = require('../dao/GameDao');
            const games = yield GameDAO.findAll();
            const gameMap = new Map(games.map((game) => [game.id, game.name]));
            // 过滤敏感信息，只返回公开信息，并添加游戏名称
            const safePlayers = result.players.map(player => ({
                id: player.id,
                name: player.name,
                photo_img: player.photo_img,
                intro: player.intro,
                status: player.status,
                voice: player.voice,
                game_id: player.game_id,
                games: player.game_id ? [gameMap.get(player.game_id) || '未知游戏'] : [],
                services: [], // 暂时为空，后续可以从services表获取
                // 隐藏敏感字段：如手机号、财务信息等
            }));
            return res.json({
                success: true,
                total: result.total,
                players: safePlayers
            });
        }
        // 管理员完整访问
        // 解析分页参数（默认页码1，每页20条，与用户路由一致）
        const page = Number(req.query.page) || 1;
        const pageSize = Number(req.query.pageSize) || 20;
        // 解析状态参数（字符串转布尔值，未提供则为undefined）
        const status = req.query.status !== undefined
            ? req.query.status === 'true'
            : undefined;
        // 解析搜索关键词（可选）
        const keyword = req.query.keyword;
        // 调用 DAO 分页查询玩家列表（带筛选条件）
        const result = yield PlayerDao_1.PlayerDAO.findAll(page, pageSize, status, keyword);
        res.json(Object.assign({ success: true }, result)); // 返回查询结果（总数+玩家列表）
    }
    catch (err) {
        next(err);
    }
}));
/**
 * @route   GET /api/players/game/:gameId
 * @desc    查询某游戏下的所有玩家
 */
router.get('/game/:gameId', auth_1.auth, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const gameId = Number(req.params.gameId); // 解析游戏ID
        const players = yield PlayerDao_1.PlayerDAO.findByGameId(gameId); // 调用 DAO 查询该游戏下的玩家
        const safePlayers = players.map(player => ({
            id: player.id,
            name: player.name,
            photo_img: player.photo_img,
            intro: player.intro,
            status: player.status,
            voice: player.voice,
            game_id: player.game_id,
            // 隐藏敏感字段：如手机号、财务信息等
        }));
        res.json({ success: true, count: safePlayers.length, players: safePlayers }); // 返回玩家列表
    }
    catch (err) {
        next(err);
    }
}));
/**
 * @route   GET /api/players/:id
 * @desc    查询单个玩家
 * @access  本人或管理员可访问
 */
router.get('/:id', auth_1.auth, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const targetId = Number(req.params.id);
        const currentUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const currentRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        // 权限判断：仅本人或管理员可访问
        if (currentRole !== 'manager' && currentUserId !== targetId) {
            return res.status(403).json({ success: false, error: '无权限访问该玩家资料' });
        }
        const player = yield PlayerDao_1.PlayerDAO.findById(targetId);
        if (!player)
            return res.status(404).json({ success: false, error: '玩家不存在' });
        res.json({ success: true, player });
    }
    catch (err) {
        next(err);
    }
}));
/**
 * @route   PATCH /api/players/:id
 * @desc    更新玩家基础信息（name, phone_num, intro, photo_img, voice）
 * @access  本人可访问
 * @body    Partial<{ name, phone_num, intro, photo_img, voice }>
 */
router.patch('/:id', auth_1.auth, upload_1.playerUpload.single('photo_img'), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const targetId = Number(req.params.id);
        const currentUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        // 权限判断：仅本人可更新
        if (currentUserId !== targetId) {
            return res.status(403).json({ success: false, error: '无权限更新该玩家信息' });
        }
        const updateData = Object.assign({}, req.body);
        // 处理头像更新
        if (req.file)
            updateData.photo_img = req.file.path;
        yield PlayerDao_1.PlayerDAO.updateById(targetId, updateData);
        // 返回更新后的用户数据
        const updatedPlayer = yield PlayerDao_1.PlayerDAO.findById(targetId);
        res.json({ success: true, player: updatedPlayer });
    }
    catch (err) {
        next(err);
    }
}));
/**
 * @route   PATCH /api/players/:id/status
 * @desc    更新在线状态
 * @access  本人可访问
 * @body    { status: boolean }
 */
router.patch('/:id/status', auth_1.auth, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const targetId = Number(req.params.id);
        const currentUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (currentUserId !== targetId) {
            return res.status(403).json({ success: false, error: '无权限更新该玩家状态' });
        }
        const { status } = req.body;
        yield PlayerDao_1.PlayerDAO.updateStatus(targetId, status);
        res.json({ success: true });
    }
    catch (err) {
        next(err);
    }
}));
/**
 * @route   PATCH /api/players/:id/financials
 * @desc    更新余额和提现金额
 * @body    { money: number, profit: number }
 */
router.patch('/:id/financials', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = Number(req.params.id); // 获取玩家ID
        const { money, profit } = req.body; // 获取财务参数
        yield PlayerDao_1.PlayerDAO.updateFinancials(id, money, profit); // 调用 DAO 更新财务信息
        res.json({ success: true });
    }
    catch (err) {
        next(err);
    }
}));
/**
 * @route   PATCH /api/players/:id/voice
 * @desc    更新录音文件路径
 * @access  本人可访问
 */
router.patch('/:id/voice', auth_1.auth, upload_1.playerUpload.single('voice'), // 处理录音文件上传
(req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const targetId = Number(req.params.id);
        const currentUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (currentUserId !== targetId) {
            return res.status(403).json({ success: false, error: '无权限更新录音信息' });
        }
        // 获取上传的录音文件路径
        const voicePath = ((_b = req.file) === null || _b === void 0 ? void 0 : _b.path) || null;
        if (!voicePath) {
            return res.status(400).json({ success: false, error: '请上传录音文件' });
        }
        yield PlayerDao_1.PlayerDAO.updateVoice(targetId, voicePath);
        res.json({ success: true });
    }
    catch (err) {
        next(err);
    }
}));
/**
 * @route   PATCH /api/players/:id/qr
 * @desc    更新二维码图片路径（支持文件上传或直接传路径）
 * @access  本人可访问
 */
router.patch('/:id/qr', auth_1.auth, upload_1.playerUpload.single('QR_img'), // 支持上传新二维码图片
(req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const targetId = Number(req.params.id);
        const currentUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (currentUserId !== targetId) {
            return res.status(403).json({ success: false, error: '无权限更新二维码' });
        }
        // 优先使用上传的文件路径，其次使用body中的路径
        const QR_img = ((_b = req.file) === null || _b === void 0 ? void 0 : _b.path) || req.body.QR_img;
        yield PlayerDao_1.PlayerDAO.updateQR(targetId, QR_img);
        res.json({ success: true });
    }
    catch (err) {
        next(err);
    }
}));
/**
 * @route   PATCH /api/players/:id/password
 * @desc    修改密码
 * @access  仅本人可访问
 * @body    { passwd: string }
 */
router.patch('/:id/password', auth_1.auth, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const targetId = Number(req.params.id);
        const currentUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        // 仅本人可修改密码
        if (currentUserId !== targetId) {
            return res.status(403).json({ success: false, error: '无权限修改该玩家密码' });
        }
        // 验证新密码格式
        const passwd = req.body.passwd;
        if (!passwd || passwd.length < 6 || !/^(?=.*[a-zA-Z])(?=.*\d)/.test(passwd)) {
            return res.status(400).json({
                success: false,
                error: '密码必须包含字母和数字，且长度至少6个字符'
            });
        }
        const hash = yield bcrypt_1.default.hash(passwd, 10);
        yield PlayerDao_1.PlayerDAO.updatePassword(targetId, hash);
        res.json({ success: true });
    }
    catch (err) {
        next(err);
    }
}));
/**
 * @route   DELETE /api/players/:id/voice
 * @desc    删除玩家录音文件
 * @access  本人可访问
 */
router.delete('/:id/voice', auth_1.auth, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const targetId = Number(req.params.id);
        const currentUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        // 权限判断
        if (currentUserId !== targetId) {
            return res.status(403).json({ success: false, error: '无权限删除录音' });
        }
        // 1. 查询数据库获取旧录音路径
        const player = yield PlayerDao_1.PlayerDAO.findById(targetId);
        if (!player || !player.voice) {
            return res.status(404).json({ success: false, error: '录音文件不存在' });
        }
        // 2. 删除本地文件
        const fs = require('fs');
        const path = require('path');
        const uploadsDir = path.join(__dirname, '../../../../uploads/players/voices'); // 确定上传目录
        const fullPath = path.join(uploadsDir, player.voice); // 拼接完整的录音文件路径
        // 检查文件是否存在
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath); // 删除文件
        }
        else {
            return res.status(404).json({ success: false, error: '文件未找到' });
        }
        // 3. 清空数据库中的录音路径
        yield PlayerDao_1.PlayerDAO.updateVoice(targetId, null);
        res.json({ success: true, message: '录音已删除' });
    }
    catch (err) {
        next(err);
    }
}));
/**
 * @route   DELETE /api/players/:id
 * @desc    删除玩家
 * @access  仅管理员可访问
 */
router.delete('/:id', auth_1.auth, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'manager') {
            return res.status(403).json({ success: false, error: '仅管理员可删除玩家' });
        }
        const id = Number(req.params.id);
        yield PlayerDao_1.PlayerDAO.deleteById(id);
        res.json({ success: true });
    }
    catch (err) {
        next(err);
    }
}));
/**
 * @route   GET /api/players/count
 * @desc    获取玩家总数
 * @access  仅管理员可访问
 */
router.get('/count', auth_1.auth, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'manager') {
            return res.status(403).json({ success: false, error: '仅管理员可查看玩家总数' });
        }
        const count = yield PlayerDao_1.PlayerDAO.countAll();
        res.json({ success: true, count });
    }
    catch (err) {
        next(err);
    }
}));
exports.default = router;
