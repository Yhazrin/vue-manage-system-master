// backend/server/src/routes/manager.route.ts
import { Router } from 'express';
import bcrypt from 'bcrypt';
import { ManagerDAO } from '../dao/ManagerDao';
import { signToken } from '../middleware/auth'; // 如果需要身份验证，可以启用

const router = Router();

/**
 * @route   POST /api/managers/register
 * @desc    管理员注册
 * @body    { name, passwd, phone_num, authority, photo_img? }
 */
router.post('/register', async (req, res, next) => {
    try {
        const { name, passwd, phone_num, authority, photo_img } = req.body;
        const hash = await bcrypt.hash(passwd, 10);
        const id = await ManagerDAO.create(
            name,
            hash,
            phone_num,
            authority,
            photo_img
        );
        res.status(201).json({ success: true, id });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   POST /api/managers/login
 * @desc    管理员登录
 * @body    { phone_num, passwd }
 */
router.post('/login', async (req, res, next) => {
    try {
        const { phone_num, passwd } = req.body;
        // 假设 ManagerDAO 有 findByPhone 方法，否则可用 findAll 模糊查
        const mgr = await ManagerDAO.findByPhone(phone_num);
        if (!mgr) return res.status(404).json({ success: false, error: '管理员不存在' });
        const match = await bcrypt.compare(passwd, mgr.passwd);
        if (!match) return res.status(401).json({ success: false, error: '密码错误' });
        // 签发 JWT Token
        const token = signToken(mgr.id, mgr.phone_num, 'manager');
        // 返回 token 和管理员信息
        res.json({ success: true, token, manager: { id: mgr.id, name: mgr.name, authority: mgr.authority } });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/managers/:id
 * @desc    获取单个管理员
 */
router.get('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const mgr = await ManagerDAO.findById(id);
        if (!mgr) return res.status(404).json({ success: false, error: '管理员不存在' });
        res.json({ success: true, manager: mgr });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/managers
 * @desc    分页查询管理员列表
 * @query   page, pageSize, status?, authority?, keyword?
 */
router.get('/', async (req, res, next) => {
    try {
        const page     = Number(req.query.page) || 1;
        const pageSize = Number(req.query.pageSize) || 20;
        const status   = req.query.status !== undefined
            ? req.query.status === 'true'
            : undefined;
        const authority = req.query.authority !== undefined
            ? Number(req.query.authority)
            : undefined;
        const keyword  = req.query.keyword as string | undefined;

        const result = await ManagerDAO.findAll(
            page,
            pageSize,
            status,
            authority,
            keyword
        );
        res.json({ success: true, ...result });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   PATCH /api/managers/:id
 * @desc    更新管理员基本信息（name, phone_num, photo_img）
 */
router.patch('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        await ManagerDAO.updateById(id, req.body);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   PATCH /api/managers/:id/status
 * @desc    更新启用/禁用状态
 * @body    { status: boolean }
 */
router.patch('/:id/status', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const { status } = req.body;
        await ManagerDAO.updateStatus(id, status);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   PATCH /api/managers/:id/authority
 * @desc    更新权限等级
 * @body    { authority: number }
 */
router.patch('/:id/authority', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const { authority } = req.body;
        await ManagerDAO.updateAuthority(id, authority);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   PATCH /api/managers/:id/password
 * @desc    修改密码
 * @body    { passwd: string }
 */
router.patch('/:id/password', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const hash = await bcrypt.hash(req.body.passwd, 10);
        await ManagerDAO.updatePassword(id, hash);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   DELETE /api/managers/:id
 * @desc    删除管理员
 */
router.delete('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        await ManagerDAO.deleteById(id);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/managers/count
 * @desc    获取管理员总数
 */
router.get('/count', async (req, res, next) => {
    try {
        const count = await ManagerDAO.countAll();
        res.json({success: true, count});
    } catch (err) {
        next(err);
    }
});

export default router;
