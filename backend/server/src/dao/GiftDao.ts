// src/dao/GiftDAO.ts
import { pool } from '../db';

export interface Gift {
    id: number;
    name: string;
    price: number;
    image_url?: string | null;
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

    /** 更新礼物（可部分更新） */
    static async update(id: number, g: Partial<Omit<Gift, 'id'>>): Promise<void> {
        const fields: string[] = [];
        const params: any[] = [];

        if (g.name !== undefined) {
            fields.push('name = ?');
            params.push(g.name);
        }
        if (g.price !== undefined) {
            fields.push('price = ?');
            params.push(g.price);
        }
        if (g.image_url !== undefined) {
            fields.push('image_url = ?');
            params.push(g.image_url);
        }
        if (fields.length === 0) {
            return;
        }

        const sql = `UPDATE gifts SET ${fields.join(', ')} WHERE id = ?`;
        params.push(id);
        await pool.execute(sql, params);
    }

    /** 按名称模糊查询礼物 */
    static async findByNameLike(keyword: string): Promise<Gift[]> {
        const sql = `SELECT * FROM gifts WHERE name LIKE ? ORDER BY id ASC`;
        const [rows]: any = await pool.execute(sql, [`%${keyword}%`]);
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