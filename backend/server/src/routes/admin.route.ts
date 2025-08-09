import { Router } from 'express';
import { auth, AuthRequest } from '../middleware/auth';
import { pool } from '../db';
import { RowDataPacket } from 'mysql2';
import { ManagerDAO } from '../dao/ManagerDao';

const router = Router();

// 获取管理员个人资料
router.get('/profile', auth, async (req: AuthRequest, res) => {
  try {
    console.log('🔍 获取管理员个人资料，用户ID:', req.user?.id);
    
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: '用户未认证' });
    }

    // 从数据库获取管理员信息
    const manager = await ManagerDAO.findById(req.user.id);
    
    if (!manager) {
      return res.status(404).json({ success: false, error: '管理员信息不存在' });
    }

    // 计算任职时长（年）
    const joinDate = new Date(manager.created_at);
    const now = new Date();
    const tenureDuration = Math.max(0, Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 365)));

    // 统一的管理员角色
    const roleName = '管理员';
    const permissions = ['用户管理', '订单管理', '财务管理', '系统设置', '权限管理', '数据统计', '游戏管理', '提现管理'];

    // 构建返回数据
    const profileData = {
      id: manager.id.toString(),
      name: manager.name,
      uid: `AD${manager.id.toString().padStart(8, '0')}`,
      avatar: manager.photo_img || `https://api.dicebear.com/7.x/avataaars/svg?seed=${manager.name}`,
      role: roleName,
      permissions: permissions,
      joinDate: joinDate.toISOString().split('T')[0], // YYYY-MM-DD 格式
      lastLogin: manager.last_login ? new Date(manager.last_login).toLocaleString('zh-CN') : '从未登录',
      loginCount: 0, // 暂时设为0，因为数据库中没有login_count字段
      lastLoginIp: '未知', // 暂时设为未知，因为数据库中没有last_login_ip字段
      tenureDuration: tenureDuration
    };

    console.log('✅ 管理员个人资料获取成功:', profileData);
    res.json(profileData);
    
  } catch (error) {
    console.error('❌ 获取管理员个人资料失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取个人资料失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 获取数据统计
router.get('/data-stats', auth, async (req: AuthRequest, res) => {
  try {
    console.log('🔍 开始获取数据统计...');
    
    // 使用固定的平台提成率 (15%)
    const commissionRate = 0.15;

    console.log('📊 正在查询订单统计...');
    // 订单统计 - 使用JOIN避免子查询问题
    const [orderStats] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN o.status = 'completed' THEN 1 END) as completed,
        COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.amount ELSE 0 END), 0) as completedRevenue,
        COUNT(CASE WHEN ((u.name LIKE '%test%' OR u.name LIKE '%测试%') 
                        OR o.amount > 10000 OR o.amount < 1) THEN 1 END) as testOrders,
        COALESCE(SUM(CASE WHEN ((u.name LIKE '%test%' OR u.name LIKE '%测试%') 
                              OR o.amount > 10000 OR o.amount < 1) AND o.status = 'completed' THEN o.amount ELSE 0 END), 0) as testRevenue
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
    `);
    console.log('✅ 订单统计查询完成:', orderStats[0]);

    console.log('🎁 正在查询礼物统计...');
    // 礼物统计 - 使用JOIN避免子查询问题
    const [giftStats] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(g.total_price), 0) as totalRevenue,
        COUNT(CASE WHEN ((u.name LIKE '%test%' OR u.name LIKE '%测试%') 
                        OR g.total_price > 10000 OR g.total_price < 1) THEN 1 END) as testGifts,
        COALESCE(SUM(CASE WHEN ((u.name LIKE '%test%' OR u.name LIKE '%测试%') 
                              OR g.total_price > 10000 OR g.total_price < 1) THEN g.total_price ELSE 0 END), 0) as testRevenue
      FROM gift_records g
      LEFT JOIN users u ON g.user_id = u.id
    `);
    console.log('✅ 礼物统计查询完成:', giftStats[0]);

    console.log('💰 正在查询提现统计...');
    // 提现统计
    const [withdrawalStats] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(amount), 0) as totalAmount
      FROM withdrawals
    `);
    console.log('✅ 提现统计查询完成:', withdrawalStats[0]);

    // 获取实际平台利润
    const [actualProfitResult] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount * ? END), 0) as orderCommission,
        COALESCE((SELECT SUM(total_price * ?) FROM gift_records), 0) as giftCommission
    `, [commissionRate, commissionRate]);

    const orderRevenue = orderStats[0].completedRevenue;
    const giftRevenue = giftStats[0].totalRevenue;
    const theoreticalOrderCommission = orderRevenue * commissionRate;
    const theoreticalGiftCommission = giftRevenue * commissionRate;
    const theoreticalTotal = theoreticalOrderCommission + theoreticalGiftCommission;
    
    const actualOrderCommission = actualProfitResult[0].orderCommission;
    const actualGiftCommission = actualProfitResult[0].giftCommission;
    const actualTotal = actualOrderCommission + actualGiftCommission;
    
    const discrepancy = actualTotal - theoreticalTotal;

    res.json({
      success: true,
      stats: {
        orderStats: orderStats[0],
        giftStats: giftStats[0],
        withdrawalStats: withdrawalStats[0],
        revenueCalculation: {
          orderRevenue,
          giftRevenue,
          commissionRate,
          theoreticalOrderCommission,
          theoreticalGiftCommission,
          theoreticalTotal,
          actualTotal,
          discrepancy
        }
      }
    });
  } catch (error) {
    console.error('❌ 获取数据统计失败 - 详细错误信息:', error);
    console.error('❌ 错误堆栈:', error instanceof Error ? error.stack : '未知错误');
    res.status(500).json({ 
      success: false, 
      message: '获取数据统计失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 获取异常数据
router.get('/anomalous-data', auth, async (req: AuthRequest, res) => {
  try {
    // 异常订单
    const [anomalousOrders] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        o.order_id,
        o.amount,
        o.status,
        o.user_id,
        u.name as username,
        o.created_at,
        CASE 
          WHEN o.amount > 10000 THEN '金额过大'
          WHEN o.amount < 1 THEN '金额过小'
          WHEN u.name LIKE '%test%' OR u.name LIKE '%测试%' THEN '测试用户'
          ELSE '其他异常'
        END as issue
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.amount > 10000 OR o.amount < 1 
         OR u.name LIKE '%test%' OR u.name LIKE '%测试%'
      ORDER BY o.created_at DESC
      LIMIT 100
    `);

    // 异常礼物
    const [anomalousGifts] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        g.id,
        g.total_price,
        g.user_id,
        u.name as username,
        g.created_at,
        CASE 
          WHEN g.total_price > 10000 THEN '金额过大'
          WHEN g.total_price < 1 THEN '金额过小'
          WHEN u.name LIKE '%test%' OR u.name LIKE '%测试%' THEN '测试用户'
          ELSE '其他异常'
        END as issue
      FROM gift_records g
      LEFT JOIN users u ON g.user_id = u.id
      WHERE g.total_price > 10000 OR g.total_price < 1 
         OR u.name LIKE '%test%' OR u.name LIKE '%测试%'
      ORDER BY g.created_at DESC
      LIMIT 100
    `);

    // 异常提现
    const [anomalousWithdrawals] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        w.withdrawal_id as id,
        w.amount,
        w.player_id,
        p.name as player_name,
        w.created_at,
        CASE 
          WHEN w.amount > 50000 THEN '金额过大'
          WHEN w.amount < 10 THEN '金额过小'
          WHEN p.name LIKE '%test%' OR p.name LIKE '%测试%' THEN '测试陪玩'
          ELSE '其他异常'
        END as issue
      FROM withdrawals w
      LEFT JOIN players p ON w.player_id = p.id
      WHERE w.amount > 50000 OR w.amount < 10 
         OR p.name LIKE '%test%' OR p.name LIKE '%测试%'
      ORDER BY w.created_at DESC
      LIMIT 100
    `);

    res.json({
      success: true,
      anomalous: {
        orders: anomalousOrders,
        gifts: anomalousGifts,
        withdrawals: anomalousWithdrawals
      }
    });
  } catch (error) {
    console.error('获取异常数据失败:', error);
    res.status(500).json({ success: false, message: '获取异常数据失败' });
  }
});

// 清理数据
router.post('/cleanup-data', auth, async (req: AuthRequest, res) => {
  const { type } = req.body;
  
  if (!['orders', 'gifts', 'users', 'all'].includes(type)) {
    return res.status(400).json({ success: false, message: '无效的清理类型' });
  }

  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    let deletedCount = 0;

    if (type === 'orders' || type === 'all') {
      // 清理测试订单 - 使用JOIN避免子查询问题
      const [orderResult] = await connection.execute(`
        DELETE o FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        WHERE (u.name LIKE '%test%' OR u.name LIKE '%测试%')
           OR o.amount > 10000 
           OR o.amount < 1
      `);
      deletedCount += (orderResult as any).affectedRows;
    }

    if (type === 'gifts' || type === 'all') {
      // 清理测试礼物 - 使用JOIN避免子查询问题
      const [giftResult] = await connection.execute(`
        DELETE g FROM gift_records g
        LEFT JOIN users u ON g.user_id = u.id
        WHERE (u.name LIKE '%test%' OR u.name LIKE '%测试%')
           OR g.total_price > 10000 
           OR g.total_price < 1
      `);
      deletedCount += (giftResult as any).affectedRows;
    }

    if (type === 'users' || type === 'all') {
      // 清理测试用户相关数据
      // 先删除相关的订单和礼物 - 使用JOIN避免子查询问题
      await connection.execute(`
        DELETE o FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        WHERE u.name LIKE '%test%' OR u.name LIKE '%测试%'
      `);
      
      await connection.execute(`
        DELETE g FROM gift_records g
        LEFT JOIN users u ON g.user_id = u.id
        WHERE u.name LIKE '%test%' OR u.name LIKE '%测试%'
      `);
      
      // 删除测试用户
      const [userResult] = await connection.execute(`
        DELETE FROM users 
        WHERE name LIKE '%test%' OR name LIKE '%测试%'
      `);
      deletedCount += (userResult as any).affectedRows;

      // 清理测试陪玩 - 使用JOIN避免子查询问题
      await connection.execute(`
        DELETE w FROM withdrawals w
        LEFT JOIN players p ON w.player_id = p.id
        WHERE p.name LIKE '%test%' OR p.name LIKE '%测试%'
      `);
      
      const [playerResult] = await connection.execute(`
        DELETE FROM players 
        WHERE name LIKE '%test%' OR name LIKE '%测试%'
      `);
      deletedCount += (playerResult as any).affectedRows;
    }

    await connection.commit();
    
    res.json({
      success: true,
      message: '数据清理完成',
      deletedCount
    });
  } catch (error) {
    await connection.rollback();
    console.error('数据清理失败:', error);
    res.status(500).json({ success: false, message: '数据清理失败' });
  } finally {
    connection.release();
  }
});

// 测试路由
router.get('/test', (req, res) => {
  console.log('🔥 admin test 路由被调用');
  res.json({ success: true, message: 'admin test 路由工作正常' });
});

// 收入统计API
router.post('/income-stats', auth, async (req: AuthRequest, res) => {
  console.log('🔥 income-stats 接口被调用');
  console.log('请求参数:', req.body);
  console.log('用户信息:', req.user);
  try {
    const { type, userId, startDate, endDate } = req.body;
    
    // 验证参数
    if (!type || !userId || !startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少必要参数' 
      });
    }

    if (!['user', 'player'].includes(type)) {
      return res.status(400).json({ 
        success: false, 
        error: '无效的查询类型' 
      });
    }

    // 验证日期格式
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ 
        success: false, 
        error: '无效的日期格式' 
      });
    }

    // 设置结束日期为当天的23:59:59
    end.setHours(23, 59, 59, 999);

    let statsData: any = {
      orderCount: 0,
      giftCount: 0,
      giftTotal: 0
    };

    if (type === 'user') {
      // 查询用户消费统计
      // 获取用户信息
      const [userInfo] = await pool.execute<RowDataPacket[]>(
        'SELECT name FROM users WHERE id = ?',
        [userId]
      );

      if (userInfo.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: '用户不存在' 
        });
      }

      // 查询用户订单统计
      const [orderStats] = await pool.execute<RowDataPacket[]>(`
        SELECT 
          COUNT(*) as orderCount,
          COALESCE(SUM(amount), 0) as totalSpent
        FROM orders 
        WHERE user_id = ? 
          AND status = 'completed'
          AND created_at >= ? 
          AND created_at <= ?
      `, [userId, start, end]);

      // 查询用户礼物统计（只统计已结算的礼物）
      const [giftStats] = await pool.execute<RowDataPacket[]>(`
        SELECT 
          COUNT(*) as giftCount,
          COALESCE(SUM(total_price), 0) as giftTotal
        FROM gift_records 
        WHERE user_id = ? 
          AND is_settled = 1
          AND created_at >= ? 
          AND created_at <= ?
      `, [userId, start, end]);

      statsData = {
        userName: userInfo[0].name,
        totalSpent: (orderStats[0].totalSpent || 0) + (giftStats[0].giftTotal || 0),
        orderCount: orderStats[0].orderCount || 0,
        giftCount: giftStats[0].giftCount || 0,
        giftTotal: giftStats[0].giftTotal || 0
      };

    } else if (type === 'player') {
      // 查询陪玩收入统计
      // 获取陪玩信息
      const [playerInfo] = await pool.execute<RowDataPacket[]>(
        'SELECT name FROM players WHERE id = ?',
        [userId]
      );

      if (playerInfo.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: '陪玩不存在' 
        });
      }

      // 获取佣金率配置
      const [commissionConfig] = await pool.execute<RowDataPacket[]>(
        'SELECT order_commission_rate, gift_commission_rate FROM commission_config LIMIT 1'
      );

      const orderCommissionRate = commissionConfig.length > 0 ? 
        (commissionConfig[0].order_commission_rate || 10) / 100 : 0.10;
      const giftCommissionRate = commissionConfig.length > 0 ? 
        (commissionConfig[0].gift_commission_rate || 30) / 100 : 0.30;

      // 查询陪玩订单统计
      const [orderStats] = await pool.execute<RowDataPacket[]>(`
        SELECT 
          COUNT(*) as orderCount,
          COALESCE(SUM(amount), 0) as totalOrderAmount
        FROM orders 
        WHERE player_id = ? 
          AND status = 'completed'
          AND created_at >= ? 
          AND created_at <= ?
      `, [userId, start, end]);

      // 查询陪玩礼物统计（只统计已结算的礼物）
      const [giftStats] = await pool.execute<RowDataPacket[]>(`
        SELECT 
          COUNT(*) as giftCount,
          COALESCE(SUM(total_price), 0) as giftTotal
        FROM gift_records 
        WHERE player_id = ? 
          AND is_settled = 1
          AND created_at >= ? 
          AND created_at <= ?
      `, [userId, start, end]);

      const totalOrderAmount = orderStats[0].totalOrderAmount || 0;
      const totalGiftAmount = giftStats[0].giftTotal || 0;
      
      // 计算陪玩实际收入（扣除平台佣金）
      const orderEarnings = totalOrderAmount * (1 - orderCommissionRate);
      const giftEarnings = totalGiftAmount * (1 - giftCommissionRate);
      const totalEarned = orderEarnings + giftEarnings;

      statsData = {
        playerName: playerInfo[0].name,
        totalEarned: totalEarned,
        orderCount: orderStats[0].orderCount || 0,
        giftCount: giftStats[0].giftCount || 0,
        giftTotal: totalGiftAmount
      };
    }

    res.json({
      success: true,
      ...statsData
    });

  } catch (error) {
    console.error('获取收入统计失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取收入统计失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
});

export default router;