// src/dao/WithdrawalDAO.ts
import { pool } from '../db';
import { ConfigDAO } from "./ConfigDao";

export interface Withdrawal {
    withdrawal_id: string;
    player_id?: number;
    customer_service_id?: number;
    user_type?: 'player' | 'customer_service';
    amount: number;
    platform_fee: number;
    final_amount: number;
    created_at: string;
    updated_at?: string;
    notes?: string;
    alipay_account?: string;
    status: '待审核' | '已批准' | '已拒绝' | '已完成';
}

export class WithdrawalDAO {
    /** 创建陪玩提现记录 */
    static async create(
        withdrawal: {
            withdrawal_id: string;
            player_id: number;
            amount: number;
        }) {
        // 不再收取提现抽成，platform_fee设为0
        const platform_fee = 0;

        const sql = `
      INSERT INTO withdrawals (withdrawal_id, player_id, amount, platform_fee, user_type)
      VALUES (?, ?, ?, ?, 'player')
    `;
        await pool.execute(sql, [
            withdrawal.withdrawal_id,
            withdrawal.player_id,
            withdrawal.amount,
            platform_fee,
        ]);
        return withdrawal.withdrawal_id;
    }

    /** 创建客服提现记录 */
    static async createCustomerServiceWithdrawal(
        withdrawal: {
            withdrawal_id: string;
            customer_service_id: number;
            amount: number;
            notes?: string;
            alipay_account?: string;
        }) {
        // 不再收取提现抽成，platform_fee设为0
        const platform_fee = 0;

        const sql = `
      INSERT INTO withdrawals (withdrawal_id, customer_service_id, amount, platform_fee, user_type, notes, alipay_account)
      VALUES (?, ?, ?, ?, 'customer_service', ?, ?)
    `;
        await pool.execute(sql, [
            withdrawal.withdrawal_id,
            withdrawal.customer_service_id,
            withdrawal.amount,
            platform_fee,
            withdrawal.notes || null,
            withdrawal.alipay_account || null,
        ]);
        return withdrawal.withdrawal_id;
    }

    /** 根据提现 ID 查询 */
    static async findById(id: string): Promise<Withdrawal | null> {
        const sql = `SELECT * FROM withdrawals WHERE withdrawal_id = ? LIMIT 1`;
        const [rows]: any = await pool.execute(sql, [id]);
        return rows[0] ?? null;
    }

    /** 根据玩家 ID 分页查询提现记录（支持状态筛选） */
    static async findByPlayerId(
        player_id: number,
        page: number = 1,
        pageSize: number = 20,
        status?: string
    ): Promise<{ list: Withdrawal[], total: number }> {
        // 确保参数是有效的整数
        const validPage = Math.max(1, Math.floor(Number(page) || 1));
        const validPageSize = Math.max(1, Math.min(100, Math.floor(Number(pageSize) || 20)));
        const offset = (validPage - 1) * validPageSize;

        // 基础 SQL 和参数
        let sql = `SELECT w.*, p.name as player_name, p.phone_num as player_phone FROM withdrawals w LEFT JOIN players p ON w.player_id = p.id WHERE w.player_id = ? AND w.user_type = 'player'`;
        let countSql = `SELECT COUNT(*) as total FROM withdrawals w WHERE w.player_id = ? AND w.user_type = 'player'`;
        const params: any[] = [player_id];
        const countParams: any[] = [player_id];

        // 如果有状态筛选，添加条件
        if (status) {
            sql += ` AND w.status = ?`;
            countSql += ` AND w.status = ?`;
            params.push(status);
            countParams.push(status);
        }

        // 添加排序和分页 - 使用字符串拼接而不是参数化查询
        sql += ` ORDER BY w.created_at DESC LIMIT ${validPageSize} OFFSET ${offset}`;

        // 执行查询
        const [rows]: any = await pool.execute(sql, params);
        const [countResult]: any = await pool.execute(countSql, countParams);

        return {
            list: rows,
            total: countResult[0].total
        };
    }

