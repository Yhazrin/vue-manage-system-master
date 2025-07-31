// backend/server/src/routes/manager.route.ts
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
    nameValidator,
    authorityValidator
} from '../utils/validators';
import { createLoginHandler } from '../utils/loginHandler';
import { auth, AuthRequest } from '../middleware/auth';
import { ManagerDAO } from '../dao/ManagerDao';

console.log('🔥 manager.route.ts 文件被加载了！');

const router = Router();

// 全局调试中间件
router.use((req, res, next) => {
    console.log(`🔍 Manager路由收到请求: ${req.method} ${req.path}`);
    console.log('📝 请求头:', req.headers);
    console.log('📦 请求体:', req.body);
    next();
});

/**
 * @route   PUT /api/managers/:id/toggle-status
 * @desc    切换管理员状态
 * @access  仅顶级管理员可操作
 */
router.put('/:id/toggle-status', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // 权限判断：仅顶级管理员可操作
        if (req.user?.role !== 'manager' || req.user?.authority !== 1) {
            return res.status(403).json({ success: false, error: '仅顶级管理员可修改状态' });
        }

        const targetId = Number(req.params.id);
        
        // 防止操作自己
        if (req.user?.id === targetId) {
            return res.status(400).json({ success: false, error: '不能修改自己的状态' });
        }

        // 获取当前管理员信息
        const manager = await ManagerDAO.findById(targetId);
        if (!manager) {
            return res.status(404).json({ success: false, error: '管理员不存在' });
        }

        // 防止操作超级管理员
        if (manager.authority === 1) {
            return res.status(400).json({ success: false, error: '不能修改超级管理员状态' });
        }

        // 切换状态
        const newStatus = !manager.status;
        await ManagerDAO.updateStatus(targetId, newStatus);

        // 返回更新后的管理员信息
        const updatedManager = await ManagerDAO.findById(targetId);
        if (!updatedManager) {
            return res.status(500).json({ success: false, error: '状态更新失败' });
        }

        const { passwd, ...safeManager } = updatedManager;
        const responseManager = {
            id: safeManager.id.toString(),
            username: safeManager.name,
            role: safeManager.authority === 1 ? 'super_admin' : 
                  safeManager.authority === 2 ? 'customer_service' : 'shareholder',
            status: safeManager.status ? 'active' : 'inactive',
            createdAt: safeManager.created_at,
            lastLogin: null,
            operationCount: 0
        };

        res.json(responseManager);
    } catch (err) {
        next(err);
    }
});

/**
 * @route   POST /api/managers/register
 * @desc    管理员注册
 * @body    { name, passwd, phone_num, authority?, photo_img? }
 */
