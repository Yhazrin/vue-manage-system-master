// src/dao/UserDAO.ts
import { pool } from '../db';

export interface User {
    id: number;
    name: string;
    passwd: string;
    status: boolean;
    photo_img: string | null;
    phone_num: string;
    created_at: string;
}

export class UserDAO {
    /** 插入新用户，返回新生成的 id */
    static async create(
        name: string,
        passwd: string,
        phone_num: string,
        photo_img?: string
    ): Promise<number> {
        const sql = `
            INSERT INTO users (name, passwd, phone_num, photo_img)
            VALUES (?, ?, ?, ?)
        `;
        const [result]: any = await pool.execute(sql, [
            name,
            passwd,
            phone_num,
            photo_img || null,
        ]);
        return result.insertId;
    }

    /** 根据主键 id 查询用户 */
    static async findById(id: number): Promise<User | null> {
        const sql = `SELECT * FROM users WHERE id = ? LIMIT 1`;
        const [rows]: any = await pool.execute(sql, [id]);
        return rows[0] ?? null;
    }

    /** 根据手机号查询用户 */
    static async findByPhone(phone: string): Promise<User | null> {
        const sql = `SELECT * FROM users WHERE phone_num = ? LIMIT 1`;
        const [rows]: any = await pool.execute(sql, [phone]);
        return rows[0] ?? null;
    }

    /** 根据用户名查询用户 */
    static async findByName(name: string): Promise<User | null> {
        const sql = `SELECT * FROM users WHERE name = ? LIMIT 1`;
        const [rows]: any = await pool.execute(sql, [name]);
        return rows[0] ?? null;
    }

    /** 分页查询所有用户，可选按状态或关键字过滤
     *  大概率不会使用 */
    static async findAll(
        page: number = 1,
        pageSize: number = 20,
        status?: boolean,
        keyword?: string
    ): Promise<{ total: number; users: User[] }> {
        const offset = (page - 1) * pageSize;
        let where = ''; const params: any[] = [];
        if (status !== undefined) {
            where += ` AND status = ?`;
            params.push(status ? 1 : 0);
        }
        if (keyword) {
            where += ` AND (name LIKE ? OR phone_num LIKE ?)`;
            params.push(`%${keyword}%`, `%${keyword}%`);
        }
        // 总数
        const countSql = `SELECT COUNT(*) as cnt FROM users WHERE 1=1 ${where}`;
        const [[{ cnt }]]: any = await pool.execute(countSql, params);
        // 数据
        const dataSql = `
      SELECT * FROM users WHERE 1=1 ${where}
      ORDER BY created_at DESC
      LIMIT ?, ?
    `;
        params.push(offset, pageSize);
        const [rows]: any = await pool.execute(dataSql, params);
        return { total: cnt, users: rows };
    }

    /** 更新用户基本信息（除密码外） */
    static async updateById(
        id: number,
        data: Partial<Pick<User, 'name' | 'status' | 'photo_img' | 'phone_num'>>
    ): Promise<void> {
        const fields = Object.keys(data);
        if (!fields.length) return;
        const sets = fields.map(key => `${key} = ?`).join(', ');
        const params = fields.map(key => (data as any)[key]);
        params.push(id);
        const sql = `UPDATE users SET ${sets} WHERE id = ?`;
        await pool.execute(sql, params);
    }

    /** 更新密码 */
    static async updatePassword(id: number, newPasswd: string): Promise<void> {
        const sql = `UPDATE users SET passwd = ? WHERE id = ?`;
        await pool.execute(sql, [newPasswd, id]);
    }

    /** 更新状态 */
    static async updateStatus(id: number, status: boolean): Promise<void> {
        const sql = `UPDATE users SET status = ? WHERE id = ?`;
        await pool.execute(sql, [status ? 1 : 0, id]);
    }

    /** 删除用户 */
    static async deleteById(id: number): Promise<void> {
        const sql = `DELETE FROM users WHERE id = ?`;
        await pool.execute(sql, [id]);
    }

    /** 统计用户数量 */
    static async countAll(): Promise<number> {
        const sql = `SELECT COUNT(*) as cnt FROM users`;
        const [[{ cnt }]]: any = await pool.execute(sql);
        return cnt;
    }
}