    /** 根据客服 ID 分页查询提现记录（支持状态筛选） */
    static async findByCustomerServiceId(
        customer_service_id: number,
        page: number = 1,
        pageSize: number = 20,
        status?: string
    ): Promise<{ list: Withdrawal[], total: number }> {
        // 确保参数是有效的整数
        const validPage = Math.max(1, Math.floor(Number(page) || 1));
        const validPageSize = Math.max(1, Math.min(100, Math.floor(Number(pageSize) || 20)));
        const offset = (validPage - 1) * validPageSize;

        // 基础 SQL 和参数
        let sql = `SELECT w.*, cs.username as customer_service_name, cs.phone as customer_service_phone FROM withdrawals w LEFT JOIN customer_services_super_unified cs ON w.customer_service_id = cs.id WHERE w.customer_service_id = ? AND w.user_type = 'customer_service'`;
        let countSql = `SELECT COUNT(*) as total FROM withdrawals w WHERE w.customer_service_id = ? AND w.user_type = 'customer_service'`;
        const params: any[] = [customer_service_id];
        const countParams: any[] = [customer_service_id];

        // 如果有状态筛选，添加条件
        if (status) {
            sql += ` AND w.status = ?`;
            countSql += ` AND w.status = ?`;
            params.push(status);
            countParams.push(status);
        }

        // 添加排序和分页 - 使用字符串拼接而不是参数化查询
        sql += ` ORDER BY w.created_at DESC LIMIT ${validPageSize} OFFSET ${offset}`;

        // 执行查询
        const [rows]: any = await pool.execute(sql, params);
        const [countResult]: any = await pool.execute(countSql, countParams);

        return {
            list: rows,
            total: countResult[0].total
        };
    }

    /** 分页查询并按状态过滤 */
    static async findAll(
        page: number = 1,
        pageSize: number = 20,
        status?: Withdrawal['status']
    ): Promise<{ total: number; withdrawals: Withdrawal[] }> {
        // 确保参数是有效的整数
        const validPage = Math.max(1, Math.floor(Number(page) || 1));
        const validPageSize = Math.max(1, Math.min(100, Math.floor(Number(pageSize) || 20)));
        const offset = (validPage - 1) * validPageSize;
        
        let where = '';
        const params: any[] = [];
        if (status) {
            where = ` WHERE w.status = ?`;
            params.push(status);
        }
        const countSql = `SELECT COUNT(*) as cnt FROM withdrawals w${where}`;
        const [[{ cnt }]]: any = await pool.execute(countSql, params);

        const dataSql = `
      SELECT w.*, 
             CASE 
               WHEN w.user_type = 'player' THEN p.name
               WHEN w.user_type = 'customer_service' THEN cs.username
               ELSE NULL
             END as player_name,
             CASE 
               WHEN w.user_type = 'player' THEN p.phone_num
               WHEN w.user_type = 'customer_service' THEN cs.phone
               ELSE NULL
             END as player_phone,
             w.user_type as type
      FROM withdrawals w
      LEFT JOIN players p ON w.player_id = p.id AND w.user_type = 'player'
      LEFT JOIN customer_services_super_unified cs ON w.customer_service_id = cs.id AND w.user_type = 'customer_service'
      ${where}
      ORDER BY w.created_at DESC LIMIT ${validPageSize} OFFSET ${offset}
    `;
        const [rows]: any = await pool.execute(dataSql, params);
        return { total: cnt, withdrawals: rows };
    }

