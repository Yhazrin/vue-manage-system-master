import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { auth, AuthRequest } from '../middleware/auth';
import { CustomerServiceDao, CustomerService } from '../dao/CustomerServiceDao';
import { AttendanceDao } from '../dao/AttendanceDao';
import { pool } from '../db';
import { RowDataPacket } from 'mysql2';

const router = Router();

/**
 * @route   GET /api/customer-service/auth/check
 * @desc    检查客服认证状态和封禁状态
 * @access  需要认证
 */
router.get('/auth/check', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // 如果能通过auth中间件，说明客服状态正常
        res.json({ success: true, message: '客服状态正常' });
    } catch (err) {
        next(err);
    }
});

// 客服登录
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone_num, phone, password } = req.body;
    const phoneNumber = phone_num || phone; // 兼容两种字段名

    if (!phoneNumber || !password) {
      return res.status(400).json({ 
        success: false, 
        error: '手机号和密码不能为空' 
      });
    }

    // 查找客服 - 统一使用手机号登录
    const customerService = await CustomerServiceDao.findByPhone(phoneNumber);
    
    if (!customerService) {
      return res.status(401).json({ 
        success: false, 
        error: '手机号或密码错误' 
      });
    }

    // 检查客服状态
    if (customerService.status === 'inactive' || customerService.status === 'suspended') {
      return res.status(403).json({ 
        success: false, 
        error: '账户已被禁用，请联系客服管理员',
        banned: true
      });
    }

    // 验证密码 - 支持明文密码和加密密码
    let isPasswordValid = false;
    
    // 首先检查是否有明文密码，如果有则直接比较
    if (customerService.plain_passwd && customerService.plain_passwd.trim() !== '') {
      isPasswordValid = password === customerService.plain_passwd;
    } else {
      // 如果没有明文密码，则使用bcrypt比较加密密码
      isPasswordValid = await bcrypt.compare(password, customerService.password);
    }
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        error: '手机号或密码错误' 
      });
    }

    // 更新最后登录时间
    await CustomerServiceDao.updateLastLogin(customerService.id);

    // 生成JWT token
    const token = jwt.sign(
      { 
        id: customerService.id, 
        username: customerService.username,
        role: 'customer_service'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // 获取客服权限
    const permissions = await CustomerServiceDao.getCustomerServicePermissions(customerService.id);

    // 返回客服信息（不包含密码）
    const { password: _, ...safeCustomerService } = customerService;
    
    res.json({
      success: true,
      token,
      user: {
        ...safeCustomerService,
        role: 'customer_service',
        permissions: permissions.map(p => p.permission_key)
      }
    });

  } catch (err) {
    next(err);
  }
});

// 获取客服个人资料
router.get('/profile', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'customer_service') {
      return res.status(403).json({ success: false, error: '仅客服可访问' });
    }

    const customerService = await CustomerServiceDao.findById(req.user.id);
    if (!customerService) {
      return res.status(404).json({ success: false, error: '客服不存在' });
    }

    // 获取权限
    const permissions = await CustomerServiceDao.getCustomerServicePermissions(customerService.id);

    const { password: __, ...safeCustomerService } = customerService;
    
    res.json({
      success: true,
      data: {
        ...safeCustomerService,
        permissions: permissions.map(p => p.permission_key)
      }
    });

  } catch (err) {
    next(err);
  }
});

// 更新客服个人资料
router.put('/profile', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'customer_service') {
      return res.status(403).json({ success: false, error: '仅客服可访问' });
    }

    const { phone_num, email } = req.body;
    const updates: any = {};
    if (phone_num !== undefined) updates.phone_num = phone_num;
    if (email !== undefined) updates.email = email;

    await CustomerServiceDao.updateCustomerService(req.user.id, updates);

    res.json({ success: true, message: '个人资料更新成功' });

  } catch (err) {
    next(err);
  }
});

// 修改密码
router.put('/password', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'customer_service') {
      return res.status(403).json({ success: false, error: '仅客服可访问' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        error: '当前密码和新密码不能为空' 
      });
    }

    // 获取客服信息
    const customerService = await CustomerServiceDao.findById(req.user.id);
    if (!customerService) {
      return res.status(404).json({ success: false, error: '客服不存在' });
    }

    // 验证当前密码
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, customerService.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ 
        success: false, 
        error: '当前密码错误' 
      });
    }

    // 加密新密码
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await CustomerServiceDao.updatePassword(req.user.id, hashedNewPassword);

    res.json({ success: true, message: '密码修改成功' });

  } catch (err) {
    next(err);
  }
});

// 获取客服收益信息
router.get('/earnings', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'customer_service') {
      return res.status(403).json({ success: false, error: '仅客服可访问' });
    }

    const customerService = await CustomerServiceDao.findById(req.user.id);
    if (!customerService) {
      return res.status(404).json({ success: false, error: '客服不存在' });
    }

    res.json({
      success: true,
      earnings: {
        totalEarnings: customerService.total_earnings,
        availableBalance: customerService.available_balance,
        hourlyRate: customerService.hourly_rate
      }
    });

  } catch (err) {
    next(err);
  }
});

