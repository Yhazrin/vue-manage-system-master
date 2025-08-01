// backend/server/src/routes/user.route.ts
console.log('🔥 user.route.ts 文件被加载了！');
import { Router } from 'express';
import bcrypt from 'bcrypt';
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
// 导入共享工具
import { userUpload, normalizePath } from '../utils/upload'; // 复用共享multer配置
import {
    phoneValidator,
    phoneUniqueValidator,
    passwordValidator,
    nameValidator
} from '../utils/validators'; // 复用验证规则
import { createLoginHandler } from '../utils/loginHandler'; // 复用登录逻辑
// 导入业务依赖
import { UserDAO } from '../dao/UserDao';
import { FavoriteDAO } from '../dao/FavoriteDao';
import { pool } from '../db';
import { auth } from '../middleware/auth'; // 权限中间件
import { signToken } from '../middleware/auth'; // 签发token

const router = Router();

/**
 * @route   POST /api/users/register
 * @desc    用户注册
 * @body    { name, passwd, phone_num, photo_img? } // 请求体参数：姓名、密码、手机号、可选头像
 * @return  { success: boolean, id: number }  // 返回：注册成功标识与用户 ID
 */
// ---------- 用户注册 ----------
router.post(
    '/register',
    [
        phoneValidator, // 复用手机号格式验证
        phoneUniqueValidator('user'), // 复用手机号唯一性验证（用户角色）
        passwordValidator, // 复用密码验证
        nameValidator, // 复用用户名验证
    ],userUpload.single('photo_img'),
    async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 验证请求数据
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        // 从请求体中获取注册信息
        const { name, passwd, phone_num, role = 'user' } = req.body;
        const photo_img = req.file ? normalizePath(req.file.path) : null; // 获取上传的头像路径（如果有上传）

        // 使用 bcrypt 加密密码（10 是盐值 rounds，值越大加密越慢但越安全）
        const hash = await bcrypt.hash(passwd, 10);

        // 调用 UserDAO 写入数据库，返回新用户 ID 和 用户名
        const id = await UserDAO.create(name, hash, phone_num, photo_img, role);
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
// 登录接口（包含校验）
router.post(
    '/login',
    [
        phoneValidator, // 复用手机号验证
        passwordValidator // 复用密码验证
    ],
    // 复用通用登录逻辑（传入用户DAO和角色）
    createLoginHandler(UserDAO.findByPhone, 'user')
);

/**
 * @route   GET /api/users/count
 * @desc    获取用户总数
 * @access  仅管理员可访问
 */
router.get('/count', auth, async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    try {
        if (req.user?.role !== 'manager') {
            return res.status(403).json({ success: false, error: '仅管理员可查看用户总数' });
        }

        const count = await UserDAO.countAll();
        res.json({ success: true, count });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/users/:id
 * @desc    获取用户资料
 */
router.get('/:id', auth, async (req: Request & {user?: any}, res: Response, next: NextFunction) => {
    console.log('🚀 用户资料路由被调用！参数ID:', req.params.id);
    try {
        console.log('=== 开始获取用户资料 ===');
        console.log('请求参数 ID:', req.params.id);
        console.log('请求URL:', req.url);
        console.log('请求方法:', req.method);
        
        const targetId = Number(req.params.id);
        const currentUserId = req.user?.id;
        const currentRole = req.user?.role;

        // 权限判断：仅本人或管理员可访问
        if (currentRole !== 'manager' && currentUserId !== targetId) {
            console.log('权限验证失败');
            return res.status(403).json({ success: false, error: '无权限访问该用户资料' });
        }

        console.log('正在获取用户基本信息...');
        const user = await UserDAO.findById(targetId);
        if (!user) {
            console.log('用户不存在');
            return res.status(404).json({ success: false, error: '用户不存在' });
        }

        console.log('获取到用户基本信息:', user);

        // 获取用户的订单数量和收藏数量
        console.log('开始查询用户统计数据，用户ID:', targetId);
        
        // 查询用户订单总数
        console.log('正在查询用户订单数量...');
        const [[{ orderCount }]]: any = await pool.execute(
            `SELECT COUNT(*) as orderCount FROM orders WHERE user_id = ?`,
            [targetId]
        );
        console.log('订单数量查询结果:', orderCount);
        
        // 查询用户收藏的陪玩数量
        console.log('正在查询用户收藏陪玩数量...');
        const favoritePlayers = await FavoriteDAO.getUserFavoriteCount(targetId);
        console.log('收藏数量查询结果:', favoritePlayers);

        // 构建响应数据，包含真实的订单和收藏数据
        const userWithStats = {
            ...user,
            orderCount: Number(orderCount) || 0,
            favoritePlayers: Number(favoritePlayers) || 0
        };
        console.log('最终用户数据:', userWithStats);
        console.log('=== 用户资料获取完成 ===');

        res.json({ success: true, user: userWithStats });
    } catch (err) {
        console.error('获取用户资料时出错:', err);
        next(err);
    }
});

/**
 * @route   GET /api/users
 * @desc    分页查询用户列表
 * @access  仅管理员可访问
 * @query   page, pageSize, status?, keyword?
 */
router.get('/', auth, async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    try {
        // 权限判断：仅管理员可访问
        if (req.user?.role !== 'manager') {
            return res.status(403).json({ success: false, error: '仅管理员可查看用户列表' });
        }

        const page = Number(req.query.page) || 1;
        const pageSize = Number(req.query.pageSize) || 20;
        const status = req.query.status !== undefined ? req.query.status === 'true' : undefined;
        const keyword = req.query.keyword as string | undefined;

        const result = await UserDAO.findAll(page, pageSize, status, keyword);
        res.json({ success: true, ...result });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   PATCH /api/users/:id
 * @desc    更新用户基本信息（除密码）
 * @access  仅本人可访问
 * @body    Partial<{ name, phone_num, photo_img }>
 */
router.patch(
    '/:id',
    auth,
    userUpload.single('photo_img'), // 复用文件上传配置
    async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
        try {
            const targetId = Number(req.params.id);
            const currentUserId = req.user?.id;

            // 权限判断：仅本人可更新
            if (currentUserId !== targetId) {
                return res.status(403).json({ success: false, error: '无权限更新该用户信息' });
            }

            const updateData: any = { ...req.body };
            // 处理头像更新
            if (req.file) updateData.photo_img = normalizePath(req.file.path);

            await UserDAO.updateById(targetId, updateData);
            res.json({ success: true });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * @route   PATCH /api/users/:id/status
 * @desc    更新在线状态
 * @access  仅本人可访问
 * @body    { status: boolean }
 */
router.patch('/:id/status', auth, async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    try {
        const targetId = Number(req.params.id);
        const currentUserId = req.user?.id;

        if (currentUserId !== targetId) {
            return res.status(403).json({ success: false, error: '无权限更新状态' });
        }

        const { status } = req.body;
        await UserDAO.updateStatus(targetId, status);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   PATCH /api/users/:id/password
 * @desc    修改密码
 * @access  仅本人可修改
 * @body    { passwd: string }
 */
router.patch('/:id/password', auth, async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    try {
        const targetId = Number(req.params.id);
        const currentUserId = req.user?.id;

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

        const hash = await bcrypt.hash(passwd, 10);
        await UserDAO.updatePassword(targetId, hash);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   DELETE /api/users/:id
 * @desc    删除用户
 * @access  仅管理员可操作
 */
router.delete('/:id', auth, async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    try {
        // 权限判断：仅管理员可删除
        if (req.user?.role !== 'manager') {
            return res.status(403).json({ success: false, error: '仅管理员可删除用户' });
        }

        const id = Number(req.params.id);
        await UserDAO.deleteById(id);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

export default router;