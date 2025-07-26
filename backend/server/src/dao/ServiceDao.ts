// src/dao/ServiceDAO.ts
import { pool } from '../db';

export interface Service {
    id: number;
    player_id: number;
    game_id: number;
    price: number;
    hours: number;
    created_at: string;
}

export class ServiceDAO {
    /** 创建服务 */
    static async create(s: Omit<Service, 'id' | 'created_at'>): Promise<number> {
        const sql = `INSERT INTO services (player_id, game_id, price, hours) VALUES (?, ?, ?, ?)`;
        const [result]: any = await pool.execute(sql, [
            s.player_id,
            s.game_id,
            s.price,
            s.hours
        ]);
        return result.insertId;
    }

    /** 根据 ID 查询服务 */
    static async findById(id: number): Promise<Service | null> {
        const sql = `SELECT * FROM services WHERE id = ? LIMIT 1`;
        const [rows]: any = await pool.execute(sql, [id]);
        return rows[0] ?? null;
    }

    /** 分页查询服务 */
    static async findAll(
        page: number = 1,
        pageSize: number = 20
    ): Promise<{ total: number; services: Service[] }> {
        const offset = (page - 1) * pageSize;
        // 总数
        const [[{ cnt }]]: any = await pool.execute(`SELECT COUNT(*) as cnt FROM services`);
        // 数据
        const [rows]: any = await pool.execute(
            `SELECT * FROM services ORDER BY created_at DESC LIMIT ?, ?`,
            [offset, pageSize]
        );
        return { total: cnt, services: rows };
    }

    /** 更新服务 */
    static async updateById(
        id: number,
        data: Partial<Pick<Service, 'price' | 'hours'>>
    ): Promise<void> {
        const keys = Object.keys(data);
        if (!keys.length) return;
        const sets = keys.map(k => `${k} = ?`).join(', ');
        const params = keys.map(k => (data as any)[k]);
        params.push(id);
        const sql = `UPDATE services SET ${sets} WHERE id = ?`;
        await pool.execute(sql, params);
    }

    /** 删除服务 */
    static async deleteById(id: number): Promise<void> {
        const sql = `DELETE FROM services WHERE id = ?`;
        await pool.execute(sql, [id]);
    }

    /** 统计服务总数 */
    static async countAll(): Promise<number> {
        const [[{ cnt }]]: any = await pool.execute(`SELECT COUNT(*) as cnt FROM services`);
        return cnt;
    }
}