// ==================== 客服端打卡相关接口 ====================

// 客服权限检查中间件
const requireCustomerService = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'customer_service') {
    return res.status(403).json({
      success: false,
      error: '仅客服可访问'
    });
  }
  next();
};

// 客服管理员或客服权限检查中间件
const requireManagerOrCustomerService = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin' && req.user?.role !== 'customer_service') {
    return res.status(403).json({
      success: false,
      error: '仅客服管理员或客服可访问'
    });
  }
  next();
};

// 获取客服打卡记录
router.get('/attendance', auth, requireManagerOrCustomerService, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    
    // 如果是客服管理员，可以查看指定客服的记录或所有记录
    // 如果是客服，只能查看自己的记录
    let customerServiceId: number | undefined;
    
    if (req.user?.role === 'admin') {
      // 客服管理员可以通过 customerServiceId 参数查看指定客服的记录
      const queryCustomerServiceId = req.query.customerServiceId || req.query.adminId; // 兼容旧的adminId参数名
      if (queryCustomerServiceId && queryCustomerServiceId !== 'undefined' && queryCustomerServiceId !== '[object Object]') {
        customerServiceId = Number(queryCustomerServiceId);
      }
      // 如果没有指定 customerServiceId，则查看所有记录（customerServiceId 为 undefined）
    } else {
      // 客服只能查看自己的记录
      customerServiceId = req.user?.id;
    }

    if (req.user?.role === 'customer_service' && !customerServiceId) {
      return res.status(400).json({ success: false, error: '用户ID不能为空' });
    }

    const result = await AttendanceDao.getAttendanceRecords(customerServiceId, undefined, undefined, page, pageSize);

    // 获取客服信息和收入信息
    const recordsWithEarnings = await Promise.all(result.records.map(async (record) => {
      // 获取客服时薪信息
      const [customerServiceInfo] = await pool.execute<RowDataPacket[]>(
        'SELECT hourly_rate FROM customer_services_super_unified WHERE id = ?',
        [record.customer_service_id]
      );
      
      // 获取当日收入信息
      const [earningsInfo] = await pool.execute<RowDataPacket[]>(
        'SELECT total_earnings FROM customer_service_daily_earnings WHERE customer_service_id = ? AND date = ?',
        [record.customer_service_id, record.date]
      );
      
      const hourlyRate = customerServiceInfo.length > 0 ? customerServiceInfo[0].hourly_rate || 20.00 : 20.00;
      const totalEarnings = earningsInfo.length > 0 ? earningsInfo[0].total_earnings || 0 : 0;
      
      return {
        id: record.id,
        customerServiceId: record.customer_service_id, // 使用正确的客服ID字段
        customerServiceName: record.customer_service_name, // 使用正确的客服姓名字段
        adminId: record.customer_service_id, // 保持向后兼容性
        adminName: record.customer_service_name, // 保持向后兼容性
        checkInTime: record.clock_in_time ? new Date(record.clock_in_time).toISOString() : '',
        checkOutTime: record.clock_out_time ? new Date(record.clock_out_time).toISOString() : undefined,
        workDuration: record.work_hours ? Math.round(record.work_hours * 60) : 0, // 转换为分钟
        hourlyRate: hourlyRate, // 从客服信息中获取时薪
        totalEarnings: totalEarnings, // 从收益表中获取收入
        status: record.status, // 保持原始状态值
        createdAt: record.created_at ? new Date(record.created_at).toISOString() : '',
        updatedAt: record.updated_at ? new Date(record.updated_at).toISOString() : ''
      };
    }));

    res.json({
      success: true,
      records: recordsWithEarnings,
      total: result.total,
      stats: result.stats
    });

  } catch (err) {
    next(err);
  }
});

