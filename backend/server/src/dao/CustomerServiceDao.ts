import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../db';

// 统一客服接口
export interface CustomerService {
  id: number;
  username: string;
  password: string;
  plain_passwd?: string; // 明文密码字段，用于支持明文密码登录
  phone: string;
  email: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'suspended';
  hourly_rate: number;
  total_earnings: number;
  current_month_earnings: number;
  available_balance: number;
  total_work_hours: number;
  total_work_days: number;
  current_month_hours: number;
  today_status: 'not_clocked' | 'clocked_in' | 'clocked_out';
  today_clock_in_time?: string;
  today_clock_out_time?: string;
  today_work_hours: number;
  last_login_time?: string;
  last_login_ip?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
}

export interface CustomerServiceBalanceLog {
  id: number;
  customer_service_id: number;
  amount: number;
  type: 'earning' | 'withdrawal' | 'adjustment' | 'bonus';
  description: string;
  balance_before: number;
  balance_after: number;
  created_at: string;
}

export interface CustomerServiceWithdrawal {
  id?: number;
  customer_service_id: number;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  description?: string;
  created_at?: Date;
  updated_at?: Date;
  processed_at?: Date;
  processed_by?: number;
  processed_by_name?: string;
  reject_reason?: string;
  approval_notes?: string;
  withdrawal_id?: string;
}

export interface CustomerServiceDailyEarning {
  id: number;
  customer_service_id: number;
  date: string;
  work_hours: number;
  hourly_rate: number;
  base_earnings: number;
  commission_earnings: number;
  bonus_earnings: number;
  total_earnings: number;
  clock_in_time?: string;
  clock_out_time?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerServiceStats {
  totalCustomerServices: number;
  activeCustomerServices: number;
  todayWorkingCount: number;
  totalEarnings: number;
  thisMonthEarnings: number;
  pendingWithdrawals: number;
}

export class CustomerServiceDao {
  /**
   * 创建新客服
   */
  static async createCustomerService(data: {
    username: string;
    password: string;
    plain_passwd?: string;
    phone: string;
    hourly_rate?: number;
    created_by?: number;
  }): Promise<number> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 检查用户名是否已存在
      const [existingUsers] = await connection.execute<RowDataPacket[]>(
        'SELECT id FROM customer_services_super_unified WHERE username = ?',
        [data.username]
      );
      
      if (existingUsers.length > 0) {
        throw new Error('用户名已存在');
      }
      
      // 检查手机号是否已存在
      const [existingPhones] = await connection.execute<RowDataPacket[]>(
        'SELECT id FROM customer_services_super_unified WHERE phone = ?',
        [data.phone]
      );
      
      if (existingPhones.length > 0) {
        throw new Error('手机号已存在');
      }
      
      // 插入新客服
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO customer_services_super_unified (
          username, password, plain_passwd, phone,
          hourly_rate, status, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'active', ?, NOW(), NOW())`,
        [
          data.username,
          data.password,
          data.plain_passwd || null,
          data.phone,
          data.hourly_rate || 20.00,
          data.created_by || null
        ]
      );
      
      await connection.commit();
      return result.insertId;
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 根据用户名查找客服
   */
  static async findByUsername(username: string): Promise<CustomerService | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM customer_services_super_unified WHERE username = ?',
      [username]
    );
    
    return rows.length > 0 ? rows[0] as CustomerService : null;
  }

  /**
   * 根据ID查找客服
   */
  static async findById(id: number): Promise<CustomerService | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM customer_services_super_unified WHERE id = ?',
      [id]
    );
    
    return rows.length > 0 ? rows[0] as CustomerService : null;
  }

  /**
   * 根据手机号查找客服
   */
  static async findByPhone(phone: string): Promise<CustomerService | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM customer_services_super_unified WHERE phone = ?',
      [phone]
    );
    
    return rows.length > 0 ? rows[0] as CustomerService : null;
  }

  /**
   * 更新客服最后登录信息
   */
  static async updateLastLogin(id: number, ip?: string): Promise<void> {
    await pool.execute(
      `UPDATE customer_services_super_unified 
       SET last_login_time = NOW(), last_login_ip = ?, updated_at = NOW() 
       WHERE id = ?`,
      [ip || null, id]
    );
  }

  /**
   * 分页获取客服列表
   */
  static async getCustomerServices(
    page: number = 1,
    pageSize: number = 20,
    status?: string,
    keyword?: string
  ): Promise<{ customerServices: CustomerService[]; total: number }> {
    let whereClause = '1=1';
    const params: any[] = [];
    
    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }
    
    if (keyword) {
      whereClause += ' AND (username LIKE ? OR phone LIKE ?)';
      const searchTerm = `%${keyword}%`;
      params.push(searchTerm, searchTerm);
    }
    
    // 获取总数
    const [countResult] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM customer_services_super_unified WHERE ${whereClause}`,
      params
    );
    const total = countResult[0].total;
    
