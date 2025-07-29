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
// backend/server/src/routes/withdrawal.route.ts
const express_1 = require("express");
const WithdrawalDao_1 = require("../dao/WithdrawalDao");
const auth_1 = require("../middleware/auth"); // 导入权限中间件
const router = (0, express_1.Router)();
/**
 * @route   POST /api/withdrawals
 * @desc    发起提现申请
 * @body    { withdrawal_id, player_id, amount, platform_fee, status }
 * @access  玩家本人可访问
 */
router.post('/', auth_1.auth, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { withdrawal_id, player_id, amount } = req.body;
        // 可选：校验一下，确保只能给自己的 player_id 提现
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'player' || req.user.id !== Number(player_id)) {
            return res.status(403).json({ success: false, error: '无权限给该玩家申请提现' });
        }
        // DAO 里已经会去读 commission_rate、算 platform_fee、把 status 设为 '待审核'
        yield WithdrawalDao_1.WithdrawalDAO.create({ withdrawal_id, player_id, amount });
        res.status(201).json({ success: true, withdrawal_id });
    }
    catch (err) {
        next(err);
    }
}));
/**
 * @route   GET /api/withdrawals/:id
 * @desc    查询单条提现记录
 */
router.get('/:id', auth_1.auth, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // 验证权限：只允许管理员(manager)和玩家(player)访问
        if (!['manager', 'player'].includes(((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) || '')) {
            return res.status(403).json({ success: false, error: '没有访问权限' });
        }
        const id = req.params.id;
        const wd = yield WithdrawalDao_1.WithdrawalDAO.findById(id);
        // 玩家只能查看自己的提现记录（如果需要更细粒度控制）
        if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === 'player' && (wd === null || wd === void 0 ? void 0 : wd.player_id) !== req.user.id) {
            return res.status(403).json({ success: false, error: '无权查看他人提现记录' });
        }
        if (!wd)
            return res.status(404).json({ success: false, error: '提现记录不存在' });
        res.json({ success: true, withdrawal: wd });
    }
    catch (err) {
        next(err);
    }
}));
/**
 * @route   GET /api/withdrawals
 * @desc    分页查询提现记录列表
 * @query   page, pageSize, status?
 */
router.get('/', auth_1.auth, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // 验证权限：只允许管理员和玩家访问
        if (!['manager', 'player'].includes(((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) || '')) {
            return res.status(403).json({ success: false, error: '没有访问权限' });
        }
        const page = Number(req.query.page) || 1;
        const pageSize = Number(req.query.pageSize) || 20;
        const status = req.query.status;
        let result;
        // 玩家只能查看自己的记录，管理员可以查看所有
        if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === 'player') {
            result = yield WithdrawalDao_1.WithdrawalDAO.findByPlayerId(req.user.id, page, pageSize, status);
        }
        else {
            result = yield WithdrawalDao_1.WithdrawalDAO.findAll(page, pageSize, status);
        }
        res.json(Object.assign({ success: true }, result));
    }
    catch (err) {
        next(err);
    }
}));
exports.default = router;