// 获取客服打卡记录 (别名路由，匹配前端请求)
router.get('/attendance/records', auth, requireManagerOrCustomerService, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    
    // 如果是客服管理员，可以查看指定客服的记录或所有记录
    // 如果是客服，只能查看自己的记录
    let customerServiceId: number | undefined;
    
    if (req.user?.role === 'admin') {
      // 客服管理员可以通过 customerServiceId 参数查看指定客服的记录
      const queryCustomerServiceId = req.query.customerServiceId || req.query.adminId; // 兼容旧的adminId参数名
      if (queryCustomerServiceId && queryCustomerServiceId !== 'undefined' && queryCustomerServiceId !== '[object Object]') {
        customerServiceId = Number(queryCustomerServiceId);
      }
      // 如果没有指定 customerServiceId，则查看所有记录（customerServiceId 为 undefined）
    } else {
      // 客服只能查看自己的记录
      customerServiceId = req.user?.id;
    }

    if (req.user?.role === 'customer_service' && !customerServiceId) {
      return res.status(400).json({ success: false, error: '用户ID不能为空' });
    }

    const result = await AttendanceDao.getAttendanceRecords(customerServiceId, undefined, undefined, page, pageSize);

    // 获取客服信息和收入信息
    const recordsWithEarnings = await Promise.all(result.records.map(async (record) => {
      // 获取客服时薪信息
      const [customerServiceInfo] = await pool.execute<RowDataPacket[]>(
        'SELECT hourly_rate FROM customer_services_super_unified WHERE id = ?',
        [record.customer_service_id]
      );
      
      // 获取当日收入信息
      const [earningsInfo] = await pool.execute<RowDataPacket[]>(
        'SELECT total_earnings FROM customer_service_daily_earnings WHERE customer_service_id = ? AND date = ?',
        [record.customer_service_id, record.date]
      );
      
      const hourlyRate = customerServiceInfo.length > 0 ? customerServiceInfo[0].hourly_rate || 20.00 : 20.00;
      const totalEarnings = earningsInfo.length > 0 ? earningsInfo[0].total_earnings || 0 : 0;
      
      return {
        id: record.id,
        customerServiceId: record.customer_service_id, // 使用正确的客服ID字段
        customerServiceName: record.customer_service_name, // 使用正确的客服姓名字段
        adminId: record.customer_service_id, // 保持向后兼容性
        adminName: record.customer_service_name, // 保持向后兼容性
        checkInTime: record.clock_in_time ? new Date(record.clock_in_time).toISOString() : '',
        checkOutTime: record.clock_out_time ? new Date(record.clock_out_time).toISOString() : undefined,
        workDuration: record.work_hours ? Math.round(record.work_hours * 60) : 0, // 转换为分钟
        hourlyRate: hourlyRate, // 从客服信息中获取时薪
        totalEarnings: totalEarnings, // 从收益表中获取收入
        status: record.status, // 保持原始状态值
        createdAt: record.created_at ? new Date(record.created_at).toISOString() : '',
        updatedAt: record.updated_at ? new Date(record.updated_at).toISOString() : ''
      };
    }));

    res.json({
      success: true,
      records: recordsWithEarnings,
      total: result.total,
      stats: result.stats
    });

  } catch (err) {
    next(err);
  }
});

// 客服上班打卡
router.post('/attendance/check-in', auth, requireCustomerService, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const customerServiceId = req.user?.id;
    const customerServiceName = req.user?.username;

    if (!customerServiceId || !customerServiceName) {
      return res.status(400).json({ success: false, error: '用户信息不完整' });
    }

    const record = await AttendanceDao.clockIn(customerServiceId, customerServiceName);
    
    // 获取客服时薪信息
    const [customerServiceInfo] = await pool.execute<RowDataPacket[]>(
      'SELECT hourly_rate FROM customer_services_super_unified WHERE id = ?',
      [customerServiceId]
    );
    
    const hourlyRate = customerServiceInfo.length > 0 ? customerServiceInfo[0].hourly_rate || 20.00 : 20.00;
    
    // 转换数据格式
    const result = {
      id: record.data.id,
      customerServiceId: record.data.customer_service_id, // 使用正确的客服ID字段
      customerServiceName: record.data.customer_service_name, // 使用正确的客服姓名字段
      adminId: record.data.customer_service_id, // 保持向后兼容性
      adminName: record.data.customer_service_name, // 保持向后兼容性
      checkInTime: record.data.clock_in_time ? new Date(record.data.clock_in_time).toISOString() : '',
      checkOutTime: record.data.clock_out_time ? new Date(record.data.clock_out_time).toISOString() : undefined,
      workDuration: record.data.work_hours ? Math.round(record.data.work_hours * 60) : 0,
      hourlyRate: hourlyRate, // 从客服信息中获取时薪
      totalEarnings: 0, // 上班时收益为0，下班时才计算
      status: record.data.status, // 保持原始状态值
      createdAt: record.data.created_at ? new Date(record.data.created_at).toISOString() : '',
      updatedAt: record.data.updated_at ? new Date(record.data.updated_at).toISOString() : ''
    };

    res.json({
      success: true,
      message: '上班打卡成功',
      data: result
    });

  } catch (err) {
    if (err instanceof Error) {
      res.status(400).json({ success: false, error: err.message });
    } else {
      next(err);
    }
  }
});

