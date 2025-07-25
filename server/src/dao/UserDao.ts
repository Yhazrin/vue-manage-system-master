// src/dao/UserDAO.ts
import { pool } from '../db';

export interface User {
    id: number;
    name: string;
    passwd: string;
    status: number;
    photo_img: string;
    phone_num: string;
}

export class UserDAO {
    /** 插入新用户 */
    static async create(u: Omit<User, 'id'>): Promise<number> {
        const sql = `
      INSERT INTO users (name, passwd, status, photo_img, phone_num)
      VALUES (?, ?, ?, ?, ?)
    `;
        const [res]: any = await pool.execute(sql, [
            u.name, u.passwd, u.status, u.photo_img, u.phone_num
        ]);
        return res.insertId;
    }

    /** 根据ID查询 */
    static async findById(id: number): Promise<User | null> {
        const sql = `SELECT * FROM users WHERE id = ? LIMIT 1`;
        const [rows]: any = await pool.execute(sql, [id]);
        return rows[0] ?? null;
    }

    /** 根据手机号查询 */
    static async findByPhone(phone: string): Promise<User | null> {
        const sql = `SELECT * FROM users WHERE phone_num = ? LIMIT 1`;
        const [rows]: any = await pool.execute(sql, [phone]);
        return rows[0] ?? null;
    }

    /** 更新头像 */
    static async updatePhoto(id: number, imgUrl: string): Promise<void> {
        const sql = `UPDATE users SET photo_img = ? WHERE id = ?`;
        await pool.execute(sql, [imgUrl, id]);
    }

    /** 其它更新、删除方法同理…… */
}