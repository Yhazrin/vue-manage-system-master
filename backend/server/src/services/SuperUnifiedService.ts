/**
 * 超级统一客服服务 - 专为单表设计的简化服务
 * 所有操作都在一个表中完成，无需复杂的数据同步
 */

import mysql from 'mysql2/promise';

export class SuperUnifiedService {
  private static connection: mysql.Connection;

  // 初始化数据库连接
  static async init() {
    if (!this.connection) {
      this.connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || 'YHZ@yhz050401',
        database: process.env.DB_NAME || 'author_center',
        charset: 'utf8mb4'
      });
    }
    return this.connection;
  }

  /**
   * 客服上班打卡
   */
  static async clockIn(customerId: number): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const connection = await this.init();
      const clockInTime = new Date();

      // 检查是否已经打卡 - 重新启用一天只能打卡一次的限制
      const [existing] = await connection.execute(`
        SELECT today_status FROM customer_services_super_unified 
        WHERE id = ? AND today_status != 'not_clocked'
      `, [customerId]);

      if ((existing as any[]).length > 0) {
        return { success: false, message: '今日已经打卡，无需重复打卡' };
      }

      // 执行上班打卡
      await connection.execute(`
        UPDATE customer_services_super_unified 
        SET 
          today_status = 'clocked_in',
          today_clock_in_time = ?,
          today_clock_out_time = NULL,
          today_work_hours = 0.00,
          today_base_earnings = 0.00,
          today_total_earnings = 0.00,
          is_online = TRUE,
          updated_at = NOW()
        WHERE id = ?
      `, [clockInTime, customerId]);

      // 记录历史日志 - 创建一条记录，只填充上班时间
      await connection.execute(`
        INSERT INTO customer_service_history_logs (
          customer_service_id, action_type, action_date, action_time,
          clock_in_time, clock_out_time, work_hours, hourly_rate,
          base_earnings, total_earnings, description
        ) VALUES (?, 'clock_in', CURDATE(), ?, ?, NULL, 0, 
                  (SELECT hourly_rate FROM customer_services_super_unified WHERE id = ?), 
                  0, 0, '客服上班打卡')
      `, [customerId, clockInTime, clockInTime, customerId]);

      return {
        success: true,
        message: '上班打卡成功',
        data: { clockInTime }
      };

    } catch (error) {
      console.error('上班打卡失败:', error);
      return { success: false, message: `上班打卡失败: ${error.message}` };
    }
  }

  /**
   * 客服下班打卡（自动计算收益）
   */
  static async clockOut(customerId: number): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const connection = await this.init();
      const clockOutTime = new Date();

      // 获取客服信息
      const [customerInfo] = await connection.execute(`
        SELECT 
          today_clock_in_time, hourly_rate, available_balance, 
          total_earnings, current_month_earnings
        FROM customer_services_super_unified 
        WHERE id = ? AND today_status = 'clocked_in'
      `, [customerId]);

      if ((customerInfo as any[]).length === 0) {
        return { success: false, message: '未找到有效的上班打卡记录' };
      }

      const customer = (customerInfo as any[])[0];
      const clockInTime = new Date(customer.today_clock_in_time);
      
      // 计算工作时长（小时）- 精确到分钟级别
      const workMilliseconds = clockOutTime.getTime() - clockInTime.getTime();
      const workHours = Math.round(workMilliseconds / (1000 * 60)) / 60; // 先转换为分钟再除以60，避免秒级误差
      
      // 计算收益
      const hourlyRate = parseFloat(customer.hourly_rate);
      const baseEarnings = Math.round(workHours * hourlyRate * 100) / 100;
      const totalEarnings = baseEarnings; // 可以后续添加提成和奖金

      // 一次性更新所有相关数据
      await connection.execute(`
        UPDATE customer_services_super_unified 
        SET 
          -- 今日状态
          today_status = 'clocked_out',
          today_clock_out_time = ?,
          today_work_hours = ?,
          today_base_earnings = ?,
          today_total_earnings = ?,
          
          -- 余额更新
          available_balance = available_balance + ?,
          total_earnings = total_earnings + ?,
          current_month_earnings = current_month_earnings + ?,
          
          -- 状态更新
          is_online = FALSE,
          updated_at = NOW()
        WHERE id = ?
      `, [
        clockOutTime, workHours, baseEarnings, totalEarnings,
        totalEarnings, totalEarnings, totalEarnings,
        customerId
      ]);

      // 确保数值类型转换
      const balanceBefore = parseFloat(customer.available_balance) || 0;
      const balanceAfter = balanceBefore + totalEarnings;

      // 先检查是否存在今日的上班打卡记录
      const [existingRecord] = await connection.execute(`
        SELECT id FROM customer_service_history_logs 
        WHERE customer_service_id = ? 
          AND action_type = 'clock_in' 
          AND action_date = CURDATE()
          AND clock_out_time IS NULL
      `, [customerId]);

      if ((existingRecord as any[]).length === 0) {
        // 如果没有找到记录，创建一条新的考勤记录
        await connection.execute(`
          INSERT INTO customer_service_history_logs (
            customer_service_id, action_type, action_date, action_time,
            clock_in_time, clock_out_time, work_hours, hourly_rate,
            base_earnings, total_earnings, balance_before, balance_after, amount, description
          ) VALUES (?, 'clock_out', CURDATE(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          customerId, clockOutTime, clockInTime, clockOutTime, workHours, hourlyRate,
          baseEarnings, totalEarnings, balanceBefore, balanceAfter, totalEarnings,
          `客服完整考勤记录，工作${workHours.toFixed(2)}小时，获得收益¥${totalEarnings.toFixed(2)}`
        ]);
      } else {
        // 更新现有的考勤记录
        await connection.execute(`
          UPDATE customer_service_history_logs 
          SET 
            action_type = 'clock_out',
            clock_out_time = ?,
            work_hours = ?,
            base_earnings = ?,
            total_earnings = ?,
            balance_before = ?,
            balance_after = ?,
            amount = ?,
            description = ?,
            action_time = ?
          WHERE customer_service_id = ? 
            AND action_type = 'clock_in' 
            AND action_date = CURDATE()
            AND clock_out_time IS NULL
        `, [
          clockOutTime, workHours, baseEarnings, totalEarnings,
          balanceBefore, balanceAfter, totalEarnings,
          `客服下班打卡，工作${workHours.toFixed(2)}小时，获得收益¥${totalEarnings.toFixed(2)}`,
          clockOutTime, customerId
        ]);
      }

      return {
        success: true,
        message: '下班打卡成功',
        data: {
          clockInTime,
          clockOutTime,
          workHours,
          hourlyRate,
          baseEarnings,
          totalEarnings,
          newBalance: customer.available_balance + totalEarnings
        }
      };

    } catch (error) {
      console.error('下班打卡失败:', error);
      return { success: false, message: `下班打卡失败: ${error.message}` };
    }
  }

  /**
   * 获取客服完整信息
   */
  static async getCustomerServiceInfo(customerId: number): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const connection = await this.init();

      const [customerInfo] = await connection.execute(`
        SELECT * FROM customer_services_super_unified WHERE id = ?
      `, [customerId]);

      if ((customerInfo as any[]).length === 0) {
        return { success: false, message: '客服不存在' };
      }

      return {
        success: true,
        data: (customerInfo as any[])[0]
      };

    } catch (error) {
      console.error('获取客服信息失败:', error);
      return { success: false, message: `获取客服信息失败: ${error.message}` };
    }
  }

  /**
   * 获取客服历史记录
   */
  static async getCustomerServiceHistory(customerId: number, limit: number = 50): Promise<{ success: boolean; data?: any[]; message?: string }> {
    try {
      const connection = await this.init();

      // 查询历史记录并格式化数据
      const [history] = await connection.execute(`
        SELECT 
          id,
          customer_service_id,
          action_type,
          action_date,
          action_time,
          clock_in_time,
          clock_out_time,
          work_hours,
          hourly_rate,
          base_earnings,
          total_earnings,
          amount,
          description,
          DATE(action_date) as date
        FROM customer_service_history_logs 
        WHERE customer_service_id = ? 
        ORDER BY action_time DESC 
        LIMIT ${limit}
      `, [customerId]);

      // 格式化数据以匹配前端期望的格式
      const formattedHistory = (history as any[]).map(record => ({
        id: record.id,
        customer_service_id: record.customer_service_id,
        customer_service_name: '', // 可以后续从客服表中获取
        clock_in_time: record.clock_in_time,
        clock_out_time: record.clock_out_time,
        work_hours: record.work_hours || 0,
        date: record.date || record.action_date, // 确保有日期字段
        status: record.clock_out_time ? 'clocked_out' : (record.clock_in_time ? 'clocked_in' : 'not_clocked'),
        earnings: record.total_earnings || 0,
        hourly_rate: record.hourly_rate,
        available_balance: 0, // 历史记录中不需要实时余额
        total_earnings: record.total_earnings || 0
      }));

      return {
        success: true,
        data: formattedHistory
      };

    } catch (error) {
      console.error('获取客服历史失败:', error);
      return { success: false, message: `获取客服历史失败: ${error.message}` };
    }
  }

  // processWithdrawal方法已移除，避免重复提现申请
  // 请使用 /customer-service/withdrawal 接口进行提现申请

  /**
   * 获取所有客服列表
   */
  static async getAllCustomerServices(): Promise<{ success: boolean; data?: any[]; message?: string }> {
    try {
      const connection = await this.init();

      const [customerServices] = await connection.execute(`
        SELECT 
          id, username, phone, status, is_online, plain_passwd,
          hourly_rate, available_balance, total_earnings, current_month_earnings,
          today_status, today_clock_in_time, today_work_hours, today_total_earnings,
          last_login_time, created_at, updated_at
        FROM customer_services_super_unified 
        ORDER BY id
      `);

      return {
        success: true,
        data: customerServices as any[]
      };

    } catch (error) {
      console.error('获取客服列表失败:', error);
      return { success: false, message: `获取客服列表失败: ${error.message}` };
    }
  }

  // 重置方法已移除 - 生产环境不提供手动重置功能
  // 数据重置应通过定时任务或数据库脚本自动执行
}

export default SuperUnifiedService;