router.post('/register', [
    phoneValidator, // 手机号格式验证
    phoneUniqueValidator('manager'), // 手机号唯一性验证
    passwordValidator, // 密码验证：长度+复杂度
    nameValidator, // 姓名验证
    authorityValidator // 权限等级验证
], userUpload.single('photo_img'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 验证请求数据
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        // 从请求体中获取注册信息
        const { name, passwd, phone_num, authority = 1 } = req.body;
        const photo_img = req.file ? normalizePath(req.file.path) : null;

        // 使用 bcrypt 加密密码
        const hash = await bcrypt.hash(passwd, 10);

        // 调用 ManagerDAO 写入数据库
        const id = await ManagerDAO.create(name, hash, phone_num, authority, photo_img);
        const newManager = await ManagerDAO.findById(id);

        // 响应 201（创建成功）
        res.status(201).json({ 
            success: true, 
            id, 
            name: newManager?.name,
            message: '管理员注册成功'
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   POST /api/managers/login
 * @desc    管理员登录
 * @body    { phone_num, passwd }
 */
router.post(
    '/login',
    [
        phoneValidator, // 复用手机号格式验证
        passwordValidator // 复用密码验证
    ],
    // 复用通用登录逻辑（传入管理员DAO和角色）
    createLoginHandler(ManagerDAO.findByPhone, 'manager')
);

// 测试路由 - 不需要认证（必须放在参数化路由之前）
router.get('/test', (req: Request, res: Response) => {
    console.log('✅ Manager测试路由被调用');
    res.json({ 
        success: true, 
        message: 'Manager route is working!',
        timestamp: new Date().toISOString()
    });
});

// 新增的无认证测试路由（必须放在参数化路由之前）
router.get('/no-auth-test', (req: Request, res: Response) => {
    console.log('✅ Manager无认证测试路由被调用');
    res.json({ success: true, message: 'Hello World from manager router!' });
});

/**
 * @route   POST /api/managers
 * @desc    创建客服账号（仅超级管理员可操作）
 * @access  仅顶级管理员可访问
 * @body    { username, role }
 */
router.post('/', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // 权限判断：仅顶级管理员可创建客服
        if (req.user?.role !== 'manager' || req.user.authority !== 1) {
            return res.status(403).json({ success: false, error: '仅顶级管理员可创建客服账号' });
        }

        const { username, role } = req.body;

        // 验证输入
        if (!username || !username.trim()) {
            return res.status(400).json({ success: false, error: '用户名不能为空' });
        }

        if (role !== 'customer_service') {
            return res.status(400).json({ success: false, error: '只能创建客服角色账号' });
        }

        // 检查用户名是否已存在
        const existingManager = await ManagerDAO.findByPhone(username);
        if (existingManager) {
            return res.status(400).json({ success: false, error: '用户名已存在' });
        }

        // 生成默认密码（kefu+123456，确保包含字母和数字）
        const defaultPassword = `kefu123456`;
        const hash = await bcrypt.hash(defaultPassword, 10);

        // 创建客服账号（authority设为2，表示客服）
        const id = await ManagerDAO.create(username, hash, username, 2, null);
        const newManager = await ManagerDAO.findById(id);

        if (!newManager) {
            return res.status(500).json({ success: false, error: '创建客服账号失败' });
        }

        // 返回客服信息（包含密码，仅在创建时返回）
        const { passwd, ...safeManager } = newManager;
        const responseManager = {
            id: safeManager.id.toString(),
            username: safeManager.name,
            role: 'customer_service',
            status: safeManager.status ? 'active' : 'inactive',
            createdAt: safeManager.created_at,
            lastLogin: null,
            operationCount: 0,
            // 仅在创建时返回密码信息
            password: defaultPassword
        };

        res.status(201).json(responseManager);
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/managers/:id
 * @desc    获取管理员资料
 */
router.get('/:id', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const targetId = Number(req.params.id);
        const currentUserId = req.user?.id;
        const currentRole = req.user?.role;

        // 权限判断：仅本人或顶级管理员可访问
        if (currentRole !== 'manager' || (currentUserId !== targetId && req.user?.authority !== 1)) {
            return res.status(403).json({ success: false, error: '无权限访问该管理员资料' });
        }

        const manager = await ManagerDAO.findById(targetId);
        if (!manager) return res.status(404).json({ success: false, error: '管理员不存在' });

        // 隐藏密码字段
        const { passwd, ...safeManager } = manager;
        res.json({ success: true, manager: safeManager });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/managers
 * @desc    分页查询管理员列表
 * @access  仅顶级管理员可访问
 * @query   page, pageSize, status?, authority?, keyword?
 */
router.get('/', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // 权限判断：仅顶级管理员可访问
        if (req.user?.role !== 'manager' || req.user.authority !== 1) {
            return res.status(403).json({ success: false, error: '仅顶级管理员可查看管理员列表' });
        }

        const page = Number(req.query.page) || 1;
        const pageSize = Number(req.query.pageSize) || 20;
        const status = req.query.status !== undefined ? req.query.status === 'true' : undefined;
        const authority = req.query.authority ? Number(req.query.authority) : undefined;
        const keyword = req.query.keyword as string;

        const result = await ManagerDAO.findAll(page, pageSize, status, authority, keyword);
        
        // 转换为前端期望的格式
        const formattedManagers = result.managers.map(manager => {
            const { passwd, ...safeManager } = manager;
            return {
                id: safeManager.id.toString(),
                username: safeManager.name,
                role: safeManager.authority === 1 ? 'super_admin' : 
                      safeManager.authority === 2 ? 'customer_service' : 'shareholder',
                status: safeManager.status ? 'active' : 'inactive',
                createdAt: safeManager.created_at,
                lastLogin: null, // 暂时设为null，后续可以从数据库获取
                operationCount: 0 // 暂时设为0，后续可以从操作日志统计
            };
        });

        res.json(formattedManagers);
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/managers/credentials
 * @desc    获取所有管理员的账号密码信息（仅超级管理员可查看）
 * @access  仅顶级管理员可访问
 */
router.get('/credentials', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // 权限判断：仅顶级管理员可访问
        if (req.user?.role !== 'manager' || req.user.authority !== 1) {
            return res.status(403).json({ success: false, error: '仅超级管理员可查看管理员账号密码' });
        }

        const result = await ManagerDAO.findAll(1, 1000); // 获取所有管理员
        
        // 返回包含密码的管理员信息
        const managersWithCredentials = result.managers.map(manager => ({
            id: manager.id.toString(),
            username: manager.name,
            password: manager.passwd, // 返回加密后的密码
            role: manager.authority === 1 ? 'super_admin' : 
                  manager.authority === 2 ? 'customer_service' : 'shareholder',
            status: manager.status ? 'active' : 'inactive',
            createdAt: manager.created_at
        }));

        res.json(managersWithCredentials);
    } catch (err) {
        next(err);
    }
});

/**
 * @route   PATCH /api/managers/:id
 * @desc    更新管理员基本信息（除密码）
 * @access  仅本人或顶级管理员可访问
 */
router.patch('/:id', auth, userUpload.single('photo_img'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const targetId = Number(req.params.id);
        const currentUserId = req.user?.id;
        const currentRole = req.user?.role;

        // 权限判断：仅本人或顶级管理员可更新
        if (currentRole !== 'manager' || (currentUserId !== targetId && req.user?.authority !== 1)) {
            return res.status(403).json({ success: false, error: '无权限更新该管理员信息' });
        }

        const updateData: any = { ...req.body };
        
        // 处理头像更新
        if (req.file) updateData.photo_img = normalizePath(req.file.path);

        await ManagerDAO.updateById(targetId, updateData);
        res.json({ success: true, message: '管理员信息更新成功' });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   PATCH /api/managers/:id/password
 * @desc    修改密码
 * @access  仅本人可修改
 */
router.patch('/:id/password', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const targetId = Number(req.params.id);
        const currentUserId = req.user?.id;

        // 权限判断：仅本人可修改密码
        if (currentUserId !== targetId) {
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
        res.json({ success: true, message: '密码修改成功' });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   PATCH /api/managers/:id/status
 * @desc    更新启用/禁用状态
 * @access  仅顶级管理员可操作
 */
router.patch('/:id/status', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // 权限判断：仅顶级管理员可操作
        if (req.user?.role !== 'manager' || req.user?.authority !== 1) {
            return res.status(403).json({ success: false, error: '仅顶级管理员可修改状态' });
        }

        const targetId = Number(req.params.id);
        const { status } = req.body;

        await ManagerDAO.updateStatus(targetId, status);
        res.json({ success: true, message: '状态更新成功' });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   DELETE /api/managers/:id
 * @desc    删除管理员
 * @access  仅顶级管理员可操作
 */
router.delete('/:id', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // 权限判断：仅顶级管理员可删除
        if (req.user?.role !== 'manager' || req.user?.authority !== 1) {
            return res.status(403).json({ success: false, error: '仅顶级管理员可删除管理员' });
        }

        const id = Number(req.params.id);
        
        // 防止删除自己
        if (id === req.user?.id) {
            return res.status(400).json({ success: false, error: '不能删除自己的账号' });
        }

        await ManagerDAO.deleteById(id);
        res.json({ success: true, message: '管理员删除成功' });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/managers/operation-logs
 * @desc    获取操作日志
 * @access  仅管理员可访问
 */
router.get('/operation-logs', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // 权限判断：仅管理员可访问
        if (req.user?.role !== 'manager') {
            return res.status(403).json({ success: false, error: '仅管理员可查看操作日志' });
        }

        // 模拟操作日志数据
        const operationLogs = [
            {
                id: '1',
                adminId: req.user.id.toString(),
                adminName: '超级管理员',
                adminRole: 'super_admin',
                operation: '创建客服账号',
                module: '用户管理',
                details: '创建了客服账号: 13900000003',
                ipAddress: '127.0.0.1',
                createdAt: new Date().toISOString()
            },
            {
                id: '2',
                adminId: req.user.id.toString(),
                adminName: '超级管理员',
                adminRole: 'super_admin',
                operation: '切换账号状态',
                module: '用户管理',
                details: '将客服账号 13900000002 状态切换为 inactive',
                ipAddress: '127.0.0.1',
                createdAt: new Date(Date.now() - 3600000).toISOString()
            }
        ];

        res.json(operationLogs);
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/managers/operation-logs/admin/:adminId
 * @desc    根据管理员ID获取操作日志
 * @access  仅管理员可访问
 */
router.get('/operation-logs/admin/:adminId', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // 权限判断：仅管理员可访问
        if (req.user?.role !== 'manager') {
            return res.status(403).json({ success: false, error: '仅管理员可查看操作日志' });
        }

        const adminId = req.params.adminId;
        
        // 模拟根据管理员ID过滤的操作日志
        const operationLogs = [
            {
                id: '1',
                adminId: adminId,
                adminName: '超级管理员',
                adminRole: 'super_admin',
                operation: '创建客服账号',
                module: '用户管理',
                details: `管理员 ${adminId} 创建了客服账号`,
                ipAddress: '127.0.0.1',
                createdAt: new Date().toISOString()
            }
        ];

        res.json(operationLogs);
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/managers/operation-logs/module/:module
 * @desc    根据模块获取操作日志
 * @access  仅管理员可访问
 */
router.get('/operation-logs/module/:module', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // 权限判断：仅管理员可访问
        if (req.user?.role !== 'manager') {
            return res.status(403).json({ success: false, error: '仅管理员可查看操作日志' });
        }

        const module = req.params.module;
        
        // 模拟根据模块过滤的操作日志
        const operationLogs = [
            {
                id: '1',
                adminId: req.user?.id.toString(),
                adminName: '超级管理员',
                adminRole: 'super_admin',
                operation: '模块操作',
                module: module,
                details: `在 ${module} 模块执行了操作`,
                ipAddress: '127.0.0.1',
                createdAt: new Date().toISOString()
            }
        ];

        res.json(operationLogs);
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/managers/operation-logs/date-range
 * @desc    根据日期范围获取操作日志
 * @access  仅管理员可访问
 */
router.get('/operation-logs/date-range', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // 权限判断：仅管理员可访问
        if (req.user?.role !== 'manager') {
            return res.status(403).json({ success: false, error: '仅管理员可查看操作日志' });
        }

        const { start, end } = req.query;
        
        // 模拟根据日期范围过滤的操作日志
        const operationLogs = [
            {
                id: '1',
                adminId: req.user?.id.toString(),
                adminName: '超级管理员',
                adminRole: 'super_admin',
                operation: '日期范围查询',
                module: '系统管理',
                details: `查询了 ${start} 到 ${end} 的操作日志`,
                ipAddress: '127.0.0.1',
                createdAt: new Date().toISOString()
            }
        ];

        res.json(operationLogs);
    } catch (err) {
        next(err);
    }
});

// 导出路由
export default router;