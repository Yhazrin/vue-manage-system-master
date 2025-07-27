// src/dao/GiftRecordDAO.ts
import { pool } from '../db';

export interface GiftRecord {
    id: number;
    user_id: number;
    player_id: number;
    gift_id: number;
    quantity: number;
    total_price: number;
    order_id: string | null;
    created_at: string;
}

export class GiftRecordDAO {
    /** 插入打赏记录 */
    static async create(r: Omit<GiftRecord, 'id' | 'created_at'>): Promise<number> {
        const sql = `
      INSERT INTO gift_records (user_id, player_id, gift_id, quantity, total_price, order_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
        const [result]: any = await pool.execute(sql, [
            r.user_id,
            r.player_id,
            r.gift_id,
            r.quantity,
            r.total_price,
            r.order_id || null
        ]);
        return result.insertId;
    }

    /** 根据 ID 查询 */
    static async findById(id: number): Promise<GiftRecord | null> {
        const sql = `SELECT * FROM gift_records WHERE id = ? LIMIT 1`;
        const [rows]: any = await pool.execute(sql, [id]);
        return rows[0] ?? null;
    }

    /** 查询某用户的所有打赏记录 */
    static async findAllByUser(
        userId: number
    ): Promise<GiftRecord[]> {
        const sql = `SELECT * FROM gift_records WHERE user_id = ? ORDER BY created_at DESC`;
        const [rows]: any = await pool.execute(sql, [userId]);
        return rows;
    }

    /** 统计所有打赏记录数 */
    static async countAll(): Promise<number> {
        const [[{ cnt }]]: any = await pool.execute(`SELECT COUNT(*) as cnt FROM gift_records`);
        return cnt;
    }
}