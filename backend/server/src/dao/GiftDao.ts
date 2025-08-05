// src/dao/GiftDAO.ts
import { pool } from '../db';

export interface Gift {
    id: number;
    name: string;
    price: number;
    image_url?: string | null;
    created_at?: string;
}

export class GiftDAO {
    /** 创建礼物 */
    static async create(g: Omit<Gift, 'id' | 'created_at'>): Promise<number> {
        console.log('GiftDAO.create 接收到的参数:', g);
        const sql = `INSERT INTO gifts (name, price, image_url) VALUES (?, ?, ?)`;
        const params = [g.name, g.price, g.image_url];
        console.log('执行SQL:', sql);
        console.log('SQL参数:', params);
        
        try {
            const [result]: any = await pool.execute(sql, params);
            console.log('插入成功，insertId:', result.insertId);
            return result.insertId;
        } catch (error) {
            console.error('GiftDAO.create 执行失败:', error);
            throw error;
        }
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

    /** 检查礼物是否有关联的送礼记录 */
    static async hasRelatedRecords(id: number): Promise<boolean> {
        const sql = `SELECT COUNT(*) as cnt FROM gift_records WHERE gift_id = ?`;
        const [[{ cnt }]]: any = await pool.execute(sql, [id]);
        return cnt > 0;
    }

    /** 按 ID 删除礼物 */
    static async deleteById(id: number): Promise<void> {
        // 检查是否存在关联的送礼记录
        const hasRecords = await this.hasRelatedRecords(id);
        if (hasRecords) {
            throw new Error('无法删除礼物：存在相关的送礼记录');
        }
        
        const sql = `DELETE FROM gifts WHERE id = ?`;
        await pool.execute(sql, [id]);
    }

    /** 计算礼物总数 */
    static async countAll(): Promise<number> {
        const [[{ cnt }]]: any = await pool.execute(`SELECT COUNT(*) as cnt FROM gifts`);
        return cnt;
    }
}