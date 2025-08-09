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
    role: string;
}

export class UserDAO {
    /** 插入新用户，返回新生成的 id */
    static async create(
        name: string,
        passwd: string,
        phone_num: string,
        photo_img?: string | null,
        role: string = 'user',
        plain_passwd?: string | null
    ): Promise<number> {
        console.log('🔥🔥🔥 UserDAO.create 被调用，参数:', { name, passwd: '***', phone_num, photo_img, role, plain_passwd });
        const sql = `
            INSERT INTO users (name, passwd, phone_num, photo_img, role, plain_passwd)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const params = [
            name,
            passwd,
            phone_num,
            photo_img || null,
            role,
            plain_passwd || null,
        ];
        console.log('🔥🔥🔥 UserDAO.create SQL参数:', { name, passwd: '***', phone_num, photo_img, role, plain_passwd });
        const [result]: any = await pool.execute(sql, params);
        console.log('🔥🔥🔥 UserDAO.create 插入结果:', result.insertId);
        return result.insertId;
    }

    /** 根据主键 id 查询用户 */
    static async findById(id: number): Promise<User | null> {
        const sql = `SELECT * FROM users WHERE id = ? LIMIT 1`;
        const [rows]: any = await pool.execute(sql, [id]);
        if (!rows[0]) return null;
        const user = rows[0];
        // 转换status字段为boolean类型
        return {
            ...user,
            status: Boolean(user.status)
        } as User;
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
    ): Promise<{ total: number; users: any[] }> {
        console.log('🚀🚀🚀 UserDAO.findAll 被调用了！最新版本！🚀🚀🚀');
        const offset = (page - 1) * pageSize;
        let where = ''; const params: any[] = [];
        if (status !== undefined) {
            where += ` AND u.status = ?`;
            params.push(status ? 1 : 0);
        }
        if (keyword) {
            where += ` AND (u.name LIKE ? OR u.phone_num LIKE ?)`;
            params.push(`%${keyword}%`, `%${keyword}%`);
        }
        // 总数
        const countSql = `SELECT COUNT(*) as cnt FROM users u WHERE 1=1 ${where}`;
        const [[{ cnt }]]: any = await pool.execute(countSql, params);
        // 数据 - 使用LEFT JOIN获取订单数，包含明文密码
        const dataSql = `
      SELECT u.id, u.name, u.passwd, u.plain_passwd, u.status, u.photo_img, u.phone_num, u.created_at, u.role,
             COALESCE(COUNT(o.order_id), 0) as orderCount
      FROM users u 
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE 1=1 ${where}
      GROUP BY u.id, u.name, u.passwd, u.plain_passwd, u.status, u.photo_img, u.phone_num, u.created_at, u.role
      ORDER BY u.id ASC
      LIMIT ${offset}, ${pageSize}
    `;
        console.log('🔥🔥🔥 UserDAO查询SQL:', dataSql);
        console.log('🔥🔥🔥 UserDAO查询参数:', params);
        const [rows]: any = await pool.execute(dataSql, params);
        console.log('🔥🔥🔥 UserDAO查询结果:', rows);
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
    static async updatePassword(id: number, newPasswd: string, plainPasswd?: string): Promise<void> {
        const sql = `UPDATE users SET passwd = ?, plain_passwd = ? WHERE id = ?`;
        await pool.execute(sql, [newPasswd, plainPasswd || null, id]);
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

    /** 更新最后登录时间 */
    static async updateLastLogin(id: number): Promise<void> {
        const sql = `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?`;
        await pool.execute(sql, [id]);
    }
}