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
Object.defineProperty(exports, "__esModule", { value: true });
// server/src/routes/game.route.ts
const express_1 = require("express");
const GameDao_1 = require("../dao/GameDao");
const PlayerDao_1 = require("../dao/PlayerDao");
const auth_1 = require("../middleware/auth");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/games/search
 * @desc    模糊搜索游戏并返回该游戏的陪玩列表
 * @query   { keyword: string }
 */
router.get('/search', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const keyword = (_a = req.query.keyword) === null || _a === void 0 ? void 0 : _a.trim();
        if (!keyword) {
            return res.status(400).json({ success: false, error: 'keyword is required' });
        }
        const games = yield GameDao_1.GameDAO.findByName(keyword);
        const results = yield Promise.all(games.map((game) => __awaiter(void 0, void 0, void 0, function* () {
            const players = yield PlayerDao_1.PlayerDAO.findByGameId(game.id);
            return Object.assign(Object.assign({}, game), { players });
        })));
        res.json({ success: true, results });
    }
    catch (err) {
        next(err);
    }
}));
/**
 * @route   POST /api/games
 * @desc    创建新游戏
 * @access  管理员
 */
router.post('/', auth_1.auth, [
    (0, express_validator_1.body)('name').isString().notEmpty().withMessage('name 不能为空')
], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ success: false, errors: errors.array() });
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'manager')
        return res.status(403).json({ success: false, error: '仅管理员可创建游戏' });
    try {
        const { name } = req.body;
        const id = yield GameDao_1.GameDAO.create({ name });
        res.status(201).json({ success: true, id });
    }
    catch (err) {
        next(err);
    }
}));
/**
 * @route   GET /api/games/:id
 * @desc    查询单个游戏
 */
router.get('/:id', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = Number(req.params.id);
        const game = yield GameDao_1.GameDAO.findById(id);
        if (!game)
            return res.status(404).json({ success: false, error: '游戏不存在' });
        res.json({ success: true, game });
    }
    catch (err) {
        next(err);
    }
}));
/**
 * @route   GET /api/games
 * @desc    查询游戏列表（支持模糊搜索）
 * @query   keyword?: string
 */
router.get('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const keyword = (_a = req.query.keyword) === null || _a === void 0 ? void 0 : _a.trim();
        const games = keyword
            ? yield GameDao_1.GameDAO.findByName(keyword)
            : yield GameDao_1.GameDAO.findAll();
        res.json({ success: true, games });
    }
    catch (err) {
        next(err);
    }
}));
/**
 * @route   PATCH /api/games/:id
 * @desc    更新游戏
 * @access  管理员
 */
router.patch('/:id', auth_1.auth, [
    (0, express_validator_1.param)('id').isInt().withMessage('id 必须是整数'),
    (0, express_validator_1.body)('name').optional().isString().notEmpty().withMessage('name 不能为空')
], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ success: false, errors: errors.array() });
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'manager')
        return res.status(403).json({ success: false, error: '仅管理员可更新游戏' });
    try {
        const id = Number(req.params.id);
        yield GameDao_1.GameDAO.updateById(id, req.body);
        res.json({ success: true });
    }
    catch (err) {
        next(err);
    }
}));
/**
 * @route   DELETE /api/games/:id
 * @desc    删除游戏
 * @access  管理员
 */
router.delete('/:id', auth_1.auth, [(0, express_validator_1.param)('id').isInt().withMessage('id 必须是整数')], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ success: false, errors: errors.array() });
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'manager')
        return res.status(403).json({ success: false, error: '仅管理员可删除游戏' });
    try {
        const id = Number(req.params.id);
        yield GameDao_1.GameDAO.deleteById(id);
        res.json({ success: true });
    }
    catch (err) {
        next(err);
    }
}));
exports.default = router;
