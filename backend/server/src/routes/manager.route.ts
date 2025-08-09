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
    nameValidator
} from '../utils/validators';
import { createLoginHandler } from '../utils/loginHandler';
import { auth, AuthRequest, signToken } from '../middleware/auth';
import { ManagerDAO } from '../dao/ManagerDao';
import { CustomerServiceDao } from '../dao/CustomerServiceDao';

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
        // 权限判断：仅管理员和客服可操作
        if (req.user?.role !== 'admin' && req.user?.role !== 'customer_service') {
            return res.status(403).json({ success: false, error: '仅管理员和客服可修改状态' });
        }

        const targetId = Number(req.params.id);
        
        // 验证ID是否为有效数字
        if (isNaN(targetId) || targetId <= 0) {
            return res.status(400).json({ success: false, error: '无效的管理员ID' });
        }
        
        // 防止操作自己
        if (req.user?.id === targetId) {
            return res.status(400).json({ success: false, error: '不能修改自己的状态' });
        }

        // 获取目标管理员信息
        const manager = await ManagerDAO.findById(targetId);
        if (!manager) {
            return res.status(404).json({ success: false, error: '管理员不存在' });
        }

        // 防止操作其他管理员（可根据需要调整此逻辑）
        // 暂时允许管理员之间互相修改状态

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
            role: 'admin',
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
 * @body    { name, passwd, phone_num, photo_img? }
 */
