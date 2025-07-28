// backend/server/src/routes/user.route.ts
import { Router } from 'express';
import bcrypt from 'bcrypt';
import { UserDAO } from '../dao/UserDao';
import { signToken } from '../middleware/auth'; // auth.ts 中签发 JWT 的方法
import { auth } from "../middleware/auth"; // 引入auth中间件
import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express'; // 导入类型定义
import multer from 'multer';

const router = Router();

// 配置multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // 判断是用户还是玩家，分别存储不同的目录
        const directory = req.body.type === 'user' ? 'users/' : 'players/';
        cb(null, `uploads/${directory}`);  // 上传到不同的目录：uploads/players 或 uploads/users
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`); // 文件名加时间戳防重名
    }
});

const upload = multer({ storage });

/**
 * @route   POST /api/users/register
 * @desc    用户注册
 * @body    { name, passwd, phone_num, photo_img? } // 请求体参数：姓名、密码、手机号、可选头像
 * @return  { success: boolean, id: number }  // 返回：注册成功标识与用户 ID
 */
// ---------- 用户注册 ----------
router.post('/register', [
    // 手机号验证 - 与登录保持一致
    body('phone_num')
        .isMobilePhone('zh-CN')
        .withMessage('手机号格式不正确')
        .custom(async (value) => {
            // 额外验证：检查手机号是否已被注册
            const existingUser = await UserDAO.findByPhone(value);
            if (existingUser) {
                throw new Error('该手机号已被注册');
            }
            return true;
        }),
    // 密码验证 - 与登录保持一致且可以更严格
    body('passwd')
        .isLength({ min: 6 })
        .withMessage('密码长度至少6个字符')
        .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
        .withMessage('密码必须包含字母和数字'),
    // 用户名验证
    body('name')
        .notEmpty()
        .withMessage('用户名不能为空')
        .isLength({ min: 2, max: 20 })
        .withMessage('用户名长度必须在2-20个字符之间')
], upload.single('photo_img'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 验证请求数据
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        // 从请求体中获取注册信息
        const { name, passwd, phone_num } = req.body;
        const photo_img = req.file ? req.file.path : null; // 获取上传的头像路径（如果有上传）

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
// 登录接口（包含校验）
router.post(
    '/login',
    [
        body('phone_num').isMobilePhone('zh-CN').withMessage('手机号格式不正确'),
        body('passwd').isLength({ min: 6 }).withMessage('密码长度至少6个字符')
    ],
    // 明确指定请求、响应和next函数的类型
    async (req: Request, res: Response, next: NextFunction) => {
        // 校验请求体
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        try {
            const { phone_num, passwd } = req.body;
            const user = await UserDAO.findByPhone(phone_num);
            if (!user) {
                return res.status(404).json({ success: false, error: '用户不存在' });
            }

            const match = await bcrypt.compare(passwd, user.passwd);
            if (!match) {
                return res.status(401).json({ success: false, error: '密码错误' });
            }

            const token = signToken(user.id, user.phone_num, 'user');
            res.json({ success: true, token });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * @route   GET /api/users/:id
 * @desc    获取用户资料
 */
router.get('/:id', auth, async (req, res, next) => {
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
        const updateData: any = { ...req.body }

        // 如果上传了新头像，则更新头像路径
        if (req.file) updateData.photo_img = req.file.path;

        // 调用 DAO 更新用户信息（请求体中的字段会被部分更新）
        await UserDAO.updateById(id, updateData);
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