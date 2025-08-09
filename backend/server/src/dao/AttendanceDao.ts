import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../db';
import { EarningsSync } from './EarningsSync';

export interface AttendanceRecord {
  id?: number;
  customer_service_id: number;
  customer_service_name: string;
  date: string;
  clock_in_time?: string;
  clock_out_time?: string;
  work_hours?: number;
  status: 'clocked_in' | 'clocked_out' | 'not_clocked';
  created_at?: Date;
  updated_at?: Date;
}

export interface AttendanceStats {
  todayStatus: string;
  todayWorkHours: number;
}

export class AttendanceDao {
  /**
   * 客服打卡上班 - 使用customer_services_super_unified表
   */
  static async clockIn(customerServiceId: number, customerServiceName?: string): Promise<{ success: boolean; message: string; data?: any }> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 获取客服信息
      const [customerService] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM customer_services_super_unified WHERE id = ?',
        [customerServiceId]
      );
      
      if (customerService.length === 0) {
        await connection.rollback();
        return { success: false, message: '客服不存在' };
      }
      
      const cs = customerService[0];
      const actualCustomerServiceName = customerServiceName || cs.username;
      
      // 检查今天是否已经打过卡
      if (cs.today_status === 'clocked_in') {
        await connection.rollback();
        return { success: false, message: '今天已经打过上班卡了' };
      }
      
      if (cs.today_status === 'clocked_out') {
        await connection.rollback();
        return { success: false, message: '今天已经下班了，无法重新打卡' };
      }
      
      const now = new Date();
      const today = new Date().toISOString().split('T')[0];
      
      // 使用本地时间格式
      const timestamp = now.getFullYear() + '-' + 
        String(now.getMonth() + 1).padStart(2, '0') + '-' + 
        String(now.getDate()).padStart(2, '0') + ' ' + 
        String(now.getHours()).padStart(2, '0') + ':' + 
        String(now.getMinutes()).padStart(2, '0') + ':' + 
        String(now.getSeconds()).padStart(2, '0');
      
      // 更新客服统一表中的今日状态
      await connection.execute(
        `UPDATE customer_services_super_unified 
         SET today_status = 'clocked_in', 
             today_clock_in_time = ?, 
             today_clock_out_time = NULL, 
             today_work_hours = 0,
             today_total_earnings = 0,
             updated_at = NOW()
         WHERE id = ?`,
        [timestamp, customerServiceId]
      );
      
      // 记录到历史日志（如果表存在）
      try {
        await connection.execute(
          `INSERT INTO customer_service_history_logs 
           (customer_service_id, action_type, action_date, clock_in_time, created_at) 
           VALUES (?, 'clock_in', ?, ?, NOW())`,
          [customerServiceId, today, timestamp]
        );
      } catch (error) {
        console.log('历史记录表不存在，跳过历史记录插入');
      }
      
      await connection.commit();
      
      console.log(`客服 ${actualCustomerServiceName} 上班打卡成功，时间: ${timestamp}`);
      
      return {
        success: true,
        message: '上班打卡成功',
        data: {
          id: customerServiceId,
          customer_service_id: customerServiceId,
          customer_service_name: actualCustomerServiceName,
          date: today,
          clock_in_time: timestamp,
          status: 'clocked_in'
        }
      };
      
    } catch (error) {
      await connection.rollback();
      console.error('上班打卡失败:', error);
      return { success: false, message: '上班打卡失败，请重试' };
    } finally {
      connection.release();
    }
  }

  /**
   * 客服打卡下班 - 使用customer_services_super_unified表
   */
  static async clockOut(customerServiceId: number): Promise<{ success: boolean; message: string; data?: any }> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 获取客服信息
      const [customerServices] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM customer_services_super_unified WHERE id = ?',
        [customerServiceId]
      );
      
      if (customerServices.length === 0) {
        await connection.rollback();
        return { success: false, message: '客服不存在' };
      }
      
      const cs = customerServices[0];
      
      if (cs.today_status !== 'clocked_in') {
        await connection.rollback();
        if (cs.today_status === 'clocked_out') {
          return { success: false, message: '今天已经打过下班卡了' };
        } else {
          return { success: false, message: '请先打卡上班' };
        }
      }
      
      if (!cs.today_clock_in_time) {
        await connection.rollback();
        return { success: false, message: '今天还没有打卡上班' };
      }
      
      const now = new Date();
      const today = new Date().toISOString().split('T')[0];
      
      // 使用本地时间格式
      const timestamp = now.getFullYear() + '-' + 
        String(now.getMonth() + 1).padStart(2, '0') + '-' + 
        String(now.getDate()).padStart(2, '0') + ' ' + 
        String(now.getHours()).padStart(2, '0') + ':' + 
        String(now.getMinutes()).padStart(2, '0') + ':' + 
        String(now.getSeconds()).padStart(2, '0');
      
      // 计算工作时长
      const clockInTime = new Date(cs.today_clock_in_time);
      const clockOutTime = now;
      const workHours = Math.round((clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60) * 100) / 100;
      
      const hourlyRate = cs.hourly_rate || 20.00;
      const totalEarnings = Math.round(workHours * hourlyRate * 100) / 100;
      
      // 更新客服状态
      await connection.execute(
        `UPDATE customer_services_super_unified 
         SET today_status = 'clocked_out', 
             today_clock_out_time = ?, 
             today_work_hours = ?,
             today_total_earnings = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [timestamp, workHours, totalEarnings, customerServiceId]
      );
      
      // 记录到历史日志（如果表存在）
      try {
        await connection.execute(
          `INSERT INTO customer_service_history_logs 
           (customer_service_id, action_type, action_date, clock_in_time, clock_out_time, work_hours, total_earnings, created_at) 
           VALUES (?, 'clock_out', ?, ?, ?, ?, ?, NOW())`,
          [customerServiceId, today, cs.today_clock_in_time, timestamp, workHours, totalEarnings]
        );
      } catch (error) {
        console.log('历史记录表不存在，跳过历史记录插入');
      }
      
      await connection.commit();
      
      // 实时同步收益（不阻塞主流程）
      setImmediate(async () => {
        try {
          await EarningsSync.syncCustomerServiceEarnings(customerServiceId);
          console.log(`客服 ${customerServiceId} 收益同步完成`);
        } catch (error) {
          console.error(`客服 ${customerServiceId} 收益同步失败:`, error);
        }
      });
      
      // 异步更新收入记录（不阻塞主流程）
      setImmediate(() => {
        this.updateEarningsAsync(customerServiceId, today, workHours, hourlyRate, cs.today_clock_in_time, timestamp);
      });
      
      console.log(`客服 ${cs.username} 下班打卡成功，工作时长: ${workHours}小时，收入: ${totalEarnings}元`);
      
      return {
        success: true,
        message: '下班打卡成功',
        data: {
          id: customerServiceId,
          customer_service_id: customerServiceId,
          customer_service_name: cs.username,
          date: today,
          clock_in_time: cs.today_clock_in_time,
          clock_out_time: timestamp,
          work_hours: workHours,
          hourly_rate: hourlyRate,
          earnings: totalEarnings,
          status: 'clocked_out'
        }
      };
      
    } catch (error) {
      await connection.rollback();
      console.error('下班打卡失败:', error);
      return { success: false, message: '下班打卡失败，请重试' };
    } finally {
      connection.release();
    }
  }

  /**
   * 异步更新收入记录
   */
  static async updateEarningsAsync(customerServiceId: number, date: string, workHours: number, hourlyRate: number, clockInTime: string, clockOutTime: string): Promise<void> {
    const connection = await pool.getConnection();
    
    try {
      const baseEarnings = Math.round(workHours * hourlyRate * 100) / 100;
      
      // 插入或更新每日收入记录
      await connection.execute(
        `INSERT INTO customer_service_daily_earnings (
          customer_service_id, date, work_hours, hourly_rate,
          base_earnings, commission_earnings, bonus_earnings, total_earnings,
          clock_in_time, clock_out_time, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 0.00, 0.00, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          work_hours = VALUES(work_hours),
          hourly_rate = VALUES(hourly_rate),
          base_earnings = VALUES(base_earnings),
          total_earnings = VALUES(total_earnings),
          clock_in_time = VALUES(clock_in_time),
          clock_out_time = VALUES(clock_out_time),
          updated_at = NOW()`,
        [
          customerServiceId, date, workHours, hourlyRate,
          baseEarnings, baseEarnings,
          clockInTime, clockOutTime
        ]
      );
      
      console.log(`客服 ${customerServiceId} 的收入记录已异步更新: ${baseEarnings}元`);
      
    } catch (error) {
      console.error('异步更新收入失败:', error);
    } finally {
      connection.release();
    }
  }

  /**
   * 计算并更新收入 - 保留原方法以兼容其他调用
   */
  static async calculateAndUpdateEarnings(customerServiceId: number, date: string, workHours: number): Promise<void> {
    const connection = await pool.getConnection();
    
    try {
      // 获取客服信息
      const [customerServices] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM customer_services_super_unified WHERE id = ?',
        [customerServiceId]
      );
      
      if (customerServices.length === 0) {
        console.error('客服不存在:', customerServiceId);
        return;
      }
      
      const customerService = customerServices[0];
      const hourlyRate = customerService.hourly_rate || 20.00;
      const baseEarnings = Math.round(workHours * hourlyRate * 100) / 100;
      
      // 获取打卡时间
      const [attendanceRecords] = await connection.execute<RowDataPacket[]>(
        'SELECT clock_in_time, clock_out_time FROM attendance_records WHERE customer_service_id = ? AND date = ?',
        [customerServiceId, date]
      );
      
      const attendance = attendanceRecords[0] || {};
      
      // 插入每日收入记录
      await connection.execute(
        `INSERT INTO customer_service_daily_earnings (
          customer_service_id, date, work_hours, hourly_rate,
          base_earnings, commission_earnings, bonus_earnings, total_earnings,
          clock_in_time, clock_out_time, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 0.00, 0.00, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          work_hours = VALUES(work_hours),
          hourly_rate = VALUES(hourly_rate),
          base_earnings = VALUES(base_earnings),
          total_earnings = VALUES(total_earnings),
          clock_in_time = VALUES(clock_in_time),
          clock_out_time = VALUES(clock_out_time),
          updated_at = NOW()`,
        [
          customerServiceId, date, workHours, hourlyRate,
          baseEarnings, baseEarnings,
          attendance.clock_in_time, attendance.clock_out_time
        ]
      );
      
      // 简化更新：只更新基本字段，避免复杂子查询
      await connection.execute(
        `UPDATE customer_services_super_unified 
         SET updated_at = NOW()
         WHERE id = ?`,
        [customerServiceId]
      );
      
      console.log(`客服 ${customerService.username} 的收入已更新: ${baseEarnings}元`);
      
    } catch (error) {
      console.error('计算收入失败:', error);
    } finally {
      connection.release();
    }
  }

  /**
   * 重置今日打卡状态（管理员功能）
   */
  static async resetTodayAttendance(customerServiceId: number): Promise<{ success: boolean; message: string }> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const today = new Date().toISOString().split('T')[0];
      
      // 重置客服统一表中的今日状态
      await connection.execute(
        `UPDATE customer_services_super_unified 
         SET today_status = 'not_clocked', 
             today_clock_in_time = NULL, 
             today_clock_out_time = NULL, 
             today_work_hours = 0,
             today_total_earnings = 0,
             updated_at = NOW()
         WHERE id = ?`,
        [customerServiceId]
      );
      
      // 删除今天的收入记录（如果存在）
      try {
        await connection.execute(
          'DELETE FROM customer_service_daily_earnings WHERE customer_service_id = ? AND date = ?',
          [customerServiceId, today]
        );
      } catch (error) {
        console.log('收入记录表不存在或删除失败，继续执行');
      }
      
      // 删除今天的历史记录（如果存在）
      try {
        await connection.execute(
          'DELETE FROM customer_service_history_logs WHERE customer_service_id = ? AND action_date = ?',
          [customerServiceId, today]
        );
      } catch (error) {
        console.log('历史记录表不存在或删除失败，继续执行');
      }
      
      await connection.commit();
      
      return { success: true, message: '今日打卡状态已重置' };
      
    } catch (error) {
      await connection.rollback();
      console.error('重置打卡状态失败:', error);
      return { success: false, message: '重置失败，请重试' };
    } finally {
      connection.release();
    }
  }

  /**
   * 获取今日打卡状态 - 从customer_services_super_unified表中读取
   */
  static async getTodayAttendanceStatus(customerServiceId: number): Promise<{ 
    status: string; 
    checkInTime?: string; 
    checkOutTime?: string; 
    workDuration?: number;
    hourlyRate?: number;
    totalEarnings?: number;
    canClockIn: boolean;
    canClockOut: boolean;
    todayRecord?: any;
  }> {
    const connection = await pool.getConnection();
    
    try {
      // 直接从客服统一表中获取今日状态
      const [customerServices] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM customer_services_super_unified WHERE id = ?',
        [customerServiceId]
      );
      
      if (customerServices.length === 0) {
        return {
          status: 'not_clocked',
          canClockIn: false,
          canClockOut: false,
          hourlyRate: 20.00,
          totalEarnings: 0
        };
      }
      
      const cs = customerServices[0];
      const hourlyRate = cs.hourly_rate || 20.00;
      const status = cs.today_status || 'not_clocked';
      
      // 计算工作时长（分钟）
      let workDuration = 0;
      let totalEarnings = cs.today_total_earnings || 0;
      
      if (cs.today_work_hours) {
        workDuration = Math.round(cs.today_work_hours * 60); // 转换为分钟
      } else if (cs.today_clock_in_time && cs.today_clock_out_time) {
        const clockInTime = new Date(cs.today_clock_in_time);
        const clockOutTime = new Date(cs.today_clock_out_time);
        workDuration = Math.round((clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60));
      } else if (cs.today_clock_in_time && status === 'clocked_in') {
        // 如果还在工作中，计算到现在的时长
        const clockInTime = new Date(cs.today_clock_in_time);
        const now = new Date();
        workDuration = Math.round((now.getTime() - clockInTime.getTime()) / (1000 * 60));
      }
      
      // 如果没有存储的收入，根据工作时长计算
      if (!totalEarnings && workDuration > 0) {
        totalEarnings = Math.round((workDuration / 60) * hourlyRate * 100) / 100;
      }
      
      const today = new Date().toISOString().split('T')[0];
      
      return {
        status,
        checkInTime: cs.today_clock_in_time,
        checkOutTime: cs.today_clock_out_time,
        workDuration,
        hourlyRate,
        totalEarnings,
        canClockIn: status === 'not_clocked',
        canClockOut: status === 'clocked_in',
        todayRecord: {
          id: cs.id,
          customer_service_id: cs.id,
          customer_service_name: cs.username,
          admin_id: cs.id,
          admin_name: cs.username,
          date: today,
          clock_in_time: cs.today_clock_in_time,
          clock_out_time: cs.today_clock_out_time,
          work_duration: workDuration,
          work_hours: cs.today_work_hours || (workDuration / 60),
          hourly_rate: hourlyRate,
          total_earnings: totalEarnings,
          earnings: totalEarnings,
          status,
          created_at: cs.created_at,
          updated_at: cs.updated_at
        }
      };
      
    } catch (error) {
      console.error('获取今日打卡状态失败:', error);
      return {
        status: 'not_clocked',
        canClockIn: true,
        canClockOut: false,
        hourlyRate: 20.00,
        totalEarnings: 0
      };
    } finally {
      connection.release();
    }
  }

  /**
   * 获取打卡记录 - 主要从customer_service_history_logs表读取，补充当前状态
   */
  static async getAttendanceRecords(
    customerServiceId?: number,
    startDate?: string,
    endDate?: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ records: AttendanceRecord[]; total: number; stats?: AttendanceStats }> {
    const connection = await pool.getConnection();
    
    try {
      // 主要从历史记录表查询所有打卡记录
      let historyWhereClause = '1=1';
      const historyParams: any[] = [];
      
      if (customerServiceId) {
        historyWhereClause += ' AND h.customer_service_id = ?';
        historyParams.push(customerServiceId);
      }
      
      if (startDate) {
        historyWhereClause += ' AND h.action_date >= ?';
        historyParams.push(startDate);
      }
      
      if (endDate) {
        historyWhereClause += ' AND h.action_date <= ?';
        historyParams.push(endDate);
      }
      
      // 查询历史打卡记录
      const [historyRecords] = await connection.execute<RowDataPacket[]>(
        `SELECT 
           h.id as history_id,
           h.customer_service_id as id,
           cs.username,
           CASE 
             WHEN h.action_type = 'clock_in' THEN 'clocked_in'
             WHEN h.action_type = 'clock_out' THEN 'clocked_out'
             ELSE 'not_clocked'
           END as status,
           h.action_type,
           h.clock_in_time,
           h.clock_out_time,
           h.work_hours,
           h.total_earnings,
           h.hourly_rate,
           h.action_date as date,
           h.action_time
         FROM customer_service_history_logs h
         LEFT JOIN customer_services_super_unified cs ON h.customer_service_id = cs.id
         WHERE ${historyWhereClause} AND h.action_type IN ('clock_in', 'clock_out')
         ORDER BY h.action_date DESC, h.action_time DESC, h.id DESC`,
        historyParams
      );
      
      // 如果没有指定日期范围，或者包含今天，则补充当前状态
      let currentRecords: any[] = [];
      const today = new Date().toISOString().split('T')[0];
      const shouldIncludeToday = (!startDate || startDate <= today) && (!endDate || endDate >= today);
      
      if (shouldIncludeToday) {
        let currentWhereClause = '1=1';
        const currentParams: any[] = [];
        
        if (customerServiceId) {
          currentWhereClause += ' AND cs.id = ?';
          currentParams.push(customerServiceId);
        }
        
        // 只获取今天有打卡状态的客服
        currentWhereClause += ' AND cs.today_status != \'not_clocked\'';
        
        const [currentStatus] = await connection.execute<RowDataPacket[]>(
           `SELECT 
              cs.id,
              cs.username,
              cs.today_status as status,
              cs.today_clock_in_time as clock_in_time,
              cs.today_clock_out_time as clock_out_time,
              cs.today_work_hours as work_hours,
              cs.today_total_earnings as total_earnings,
              cs.hourly_rate,
              CURDATE() as date,
              cs.updated_at
            FROM customer_services_super_unified cs
            WHERE ${currentWhereClause}`,
           currentParams
         );
        
        // 过滤掉已经在历史记录中存在的今日记录
        currentRecords = currentStatus.filter(current => {
          const hasHistoryToday = historyRecords.some(history => 
            history.id === current.id && 
            history.date === current.date
          );
          return !hasHistoryToday;
        });
      }
      
      // 合并历史记录和当前状态
      const allRecords = [...historyRecords, ...currentRecords];
      
      const total = allRecords.length;
      
      // 分页
      const offset = (page - 1) * pageSize;
      const paginatedRecords = allRecords.slice(offset, offset + pageSize);
      
      // 处理记录，确保包含收入信息
      const processedRecords = paginatedRecords.map((record: any) => {
        // 计算工作时长（分钟）
        let workDuration = 0;
        if (record.work_hours) {
          workDuration = Math.round(record.work_hours * 60); // 转换为分钟
        } else if (record.clock_in_time && record.clock_out_time) {
          const clockInTime = new Date(record.clock_in_time);
          const clockOutTime = new Date(record.clock_out_time);
          workDuration = Math.round((clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60));
        } else if (record.clock_in_time && record.status === 'clocked_in') {
          // 如果还在工作中，计算到现在的时长
          const clockInTime = new Date(record.clock_in_time);
          const now = new Date();
          workDuration = Math.round((now.getTime() - clockInTime.getTime()) / (1000 * 60));
        }
        
        // 计算收入
        const hourlyRate = record.hourly_rate || 20.00;
        let totalEarnings = record.total_earnings || 0;
        
        if (!totalEarnings && workDuration > 0) {
          totalEarnings = Math.round((workDuration / 60) * hourlyRate * 100) / 100;
        }
        
        return {
          id: record.history_id || record.id,
          customer_service_id: record.id,
          customer_service_name: record.username,
          admin_id: record.id,
          admin_name: record.username,
          date: record.date,
          clock_in_time: record.clock_in_time,
          clock_out_time: record.clock_out_time,
          work_hours: record.work_hours || (workDuration / 60),
          work_duration: workDuration,
          hourly_rate: hourlyRate,
          total_earnings: totalEarnings,
          earnings: totalEarnings,
          base_earnings: totalEarnings,
          commission_earnings: 0,
          bonus_earnings: 0,
          status: record.status,
          action_type: record.action_type,
          created_at: record.action_time || record.updated_at,
          updated_at: record.action_time || record.updated_at
        };
      });
      
      let stats: AttendanceStats | undefined;
      
      // 如果查询特定客服，计算统计信息
      if (customerServiceId) {
        const [customerService] = await connection.execute<RowDataPacket[]>(
          'SELECT * FROM customer_services_super_unified WHERE id = ?',
          [customerServiceId]
        );
        
        if (customerService.length > 0) {
          const cs = customerService[0];
          stats = {
            todayStatus: cs.today_status || 'not_clocked',
            todayWorkHours: cs.today_work_hours || 0
          };
        }
      }
      
      return {
        records: processedRecords as AttendanceRecord[],
        total,
        stats
      };
      
    } catch (error) {
      console.error('获取打卡记录失败:', error);
      return { records: [], total: 0 };
    } finally {
      connection.release();
    }
  }

  /**
   * 获取所有管理员打卡记录 - 为管理员界面提供
   */
  static async getAllManagerAttendanceRecords(
    page: number = 1,
    pageSize: number = 50
  ): Promise<{ records: AttendanceRecord[]; total: number }> {
    const connection = await pool.getConnection();
    
    try {
      // 获取所有客服的当前状态作为记录
      const [records] = await connection.execute<RowDataPacket[]>(
        `SELECT 
           cs.id,
           cs.username,
           cs.today_status as status,
           cs.today_clock_in_time as clock_in_time,
           cs.today_clock_out_time as clock_out_time,
           cs.today_work_hours as work_hours,
           cs.today_total_earnings as total_earnings,
           cs.hourly_rate,
           CURDATE() as date,
           cs.created_at,
           cs.updated_at
         FROM customer_services_super_unified cs
         ORDER BY cs.updated_at DESC
         LIMIT ? OFFSET ?`,
        [pageSize, (page - 1) * pageSize]
      );
      
      // 获取总数
      const [countResult] = await connection.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as total FROM customer_services_super_unified'
      );
      
      const total = countResult[0].total;
      
      // 处理记录，确保包含收入信息
      const processedRecords = records.map((record: any) => {
        // 计算工作时长（分钟）
        let workDuration = 0;
        if (record.work_hours) {
          workDuration = Math.round(record.work_hours * 60); // 转换为分钟
        } else if (record.clock_in_time && record.clock_out_time) {
          const clockInTime = new Date(record.clock_in_time);
          const clockOutTime = new Date(record.clock_out_time);
          workDuration = Math.round((clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60));
        } else if (record.clock_in_time && record.status === 'clocked_in') {
          // 如果还在工作中，计算到现在的时长
          const clockInTime = new Date(record.clock_in_time);
          const now = new Date();
          workDuration = Math.round((now.getTime() - clockInTime.getTime()) / (1000 * 60));
        }
        
        // 计算收入
        const hourlyRate = record.hourly_rate || 20.00;
        let totalEarnings = record.total_earnings || 0;
        
        if (!totalEarnings && workDuration > 0) {
          totalEarnings = Math.round((workDuration / 60) * hourlyRate * 100) / 100;
        }
        
        return {
          id: record.id,
          customer_service_id: record.id,
          customer_service_name: record.username,
          admin_id: record.id,
          admin_name: record.username,
          date: record.date,
          clock_in_time: record.clock_in_time,
          clock_out_time: record.clock_out_time,
          work_hours: record.work_hours || (workDuration / 60),
          work_duration: workDuration,
          hourly_rate: hourlyRate,
          total_earnings: totalEarnings,
          earnings: totalEarnings,
          base_earnings: totalEarnings,
          commission_earnings: 0,
          bonus_earnings: 0,
          status: record.status,
          created_at: record.created_at,
          updated_at: record.updated_at
        };
      });
      
      return {
        records: processedRecords as AttendanceRecord[],
        total
      };
      
    } catch (error) {
      console.error('获取所有管理员打卡记录失败:', error);
      return { records: [], total: 0 };
    } finally {
      connection.release();
    }
  }

  /**
   * 删除打卡记录 - 仅管理员可用
   */
  static async deleteAttendanceRecord(recordId: number): Promise<{ success: boolean; message: string }> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 首先检查记录是否存在于历史记录表中
      let recordFound = false;
      
      try {
        const [historyRecords] = await connection.execute<RowDataPacket[]>(
          'SELECT * FROM customer_service_history_logs WHERE id = ?',
          [recordId]
        );
        
        if (historyRecords.length > 0) {
          // 从历史记录表中删除
          await connection.execute(
            'DELETE FROM customer_service_history_logs WHERE id = ?',
            [recordId]
          );
          recordFound = true;
          console.log(`从历史记录表删除记录 ${recordId}`);
        }
      } catch (error) {
        console.log('历史记录表不存在或查询失败，尝试从主表删除');
      }
      
      // 如果历史记录表中没有找到，尝试从主表删除（通过重置客服状态）
      if (!recordFound) {
        // 查找对应的客服记录
        const [customerServices] = await connection.execute<RowDataPacket[]>(
          'SELECT * FROM customer_services_super_unified WHERE id = ?',
          [recordId]
        );
        
        if (customerServices.length > 0) {
          // 重置客服的今日状态
          await connection.execute(
            `UPDATE customer_services_super_unified 
             SET today_status = 'not_clocked',
                 today_clock_in_time = NULL,
                 today_clock_out_time = NULL,
                 today_work_hours = 0,
                 today_total_earnings = 0,
                 updated_at = NOW()
             WHERE id = ?`,
            [recordId]
          );
          recordFound = true;
          console.log(`重置客服 ${recordId} 的今日打卡状态`);
        }
      }
      
      if (!recordFound) {
        await connection.rollback();
        return { success: false, message: '记录不存在' };
      }
      
      await connection.commit();
      
      return {
        success: true,
        message: '删除成功'
      };
      
    } catch (error) {
      await connection.rollback();
      console.error('删除打卡记录失败:', error);
      return { success: false, message: '删除失败，请重试' };
    } finally {
      connection.release();
    }
  }
}