router.post('/register', [
    phoneValidator, // 手机号格式验证
    phoneUniqueValidator('manager'), // 手机号唯一性验证
    passwordValidator, // 密码验证：长度+复杂度
    nameValidator // 姓名验证
], userUpload.single('photo_img'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 验证请求数据
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        // 从请求体中获取注册信息
        const { name, passwd, phone_num } = req.body;
        const photo_img = req.file ? normalizePath(req.file.path) : null;

        // 使用 bcrypt 加密密码
        const hash = await bcrypt.hash(passwd, 10);

        // 调用 ManagerDAO 写入数据库
        const id = await ManagerDAO.create(name, hash, phone_num, photo_img);
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
    // 复用通用登录逻辑（传入管理员DAO、更新最后登录时间方法和角色）
    createLoginHandler(ManagerDAO.findByPhone, ManagerDAO.updateLastLogin, 'admin')
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
 * @desc    创建客服账号（管理员可操作）
 * @access  管理员可访问
 * @body    { username, role }
 */
router.post('/', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // 权限判断：仅管理员和客服可创建客服
        if (req.user?.role !== 'admin' && req.user?.role !== 'customer_service') {
            return res.status(403).json({ success: false, error: '仅管理员和客服可创建客服账号' });
        }

        const { username, phone, role } = req.body;

        // 验证输入
        if (!username || !username.trim()) {
            return res.status(400).json({ success: false, error: '用户名不能为空' });
        }

        if (role !== 'customer_service') {
            return res.status(400).json({ success: false, error: '只能创建客服角色账号' });
        }

        // 生成客服昵称：如果用户输入的是数字，则生成"客服XX"格式，否则使用原输入
        let customerServiceName = username.trim();
        if (/^\d+$/.test(customerServiceName)) {
            customerServiceName = `客服${customerServiceName.padStart(2, '0')}`;
        }

        // 生成11位数字手机号的函数（符合中国手机号格式）
        const generatePhoneNumber = async () => {
            let phoneNumber;
            let attempts = 0;
            const maxAttempts = 100;
            
            // 中国手机号有效号段前缀
            const validPrefixes = ['130', '131', '132', '133', '134', '135', '136', '137', '138', '139',
                                   '147', '150', '151', '152', '153', '155', '156', '157', '158', '159',
                                   '166', '170', '171', '172', '173', '175', '176', '177', '178',
                                   '180', '181', '182', '183', '184', '185', '186', '187', '188', '189',
                                   '191', '193', '195', '196', '197', '198', '199'];
            
            do {
                // 随机选择一个有效的号段前缀
                const prefix = validPrefixes[Math.floor(Math.random() * validPrefixes.length)];
                // 生成后8位随机数字
                const suffix = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
                phoneNumber = prefix + suffix;
                
                // 检查是否已存在（同时检查managers表和customer_services表）
                const existingManager = await ManagerDAO.findByPhone(phoneNumber);
                const existingCustomerService = await CustomerServiceDao.findCustomerServiceByUsername(phoneNumber);
                if (!existingManager && !existingCustomerService) {
                    return phoneNumber;
                }
                
                attempts++;
            } while (attempts < maxAttempts);
            
            throw new Error('无法生成唯一的手机号码');
        };

        // 使用前端传入的手机号或生成唯一的11位手机号
        let phoneNumber;
        if (phone && phone.trim()) {
            // 验证手机号格式
            const phoneRegex = /^1[3-9]\d{9}$/;
            if (!phoneRegex.test(phone.trim())) {
                return res.status(400).json({ success: false, error: '请输入正确的手机号格式' });
            }
            
            // 检查手机号是否已存在
            const existingManager = await ManagerDAO.findByPhone(phone.trim());
            const existingCustomerService = await CustomerServiceDao.findByPhone(phone.trim());
            if (existingManager || existingCustomerService) {
                return res.status(400).json({ success: false, error: '手机号已存在' });
            }
            
            phoneNumber = phone.trim();
        } else {
            // 如果没有传入手机号，则生成一个
            phoneNumber = await generatePhoneNumber();
        }

        // 生成随机密码（8位，包含字母和数字）
        const generatePassword = () => {
            const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let password = '';
            // 确保至少包含一个字母和一个数字
            password += chars.charAt(Math.floor(Math.random() * 26)); // 小写字母
            password += chars.charAt(Math.floor(Math.random() * 26) + 26); // 大写字母
            password += chars.charAt(Math.floor(Math.random() * 10) + 52); // 数字
            
            // 填充剩余位数
            for (let i = 3; i < 8; i++) {
                password += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            
            // 打乱字符顺序
            return password.split('').sort(() => Math.random() - 0.5).join('');
        };

        const defaultPassword = generatePassword();
        const hash = await bcrypt.hash(defaultPassword, 10);

        // 直接创建到customer_services表中
        const id = await CustomerServiceDao.createCustomerService({
            username: customerServiceName, // username (客服名称作为登录用户名)
            password: hash, // 加密密码
            plain_passwd: defaultPassword, // 明文密码
            phone: phoneNumber, // phone_num
            hourly_rate: 20.00, // hourly_rate (默认时薪)
            created_by: req.user?.id // 创建者ID
        });

        const newCustomerService = await CustomerServiceDao.findCustomerServiceById(id);

        if (!newCustomerService) {
            return res.status(500).json({ success: false, error: '创建客服账号失败' });
        }

        // 为新客服添加默认权限
        const defaultPermissions = [
            { key: 'view_dashboard', name: '查看仪表板' },
            { key: 'manage_users', name: '管理用户' },
            { key: 'view_orders', name: '查看订单' },
            { key: 'handle_complaints', name: '处理投诉' }
        ];

        for (const permission of defaultPermissions) {
            await CustomerServiceDao.addCustomerServicePermission(
                id, 
                permission.key, 
                permission.name, 
                req.user.id
            );
        }

        // 返回客服信息（包含密码，仅在创建时返回）
        const { passwd, plain_passwd, ...safeCustomerService } = newCustomerService;
        const responseCustomerService = {
            id: safeCustomerService.id.toString(),
            username: safeCustomerService.username, // 返回客服用户名
            role: 'customer_service',
            status: safeCustomerService.status ? 'active' : 'inactive',
            createdAt: safeCustomerService.created_at,
            lastLogin: safeCustomerService.last_login,
            operationCount: 0,
            // 仅在创建时返回密码信息
            password: defaultPassword
        };

        console.log('✅ 成功创建客服账号到customer_services表:', {
            username: customerServiceName,
            phoneNumber: phoneNumber,
            password: defaultPassword
        });

        res.status(201).json(responseCustomerService);
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/managers/credentials
 * @desc    获取所有管理员和客服的账号密码信息（管理员可查看）
 * @access  管理员可访问
 */
router.get('/credentials', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // 权限判断：仅管理员和客服可访问
        if (req.user?.role !== 'admin' && req.user?.role !== 'customer_service') {
            return res.status(403).json({ success: false, error: '仅管理员和客服可查看账号密码' });
        }

        // 获取所有管理员
        const managerResult = await ManagerDAO.findAll(1, 1000, undefined, undefined);
        const managersWithCredentials = managerResult.managers.map(manager => ({
            id: manager.id.toString(),
            username: manager.phone_num, // 返回登录用户名（手机号）
            phone: manager.phone_num, // 添加手机号字段
            password: manager.plain_passwd || '密码未设置', // 返回明文密码
            role: 'admin',
            status: manager.status ? 'active' : 'inactive',
            createdAt: manager.created_at,
            source: 'managers' // 标识来源
        }));

        // 获取所有客服
        const customerServiceResult = await CustomerServiceDao.findAllCustomerServices(1, 1000, undefined, undefined);
        const customerServicesWithCredentials = customerServiceResult.customerServices.map(cs => ({
            id: cs.id.toString(),
            username: cs.username, // 返回登录用户名
            phone: cs.phone, // 添加手机号字段
            password: cs.plain_passwd || '密码未设置', // 返回明文密码
            role: 'customer_service',
            status: cs.status ? 'active' : 'inactive',
            createdAt: cs.created_at,
            source: 'customer_services' // 标识来源
        }));

        // 合并管理员和客服数据
        const allCredentials = [...managersWithCredentials, ...customerServicesWithCredentials];

        res.json(allCredentials);
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/managers/attendance
 * @desc    获取所有客服打卡记录
 * @access  仅管理员可访问
 */
router.get('/attendance', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // 权限判断：仅管理员和客服可访问
        if (req.user?.role !== 'admin' && req.user?.role !== 'customer_service') {
            return res.status(403).json({ success: false, error: '仅管理员和客服可查看打卡记录' });
        }

        // 调用实际的DAO方法获取所有打卡记录
        const { AttendanceDao } = require('../dao/AttendanceDao');
        const page = Number(req.query.page) || 1;
        const pageSize = Number(req.query.pageSize) || 50;
        
        const result = await AttendanceDao.getAllManagerAttendanceRecords(page, pageSize);
        
        // 格式化返回数据
        const formattedRecords = result.records.map((record: any) => ({
            id: record.id,
            adminId: record.admin_id,
            adminName: record.admin_name,
            date: record.date,
            checkInTime: record.clock_in_time,
            checkOutTime: record.clock_out_time,
            workDuration: record.work_hours ? Math.round(record.work_hours * 60) : 0, // 转换为分钟
            hourlyRate: record.hourly_rate || 20,
            totalEarnings: record.total_earnings || 0,
            status: record.status === 'clocked_in' ? 'checked_in' : 'checked_out',
            createdAt: record.created_at,
            updatedAt: record.updated_at
        }));

        res.json({
            records: formattedRecords,
            total: result.total,
            stats: {
                totalWorkHours: 0,
                totalEarnings: 0,
                averageHourlyRate: 20,
                totalDays: result.total
            }
        });
    } catch (err) {
        console.error('获取打卡记录失败:', err);
        next(err);
    }
});

/**
 * @route   GET /api/managers/attendance/admin/:adminId
 * @desc    根据管理员ID获取打卡记录
 * @access  仅管理员可访问
 */
router.get('/attendance/admin/:adminId', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // 权限判断：仅管理员和客服可访问
        if (req.user?.role !== 'admin' && req.user?.role !== 'customer_service') {
            return res.status(403).json({ success: false, error: '仅管理员和客服可查看打卡记录' });
        }

        const customerServiceId = Number(req.params.adminId);
        
        // 调用实际的DAO方法获取指定客服的打卡记录
        const { AttendanceDao } = require('../dao/AttendanceDao');
        const page = Number(req.query.page) || 1;
        const pageSize = Number(req.query.pageSize) || 50;
        
        const result = await AttendanceDao.getAttendanceRecords(customerServiceId, page, pageSize);
        
        // 格式化返回数据
        const formattedRecords = result.records.map((record: any) => ({
            id: record.id,
            adminId: record.admin_id,
            adminName: record.admin_name,
            date: record.date,
            clockInTime: record.clock_in_time,
            clockOutTime: record.clock_out_time,
            workDuration: record.work_hours ? Math.round(record.work_hours * 60) : 0, // 转换为分钟
            status: record.status === 'clocked_in' ? 'working' : 'off_work',
            createdAt: record.created_at,
            updatedAt: record.updated_at
        }));

        res.json(formattedRecords);
    } catch (err) {
        console.error('获取指定客服打卡记录失败:', err);
        next(err);
    }
});

/**
 * @route   GET /api/managers/salaries
 * @desc    获取客服时薪设置
 * @access  仅管理员可访问
 */
router.get('/salaries', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // 权限判断：仅管理员和客服可访问
        if (req.user?.role !== 'admin' && req.user?.role !== 'customer_service') {
            return res.status(403).json({ success: false, error: '仅管理员和客服可查看时薪设置' });
        }

        // 调用实际的DAO方法获取客服时薪设置
        const page = Number(req.query.page) || 1;
        const pageSize = Number(req.query.pageSize) || 50;
        
        const result = await CustomerServiceDao.getSalarySettings(page, pageSize);
        
        // 格式化薪资数据
        const salariesWithNames = result.salaries.map((salary: any) => ({
            adminId: salary.id.toString(),
            adminName: salary.nickname || salary.username,
            hourlyRate: salary.hourly_rate,
            minimumSettlementHours: 8, // 默认值
            updatedAt: new Date().toISOString(),
            updatedBy: '系统'
        }));

        res.json(salariesWithNames);
    } catch (err) {
        console.error('获取客服时薪设置失败:', err);
        next(err);
    }
});