    // 获取数据
    const offset = (page - 1) * pageSize;
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM customer_services_super_unified 
       WHERE ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT ${offset}, ${pageSize}`,
      params
    );
    
    return {
      customerServices: rows as CustomerService[],
      total
    };
  }

  /**
   * 更新客服信息
   */
  static async updateCustomerService(
    id: number,
    updates: Partial<Pick<CustomerService, 'phone' | 'status' | 'hourly_rate'>>
  ): Promise<void> {
    const fields = Object.keys(updates).filter(key => updates[key as keyof typeof updates] !== undefined);
    if (fields.length === 0) return;
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updates[field as keyof typeof updates]);
    
    await pool.execute(
      `UPDATE customer_services_super_unified SET ${setClause}, updated_at = NOW() WHERE id = ?`,
      [...values, id]
    );
  }



  /**
   * 删除客服
   */
  static async deleteCustomerService(id: number): Promise<void> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 首先检查客服是否存在
      const [customerService] = await connection.execute<RowDataPacket[]>(
        'SELECT id FROM customer_services_super_unified WHERE id = ?',
        [id]
      );
      
      if (customerService.length === 0) {
        throw new Error('客服不存在');
      }
      
      // 删除相关数据 - 使用正确的表名和字段名
      // 删除历史记录
      await connection.execute('DELETE FROM customer_service_history_logs WHERE customer_service_id = ?', [id]);
      
      // 删除提现记录（如果使用统一的withdrawals表）
      try {
        await connection.execute('DELETE FROM withdrawals WHERE customer_service_id = ? AND user_type = ?', [id, 'customer_service']);
      } catch (err) {
        console.log('withdrawals 表不存在或字段不匹配，跳过删除');
      }
      
      // 删除其他可能存在的相关记录
      try {
        await connection.execute('DELETE FROM customer_service_daily_earnings WHERE customer_service_id = ?', [id]);
      } catch (err) {
        console.log('customer_service_daily_earnings 表不存在，跳过删除');
      }
      
      try {
        await connection.execute('DELETE FROM attendance_records WHERE customer_service_id = ?', [id]);
      } catch (err) {
        console.log('attendance_records 表不存在，跳过删除');
      }
      
      // 删除客服主记录
      await connection.execute('DELETE FROM customer_services_super_unified WHERE id = ?', [id]);
      
      await connection.commit();
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 更新客服余额
   */
  static async updateBalance(
    customerServiceId: number,
    amount: number,
    type: 'earning' | 'withdrawal' | 'adjustment' | 'bonus',
    description: string
  ): Promise<void> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 获取当前余额
      const [customerService] = await connection.execute<RowDataPacket[]>(
        'SELECT available_balance FROM customer_services_super_unified WHERE id = ?',
        [customerServiceId]
      );
      
      if (customerService.length === 0) {
        throw new Error('客服不存在');
      }
      
      const currentBalance = customerService[0].available_balance || 0;
      const newBalance = currentBalance + amount;
      
      if (newBalance < 0) {
        throw new Error('余额不足');
      }
      
      // 更新余额
      await connection.execute(
        'UPDATE customer_services_super_unified SET available_balance = ?, updated_at = NOW() WHERE id = ?',
        [newBalance, customerServiceId]
      );
      
      // 记录余额变动日志到历史记录表
      await connection.execute(
        `INSERT INTO customer_service_history_logs (
          customer_service_id, action_type, action_date, action_time,
          balance_before, balance_after, amount, description
        ) VALUES (?, 'balance_change', CURDATE(), NOW(), ?, ?, ?, ?)`,
        [customerServiceId, currentBalance, newBalance, amount, description]
      );
      
      await connection.commit();
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 获取客服余额日志
   */
  static async getBalanceLogs(
    customerServiceId: number,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ logs: CustomerServiceBalanceLog[]; total: number }> {
    // 获取总数
    const [countResult] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM customer_service_history_logs WHERE customer_service_id = ? AND action_type = ?',
      [customerServiceId, 'balance_change']
    );
    const total = countResult[0].total;
    
    // 获取数据
    const offset = (page - 1) * pageSize;
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        id,
        customer_service_id,
        amount,
        'balance_change' as type,
        description,
        balance_before,
        balance_after,
        action_time as created_at
       FROM customer_service_history_logs 
       WHERE customer_service_id = ? AND action_type = ?
       ORDER BY action_time DESC 
       LIMIT ${offset}, ${pageSize}`,
      [customerServiceId, 'balance_change']
    );
    
    return {
      logs: rows as CustomerServiceBalanceLog[],
      total
    };
  }

  /**
   * 创建提现申请
   */
  static async createWithdrawal(data: {
    customer_service_id: number;
    amount: number;
    description?: string;
    alipay_account?: string;
  }): Promise<string> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 检查余额
      const [customerService] = await connection.execute<RowDataPacket[]>(
        'SELECT available_balance FROM customer_services_super_unified WHERE id = ?',
        [data.customer_service_id]
      );
      
      if (customerService.length === 0) {
        throw new Error('客服不存在');
      }
      
      const availableBalance = customerService[0].available_balance || 0;
      if (availableBalance < data.amount) {
        throw new Error('余额不足');
      }

      // 防重复提交：检查是否在5分钟内有相同金额的待审核提现申请
      const [duplicateCheck] = await connection.execute<RowDataPacket[]>(
        `SELECT COUNT(*) as count FROM withdrawals 
         WHERE customer_service_id = ? 
         AND amount = ? 
         AND status = '待审核' 
         AND user_type = 'customer_service'
         AND created_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)`,
        [data.customer_service_id, data.amount]
      );
      
      if (duplicateCheck[0].count > 0) {
        throw new Error('请勿重复提交相同金额的提现申请，请等待5分钟后再试');
      }
      
      // 注意：不在申请时扣款，而是在管理员批准时才扣款
      
      // 生成提现单号
      const withdrawalId = `WD${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      
      // 创建提现申请到统一的withdrawals表
      // 注意：final_amount是生成列，不能直接插入，它会自动计算为 (amount - platform_fee)
      await connection.execute(
        `INSERT INTO withdrawals (
          withdrawal_id, user_type, customer_service_id, amount, 
          platform_fee, alipay_account, status, notes, created_at, updated_at
        ) VALUES (?, 'customer_service', ?, ?, ?, ?, '待审核', ?, NOW(), NOW())`,
        [withdrawalId, data.customer_service_id, data.amount, 0, data.alipay_account || null, data.description || null]
      );
      
      await connection.commit();
      return withdrawalId;
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 获取提现记录
   */
  static async getWithdrawals(
    customerServiceId?: number,
    page: number = 1,
    pageSize: number = 20,
    status?: string
  ): Promise<{ withdrawals: CustomerServiceWithdrawal[]; total: number }> {
    let whereClause = "user_type = 'customer_service'";
    const params: any[] = [];
    
    if (customerServiceId) {
      whereClause += ' AND customer_service_id = ?';
      params.push(customerServiceId);
    }
    
    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }
    
    // 获取总数 - withdrawal_id 是主键，不会有重复
    const [countResult] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM withdrawals WHERE ${whereClause}`,
      params
    );
    
    const total = countResult[0].total;
    
    // 获取数据 - withdrawal_id 是主键，直接查询即可
    const offset = (page - 1) * pageSize;
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM withdrawals 
       WHERE ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT ${offset}, ${pageSize}`,
      params
    );
    
    return {
      withdrawals: rows as CustomerServiceWithdrawal[],
      total
    };
  }

  /**
   * 处理提现申请
   */
  static async processWithdrawal(
    withdrawalId: string,
    action: 'approve' | 'reject',
    processedBy: number,
    processedByName: string,
    notes?: string
  ): Promise<void> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 获取提现申请信息
      const [withdrawal] = await connection.execute<RowDataPacket[]>(
        "SELECT * FROM withdrawals WHERE withdrawal_id = ? AND user_type = 'customer_service'",
        [withdrawalId]
      );
      
      if (withdrawal.length === 0) {
        throw new Error('提现申请不存在');
      }
      
      const withdrawalData = withdrawal[0];
      
      if (withdrawalData.status !== '待审核') {
        throw new Error('该提现申请已被处理');
      }
      
      if (action === 'approve') {
        // 审核通过，现在才扣除余额
        // 先检查余额是否充足
        const [customerService] = await connection.execute<RowDataPacket[]>(
          'SELECT available_balance FROM customer_services_super_unified WHERE id = ?',
          [withdrawalData.customer_service_id]
        );
        
        if (customerService.length === 0) {
          throw new Error('客服不存在');
        }
        
        if (customerService[0].available_balance < withdrawalData.amount) {
          throw new Error('余额不足，无法批准提现申请');
        }
        
        // 扣除余额
        await connection.execute(
          'UPDATE customer_services_super_unified SET available_balance = available_balance - ? WHERE id = ?',
          [withdrawalData.amount, withdrawalData.customer_service_id]
        );
        
        // 更新提现状态
        await connection.execute(
          `UPDATE withdrawals 
           SET status = '已通过', processed_by = ?, processed_by_name = ?, 
               processed_at = NOW(), approval_notes = ?, updated_at = NOW()
           WHERE withdrawal_id = ? AND user_type = 'customer_service'`,
          [processedBy, processedByName, notes || null, withdrawalId]
        );
      } else {
        // 审核拒绝，由于申请时没有扣款，所以不需要退还资金
        await connection.execute(
          `UPDATE withdrawals 
           SET status = '已拒绝', processed_by = ?, processed_by_name = ?, 
               processed_at = NOW(), reject_reason = ?, updated_at = NOW()
           WHERE withdrawal_id = ? AND user_type = 'customer_service'`,
          [processedBy, processedByName, notes || null, withdrawalId]
        );
      }
      
      await connection.commit();
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 获取客服每日收入记录
   */
  static async getDailyEarnings(
    customerServiceId: number,
    startDate?: string,
    endDate?: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ earnings: CustomerServiceDailyEarning[]; total: number }> {
    let whereClause = 'customer_service_id = ?';
    const params: any[] = [customerServiceId];
    
    if (startDate) {
      whereClause += ' AND date >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      whereClause += ' AND date <= ?';
      params.push(endDate);
    }
    
    // 获取总数
    const [countResult] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM customer_service_daily_earnings WHERE ${whereClause}`,
      params
    );
    const total = countResult[0].total;
    
    // 获取数据 - 使用 LIMIT offset, count 语法
    const offset = (page - 1) * pageSize;
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM customer_service_daily_earnings 
       WHERE ${whereClause} 
       ORDER BY date DESC 
       LIMIT ${offset}, ${pageSize}`,
      params
    );
    
    return {
      earnings: rows as CustomerServiceDailyEarning[],
      total
    };
  }

  /**
   * 获取客服收入概览
   */
  static async getEarningsOverview(customerServiceId: number): Promise<{
    totalEarnings: number;
    currentMonthEarnings: number;
    availableBalance: number;
    pendingWithdrawals: number;
  }> {
    // 获取客服基本信息
    const [customerService] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM customer_services_super_unified WHERE id = ?',
      [customerServiceId]
    );
    
    if (customerService.length === 0) {
      throw new Error('客服不存在');
    }
    
    const cs = customerService[0];
    
    // 获取待处理提现金额
    const [pendingResult] = await pool.execute<RowDataPacket[]>(
      'SELECT COALESCE(SUM(amount), 0) as pending FROM withdrawals WHERE customer_service_id = ? AND user_type = ? AND status = ?',
      [customerServiceId, 'customer_service', '待审核']
    );
    
    return {
      totalEarnings: cs.total_earnings || 0,
      currentMonthEarnings: cs.current_month_earnings || 0,
      availableBalance: cs.available_balance || 0,
      pendingWithdrawals: pendingResult[0].pending || 0
    };
  }

  /**
   * 获取客服统计信息
   */
  static async getCustomerServiceStats(): Promise<CustomerServiceStats> {
    // 总客服数和活跃客服数
    const [countResult] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN today_status = 'clocked_in' THEN 1 END) as working
       FROM customer_services_super_unified`
    );
    
    // 总收入
    const [statsResult] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COALESCE(SUM(total_earnings), 0) as totalEarnings,
        COALESCE(SUM(current_month_earnings), 0) as thisMonthEarnings
       FROM customer_services_super_unified`
    );
    
    // 待处理提现金额
    const [withdrawalResult] = await pool.execute<RowDataPacket[]>(
      'SELECT COALESCE(SUM(amount), 0) as pending FROM withdrawals WHERE user_type = ? AND status = ?',
      ['customer_service', '待审核']
    );
    
    return {
      totalCustomerServices: countResult[0].total,
      activeCustomerServices: countResult[0].active,
      todayWorkingCount: countResult[0].working,
      totalEarnings: statsResult[0].totalEarnings,
      thisMonthEarnings: statsResult[0].thisMonthEarnings,
      pendingWithdrawals: withdrawalResult[0].pending
    };
  }

  /**
   * 批量更新客服时薪
   */
  static async batchUpdateHourlyRate(hourlyRate: number, customerServiceIds?: number[]): Promise<void> {
    let sql = 'UPDATE customer_services_super_unified SET hourly_rate = ?, updated_at = NOW()';
    const params: any[] = [hourlyRate];
    
    if (customerServiceIds && customerServiceIds.length > 0) {
      sql += ` WHERE id IN (${customerServiceIds.map(() => '?').join(',')})`;
      params.push(...customerServiceIds);
    }
    
    await pool.execute(sql, params);
  }

  /**
   * 更新客服密码
   */
  static async updatePassword(customerServiceId: number, hashedPassword: string, plainPassword?: string): Promise<void> {
    if (plainPassword) {
      // 同时更新加密密码和明文密码字段
      await pool.execute(
        'UPDATE customer_services_super_unified SET password = ?, plain_passwd = ?, updated_at = NOW() WHERE id = ?',
        [hashedPassword, plainPassword, customerServiceId]
      );
    } else {
      // 只更新加密密码字段
      await pool.execute(
        'UPDATE customer_services_super_unified SET password = ?, updated_at = NOW() WHERE id = ?',
        [hashedPassword, customerServiceId]
      );
    }
  }

  /**
   * 获取客服权限
   */
  static async getCustomerServicePermissions(customerServiceId: number): Promise<{ permission_key: string }[]> {
    // 暂时返回空数组，因为新系统中权限管理可能需要重新设计
    return [];
  }

  /**
   * 分页获取所有客服列表 (兼容旧接口名称)
   */
  static async findAllCustomerServices(
    page: number = 1,
    pageSize: number = 20,
    status?: string,
    keyword?: string
  ): Promise<{ customerServices: CustomerService[]; total: number }> {
    return this.getCustomerServices(page, pageSize, status, keyword);
  }

  /**
   * 根据用户名查找客服 (兼容旧接口)
   */
  static async findCustomerServiceByUsername(username: string): Promise<CustomerService | null> {
    return this.findByUsername(username);
  }

  /**
   * 根据ID查找客服 (兼容旧接口)
   */
  static async findCustomerServiceById(id: number): Promise<CustomerService | null> {
    return this.findById(id);
  }

  /**
   * 更新客服状态
   */
  static async updateCustomerServiceStatus(id: number, status: 'active' | 'inactive' | 'suspended'): Promise<void> {
    // 首先检查客服是否存在
    const [customerService] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM customer_services_super_unified WHERE id = ?',
      [id]
    );
    
    if (customerService.length === 0) {
      throw new Error('客服不存在');
    }
    
    // 更新客服状态
    await pool.execute(
      'UPDATE customer_services_super_unified SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );
  }

  /**
   * 添加客服权限 (兼容旧接口)
   */
  static async addCustomerServicePermission(
    customerServiceId: number,
    permissionKey: string,
    permissionName: string,
    createdBy?: number
  ): Promise<void> {
    // 暂时不实现，因为新系统中权限管理可能需要重新设计
    console.log(`添加客服权限: ${customerServiceId} - ${permissionKey}`);
  }

  /**
   * 移除客服权限 (兼容旧接口)
   */
  static async removeCustomerServicePermission(
    customerServiceId: number,
    permissionKey: string
  ): Promise<void> {
    // 暂时不实现，因为新系统中权限管理可能需要重新设计
    console.log(`移除客服权限: ${customerServiceId} - ${permissionKey}`);
  }

  /**
   * 检查客服是否有特定权限 (兼容旧接口)
   */
  static async hasCustomerServicePermission(
    customerServiceId: number,
    permissionKey: string
  ): Promise<boolean> {
    // 暂时返回 true，因为新系统中权限管理可能需要重新设计
    return true;
  }

  /**
   * 获取薪资设置 (兼容旧接口)
   */
  static async getSalarySettings(page: number = 1, pageSize: number = 20): Promise<{
    salaries: any[];
    total: number;
  }> {
    const result = await this.getCustomerServices(page, pageSize);
    return {
      salaries: result.customerServices.map(cs => ({
        id: cs.id,
        customer_service_id: cs.id,
        username: cs.username,
        hourly_rate: cs.hourly_rate,
        total_earnings: cs.total_earnings,
        current_month_earnings: cs.current_month_earnings,
        status: cs.status
      })),
      total: result.total
    };
  }

  /**
   * 更新客服薪资 (兼容旧接口)
   */
  static async updateCustomerServiceSalary(
    customerServiceId: number,
    hourlyRate: number,
    minimumSettlementHours?: number
  ): Promise<void> {
    await pool.execute(
      'UPDATE customer_services_super_unified SET hourly_rate = ?, updated_at = NOW() WHERE id = ?',
      [hourlyRate, customerServiceId]
    );
  }

  /**
   * 获取客服薪资信息 (兼容旧接口)
   */
  static async getCustomerServiceSalary(customerServiceId: number): Promise<any> {
    const customerService = await this.findById(customerServiceId);
    if (!customerService) {
      throw new Error('客服不存在');
    }
    
    return {
      id: customerService.id,
      customer_service_id: customerService.id,
      username: customerService.username,
      hourly_rate: customerService.hourly_rate,
      total_earnings: customerService.total_earnings,
      current_month_earnings: customerService.current_month_earnings,
      status: customerService.status
    };
  }
}