// 客服下班打卡
router.post('/attendance/check-out', auth, requireCustomerService, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const customerServiceId = req.user?.id;

    if (!customerServiceId) {
      return res.status(400).json({ success: false, error: '用户ID不能为空' });
    }

    const record = await AttendanceDao.clockOut(customerServiceId);
    
    // 获取客服时薪信息
    const [customerServiceInfo] = await pool.execute<RowDataPacket[]>(
      'SELECT hourly_rate FROM customer_services_super_unified WHERE id = ?',
      [customerServiceId]
    );
    
    // 获取当日收入信息
    const today = new Date().toISOString().split('T')[0];
    const [earningsInfo] = await pool.execute<RowDataPacket[]>(
      'SELECT total_earnings FROM customer_service_daily_earnings WHERE customer_service_id = ? AND date = ?',
      [customerServiceId, today]
    );
    
    const hourlyRate = customerServiceInfo.length > 0 ? customerServiceInfo[0].hourly_rate || 20.00 : 20.00;
    const totalEarnings = earningsInfo.length > 0 ? earningsInfo[0].total_earnings || 0 : 0;
    
    // 转换数据格式
    const result = {
      id: record.data.id,
      customerServiceId: record.data.customer_service_id, // 使用正确的客服ID字段
      customerServiceName: record.data.customer_service_name, // 使用正确的客服姓名字段
      adminId: record.data.customer_service_id, // 保持向后兼容性
      adminName: record.data.customer_service_name, // 保持向后兼容性
      checkInTime: record.data.clock_in_time ? new Date(record.data.clock_in_time).toISOString() : '',
      checkOutTime: record.data.clock_out_time ? new Date(record.data.clock_out_time).toISOString() : undefined,
      workDuration: record.data.work_hours ? Math.round(record.data.work_hours * 60) : 0,
      hourlyRate: hourlyRate, // 从客服信息中获取时薪
      totalEarnings: totalEarnings, // 从收益表中获取收入
      status: record.data.status, // 保持原始状态值
      createdAt: record.data.created_at ? new Date(record.data.created_at).toISOString() : '',
      updatedAt: record.data.updated_at ? new Date(record.data.updated_at).toISOString() : ''
    };

    res.json({
      success: true,
      message: '下班打卡成功',
      data: result
    });

  } catch (err) {
    if (err instanceof Error) {
      res.status(400).json({ success: false, error: err.message });
    } else {
      next(err);
    }
  }
});

// 获取客服打卡状态
router.get('/attendance/status', auth, requireCustomerService, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const customerServiceId = req.user?.id;

    if (!customerServiceId) {
      return res.status(400).json({ success: false, error: '用户ID不能为空' });
    }

    const status = await AttendanceDao.getTodayAttendanceStatus(customerServiceId);
    
    res.json({
      success: true,
      status: status.status,
      clockInTime: status.checkInTime,
      clockOutTime: status.checkOutTime,
      workHours: status.workDuration,
      canClockIn: status.canClockIn,
      canClockOut: status.canClockOut,
      todayRecord: status.todayRecord
    });

  } catch (err) {
    next(err);
  }
});

// 重置今日打卡状态（用于测试）
router.post('/attendance/reset', auth, requireCustomerService, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const customerServiceId = req.user?.id;

    if (!customerServiceId) {
      return res.status(400).json({ success: false, error: '用户ID不能为空' });
    }

    const result = await AttendanceDao.resetTodayAttendance(customerServiceId);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.message
      });
    }

  } catch (err) {
    next(err);
  }
});

// 获取客服时薪
router.get('/hourly-rate/:customerServiceId', auth, requireCustomerService, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const customerServiceId = Number(req.params.customerServiceId);
    const currentUserId = req.user?.id;

    // 只允许客服查看自己的时薪
    if (customerServiceId !== currentUserId) {
      return res.status(403).json({ success: false, error: '只能查看自己的时薪信息' });
    }

    const customerService = await CustomerServiceDao.findCustomerServiceById(customerServiceId);
    if (!customerService) {
      return res.status(404).json({ success: false, error: '客服不存在' });
    }

    res.json({
      success: true,
      hourlyRate: customerService.hourly_rate || 0
    });

  } catch (err) {
    next(err);
  }
});

// 客服权限检查中间件
const checkCustomerServicePermission = (permissionKey: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // 客服管理员拥有所有权限
      if (req.user?.role === 'admin') {
        return next();
      }

      // 客服需要检查具体权限
      if (req.user?.role === 'customer_service') {
        const hasPermission = await CustomerServiceDao.hasCustomerServicePermission(
          req.user.id, 
          permissionKey
        );

        if (!hasPermission) {
          return res.status(403).json({ 
            success: false, 
            error: `没有权限访问 ${permissionKey}` 
          });
        }

        return next();
      }

      // 其他角色无权限
      return res.status(403).json({ success: false, error: '仅客服管理员和客服可访问' });
    } catch (err) {
      next(err);
    }
  };
};

// ==================== 客服管理员对客服的管理接口 ====================

// 权限中间件：仅允许客服管理员访问
const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: '仅客服管理员可访问'
    });
  }
  next();
};