/**
 * @route   PUT /api/managers/salaries/batch
 * @desc    批量更新客服时薪
 * @access  仅管理员可访问
 */
router.put('/salaries/batch', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // 权限判断：仅管理员和客服可访问
        if (req.user?.role !== 'admin' && req.user?.role !== 'customer_service') {
            return res.status(403).json({ success: false, error: '仅管理员和客服可批量修改时薪设置' });
        }

        const { updates } = req.body;

        if (!updates || !Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({ success: false, error: '更新数据不能为空' });
        }

        const results = [];
        
        for (const update of updates) {
            const { adminId, hourlyRate, minimumSettlementHours } = update;
            
            if (!adminId) {
                results.push({
                    adminId: adminId?.toString() || 'unknown',
                    success: false,
                    error: '管理员ID不能为空'
                });
                continue;
            }
            
            if (hourlyRate === undefined || hourlyRate === null || isNaN(Number(hourlyRate)) || Number(hourlyRate) <= 0) {
                results.push({
                    adminId: adminId.toString(),
                    success: false,
                    error: '时薪必须大于0'
                });
                continue;
            }

            try {
                // 调用实际的DAO方法更新时薪
                await CustomerServiceDao.updateCustomerServiceSalary(adminId, Number(hourlyRate), minimumSettlementHours);
                
                // 获取更新后的数据
                const updatedSalary = await CustomerServiceDao.getCustomerServiceSalary(adminId);
                const admin = await ManagerDAO.findById(adminId);
                
                results.push({
                    adminId: adminId.toString(),
                    adminName: admin?.name || `客服${adminId}`,
                    hourlyRate: updatedSalary?.hourly_rate || hourlyRate,
                    minimumSettlementHours: updatedSalary?.minimum_settlement_hours,
                    updatedAt: updatedSalary?.updated_at || new Date().toISOString(),
                    success: true
                });
            } catch (error) {
                results.push({
                    adminId: adminId.toString(),
                    success: false,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            message: `批量更新完成，成功 ${results.filter(r => r.success).length} 个，失败 ${results.filter(r => !r.success).length} 个`,
            results
        });
    } catch (err) {
        console.error('批量更新客服时薪失败:', err);
        next(err);
    }
});

