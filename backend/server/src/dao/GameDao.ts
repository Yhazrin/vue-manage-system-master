// src/dao/GameDAO.ts
import { pool } from '../db';
export interface Game {
    id: number;
    name: string;
    image_url?: string;
}

export class GameDAO {
    /** 创建新游戏 */
    static async create(gameData: { name: string; image_url?: string }): Promise<number> {
        const { name, image_url } = gameData;
        const sql = `INSERT INTO games (name, image_url) VALUES (?, ?)`;
        const [result]: any = await pool.execute(sql, [name, image_url]);
        return result.insertId;
    }

    /** 根据 name 模糊查询游戏 */
    static async findByName(name: string): Promise<Game[]> {
        const sql = `SELECT * FROM games WHERE name LIKE ?`;
        const [rows]: any = await pool.execute(sql, [`%${name}%`]);
        return rows;
    }

    /** 根据 ID 查询单个游戏 */
    static async findById(id: number): Promise<Game | null> {
        const sql = `SELECT * FROM games WHERE id = ?`;
        const [[row]]: any = await pool.execute(sql, [id]);
        return row || null;
    }

    /** 查询所有游戏 */
    static async findAll(): Promise<Game[]> {
        const sql = `SELECT * FROM games ORDER BY name ASC`;
        const [rows]: any = await pool.execute(sql);
        return rows;
    }

    /** 更新游戏信息 */
    static async updateById(id: number, gameData: { name?: string; image_url?: string }): Promise<void> {
        const { name, image_url } = gameData;
        const updates = [];
        const params = [];

        if (name !== undefined) {
            updates.push('name = ?');
            params.push(name);
        }

        if (image_url !== undefined) {
            updates.push('image_url = ?');
            params.push(image_url);
        }

        if (updates.length === 0) {
            throw new Error('No fields to update');
        }

        params.push(id);
        const sql = `UPDATE games SET ${updates.join(', ')} WHERE id = ?`;
        await pool.execute(sql, params);
    }

    /** 删除游戏 */
    static async deleteById(id: number): Promise<void> {
        // 首先删除相关的服务记录
        const deleteServicesSql = `DELETE FROM services WHERE game_id = ?`;
        await pool.execute(deleteServicesSql, [id]);
        
        // 然后删除游戏
        const sql = `DELETE FROM games WHERE id = ?`;
        await pool.execute(sql, [id]);
    }

    /** 统计游戏总数 */
    static async countAll(): Promise<number> {
        const sql = `SELECT COUNT(*) as cnt FROM games`;
        const [[{ cnt }]]: any = await pool.execute(sql);
        return cnt;
    }
}