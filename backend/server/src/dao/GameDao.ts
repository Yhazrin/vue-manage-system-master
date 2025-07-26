// src/dao/GameDAO.ts
import { pool } from '../db';
export interface Game {
    id: number;
    name: string;
}

export class GameDAO {
    /** 创建新游戏 */
    static async create(name: string): Promise<number> {
        const sql = `INSERT INTO games (name) VALUES (?)`;
        const [result]: any = await pool.execute(sql, [name]);
        return result.insertId;
    }

    /** 根据 name 模糊查询游戏 */
    static async findByName(name: string): Promise<Game[]> {
        const sql = `SELECT * FROM games WHERE name LIKE ?`;
        const [rows]: any = await pool.execute(sql, [`%${name}%`]);
        return rows;
    }

    /** 查询所有游戏 */
    static async findAll(): Promise<Game[]> {
        const sql = `SELECT * FROM games ORDER BY name ASC`;
        const [rows]: any = await pool.execute(sql);
        return rows;
    }

    /** 更新游戏名称 */
    static async updateById(id: number, name: string): Promise<void> {
        const sql = `UPDATE games SET name = ? WHERE id = ?`;
        await pool.execute(sql, [name, id]);
    }

    /** 删除游戏 */
    static async deleteById(id: number): Promise<void> {
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