// src/dao/ManagerDAO.ts
import { pool } from '../db';

export interface Manager {
    id: number;
    name: string;
    passwd: string;
    phone_num: string;
    status: boolean;
    authority: number;
    photo_img: string | null;
    created_at: string;
}

export class ManagerDAO {
    /** 创建新管理员，返回新生成的 id */
    static async create(
        name: string,
        passwd: string,
        phone_num: string,
        authority: number,
        photo_img?: string
    ): Promise<number> {
        const sql = `
            INSERT INTO managers
                (name, passwd, phone_num, status, authority, photo_img)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const [result]: any = await pool.execute(sql, [
            name,
            passwd,
            phone_num,
            1,                // 默认启用状态
            authority,
            photo_img || null
        ]);
        return result.insertId;
    }

    /** 根据 ID 查询管理员 */
    static async findById(id: number): Promise<Manager | null> {
        const sql = `SELECT * FROM managers WHERE id = ? LIMIT 1`;
        const [rows]: any = await pool.execute(sql, [id]);
        return rows[0] ?? null;
    }

    /** 根据名称模糊查询管理员 */
    static async findByName(name: string): Promise<Manager[]> {
        const sql = `SELECT * FROM managers WHERE name LIKE ?`;
        const [rows]: any = await pool.execute(sql, [`%${name}%`]);
        return rows;
    }

    /** 分页查询管理员，可按状态、权限或关键字过滤 */
    static async findAll(
        page: number = 1,
        pageSize: number = 20,
        status?: boolean,
        authority?: number,
        keyword?: string
    ): Promise<{ total: number; managers: Manager[] }> {
        const offset = (page - 1) * pageSize;
        let where = '';
        const params: any[] = [];

        if (status !== undefined) {
            where += ` AND status = ?`;
            params.push(status ? 1 : 0);
        }
        if (authority !== undefined) {
            where += ` AND authority = ?`;
            params.push(authority);
        }
        if (keyword) {
            where += ` AND (name LIKE ? OR phone_num LIKE ?)`;
            params.push(`%${keyword}%`, `%${keyword}%`);
        }

        // 查询总数
        const countSql = `SELECT COUNT(*) as cnt FROM managers WHERE 1=1 ${where}`;
        const [[{ cnt }]]: any = await pool.execute(countSql, params);

        // 查询数据
        const dataSql = `
      SELECT * FROM managers
      WHERE 1=1 ${where}
      ORDER BY created_at DESC
      LIMIT ?, ?
    `;
        params.push(offset, pageSize);
        const [rows]: any = await pool.execute(dataSql, params);

        return { total: cnt, managers: rows };
    }

    /** 更新管理员基本信息（不含密码） */
    static async updateById(
        id: number,
        data: Partial<Pick<Manager, 'name' | 'phone_num' | 'status' | 'authority' | 'photo_img'>>
    ): Promise<void> {
        const keys = Object.keys(data);
        if (!keys.length) return;
        const sets = keys.map(k => `${k} = ?`).join(', ');
        const params = keys.map(k => (data as any)[k]);
        params.push(id);
        const sql = `UPDATE managers SET ${sets} WHERE id = ?`;
        await pool.execute(sql, params);
    }

    /** 更新密码 */
    static async updatePassword(id: number, newPasswd: string): Promise<void> {
        const sql = `UPDATE managers SET passwd = ? WHERE id = ?`;
        await pool.execute(sql, [newPasswd, id]);
    }

    /** 更新启用/禁用状态 */
    static async updateStatus(id: number, status: boolean): Promise<void> {
        const sql = `UPDATE managers SET status = ? WHERE id = ?`;
        await pool.execute(sql, [status ? 1 : 0, id]);
    }

    /** 更新权限等级 */
    static async updateAuthority(id: number, authority: number): Promise<void> {
        const sql = `UPDATE managers SET authority = ? WHERE id = ?`;
        await pool.execute(sql, [authority, id]);
    }

    /** 删除管理员 */
    static async deleteById(id: number): Promise<void> {
        const sql = `DELETE FROM managers WHERE id = ?`;
        await pool.execute(sql, [id]);
    }

    /** 统计管理员总数 */
    static async countAll(): Promise<number> {
        const sql = `SELECT COUNT(*) as cnt FROM managers`;
        const [[{ cnt }]]: any = await pool.execute(sql);
        return cnt;
    }
}
