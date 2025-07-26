// src/dao/GiftDAO.ts
import { pool } from '../db';

export interface Gift {
    id: number;
    name: string;
    price: number;
    image_url: string;
}

export class GiftDAO {
    /** 创建礼物 */
    static async create(g: Omit<Gift, 'id'>): Promise<number> {
        const sql = `INSERT INTO gifts (name, price, image_url) VALUES (?, ?, ?, ?)`;
        const [result]: any = await pool.execute(sql, [
            g.name,
            g.price,
            g.image_url
        ]);
        return result.insertId;
    }

    /** 按 ID 查询礼物 */
    static async findById(id: number): Promise<Gift | null> {
        const sql = `SELECT * FROM gifts WHERE id = ? LIMIT 1`;
        const [rows]: any = await pool.execute(sql, [id]);
        return rows[0] ?? null;
    }

    /** 查询所有礼物 */
    static async findAll(): Promise<Gift[]> {
        const sql = `SELECT * FROM gifts ORDER BY id ASC`;
        const [rows]: any = await pool.execute(sql);
        return rows;
    }

    /** 按 ID 删除礼物 */
    static async deleteById(id: number): Promise<void> {
        const sql = `DELETE FROM gifts WHERE id = ?`;
        await pool.execute(sql, [id]);
    }

    /** 计算礼物总数 */
    static async countAll(): Promise<number> {
        const [[{ cnt }]]: any = await pool.execute(`SELECT COUNT(*) as cnt FROM gifts`);
        return cnt;
    }
}