// 创建客服账号（仅客服管理员可操作）
router.post('/', auth, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { username, password, phone_num, email, hourly_rate } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: '用户名和密码不能为空' 
      });
    }

    // 检查用户名是否已存在
    const existingCustomerService = await CustomerServiceDao.findCustomerServiceByUsername(username);
    if (existingCustomerService) {
      return res.status(400).json({ 
        success: false, 
        error: '用户名已存在' 
      });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建客服
    const customerServiceId = await CustomerServiceDao.createCustomerService({
      username,
      password: hashedPassword,
      plain_passwd: password,
      phone: phone_num,
      hourly_rate: hourly_rate || 20.00,
      created_by: req.user?.id
    });

    // 添加默认权限
    const defaultPermissions = [
      { key: 'customer_service.orders', name: '订单管理' },
      { key: 'customer_service.users', name: '用户管理' },
      { key: 'customer_service.gifts', name: '礼物管理' },
      { key: 'customer_service.withdrawals', name: '提现管理' }
    ];

    for (const permission of defaultPermissions) {
      await CustomerServiceDao.addCustomerServicePermission(
        customerServiceId,
        permission.key,
        permission.name,
        req.user?.id
      );
    }

    res.status(201).json({
      success: true,
      message: '客服账号创建成功',
      customerServiceId
    });

  } catch (err) {
    next(err);
  }
});

// 获取客服列表（仅客服管理员可访问）
router.get('/', auth, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const status = req.query.status !== undefined ? req.query.status === 'true' : undefined;
    const keyword = req.query.keyword as string;

    const result = await CustomerServiceDao.findAllCustomerServices(page, pageSize, keyword, status);

    // 为每个客服获取权限信息
    const customerServicesWithPermissions = await Promise.all(
      result.customerServices.map(async (cs) => {
        const permissions = await CustomerServiceDao.getCustomerServicePermissions(cs.id);
        const { password, plain_passwd, ...safeCs } = cs;
        return {
          ...safeCs,
          permissions: permissions.map(p => p.permission_key)
        };
      })
    );

    res.json({
      success: true,
      data: customerServicesWithPermissions,
      pagination: {
        page,
        pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / pageSize)
      }
    });

  } catch (err) {
    next(err);
  }
});

// 更新客服状态（仅客服管理员可操作）
router.put('/:id/status', auth, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const customerServiceId = Number(req.params.id);
    const { status } = req.body;

    // 支持布尔值和字符串值
    let statusValue: 'active' | 'inactive' | 'suspended';
    
    if (typeof status === 'boolean') {
      statusValue = status ? 'active' : 'inactive';
    } else if (typeof status === 'string' && ['active', 'inactive', 'suspended'].includes(status)) {
      statusValue = status as 'active' | 'inactive' | 'suspended';
    } else {
      return res.status(400).json({ 
        success: false, 
        error: '状态值必须是布尔类型或有效的状态字符串 (active/inactive/suspended)' 
      });
    }

    await CustomerServiceDao.updateCustomerServiceStatus(customerServiceId, statusValue);

    res.json({ 
      success: true, 
      message: `客服已${statusValue === 'active' ? '启用' : '禁用'}` 
    });

  } catch (err) {
    next(err);
  }
});

// 更新客服权限（仅客服管理员可操作）
router.put('/:id/permissions', auth, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const customerServiceId = Number(req.params.id);
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ 
        success: false, 
        error: '权限必须是数组格式' 
      });
    }

    // 权限映射
    const permissionMap: { [key: string]: string } = {
      'customer_service.orders': '订单管理',
      'customer_service.users': '用户管理',
      'customer_service.gifts': '礼物管理',
      'customer_service.withdrawals': '提现管理',
      'customer_service.games': '游戏管理',
      'customer_service.logs': '日志查看',
      // 保持向后兼容性
      'admin.orders': '订单管理',
      'admin.users': '用户管理',
      'admin.gifts': '礼物管理',
      'admin.withdrawals': '提现管理',
      'admin.games': '游戏管理',
      'admin.logs': '日志查看'
    };

    // 获取当前权限
    const currentPermissions = await CustomerServiceDao.getCustomerServicePermissions(customerServiceId);
    const currentPermissionKeys = currentPermissions.map(p => p.permission_key);

    // 删除不再拥有的权限
    for (const currentKey of currentPermissionKeys) {
      if (!permissions.includes(currentKey)) {
        await CustomerServiceDao.removeCustomerServicePermission(customerServiceId, currentKey);
      }
    }

    // 添加新权限
    for (const permissionKey of permissions) {
      if (!currentPermissionKeys.includes(permissionKey)) {
        const permissionName = permissionMap[permissionKey] || permissionKey;
        await CustomerServiceDao.addCustomerServicePermission(
          customerServiceId,
          permissionKey,
          permissionName,
          req.user?.id
        );
      }
    }

    res.json({ 
      success: true, 
      message: '客服权限更新成功' 
    });

  } catch (err) {
    next(err);
  }
});

