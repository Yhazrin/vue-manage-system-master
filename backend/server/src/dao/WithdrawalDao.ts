// src/dao/WithdrawalDAO.ts
import { pool } from '../db';
import { ConfigDAO } from "./ConfigDao";

export interface Withdrawal {
    withdrawal_id: string;
    player_id: number;
    amount: number;
    platform_fee: number;
    final_amount: number;
    created_at: string;
    updated_at?: string;
    notes?: string;
    status: '待审核' | '已批准' | '已拒绝' | '已打款';
}

export class WithdrawalDAO {
    /** 创建提现记录 */
    static async create(
        withdrawal: {
            withdrawal_id: string;
            player_id: number;
            amount: number;
        }) {
        // 不再收取提现抽成，platform_fee设为0
        const platform_fee = 0;

        const sql = `
      INSERT INTO withdrawals (withdrawal_id, player_id, amount, platform_fee)
      VALUES (?, ?, ?, ?)
    `;
        await pool.execute(sql, [
            withdrawal.withdrawal_id,
            withdrawal.player_id,
            withdrawal.amount,
            platform_fee,
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
        let sql = `SELECT w.*, p.name as player_name, p.phone_num as player_phone FROM withdrawals w LEFT JOIN players p ON w.player_id = p.id WHERE w.player_id = ?`;
        let countSql = `SELECT COUNT(*) as total FROM withdrawals w WHERE w.player_id = ?`;
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
      SELECT w.*, p.name as player_name, p.phone_num as player_phone
      FROM withdrawals w
      LEFT JOIN players p ON w.player_id = p.id
      ${where}
      ORDER BY w.created_at DESC LIMIT ${validPageSize} OFFSET ${offset}
    `;
        const [rows]: any = await pool.execute(dataSql, params);
        return { total: cnt, withdrawals: rows };
    }

    /** 更新提现状态 */
    static async updateStatus(
        withdrawal_id: string,
        status: '待审核' | '已批准' | '已拒绝' | '已打款',
        notes?: string
    ): Promise<boolean> {
        // 开始事务
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 获取当前提现记录的状态
            const currentStatusSql = `SELECT status, player_id, amount FROM withdrawals WHERE withdrawal_id = ?`;
            const [currentRows]: any = await connection.execute(currentStatusSql, [withdrawal_id]);
            
            if (currentRows.length === 0) {
                await connection.rollback();
                return false;
            }

            const { status: currentStatus, player_id, amount } = currentRows[0];

            // 更新提现记录状态
            const updateSql = `
                UPDATE withdrawals 
                SET status = ?, notes = ?, updated_at = NOW() 
                WHERE withdrawal_id = ?
            `;
            const [result]: any = await connection.execute(updateSql, [status, notes || null, withdrawal_id]);
            
            if (result.affectedRows === 0) {
                await connection.rollback();
                return false;
            }

            // 处理余额和已提现金额的更新
            if (status === '已批准') {
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
            } else if (status === '已打款') {
                // 如果状态直接变为"已打款"，需要同时处理余额扣除和已提现金额增加
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