// backend/server/src/routes/user.route.ts
import { Router } from 'express';
import bcrypt from 'bcrypt';
import { UserDAO } from '../dao/UserDao';

const router = Router();

/**
 * @route   POST /api/users/register
 * @desc    用户注册
 * @body    { name, passwd, phone_num, photo_img? } // 请求体参数：姓名、密码、手机号、可选头像
 * @return  { success: boolean, id: number }  // 返回：注册成功标识与用户 ID
 */
router.post('/register', async (req, res, next) => {
    try {
        // 从请求体中获取注册信息
        const { name, passwd, phone_num, photo_img } = req.body;
        // 使用 bcrypt 加密密码（10 是盐值 rounds，值越大加密越慢但越安全）
        const hash = await bcrypt.hash(passwd, 10);
        // 调用 UserDAO 写入数据库，返回新用户 ID 和 用户名
        const id = await UserDAO.create(name, hash, phone_num, photo_img);
        const newUser = await UserDAO.findById(id);
        // 响应 201（创建成功），返回成功信息、用户 ID 和用户名
        res.status(201).json({ success: true, id, name: newUser?.name });
    } catch (err) {
        // 捕获错误并交给错误处理中间件
        next(err);
    }
});

/**
 * @route   POST /api/users/login
 * @desc    用户登录
 * @body    { phone_num, passwd }
 * @return  { success: boolean, user }
 */
router.post('/login', async (req, res, next) => {
    try {
        // 从请求体获取手机号和密码
        const { phone_num, passwd } = req.body;
        // 通过手机号查询用户（UserDAO 封装了数据库查询逻辑）
        const user = await UserDAO.findByPhone(phone_num);
        // 若用户不存在，返回 404 错误
        if (!user) return res.status(404).json({ success: false, error: '用户不存在' });
        // 用 bcrypt 验证密码（对比明文密码与数据库中的加密密码）
        const match = await bcrypt.compare(passwd, user.passwd);
        // 若密码不匹配，返回 401 错误
        if (!match) return res.status(401).json({ success: false, error: '密码错误' });
        // Chat建议，留存，可加
        // TODO: 此处预留签发 JWT Token 的逻辑（用于后续身份验证）
        // 返回登录成功信息和用户数据
        res.json({ success: true, user });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/users/:id
 * @desc    获取用户资料
 */
router.get('/:id', async (req, res, next) => {
    try {
        // 从 URL 参数中获取用户 ID 并转为数字
        const id = Number(req.params.id);
        // 通过 ID 查询用户
        const user = await UserDAO.findById(id);
        // 若用户不存在，返回 404 错误
        if (!user) return res.status(404).json({ success: false, error: '用户不存在' });
        // 返回用户资料
        res.json({ success: true, user });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/users
 * @desc    分页查询用户列表
 * @query   page, pageSize, status?, keyword?
 */
router.get('/', async (req, res, next) => {
    try {
        // 解析查询参数（默认页码 1，每页 20 条）
        const page = Number(req.query.page) || 1;
        const pageSize = Number(req.query.pageSize) || 20;
        // 解析状态参数（将字符串转为布尔值，未提供则为 undefined）
        const status = req.query.status !== undefined ? req.query.status === 'true' : undefined;
        // 解析搜索关键词（可选）
        const keyword = req.query.keyword as string | undefined;
        // 调用 DAO 分页查询用户列表（带筛选条件）
        const result = await UserDAO.findAll(page, pageSize, status, keyword);
        // 返回查询结果（包含总数和用户列表）
        res.json({ success: true, ...result });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   PATCH /api/users/:id
 * @desc    更新用户基本信息（除密码）
 * @body    Partial<{ name, phone_num, photo_img }>
 */
router.patch('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);  // 获取用户 ID
        // 调用 DAO 更新用户信息（请求体中的字段会被部分更新）
        await UserDAO.updateById(id, req.body);
        // 返回更新成功标识
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   PATCH /api/users/:id/status
 * @desc    更新在线状态
 * @body    { status: boolean }
 */
router.patch('/:id/status', async (req, res, next) => {
    try {
        const id = Number(req.params.id);  // 获取用户 ID
        const { status } = req.body;       // 获取状态参数
        // 调用 DAO 更新用户状态
        await UserDAO.updateStatus(id, status);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   PATCH /api/users/:id/password
 * @desc    修改密码
 * @body    { passwd: string }
 */
router.patch('/:id/password', async (req, res, next) => {
    try {
        const id = Number(req.params.id);  // 获取用户 ID
        // 加密新密码后更新到数据库
        const hash = await bcrypt.hash(req.body.passwd, 10);
        await UserDAO.updatePassword(id, hash);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   DELETE /api/users/:id
 * @desc    删除用户
 */
router.delete('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);  // 获取用户 ID
        // 调用 DAO 删除用户
        await UserDAO.deleteById(id);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/users/count
 * @desc    获取用户总数
 */
router.get('/count', async (req, res, next) => {
    try {
        // 调用 DAO 获取用户总数
        const count = await UserDAO.countAll();
        // 返回总数
        res.json({success: true, count});
    } catch (err) {
        next(err);
    }
});

export default router;