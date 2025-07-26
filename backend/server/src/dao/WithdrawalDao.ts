// src/dao/WithdrawalDAO.ts
import { pool } from '../db';

export interface Withdrawal {
    withdrawal_id: string;
    player_id: number;
    amount: number;
    platform_fee: number;
    final_amount: number;
    status: '待审核' | '已批准' | '已拒绝';
    created_at: string;
}

export class WithdrawalDAO {
    /** 创建提现记录 */
    static async create(
        w: Omit<Withdrawal, 'created_at' | 'final_amount'>
    ): Promise<string> {
        const sql = `
      INSERT INTO withdrawals (withdrawal_id, player_id, amount, platform_fee, status)
      VALUES (?, ?, ?, ?, ?)
    `;
        await pool.execute(sql, [
            w.withdrawal_id,
            w.player_id,
            w.amount,
            w.platform_fee,
            w.status
        ]);
        return w.withdrawal_id;
    }

    /** 根据提现 ID 查询 */
    static async findById(id: string): Promise<Withdrawal | null> {
        const sql = `SELECT * FROM withdrawals WHERE withdrawal_id = ? LIMIT 1`;
        const [rows]: any = await pool.execute(sql, [id]);
        return rows[0] ?? null;
    }

    /** 分页查询并按状态过滤 */
    static async findAll(
        page: number = 1,
        pageSize: number = 20,
        status?: Withdrawal['status']
    ): Promise<{ total: number; withdrawals: Withdrawal[] }> {
        const offset = (page - 1) * pageSize;
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
      ORDER BY created_at DESC LIMIT ?, ?
    `;
        params.push(offset, pageSize);
        const [rows]: any = await pool.execute(dataSql, params);
        return { total: cnt, withdrawals: rows };
    }
}