// 管理员修改客服密码（仅客服管理员可操作）
router.put('/:id/password', auth, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const customerServiceId = Number(req.params.id);
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: '密码长度至少6个字符'
      });
    }

    // 检查客服是否存在
    const customerService = await CustomerServiceDao.findById(customerServiceId);
    if (!customerService) {
      return res.status(404).json({ success: false, error: '客服不存在' });
    }

    // 更新客服密码
    const hash = await bcrypt.hash(password, 10);
    await CustomerServiceDao.updatePassword(customerServiceId, hash, password);

    res.json({ 
      success: true, 
      message: '客服密码修改成功' 
    });

  } catch (err) {
    next(err);
  }
});

// 删除客服（仅客服管理员可操作）
router.delete('/:id', auth, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const customerServiceId = Number(req.params.id);
    console.log(`收到删除客服请求，ID: ${customerServiceId}, 操作者: ${req.user?.username || req.user?.id}`);

    if (!customerServiceId || isNaN(customerServiceId)) {
      console.log(`无效的客服ID: ${req.params.id}`);
      return res.status(400).json({ 
        success: false, 
        error: '无效的客服ID' 
      });
    }

    await CustomerServiceDao.deleteCustomerService(customerServiceId);
    console.log(`客服删除成功，ID: ${customerServiceId}`);

    res.json({ 
      success: true, 
      message: '客服删除成功' 
    });

  } catch (err: any) {
    console.error(`删除客服失败，ID: ${req.params.id}，错误:`, err.message);
    next(err);
  }
});

// ==================== 客服提现相关接口 ====================

// 获取客服提现记录
router.get('/withdrawal', auth, requireCustomerService, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const customerServiceId = req.user?.id;

    if (!customerServiceId) {
      return res.status(400).json({ success: false, error: '用户ID不能为空' });
    }

    const result = await CustomerServiceDao.getWithdrawals(customerServiceId, page, pageSize);
    
    res.json({
      success: true,
      data: result.withdrawals,
      pagination: {
        page,
        pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / pageSize)
      }
    });

  } catch (err) {
    next(err);
  }
});

// 获取客服提现记录（专用于前端调用）
router.get('/withdrawal/records', auth, requireCustomerService, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const customerServiceId = req.user?.id;

    if (!customerServiceId) {
      return res.status(400).json({ success: false, error: '用户ID不能为空' });
    }

    const result = await CustomerServiceDao.getWithdrawals(customerServiceId, page, pageSize);
    
    res.json({
      success: true,
      data: result.withdrawals.map(w => ({
        id: w.withdrawal_id,
        amount: w.amount,
        status: w.status,
        alipay_account: w.alipay_account,
        description: w.notes || '',
        created_at: w.created_at,
        updated_at: w.updated_at,
        processed_by_name: w.processed_by_name,
        reject_reason: w.reject_reason
      })),
      pagination: {
        page,
        pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / pageSize)
      }
    });

  } catch (err) {
    next(err);
  }
});

// 申请提现
router.post('/withdrawal', auth, requireCustomerService, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { amount, description } = req.body;
    const customerServiceId = req.user?.id;
    const customerServiceName = req.user?.username;

    if (!customerServiceId || !customerServiceName) {
      return res.status(400).json({ success: false, error: '用户信息不完整' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: '提现金额必须大于0' });
    }

    if (amount < 1) {
      return res.status(400).json({ success: false, error: '最低提现金额为1元' });
    }

    // 获取客服信息检查余额
    const customerService = await CustomerServiceDao.findById(customerServiceId);
    if (!customerService) {
      return res.status(404).json({ success: false, error: '客服不存在' });
    }

    if (customerService.available_balance < amount) {
      return res.status(400).json({ 
        success: false, 
        error: `余额不足，当前可用余额：¥${customerService.available_balance.toFixed(2)}` 
      });
    }

    // 创建提现申请
    const withdrawalId = await CustomerServiceDao.createWithdrawal({
      customer_service_id: customerServiceId,
      amount,
      alipay_account: '', // 支付宝账号改为可选
      description: description || '客服提现申请'
    });

    res.status(201).json({
      success: true,
      message: '提现申请已提交，请等待管理员审核',
      withdrawalId
    });

  } catch (err) {
    if (err instanceof Error) {
      res.status(400).json({ success: false, error: err.message });
    } else {
      next(err);
    }
  }
});

