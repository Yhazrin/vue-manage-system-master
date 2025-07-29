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
// backend/server/src/routes/comment.route.ts
const express_1 = require("express");
const CommentDao_1 = require("../dao/CommentDao");
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/comments
 * @desc    获取所有评论
 * @access  登录用户
 */
router.get('/', auth_1.auth, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const comments = yield CommentDao_1.CommentDAO.findAll();
        res.json({ success: true, comments });
    }
    catch (err) {
        next(err);
    }
}));
/**
 * @route   POST /api/comments
 * @desc    创建新评论
 * @access  登录用户
 */
router.post('/', auth_1.auth, [
    (0, express_validator_1.body)('player_id').isInt().withMessage('player_id 必须是整数'),
    (0, express_validator_1.body)('order_id').isString().notEmpty().withMessage('order_id 不能为空'),
    (0, express_validator_1.body)('content').isString().notEmpty().withMessage('content 不能为空'),
    (0, express_validator_1.body)('rating').optional().isInt({ min: 1, max: 5 }).withMessage('rating 必须在1到5之间')
], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ success: false, errors: errors.array() });
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'user')
        return res.status(403).json({ success: false, error: '仅普通用户可发表评论' });
    try {
        const { player_id, order_id, content, rating } = req.body;
        const user_id = req.user.id;
        const id = yield CommentDao_1.CommentDAO.create({ user_id, player_id, order_id, content, rating });
        res.status(201).json({ success: true, id });
    }
    catch (err) {
        next(err);
    }
}));
/**
 * @route   GET /api/comments/:id
 * @desc    获取单个评论
 * @access  登录用户
 */
router.get('/:id', auth_1.auth, [(0, express_validator_1.param)('id').isInt().withMessage('id 必须是整数')], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ success: false, errors: errors.array() });
    try {
        const id = Number(req.params.id);
        const comment = yield CommentDao_1.CommentDAO.findById(id);
        if (!comment)
            return res.status(404).json({ success: false, error: '评论不存在' });
        res.json({ success: true, comment });
    }
    catch (err) {
        next(err);
    }
}));
/**
 * @route   GET /api/comments/order/:orderId
 * @desc    获取指定订单的所有评论
 * @access  登录用户
 */
router.get('/order/:orderId', auth_1.auth, [(0, express_validator_1.param)('orderId').isString().notEmpty().withMessage('orderId 不能为空')], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ success: false, errors: errors.array() });
    try {
        const orderId = req.params.orderId;
        const comments = yield CommentDao_1.CommentDAO.findByOrder(orderId);
        res.json({ success: true, comments });
    }
    catch (err) {
        next(err);
    }
}));
exports.default = router;
