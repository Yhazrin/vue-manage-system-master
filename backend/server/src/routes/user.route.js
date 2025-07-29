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
// backend/server/src/routes/user.route.ts
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const express_validator_1 = require("express-validator");
// 导入共享工具
const upload_1 = require("../utils/upload"); // 复用共享multer配置
const validators_1 = require("../utils/validators"); // 复用验证规则
const loginHandler_1 = require("../utils/loginHandler"); // 复用登录逻辑
// 导入业务依赖
const UserDao_1 = require("../dao/UserDao");
const auth_1 = require("../middleware/auth"); // 权限中间件
const router = (0, express_1.Router)();
/**
 * @route   POST /api/users/register
 * @desc    用户注册
 * @body    { name, passwd, phone_num, photo_img? } // 请求体参数：姓名、密码、手机号、可选头像
 * @return  { success: boolean, id: number }  // 返回：注册成功标识与用户 ID
 */
// ---------- 用户注册 ----------
router.post('/register', [
    validators_1.phoneValidator, // 复用手机号格式验证
    (0, validators_1.phoneUniqueValidator)('user'), // 复用手机号唯一性验证（用户角色）
    validators_1.passwordValidator, // 复用密码验证
    validators_1.nameValidator, // 复用用户名验证
], upload_1.userUpload.single('photo_img'), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 验证请求数据
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        // 从请求体中获取注册信息
        const { name, passwd, phone_num } = req.body;
        const photo_img = req.file ? req.file.path : null; // 获取上传的头像路径（如果有上传）
        // 使用 bcrypt 加密密码（10 是盐值 rounds，值越大加密越慢但越安全）
        const hash = yield bcrypt_1.default.hash(passwd, 10);
        // 调用 UserDAO 写入数据库，返回新用户 ID 和 用户名
        const id = yield UserDao_1.UserDAO.create(name, hash, phone_num, photo_img);
        const newUser = yield UserDao_1.UserDAO.findById(id);
        // 响应 201（创建成功），返回成功信息、用户 ID 和用户名
        res.status(201).json({ success: true, id, name: newUser === null || newUser === void 0 ? void 0 : newUser.name });
    }
    catch (err) {
        // 捕获错误并交给错误处理中间件
        next(err);
    }
}));
/**
 * @route   POST /api/users/login
 * @desc    用户登录
 * @body    { phone_num, passwd }
 * @return  { success: boolean, user }
 */
// 登录接口（包含校验）
router.post('/login', [
    validators_1.phoneValidator, // 复用手机号验证
    validators_1.passwordValidator // 复用密码验证
], 
// 复用通用登录逻辑（传入用户DAO和角色）
(0, loginHandler_1.createLoginHandler)(UserDao_1.UserDAO.findByPhone, 'user'));
/**
 * @route   GET /api/users/:id
 * @desc    获取用户资料
 */
router.get('/:id', auth_1.auth, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const targetId = Number(req.params.id);
        const currentUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const currentRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        // 权限判断：仅本人或管理员可访问
        if (currentRole !== 'manager' && currentUserId !== targetId) {
            return res.status(403).json({ success: false, error: '无权限访问该用户资料' });
        }
        const user = yield UserDao_1.UserDAO.findById(targetId);
        if (!user)
            return res.status(404).json({ success: false, error: '用户不存在' });
        res.json({ success: true, user });
    }
    catch (err) {
        next(err);
    }
}));
/**
 * @route   GET /api/users
 * @desc    分页查询用户列表
 * @access  仅管理员可访问
 * @query   page, pageSize, status?, keyword?
 */
router.get('/', auth_1.auth, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // 权限判断：仅管理员可访问
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'manager') {
            return res.status(403).json({ success: false, error: '仅管理员可查看用户列表' });
        }
        const page = Number(req.query.page) || 1;
        const pageSize = Number(req.query.pageSize) || 20;
        const status = req.query.status !== undefined ? req.query.status === 'true' : undefined;
        const keyword = req.query.keyword;
        const result = yield UserDao_1.UserDAO.findAll(page, pageSize, status, keyword);
        res.json(Object.assign({ success: true }, result));
    }
    catch (err) {
        next(err);
    }
}));
/**
 * @route   PATCH /api/users/:id
 * @desc    更新用户基本信息（除密码）
 * @access  仅本人可访问
 * @body    Partial<{ name, phone_num, photo_img }>
 */
router.patch('/:id', auth_1.auth, upload_1.userUpload.single('photo_img'), // 复用文件上传配置
(req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const targetId = Number(req.params.id);
        const currentUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        // 权限判断：仅本人可更新
        if (currentUserId !== targetId) {
            return res.status(403).json({ success: false, error: '无权限更新该用户信息' });
        }
        const updateData = Object.assign({}, req.body);
        // 处理头像更新
        if (req.file)
            updateData.photo_img = req.file.path;
        yield UserDao_1.UserDAO.updateById(targetId, updateData);
        res.json({ success: true });
    }
    catch (err) {
        next(err);
    }
}));
/**
 * @route   PATCH /api/users/:id/status
 * @desc    更新在线状态
 * @access  仅本人可访问
 * @body    { status: boolean }
 */
router.patch('/:id/status', auth_1.auth, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const targetId = Number(req.params.id);
        const currentUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (currentUserId !== targetId) {
            return res.status(403).json({ success: false, error: '无权限更新状态' });
        }
        const { status } = req.body;
        yield UserDao_1.UserDAO.updateStatus(targetId, status);
        res.json({ success: true });
    }
    catch (err) {
        next(err);
    }
}));
/**
 * @route   PATCH /api/users/:id/password
 * @desc    修改密码
 * @access  仅本人可修改
 * @body    { passwd: string }
 */
router.patch('/:id/password', auth_1.auth, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const targetId = Number(req.params.id);
        const currentUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        // 权限判断：仅本人可修改密码
        if (currentUserId !== targetId) {
            return res.status(403).json({ success: false, error: '无权限修改该用户密码' });
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
        yield UserDao_1.UserDAO.updatePassword(targetId, hash);
        res.json({ success: true });
    }
    catch (err) {
        next(err);
    }
}));
/**
 * @route   DELETE /api/users/:id
 * @desc    删除用户
 * @access  仅管理员可操作
 */
router.delete('/:id', auth_1.auth, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // 权限判断：仅管理员可删除
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'manager') {
            return res.status(403).json({ success: false, error: '仅管理员可删除用户' });
        }
        const id = Number(req.params.id);
        yield UserDao_1.UserDAO.deleteById(id);
        res.json({ success: true });
    }
    catch (err) {
        next(err);
    }
}));
/**
 * @route   GET /api/users/count
 * @desc    获取用户总数
 * @access  仅管理员可访问
 */
router.get('/count', auth_1.auth, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'manager') {
            return res.status(403).json({ success: false, error: '仅管理员可查看用户总数' });
        }
        const count = yield UserDao_1.UserDAO.countAll();
        res.json({ success: true, count });
    }
    catch (err) {
        next(err);
    }
}));
exports.default = router;
