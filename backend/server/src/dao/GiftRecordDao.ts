// src/dao/GiftRecordDAO.ts
import { pool } from '../db';
import { ConfigDAO } from './ConfigDao';

export interface GiftRecord {
    id: number;
    user_id: number;
    player_id: number;
    order_id?: string;
    gift_id: number;
    quantity: number;
    total_price: number;
    created_at: string;
}

export class GiftRecordDAO {
    /** 插入打赏记录 */
    static async create(record: {
        user_id: number;
        player_id: number;
        order_id?: string;
        gift_id: number;
        quantity: number;
    }) {
        // 1) 拿礼物单价
        const [[gift]]: any = await pool.execute(
            `SELECT price FROM gifts WHERE id = ?`,
            [record.gift_id]
        );
        const total_price = gift.price * record.quantity;

        // 2) 算抽成 - 使用礼物专用抽成率
        const rate = await ConfigDAO.getGiftCommissionRate();
        const platform_fee = +(total_price * rate / 100).toFixed(2);

        // 3) 插入打赏记录
        const sql = `
      INSERT INTO gift_records (user_id, player_id, order_id, gift_id, quantity, total_price, platform_fee)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
        const [result]: any = await pool.execute(sql, [
            record.user_id,
            record.player_id,
            record.order_id || null,
            record.gift_id,
            record.quantity,
            total_price,
            platform_fee,
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