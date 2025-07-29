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
// backend/server/src/routes/service.route.ts
const express_1 = require("express");
const ServiceDao_1 = require("../dao/ServiceDao");
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/services
 * @desc    创建新的陪玩服务
 * @access  登录用户
 */
router.post('/', auth_1.auth, [
    (0, express_validator_1.body)('player_id').isInt().withMessage('player_id 必须是整数'),
    (0, express_validator_1.body)('game_id').isInt().withMessage('game_id 必须是整数'),
    (0, express_validator_1.body)('price').isFloat({ min: 0 }).withMessage('price 必须是非负数'),
    (0, express_validator_1.body)('hours').isInt({ min: 1 }).withMessage('hours 必须大于0')
], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ success: false, errors: errors.array() });
    // 只有普通用户才能创建服务
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'user') {
        return res.status(403).json({ success: false, error: '仅普通用户可创建服务' });
    }
    try {
        const { player_id, game_id, price, hours } = req.body;
        const id = yield ServiceDao_1.ServiceDAO.create({ player_id, game_id, price, hours });
        res.status(201).json({ success: true, id });
    }
    catch (err) {
        next(err);
    }
}));
/**
* @route   GET /api/services/:id
* @desc    查询单个服务
* @access  管理员、用户、玩家
*/
router.get('/:id', auth_1.auth, [(0, express_validator_1.param)('id').isInt().withMessage('id 必须是整数')], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ success: false, errors: errors.array() });
    try {
        const id = Number(req.params.id);
        const svc = yield ServiceDao_1.ServiceDAO.findById(id);
        if (!svc)
            return res.status(404).json({ success: false, error: '服务不存在' });
        res.json({ success: true, service: svc });
    }
    catch (err) {
        next(err);
    }
}));
/**
 * @route   GET /api/services
 * @desc    分页查询服务列表
 * @access  管理员
 */
router.get('/', auth_1.auth, [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('page 必须是大于0的整数'),
    (0, express_validator_1.query)('pageSize').optional().isInt({ min: 1 }).withMessage('pageSize 必须是大于0的整数')
], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ success: false, errors: errors.array() });
    // 只有管理员才能查询服务列表
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'manager') {
        return res.status(403).json({ success: false, error: '仅管理员可查询服务列表' });
    }
    try {
        const page = Number(req.query.page) || 1;
        const pageSize = Number(req.query.pageSize) || 20;
        const result = yield ServiceDao_1.ServiceDAO.findAll(page, pageSize);
        res.json(Object.assign({ success: true }, result));
    }
    catch (err) {
        next(err);
    }
}));
/**
 * @route   PATCH /api/services/:id
 * @desc    更新服务
 * @access  管理员
 */
router.patch('/:id', auth_1.auth, [
    (0, express_validator_1.param)('id').isInt().withMessage('id 必须是整数'),
    (0, express_validator_1.body)('price').optional().isFloat({ min: 0 }).withMessage('price 必须是非负数'),
    (0, express_validator_1.body)('hours').optional().isInt({ min: 1 }).withMessage('hours 必须大于0')
], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ success: false, errors: errors.array() });
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'manager') {
        return res.status(403).json({ success: false, error: '仅管理员可更新服务' });
    }
    try {
        const id = Number(req.params.id);
        yield ServiceDao_1.ServiceDAO.updateById(id, req.body);
        res.json({ success: true });
    }
    catch (err) {
        next(err);
    }
}));
/**
 * @route   DELETE /api/services/:id
 * @desc    删除服务
 * @access  管理员
 */
router.delete('/:id', auth_1.auth, [(0, express_validator_1.param)('id').isInt().withMessage('id 必须是整数')], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ success: false, errors: errors.array() });
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'manager') {
        return res.status(403).json({ success: false, error: '仅管理员可删除服务' });
    }
    try {
        const id = Number(req.params.id);
        yield ServiceDao_1.ServiceDAO.deleteById(id);
        res.json({ success: true });
    }
    catch (err) {
        next(err);
    }
}));
exports.default = router;