/**
 * @route   PUT /api/managers/salaries/:adminId
 * @desc    更新客服时薪
 * @access  仅管理员可访问
 */
router.put('/salaries/:adminId', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // 权限判断：仅管理员和客服可访问
        if (req.user?.role !== 'admin' && req.user?.role !== 'customer_service') {
            return res.status(403).json({ success: false, error: '仅管理员和客服可修改时薪设置' });
        }

        const adminId = Number(req.params.adminId);
        const { hourlyRate, minimumSettlementHours } = req.body;

        if (!hourlyRate || hourlyRate <= 0) {
            return res.status(400).json({ success: false, error: '时薪必须大于0' });
        }

        // 调用实际的DAO方法更新时薪
        await CustomerServiceDao.updateCustomerServiceSalary(adminId, hourlyRate, minimumSettlementHours);
        
        // 获取更新后的数据返回给前端
        const updatedSalary = await CustomerServiceDao.getCustomerServiceSalary(adminId);
        const admin = await ManagerDAO.findById(adminId);
        
        const result = {
            adminId: adminId.toString(),
            adminName: admin?.name || `客服${adminId}`,
            hourlyRate: updatedSalary?.hourly_rate || hourlyRate,
            minimumSettlementHours: updatedSalary?.minimum_settlement_hours,
            updatedAt: updatedSalary?.updated_at || new Date().toISOString()
        };

        res.json(result);
    } catch (err) {
        console.error('更新客服时薪失败:', err);
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
        // 权限判断：仅管理员和客服可访问
        if (req.user?.role !== 'admin' && req.user?.role !== 'customer_service') {
            return res.status(403).json({ success: false, error: '仅管理员和客服可查看操作日志' });
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
        // 权限判断：仅管理员和客服可访问
        if (req.user?.role !== 'admin' && req.user?.role !== 'customer_service') {
            return res.status(403).json({ success: false, error: '仅管理员和客服可查看操作日志' });
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
        // 权限判断：仅管理员和客服可访问
        if (req.user?.role !== 'admin' && req.user?.role !== 'customer_service') {
            return res.status(403).json({ success: false, error: '仅管理员和客服可查看操作日志' });
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
        // 权限判断：仅管理员和客服可访问
        if (req.user?.role !== 'admin' && req.user?.role !== 'customer_service') {
            return res.status(403).json({ success: false, error: '仅管理员和客服可查看操作日志' });
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

/**
 * @route   GET /api/managers/global-hourly-rate
 * @desc    获取全局时薪设置
 * @access  管理员可访问
 */
router.get('/global-hourly-rate', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // 权限判断：仅管理员可访问
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ success: false, error: '仅管理员可访问全局时薪设置' });
        }

        // 从数据库获取全局时薪设置（这里使用一个默认值，实际应该从配置表获取）
        const globalHourlyRate = 20.00; // 默认时薪，可以从配置表获取
        
        res.json({
            success: true,
            hourly_rate: globalHourlyRate
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   POST /api/managers/global-hourly-rate
 * @desc    设置全局时薪
 * @access  管理员可访问
 */
router.post('/global-hourly-rate', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // 权限判断：仅管理员可访问
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ success: false, error: '仅管理员可设置全局时薪' });
        }

        const { hourly_rate } = req.body;

        if (!hourly_rate || hourly_rate <= 0) {
            return res.status(400).json({ success: false, error: '时薪必须大于0' });
        }

        // 这里应该将全局时薪保存到配置表，暂时返回成功
        // 实际实现时可以创建一个配置表来存储全局设置
        
        res.json({
            success: true,
            message: '全局时薪设置成功',
            hourly_rate: hourly_rate
        });
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

        // 权限判断：仅本人或管理员可访问
        if (currentRole !== 'admin' || (currentUserId !== targetId && currentRole !== 'admin')) {
            return res.status(403).json({ success: false, error: '无权限访问该管理员资料' });
        }


        // 隐藏密码字段
        const { passwd, ...safeManager } = manager;
        res.json({ success: true, manager: safeManager });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/managers
 * @desc    分页查询管理员列表（包含客服）
 * @access  管理员可访问
 * @query   page, pageSize, status?, keyword?
 */
router.get('/', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // 权限判断：仅管理员和客服可访问
        if (req.user?.role !== 'admin' && req.user?.role !== 'customer_service') {
            return res.status(403).json({ success: false, error: '仅管理员和客服可查看管理员列表' });
        }

        const page = Number(req.query.page) || 1;
        const pageSize = Number(req.query.pageSize) || 20;
        const status = req.query.status !== undefined ? req.query.status === 'true' : undefined;
        const keyword = req.query.keyword as string;

        // 获取管理员数据
        const managerResult = await ManagerDAO.findAll(page, pageSize, status, keyword);
        
        // 转换管理员数据为前端期望的格式
        const formattedManagers = managerResult.managers.map(manager => {
            const { passwd, ...safeManager } = manager;
            return {
                id: safeManager.id.toString(),
                username: safeManager.name,
                nickname: safeManager.name,
                phone: safeManager.phone_num, // 添加手机号字段
                role: 'admin',
                status: safeManager.status ? 'active' : 'inactive',
                createdAt: safeManager.created_at,
                lastLogin: safeManager.last_login ? new Date(safeManager.last_login).toLocaleDateString() : '未登录',
                operationCount: 0 // 暂时设为0，后续可以从操作日志统计
            };
        });

        // 获取客服数据
        const customerServiceResult = await CustomerServiceDao.findAllCustomerServices(1, 1000, status, keyword);
        
        // 转换客服数据为前端期望的格式
        const formattedCustomerServices = customerServiceResult.customerServices.map(cs => ({
            id: cs.id.toString(),
            username: cs.username,
            nickname: cs.nickname || cs.username,
            phone: cs.phone, // 添加手机号字段
            role: 'customer_service',
            status: cs.status ? 'active' : 'inactive',
            createdAt: cs.created_at,
            lastLogin: cs.last_login ? new Date(cs.last_login).toLocaleDateString() : '未登录',
            operationCount: 0
        }));

        // 合并管理员和客服数据
        const allUsers = [...formattedManagers, ...formattedCustomerServices];

        res.json(allUsers);
    } catch (err) {
        next(err);
    }
});

/**
 * @route   PATCH /api/managers/:id
 * @desc    更新管理员基本信息（除密码）
 * @access  仅本人或管理员可访问
 */
router.patch('/:id', auth, userUpload.single('photo_img'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const targetId = Number(req.params.id);
        const currentUserId = req.user?.id;
        const currentRole = req.user?.role;

        // 权限判断：仅本人或管理员可更新
        if (currentRole !== 'admin' || (currentUserId !== targetId && currentRole !== 'admin')) {
            return res.status(403).json({ success: false, error: '无权限更新该管理员信息' });
        }

        const updateData: any = { ...req.body };
        
        // 处理头像更新
        if (req.file) updateData.photo_img = normalizePath(req.file.path);

        await ManagerDAO.updateById(targetId, updateData);
        
        // 返回更新后的头像URL
        const responseData: any = { success: true, message: '管理员信息更新成功' };
        if (req.file) {
            responseData.photo_img = updateData.photo_img;
        }
        
        res.json(responseData);
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
        await ManagerDAO.updatePasswordWithPlain(targetId, hash, passwd);
        res.json({ success: true, message: '密码修改成功' });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   PUT /api/managers/:id/password
 * @desc    管理员修改其他用户密码
 * @access  仅管理员可操作
 */
router.put('/:id/password', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // 权限判断：仅管理员可修改其他人密码
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ success: false, error: '仅管理员可修改其他用户密码' });
        }

        const targetId = req.params.id;
        const { password } = req.body;

        if (!password || password.length < 6) {
            return res.status(400).json({
                success: false,
                error: '密码长度至少6个字符'
            });
        }

        // 检查目标用户是否存在（先检查管理员表）
        let targetUser = null;
        try {
            targetUser = await ManagerDAO.findById(Number(targetId));
        } catch (err) {
            // 如果管理员表中没有，检查客服表
            try {
                const CustomerServiceDao = require('../dao/CustomerServiceDao');
                targetUser = await CustomerServiceDao.findById(Number(targetId));
                
                if (targetUser) {
                    // 更新客服密码
                    const hash = await bcrypt.hash(password, 10);
                    await CustomerServiceDao.updatePassword(Number(targetId), hash, password);
                    return res.json({ success: true, message: '客服密码修改成功' });
                }
            } catch (csErr) {
                // 客服表中也没有
            }
        }

        if (targetUser && targetUser.id) {
            // 更新管理员密码
            const hash = await bcrypt.hash(password, 10);
            await ManagerDAO.updatePasswordWithPlain(Number(targetId), hash, password);
            return res.json({ success: true, message: '管理员密码修改成功' });
        }

        return res.status(404).json({ success: false, error: '用户不存在' });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   PATCH /api/managers/:id/status
 * @desc    更新启用/禁用状态
 * @access  管理员和客服可操作
 */
router.patch('/:id/status', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // 权限判断：仅管理员和客服可操作
        if (req.user?.role !== 'admin' && req.user?.role !== 'customer_service') {
            return res.status(403).json({ success: false, error: '仅管理员和客服可修改状态' });
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
 * @access  管理员和客服可操作
 */
router.delete('/:id', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // 权限判断：仅管理员和客服可删除
        if (req.user?.role !== 'admin' && req.user?.role !== 'customer_service') {
            return res.status(403).json({ success: false, error: '仅管理员和客服可删除管理员' });
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

// 导出路由
export default router;