    /** 更新提现状态 */
    static async updateStatus(
        withdrawal_id: string,
        status: '待审核' | '已批准' | '已拒绝' | '已完成',
        notes?: string
    ): Promise<boolean> {
        // 开始事务
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 获取当前提现记录的状态
            const currentStatusSql = `SELECT status, player_id, customer_service_id, user_type, amount FROM withdrawals WHERE withdrawal_id = ?`;
            const [currentRows]: any = await connection.execute(currentStatusSql, [withdrawal_id]);
            
            if (currentRows.length === 0) {
                await connection.rollback();
                return false;
            }

            const { status: currentStatus, player_id, customer_service_id, user_type, amount } = currentRows[0];

            // 更新提现记录状态
            let updateSql: string;
            let updateParams: any[];
            
            if (status === '已拒绝') {
                // 拒绝时，将notes写入reject_reason字段
                updateSql = `
                    UPDATE withdrawals 
                    SET status = ?, reject_reason = ?, updated_at = NOW() 
                    WHERE withdrawal_id = ?
                `;
                updateParams = [status, notes || null, withdrawal_id];
            } else {
                // 批准或完成时，将notes写入notes字段
                updateSql = `
                    UPDATE withdrawals 
                    SET status = ?, notes = ?, updated_at = NOW() 
                    WHERE withdrawal_id = ?
                `;
                updateParams = [status, notes || null, withdrawal_id];
            }
            
            const [result]: any = await connection.execute(updateSql, updateParams);
            
            if (result.affectedRows === 0) {
                await connection.rollback();
                return false;
            }

            // 处理余额和已提现金额的更新
            if (status === '已批准') {
                if (user_type === 'player' && player_id) {
                    // 如果状态变为"已批准"，需要从陪玩余额中扣除提现金额
                    const playerSql = `SELECT money FROM players WHERE id = ?`;
                    const [playerRows]: any = await connection.execute(playerSql, [player_id]);
                    
                    if (playerRows.length > 0) {
                        const currentMoney = Number(playerRows[0].money) || 0;
                        const newMoney = Math.max(0, currentMoney - Number(amount));
                        
                        // 更新陪玩余额
                        const updatePlayerSql = `UPDATE players SET money = ? WHERE id = ?`;
                        await connection.execute(updatePlayerSql, [newMoney, player_id]);
                    }
                } else if (user_type === 'customer_service' && customer_service_id) {
                    // 如果状态变为"已批准"，需要从客服余额中扣除提现金额，并更新统计字段
                    const customerServiceSql = `SELECT available_balance, total_withdrawals, pending_withdrawals FROM customer_services_super_unified WHERE id = ?`;
                    const [customerServiceRows]: any = await connection.execute(customerServiceSql, [customer_service_id]);
                    
                    if (customerServiceRows.length > 0) {
                        const currentBalance = Number(customerServiceRows[0].available_balance) || 0;
                        const currentWithdrawals = Number(customerServiceRows[0].total_withdrawals) || 0;
                        const currentPending = Number(customerServiceRows[0].pending_withdrawals) || 0;
                        
                        const newBalance = Math.max(0, currentBalance - Number(amount));
                        const newWithdrawals = currentWithdrawals + Number(amount);
                        const newPending = Math.max(0, currentPending - Number(amount));
                        
                        // 更新客服余额和统计字段
                        const updateCustomerServiceSql = `
                            UPDATE customer_services_super_unified 
                            SET available_balance = ?, total_withdrawals = ?, pending_withdrawals = ?, updated_at = NOW()
                            WHERE id = ?
                        `;
                        await connection.execute(updateCustomerServiceSql, [newBalance, newWithdrawals, newPending, customer_service_id]);
                    }
                }
            } else if (status === '已完成') {
                if (user_type === 'player' && player_id) {
                    // 如果状态直接变为"已完成"，需要同时处理余额扣除和已提现金额增加
                    const playerSql = `SELECT money, profit FROM players WHERE id = ?`;
                    const [playerRows]: any = await connection.execute(playerSql, [player_id]);
                    
                    if (playerRows.length > 0) {
                        const currentMoney = Number(playerRows[0].money) || 0;
                        const currentProfit = Number(playerRows[0].profit) || 0;
                        
                        // 如果之前状态不是"已批准"，需要先扣除余额
                        let newMoney = currentMoney;
                        if (currentStatus !== '已批准') {
                            newMoney = Math.max(0, currentMoney - Number(amount));
                        }
                        
                        // 增加已提现金额
                        const newProfit = currentProfit + Number(amount);
                        
                        // 同时更新余额和已提现金额
                        const updatePlayerSql = `UPDATE players SET money = ?, profit = ? WHERE id = ?`;
                        await connection.execute(updatePlayerSql, [newMoney, newProfit, player_id]);
                    }
                } else if (user_type === 'customer_service' && customer_service_id) {
                    // 如果状态直接变为"已完成"，需要同时处理余额扣除和已提现金额增加
                    const customerServiceSql = `SELECT available_balance, total_withdrawals FROM customer_services_super_unified WHERE id = ?`;
                    const [customerServiceRows]: any = await connection.execute(customerServiceSql, [customer_service_id]);
                    
                    if (customerServiceRows.length > 0) {
                        const currentBalance = Number(customerServiceRows[0].available_balance) || 0;
                        const currentWithdrawals = Number(customerServiceRows[0].total_withdrawals) || 0;
                        
                        // 如果之前状态不是"已批准"，需要先扣除余额
                        let newBalance = currentBalance;
                        if (currentStatus !== '已批准') {
                            newBalance = Math.max(0, currentBalance - Number(amount));
                        }
                        
                        // 增加已提现金额
                        const newWithdrawals = currentWithdrawals + Number(amount);
                        
                        // 同时更新余额和已提现金额
                        const updateCustomerServiceSql = `UPDATE customer_services_super_unified SET available_balance = ?, total_withdrawals = ? WHERE id = ?`;
                        await connection.execute(updateCustomerServiceSql, [newBalance, newWithdrawals, customer_service_id]);
                    }
                }
            }

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            console.error('更新提现状态失败:', error);
            throw error;
        } finally {
            connection.release();
        }
    }
}