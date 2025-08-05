// src/dao/ManagerDAO.ts
import { pool } from '../db';

export interface Manager {
    id: number;
    name: string;
    passwd: string;
    plain_passwd?: string | null; // 明文密码字段
    phone_num: string;
    status: boolean;
    authority: number;
    photo_img: string | null;
    created_at: string;
    last_login: string | null;
}
export class ManagerDAO {
    /**
     * 创建新管理员
     * @returns 新生成的管理员 ID
     */
    static async create(
        name: string,
        passwd: string,
        phone_num: string,
        authority: number,
        photo_img?: string | null,
        plain_passwd?: string | null
    ): Promise<number> {
        const sql = `
            INSERT INTO managers
                (name, passwd, phone_num, status, authority, photo_img, plain_passwd)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const [result]: any = await pool.execute(sql, [
            name,
            passwd,
            phone_num,
            1,
            authority,
            photo_img || null,
            plain_passwd || null
        ]);
        return result.insertId;
    }

    /**
     * 根据 ID 查询管理员
     */
    static async findById(id: number): Promise<Manager | null> {
        const sql = `SELECT * FROM managers WHERE id = ? LIMIT 1`;
        const [rows]: any = await pool.execute(sql, [id]);
        if (!rows.length) return null;
        const m = rows[0];
        return { ...m, status: Boolean(m.status) };
    }

    /**
     * 根据手机号查询管理员
     */
    static async findByPhone(phone: string): Promise<Manager | null> {
        const sql = `SELECT * FROM managers WHERE phone_num = ? LIMIT 1`;
        const [rows]: any = await pool.execute(sql, [phone]);
        if (!rows.length) return null;
        const m = rows[0];
        return { ...m, status: Boolean(m.status) };
    }

    /**
     * 根据名称模糊查询管理员
     */
    static async findByName(name: string): Promise<Manager[]> {
        const sql = `SELECT * FROM managers WHERE name LIKE ?`;
        const [rows]: any = await pool.execute(sql, [`%${name}%`]);
        return rows.map((m: any) => ({ ...m, status: Boolean(m.status) }));
    }

    /**
     * 分页查询管理员列表，可选按状态、权限和关键字过滤
     */
    static async findAll(
        page = 1,
        pageSize = 20,
        status?: boolean,
        authority?: number,
        keyword?: string
    ): Promise<{ total: number; managers: Manager[] }> {
        const offset = (page - 1) * pageSize;
        let where = ' WHERE 1=1';
        const params: any[] = [];

        if (status !== undefined) {
            where += ' AND status = ?';
            params.push(status ? 1 : 0);
        }
        if (authority !== undefined) {
            where += ' AND authority = ?';
            params.push(authority);
        }
        if (keyword) {
            where += ' AND (name LIKE ? OR phone_num LIKE ?)';
            params.push(`%${keyword}%`, `%${keyword}%`);
        }

        // 查询总数
        const countSql = `SELECT COUNT(*) as cnt FROM managers${where}`;
        const [[{ cnt }]]: any = await pool.execute(countSql, params);

        // 查询数据
        const dataSql = `
      SELECT * FROM managers${where}
      ORDER BY created_at DESC
      LIMIT ${offset}, ${pageSize}
    `;
        const [rows]: any = await pool.execute(dataSql, params);
        const managers = rows.map((m: any) => ({ ...m, status: Boolean(m.status) }));

        return { total: cnt, managers };
    }

    /**
     * 更新管理员基本信息（name, phone_num, status, authority, photo_img）
     */
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

    /**
     * 更新启用/禁用状态
     */
    static async updateStatus(id: number, status: boolean): Promise<void> {
        const sql = `UPDATE managers SET status = ? WHERE id = ?`;
        await pool.execute(sql, [status ? 1 : 0, id]);
    }

    /**
     * 更新权限等级
     */
    static async updateAuthority(id: number, authority: number): Promise<void> {
        const sql = `UPDATE managers SET authority = ? WHERE id = ?`;
        await pool.execute(sql, [authority, id]);
    }

    /**
     * 更新密码
     */
    static async updatePassword(id: number, passwd: string): Promise<void> {
        const sql = `UPDATE managers SET passwd = ? WHERE id = ?`;
        await pool.execute(sql, [passwd, id]);
    }

    /**
     * 更新密码（包含明文密码）
     */
    static async updatePasswordWithPlain(id: number, passwd: string, plain_passwd: string): Promise<void> {
        const sql = `UPDATE managers SET passwd = ?, plain_passwd = ? WHERE id = ?`;
        await pool.execute(sql, [passwd, plain_passwd, id]);
    }

    /**
     * 删除管理员
     */
    static async deleteById(id: number): Promise<void> {
        const sql = `DELETE FROM managers WHERE id = ?`;
        await pool.execute(sql, [id]);
    }

    /**
     * 统计管理员总数
     */
    static async countAll(): Promise<number> {
        const sql = `SELECT COUNT(*) as cnt FROM managers`;
        const [[{ cnt }]]: any = await pool.execute(sql);
        return cnt;
    }

    /**
     * 更新最后登录时间
     */
    static async updateLastLogin(id: number): Promise<void> {
        const sql = `UPDATE managers SET last_login = CURRENT_TIMESTAMP WHERE id = ?`;
        await pool.execute(sql, [id]);
    }
}