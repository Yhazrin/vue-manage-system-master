/**
 * 收益同步服务
 * 负责将每日收益同步到客服的总收益和余额中
 */

import { pool } from '../db';
import { RowDataPacket } from 'mysql2';

export class EarningsSync {
  
  /**
   * 同步单个客服的收益到总收益和余额
   */
  static async syncCustomerServiceEarnings(customerServiceId: number): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 1. 获取客服当前信息
      const [customerServiceInfo] = await connection.execute<RowDataPacket[]>(
        'SELECT id, username, total_earnings, available_balance, current_month_earnings FROM customer_services_super_unified WHERE id = ?',
        [customerServiceId]
      );
      
      if (customerServiceInfo.length === 0) {
        return { success: false, message: '客服不存在' };
      }
      
      const customerService = customerServiceInfo[0];
      
      // 2. 计算每日收益总和
      const [dailyEarningsSum] = await connection.execute<RowDataPacket[]>(`
        SELECT 
          COALESCE(SUM(total_earnings), 0) as total_daily_earnings,
          COALESCE(SUM(CASE WHEN DATE_FORMAT(date, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m') THEN total_earnings ELSE 0 END), 0) as current_month_earnings,
          COUNT(*) as work_days
        FROM customer_service_daily_earnings 
        WHERE customer_service_id = ?
      `, [customerServiceId]);
      
      const calculatedTotalEarnings = parseFloat(dailyEarningsSum[0].total_daily_earnings);
      const calculatedMonthEarnings = parseFloat(dailyEarningsSum[0].current_month_earnings);
      const workDays = dailyEarningsSum[0].work_days;
      
      // 3. 计算需要同步的收益差额
      const earningsDiff = calculatedTotalEarnings - parseFloat(customerService.total_earnings);
      
      // 4. 更新客服的总收益、本月收益和可用余额
      await connection.execute(`
        UPDATE customer_services_super_unified 
        SET 
          total_earnings = ?,
          current_month_earnings = ?,
          available_balance = available_balance + ?,
          updated_at = NOW()
        WHERE id = ?
      `, [
        calculatedTotalEarnings,
        calculatedMonthEarnings,
        earningsDiff,
        customerServiceId
      ]);
      
      // 5. 记录余额变动日志（如果有收益增加）
      if (earningsDiff > 0) {
        try {
          await connection.execute(`
            INSERT INTO customer_service_balance_logs (
              admin_id, admin_name, amount, type, description, 
              balance_before, balance_after, created_at
            ) VALUES (?, ?, ?, 'earning', ?, ?, ?, NOW())
          `, [
            customerServiceId,
            customerService.username,
            earningsDiff,
            `收益同步：同步${workDays}天工作收益到余额`,
            parseFloat(customerService.available_balance),
            parseFloat(customerService.available_balance) + earningsDiff
          ]);
        } catch (logError) {
          // 如果余额日志记录失败，不影响主要的收益同步
          console.warn('余额日志记录失败:', logError.message);
        }
      }
      
      await connection.commit();
      
      console.log(`✅ 客服 ${customerService.username} 收益同步完成: +¥${earningsDiff}`);
      
      return {
        success: true,
        message: '收益同步成功',
        data: {
          customerServiceId,
          username: customerService.username,
          earningsDiff,
          totalEarnings: calculatedTotalEarnings,
          currentMonthEarnings: calculatedMonthEarnings,
          workDays
        }
      };
      
    } catch (error) {
      await connection.rollback();
      console.error('收益同步失败:', error);
      return { success: false, message: `收益同步失败: ${error.message}` };
    } finally {
      connection.release();
    }
  }
  
  /**
   * 同步所有客服的收益
   */
  static async syncAllCustomerServiceEarnings(): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    const connection = await pool.getConnection();
    
    try {
      // 获取所有活跃客服
      const [customerServices] = await connection.execute<RowDataPacket[]>(
        'SELECT id, username FROM customer_services_super_unified WHERE status = "active"'
      );
      
      const results = [];
      let successCount = 0;
      let failCount = 0;
      
      for (const cs of customerServices) {
        const result = await this.syncCustomerServiceEarnings(cs.id);
        results.push({
          customerServiceId: cs.id,
          username: cs.username,
          success: result.success,
          message: result.message,
          data: result.data
        });
        
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      }
      
      return {
        success: true,
        message: `批量同步完成: 成功${successCount}个，失败${failCount}个`,
        data: {
          totalCount: customerServices.length,
          successCount,
          failCount,
          results
        }
      };
      
    } catch (error) {
      console.error('批量收益同步失败:', error);
      return { success: false, message: `批量收益同步失败: ${error.message}` };
    } finally {
      connection.release();
    }
  }
  
  /**
   * 实时同步收益（在打卡下班时调用）
   */
  static async syncEarningsOnClockOut(customerServiceId: number, workHours: number, hourlyRate: number, date: string): Promise<void> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 1. 计算本次收益
      const earnings = Math.round(workHours * hourlyRate * 100) / 100;
      
      // 2. 更新客服的总收益和余额
      await connection.execute(`
        UPDATE customer_services_super_unified 
        SET 
          total_earnings = total_earnings + ?,
          current_month_earnings = CASE 
            WHEN DATE_FORMAT(NOW(), '%Y-%m') = DATE_FORMAT(updated_at, '%Y-%m') 
            THEN current_month_earnings + ?
            ELSE ?
          END,
          available_balance = available_balance + ?,
          updated_at = NOW()
        WHERE id = ?
      `, [earnings, earnings, earnings, earnings, customerServiceId]);
      
      // 3. 获取客服信息用于日志
      const [customerServiceInfo] = await connection.execute<RowDataPacket[]>(
        'SELECT username, available_balance FROM customer_services_super_unified WHERE id = ?',
        [customerServiceId]
      );
      
      if (customerServiceInfo.length > 0) {
        const customerService = customerServiceInfo[0];
        
        // 4. 记录余额变动日志
        try {
          await connection.execute(`
            INSERT INTO customer_service_balance_logs (
              admin_id, admin_name, amount, type, description, 
              balance_before, balance_after, created_at
            ) VALUES (?, ?, ?, 'earning', ?, ?, ?, NOW())
          `, [
            customerServiceId,
            customerService.username,
            earnings,
            `工作收益：${date} 工作${workHours}小时`,
            parseFloat(customerService.available_balance) - earnings,
            parseFloat(customerService.available_balance)
          ]);
        } catch (logError) {
          console.warn('余额日志记录失败:', logError.message);
        }
      }
      
      await connection.commit();
      console.log(`✅ 实时收益同步完成: 客服${customerServiceId} +¥${earnings}`);
      
    } catch (error) {
      await connection.rollback();
      console.error('实时收益同步失败:', error);
    } finally {
      connection.release();
    }
  }
}