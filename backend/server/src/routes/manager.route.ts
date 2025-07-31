// backend/server/src/routes/manager.route.ts
import { Router } from 'express';
import bcrypt from 'bcrypt';
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
// 导入共享工具
import { managerUpload, normalizePath } from '../utils/upload'; // 复用管理员上传配置并提供路径规范化
import {
    phoneValidator,
    phoneUniqueValidator,
    passwordValidator,
    nameValidator,
    authorityValidator
} from '../utils/validators'; // 复用验证规则
import { createLoginHandler } from '../utils/loginHandler'; // 复用登录逻辑
// 导入业务依赖
import { ManagerDAO } from '../dao/ManagerDao';
import { auth, AuthRequest } from '../middleware/auth'; // 权限中间件

const router = Router();

/**
 * @route   POST /api/managers/register
 * @desc    管理员注册（通常仅超级管理员可操作）
 * @access  仅顶级管理员可访问
 * @body    { name, passwd, phone_num, authority, photo_img? }
 */
router.post(
    '/register',
    auth, // 先验证登录状态
    [
        phoneValidator, // 手机号格式验证
        phoneUniqueValidator('manager'), // 手机号唯一性验证（管理员角色）
        passwordValidator, // 密码复杂度验证
        nameValidator, // 名称格式验证
        authorityValidator // 权限等级验证
    ],
    managerUpload.single('photo_img'), // 处理头像上传
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            // 验证请求数据
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            // 权限判断：仅顶级管理员（假设权限等级1为最高）可创建管理员
            if (req.user?.role !== 'manager' || req.user.authority !== 1) {
                return res.status(403).json({ success: false, error: '仅顶级管理员可创建新管理员' });
            }

            // 提取请求数据
            const { name, passwd, phone_num, authority } = req.body;
            const photo_img = req.file ? normalizePath(req.file.path) : null; // 头像路径

            // 设置默认权限为 2（普通管理员）
            const finalAuthority = authority || 2;

            // 密码加密
            const hash = await bcrypt.hash(passwd, 10);

            // 创建管理员
            const id = await ManagerDAO.create(
                name, hash, phone_num, finalAuthority, photo_img
            );

            res.status(201).json({ success: true, id });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * @route   POST /api/managers/login
 * @desc    管理员登录
 * @body    { phone_num, passwd }
 * @return  { success: boolean, token, manager }
 */
router.post(
    '/login',
    [
        phoneValidator, // 复用手机号验证
        passwordValidator // 复用密码验证
    ],
    createLoginHandler(
        ManagerDAO.findByPhone, // 使用管理员DAO查询手机号
        'manager' // 角色为管理员
    )
);

/**
 * @route   GET /api/managers/:id
 * @desc    获取单个管理员信息
 * @access  本人或顶级管理员可访问
 */
router.get('/:id', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const targetId = Number(req.params.id);
        const currentUserId = req.user?.id;
        const currentRole = req.user?.role;
        const currentAuthority = req.user?.authority;

        // 权限判断：仅本人或顶级管理员可访问
        if (
            currentRole !== 'manager' ||
            (currentUserId !== targetId && currentAuthority !== 1)
        ) {
            return res.status(403).json({ success: false, error: '无权限访问该管理员信息' });
        }

        const mgr = await ManagerDAO.findById(targetId);
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
router.get('/', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // 权限判断：仅顶级管理员可查看列表
        if (req.user?.role !== 'manager' || req.user.authority !== 1) {
            return res.status(403).json({ success: false, error: '仅顶级管理员可查看管理员列表' });
        }

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
 * @desc    更新管理员基本信息
 * @access  本人可访问
 * @body    Partial<{ name, phone_num, photo_img }>
 */
router.patch(
    '/:id',
    auth,
    managerUpload.single('photo_img'), // 支持更新头像
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const targetId = Number(req.params.id);
            const currentUserId = req.user?.id;
            const currentRole = req.user?.role;

            // 权限判断：仅本人可更新
            if (
                currentRole !== 'manager' ||
                (currentUserId !== targetId)
            ) {
                return res.status(403).json({ success: false, error: '无权限更新该管理员信息' });
            }

            const updateData: any = { ...req.body };
            // 如果上传了新头像，更新头像路径并标准化
            if (req.file) updateData.photo_img = normalizePath(req.file.path);

            await ManagerDAO.updateById(targetId, updateData);

            const updated = await ManagerDAO.findById(targetId);
            res.json({ success: true, photo_img: updated?.photo_img });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * @route   PATCH /api/managers/:id/status
 * @desc    更新启用/禁用状态
 * @access  仅顶级管理员可访问
 * @body    { status: boolean }
 */
router.patch('/:id/status', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // 权限判断：仅顶级管理员可操作
        if (req.user?.role !== 'manager' || req.user.authority !== 1) {
            return res.status(403).json({ success: false, error: '仅顶级管理员可更新状态' });
        }

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
 * @access  仅顶级管理员可访问
 * @body    { authority: number }
 */
router.patch('/:id/authority', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // 权限判断：仅顶级管理员可操作
        if (req.user?.role !== 'manager' || req.user.authority !== 1) {
            return res.status(403).json({ success: false, error: '仅顶级管理员可更新权限等级' });
        }

        // 验证权限等级有效性
        const { authority } = req.body;
        if (!Number.isInteger(authority) || authority < 1 || authority > 3) {
            return res.status(400).json({ success: false, error: '权限等级必须是1-3之间的整数' });
        }

        const id = Number(req.params.id);
        await ManagerDAO.updateAuthority(id, authority);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   PATCH /api/managers/:id/password
 * @desc    修改密码
 * @access  仅本人可访问
 * @body    { passwd: string }
 */
router.patch('/:id/password', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const targetId = Number(req.params.id);
        const currentUserId = req.user?.id;

        // 权限判断：仅本人可修改
        if (currentUserId !== targetId || req.user?.role !== 'manager') {
            return res.status(403).json({ success: false, error: '无权限修改该管理员密码' });
        }

        // 验证新密码格式
        const passwd = req.body.passwd;
        if (!passwd || passwd.length < 6 || !/^(?=.*[a-zA-Z])(?=.*\d)/.test(passwd)) {
            return res.status(400).json({
                success: false,
                error: '密码必须包含字母和数字，且长度至少6个字符'
            });
        }

        const hash = await bcrypt.hash(passwd, 10);
        await ManagerDAO.updatePassword(targetId, hash);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   DELETE /api/managers/:id
 * @desc    删除管理员
 * @access  仅顶级管理员可访问
 */
router.delete('/:id', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // 权限判断：仅顶级管理员可操作
        if (req.user?.role !== 'manager' || req.user.authority !== 1) {
            return res.status(403).json({ success: false, error: '仅顶级管理员可删除管理员' });
        }

        // 防止删除自己
        const id = Number(req.params.id);
        if (id === req.user.id) {
            return res.status(400).json({ success: false, error: '不能删除当前登录的管理员' });
        }

        await ManagerDAO.deleteById(id);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/managers/count
 * @desc    获取管理员总数
 * @access  仅顶级管理员可访问
 */
router.get('/count', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // 权限判断：仅顶级管理员可查看
        if (req.user?.role !== 'manager' || req.user.authority !== 1) {
            return res.status(403).json({ success: false, error: '仅顶级管理员可查看管理员总数' });
        }

        const count = await ManagerDAO.countAll();
        res.json({ success: true, count });
    } catch (err) {
        next(err);
    }
});

export default router;