// 获取客服工作台数据
router.get('/dashboard', auth, requireCustomerService, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const customerServiceId = req.user?.id;

    if (!customerServiceId) {
      return res.status(400).json({ success: false, error: '用户ID不能为空' });
    }

    // 获取客服基本信息
    const customerService = await CustomerServiceDao.findById(customerServiceId);
    if (!customerService) {
      return res.status(404).json({ success: false, error: '客服不存在' });
    }

    // 获取收益数据
    const earningsResult = await CustomerServiceDao.getDailyEarnings(customerServiceId, undefined, undefined, 1, 10);
    
    // 获取考勤记录
    const attendanceResult = await AttendanceDao.getAttendanceRecords(customerServiceId, undefined, undefined, 1, 10);
    
    // 获取提现记录
    const withdrawalResult = await CustomerServiceDao.getWithdrawals(customerServiceId, 1, 10);

    // 计算今日数据
    const today = new Date().toISOString().split('T')[0];
    const todayEarnings = earningsResult.earnings.filter(e => 
      e.date && e.date.toString().startsWith(today)
    ).reduce((sum, e) => sum + (e.total_earnings || 0), 0);

    const todayAttendance = attendanceResult.records.find(r => 
      r.created_at && r.created_at.toString().startsWith(today)
    );
    const todayWorkHours = todayAttendance ? (todayAttendance.work_hours || 0) : 0;

    // 计算本月数据
    const currentMonth = new Date().toISOString().substring(0, 7);
    const monthEarnings = earningsResult.earnings.filter(e => 
      e.date && e.date.toString().startsWith(currentMonth)
    ).reduce((sum, e) => sum + (e.total_earnings || 0), 0);

    res.json({
      success: true,
      earnings: {
        totalEarnings: customerService.total_earnings,
        todayEarnings,
        monthEarnings,
        availableBalance: customerService.available_balance,
        totalWorkHours: 0, // TODO: 计算总工作时长
        todayWorkHours,
        processedOrders: 0 // TODO: 从订单系统获取
      },
      recentEarnings: earningsResult.earnings.slice(0, 5).map(e => ({
        id: e.id,
        date: e.date,
        amount: e.total_earnings,
        type: 'daily_earnings',
        description: `工作${e.work_hours}小时，时薪${e.hourly_rate}元`
      })),
      attendanceRecords: attendanceResult.records.slice(0, 5).map(r => ({
        id: r.id,
        date: r.created_at ? r.created_at.toString().split('T')[0] : '',
        clockIn: r.clock_in_time ? new Date(r.clock_in_time).toTimeString().substring(0, 5) : '',
        clockOut: r.clock_out_time ? new Date(r.clock_out_time).toTimeString().substring(0, 5) : null,
        workHours: r.work_hours || 0,
        status: r.status
      })),
      withdrawalRecords: withdrawalResult.withdrawals.slice(0, 5).map(w => ({
        id: w.id?.toString(),
        amount: w.amount,
        status: w.status,
        createdAt: w.created_at ? w.created_at.toString().split('T')[0] : ''
      }))
    });

  } catch (err) {
    next(err);
  }
});

// 批量更新客服时薪
router.post('/batch-update-hourly-rate', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { hourly_rate, customer_service_ids } = req.body;

    if (!hourly_rate || hourly_rate <= 0) {
      return res.status(400).json({ success: false, error: '时薪必须大于0' });
    }

    await CustomerServiceDao.batchUpdateHourlyRate(hourly_rate, customer_service_ids);
    
    res.json({
      success: true,
      message: '时薪更新成功',
      data: { hourly_rate, affected_count: customer_service_ids?.length || 'all' }
    });

  } catch (err) {
    next(err);
  }
});

// ==================== 管理员提现管理接口 ====================

