// src/dao/CommentDAO.ts
import { pool } from '../db';

export interface Comment {
    id: number;
    user_id: number;
    player_id: number;
    order_id: string;
    content: string;
    rating: number;
    created_at: string;
}

export class CommentDAO {
    /** 插入新评论 */
    static async create(c: Omit<Comment, 'id' | 'created_at'>): Promise<number> {
        const sql = `
      INSERT INTO comments (user_id, player_id, order_id, content, rating)
      VALUES (?, ?, ?, ?, ?)
    `;
        const [result]: any = await pool.execute(sql, [
            c.user_id,
            c.player_id,
            c.order_id,
            c.content,
            c.rating
        ]);
        return result.insertId;
    }

    /** 根据评论 ID 查询 */
    static async findById(id: number): Promise<Comment | null> {
        const sql = `SELECT * FROM comments WHERE id = ? LIMIT 1`;
        const [rows]: any = await pool.execute(sql, [id]);
        return rows[0] ?? null;
    }

    /** 根据 order_id 查询该订单下所有评论 */
    static async findByOrder(
        orderId: string
    ): Promise<Comment[]> {
        const sql = `SELECT * FROM comments WHERE order_id = ?`;
        const [rows]: any = await pool.execute(sql, [orderId]);
        return rows;
    }

    /** 统计评论总数 */
    static async countAll(): Promise<number> {
        const [[{ cnt }]]: any = await pool.execute(`SELECT COUNT(*) as cnt FROM comments`);
        return cnt;
    }
}