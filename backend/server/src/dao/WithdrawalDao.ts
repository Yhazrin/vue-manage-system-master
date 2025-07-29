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
    status: '待审核' | '已通过' | '已拒绝';
}

export class WithdrawalDAO {
    /** 创建提现记录 */
    static async create(
        withdrawal: {
            withdrawal_id: string;
            player_id: number;
            amount: number;
        }) {
        // 1) 拿当前抽成率
        const rate = await ConfigDAO.getCommissionRate(); // e.g. 10
        const platform_fee = +(withdrawal.amount * rate / 100).toFixed(2);

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
        let sql = `SELECT * FROM withdrawals WHERE player_id = ?`;
        let countSql = `SELECT COUNT(*) as total FROM withdrawals WHERE player_id = ?`;
        const params: any[] = [player_id];
        const countParams: any[] = [player_id];

        // 如果有状态筛选，添加条件
        if (status) {
            sql += ` AND status = ?`;
            countSql += ` AND status = ?`;
            params.push(status);
            countParams.push(status);
        }

        // 添加排序和分页 - 使用字符串拼接而不是参数化查询
        sql += ` ORDER BY created_at DESC LIMIT ${validPageSize} OFFSET ${offset}`;

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
            where = ` WHERE status = ?`;
            params.push(status);
        }
        const countSql = `SELECT COUNT(*) as cnt FROM withdrawals${where}`;
        const [[{ cnt }]]: any = await pool.execute(countSql, params);

        const dataSql = `
      SELECT * FROM withdrawals${where}
      ORDER BY created_at DESC LIMIT ${validPageSize} OFFSET ${offset}
    `;
        const [rows]: any = await pool.execute(dataSql, params);
        return { total: cnt, withdrawals: rows };
    }
}