// 获取所有客服提现申请（仅管理员可访问）
router.get('/withdrawals', auth, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const status = req.query.status as string;
    const customerServiceId = req.query.customerServiceId ? Number(req.query.customerServiceId) : undefined;



    // 构建WHERE条件和参数
    const whereConditions: string[] = ['w.user_type = ?'];
    const baseParams: any[] = ['customer_service'];

    if (status && status.trim() !== '' && status !== 'undefined' && status !== 'null') {
      whereConditions.push('w.status = ?');
      baseParams.push(status.trim());
    }

    if (customerServiceId && !isNaN(customerServiceId) && customerServiceId > 0) {
      whereConditions.push('w.customer_service_id = ?');
      baseParams.push(customerServiceId);
    }

    const whereClause = whereConditions.join(' AND ');
    
    // 构建完整的查询参数数组
    const queryParams = [
      ...baseParams,
      pageSize.toString(),
      ((page - 1) * pageSize).toString()
    ];



    // 获取所有客服提现申请（从withdrawals表中查询user_type为customer_service的记录）
    const [rows] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        w.withdrawal_id as id,
        w.customer_service_id,
        w.amount,
        w.status,
        w.alipay_account,
        w.created_at,
        w.updated_at,
        w.processed_at,
        w.processed_by,
        w.reject_reason,
        cs.username as customer_service_name,
        cs.phone as customer_service_phone,
        admin.username as processed_by_name
      FROM withdrawals w
      LEFT JOIN customer_services_super_unified cs ON w.customer_service_id = cs.id
      LEFT JOIN customer_services_super_unified admin ON w.processed_by = admin.id
      WHERE ${whereClause}
      ORDER BY w.created_at DESC
      LIMIT ? OFFSET ?
    `, queryParams);

    // 获取总数
    const [countRows] = await pool.execute<RowDataPacket[]>(`
      SELECT COUNT(*) as total
      FROM withdrawals w
      WHERE ${whereClause}
    `, baseParams);

    const total = countRows[0].total;

    res.json({
      success: true,
      withdrawals: rows.map(row => ({
        id: row.id?.toString(),
        customer_service_id: row.customer_service_id,
        customer_service_name: row.customer_service_name,
        customer_service_phone: row.customer_service_phone,
        amount: Number(row.amount),
        status: row.status,
        alipay_account: row.alipay_account,
        created_at: row.created_at,
        updated_at: row.updated_at,
        processed_at: row.processed_at,
        processed_by: row.processed_by,
        processed_by_name: row.processed_by_name,
        reject_reason: row.reject_reason
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });

  } catch (err) {
    next(err);
  }
});

// 处理客服提现申请（仅管理员可操作）
router.put('/withdrawals/:id/process', auth, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const withdrawalId = req.params.id; // 保持字符串格式，不转换为数字
    const { status, notes } = req.body;
    const processedBy = req.user?.id;
    const processedByName = req.user?.username;

    console.log('🔍 处理提现申请:', { withdrawalId, status, notes, processedBy });

    if (!['approved', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: '无效的状态值' 
      });
    }

    if (status === 'rejected' && !notes) {
      return res.status(400).json({ 
        success: false, 
        error: '拒绝申请时必须填写拒绝原因' 
      });
    }

    // 获取提现申请信息（从withdrawals表中查询）
    const [withdrawalRows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM withdrawals WHERE withdrawal_id = ? AND user_type = ?',
      [withdrawalId, 'customer_service']
    );

    if (withdrawalRows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: '提现申请不存在' 
      });
    }

    const withdrawal = withdrawalRows[0];

    // 支持中文和英文状态值
    const isPending = withdrawal.status === 'pending' || withdrawal.status === '待审核';
    
    if (!isPending) {
      return res.status(400).json({ 
        success: false, 
        error: '只能处理待审核的申请' 
      });
    }

    // 如果是拒绝申请，需要恢复客服余额
    if (status === 'rejected') {
      await pool.execute(
        'UPDATE customer_services_super_unified SET available_balance = available_balance + ? WHERE id = ?',
        [withdrawal.amount, withdrawal.customer_service_id]
      );
    }

    // 将英文状态值转换为中文状态值以保持数据库一致性
    const statusMapping = {
      'approved': '已批准',
      'rejected': '已拒绝',
      'completed': '已完成'
    };
    
    const dbStatus = statusMapping[status] || status;

    // 使用WithdrawalDAO.updateStatus方法来更新提现申请状态
    // 这样可以确保客服余额和统计数据同步更新
    const { WithdrawalDAO } = require('../dao/WithdrawalDao');
    const updated = await WithdrawalDAO.updateStatus(withdrawalId, dbStatus, notes);
    
    if (!updated) {
      return res.status(500).json({ 
        success: false, 
        error: '更新提现状态失败' 
      });
    }

    res.json({
      success: true,
      message: `提现申请已${status === 'approved' ? '批准' : status === 'rejected' ? '拒绝' : '完成'}`
    });

  } catch (err) {
    next(err);
  }
});

// 获取客服提现申请的处理记录（仅管理员可访问）
router.get('/withdrawals/:id/records', auth, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const withdrawalId = req.params.id; // 保持字符串格式

    // 这里可以实现提现申请的处理记录查询
    // 目前返回基本的处理信息
    const [rows] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        w.withdrawal_id as id,
        w.status,
        w.created_at,
        w.processed_at,
        w.processed_by,
        w.reject_reason,
        cs.username as processed_by_name
      FROM withdrawals w
      LEFT JOIN customer_services_super_unified cs ON w.processed_by = cs.id
      WHERE w.withdrawal_id = ? AND w.user_type = ?
    `, [withdrawalId, 'customer_service']);

    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: '提现申请不存在' 
      });
    }

    const withdrawal = rows[0];
    const records = [];

    // 添加申请记录
    records.push({
      id: `${withdrawal.id}_created`,
      action: '提交申请',
      status: 'pending',
      operator: '客服',
      timestamp: withdrawal.created_at,
      notes: '提交提现申请'
    });

    // 如果已处理，添加处理记录
    if (withdrawal.processed_at) {
      records.push({
        id: `${withdrawal.id}_processed`,
        action: withdrawal.status === 'approved' ? '批准申请' : 
                withdrawal.status === 'rejected' ? '拒绝申请' : '完成提现',
        status: withdrawal.status,
        operator: withdrawal.processed_by_name || '管理员',
        timestamp: withdrawal.processed_at,
        notes: withdrawal.reject_reason || '处理完成'
      });
    }

    res.json({
      success: true,
      records
    });

  } catch (err) {
    next(err);
  }
});

export { router as customerServiceRouter, checkCustomerServicePermission };