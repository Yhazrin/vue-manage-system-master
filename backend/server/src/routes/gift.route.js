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
// backend/server/src/routes/gift.route.ts
const express_1 = require("express");
const GiftDao_1 = require("../dao/GiftDao");
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../utils/upload"); // 导入礼物上传实例
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
/**
 * @route   POST /api/gifts
 * @desc    创建礼物
 * @access  管理员
 */
router.post('/', auth_1.auth, upload_1.giftUpload.single('image'), [
    (0, express_validator_1.body)('name').isString().notEmpty().withMessage('name 不能为空'),
    (0, express_validator_1.body)('price').isFloat({ min: 0 }).withMessage('price 必须是非负数')
], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ success: false, errors: errors.array() });
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'manager')
        return res.status(403).json({ success: false, error: '仅管理员可创建礼物' });
    try {
        const { name, price } = req.body;
        const image_url = req.file ? req.file.path : null;
        const id = yield GiftDao_1.GiftDAO.create({ name, price, image_url });
        res.status(201).json({ success: true, id });
    }
    catch (err) {
        next(err);
    }
}));
// ===== 按名称模糊搜索礼物 =====
router.get('/search', auth_1.auth, [(0, express_validator_1.query)('name').isString().notEmpty().withMessage('name 参数必填')], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ success: false, errors: errors.array() });
    try {
        const { name } = req.query;
        const gifts = yield GiftDao_1.GiftDAO.findByNameLike(name);
        res.json({ success: true, gifts });
    }
    catch (err) {
        next(err);
    }
}));
/**
 * @route   GET /api/gifts/:id
 * @desc    查询单个礼物
 */
router.get('/:id', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = Number(req.params.id);
        const gift = yield GiftDao_1.GiftDAO.findById(id);
        if (!gift)
            return res.status(404).json({ success: false, error: '礼物不存在' });
        res.json({ success: true, gift });
    }
    catch (err) {
        next(err);
    }
}));
/**
 * @route   GET /api/gifts
 * @desc    查询所有礼物
 */
router.get('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const gifts = yield GiftDao_1.GiftDAO.findAll();
        res.json({ success: true, gifts });
    }
    catch (err) {
        next(err);
    }
}));
// ===== 更新礼物（管理员） =====
router.patch('/:id', auth_1.auth, upload_1.giftUpload.single('image'), [
    (0, express_validator_1.param)('id').isInt().withMessage('id 必须为正整数'),
    (0, express_validator_1.body)('name').optional().isString().withMessage('name 必须是字符串'),
    (0, express_validator_1.body)('price').optional().isFloat({ min: 0 }).withMessage('price 必须是非负数')
], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ success: false, errors: errors.array() });
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'manager')
        return res.status(403).json({ success: false, error: '仅管理员可更新礼物' });
    try {
        const id = Number(req.params.id);
        const { name, price } = req.body;
        let image_url;
        if (req.file) {
            image_url = path_1.default.join('uploads/gift/images', req.file.filename);
        }
        yield GiftDao_1.GiftDAO.update(id, { name, price, image_url });
        const updated = yield GiftDao_1.GiftDAO.findById(id);
        res.json({ success: true, gift: updated });
    }
    catch (err) {
        next(err);
    }
}));
/**
 * @route   DELETE /api/gifts/:id
 * @desc    删除礼物
 */
router.delete('/:id', auth_1.auth, [(0, express_validator_1.param)('id').isInt().withMessage('id 必须为正整数')], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ success: false, errors: errors.array() });
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'manager')
        return res.status(403).json({ success: false, error: '仅管理员可删除礼物' });
    try {
        const id = Number(req.params.id);
        yield GiftDao_1.GiftDAO.deleteById(id);
        res.json({ success: true });
    }
    catch (err) {
        next(err);
    }
}));
exports.default = router;
