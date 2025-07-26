// src/dao/UserDao.ts
import { pool } from '../db';

// 用户状态枚举
export enum UserStatus {
    ACTIVE = 1,
    INACTIVE = 0
}

// 用户实体接口 - 完全对应数据库表结构
export interface User {
    id: number;
    name: string;
    passwd: string;
    status: UserStatus;
    photo_img: string | null;
    phone_num: string;
    created_at: Date;
}

// 创建用户DTO - 不包含自动生成的字段
export interface CreateUserDto {
    name: string;
    passwd: string;
    status?: UserStatus;
    photo_img?: string;
    phone_num: string;
}

// 更新用户DTO - 所有字段都是可选的
export interface UpdateUserDto {
    name?: string;
    passwd?: string;
    status?: UserStatus;
    photo_img?: string;
    phone_num?: string;
}

// 用户查询选项
export interface UserQueryOptions {
    status?: UserStatus;
    limit?: number;
    offset?: number;
    orderBy?: 'id' | 'name' | 'created_at';
    orderDirection?: 'ASC' | 'DESC';
}

// 用户统计信息
export interface UserStatistics {
    total_users: number;
    active_users: number;
    inactive_users: number;
    total_orders: number;
    total_spent: number;
}

export class UserDAO {
    /** 创建新用户 */
    static async create(user: CreateUserDto): Promise<number> {
        try {
            const sql = `
                INSERT INTO users (name, passwd, status, photo_img, phone_num)
                VALUES (?, ?, ?, ?, ?)
            `;
            const [result]: any = await pool.execute(sql, [
                user.name,
                user.passwd,
                user.status ?? UserStatus.ACTIVE,
                user.photo_img ?? null,
                user.phone_num
            ]);
            return result.insertId;
        } catch (error) {
            throw new Error(`创建用户失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }

    /** 根据ID查询用户 */
    static async findById(id: number): Promise<User | null> {
        try {
            const sql = `
                SELECT * FROM users 
                WHERE id = ? 
                LIMIT 1
            `;
            const [rows]: any = await pool.execute(sql, [id]);
            return rows[0] ?? null;
        } catch (error) {
            throw new Error(`查询用户失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }

    /** 根据手机号查询用户 */
    static async findByPhone(phone: string): Promise<User | null> {
        try {
            const sql = `
                SELECT * FROM users 
                WHERE phone_num = ? 
                LIMIT 1
            `;
            const [rows]: any = await pool.execute(sql, [phone]);
            return rows[0] ?? null;
        } catch (error) {
            throw new Error(`查询用户失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }

    /** 根据用户名查询用户 */
    static async findByName(name: string): Promise<User | null> {
        try {
            const sql = `
                SELECT * FROM users 
                WHERE name = ? 
                LIMIT 1
            `;
            const [rows]: any = await pool.execute(sql, [name]);
            return rows[0] ?? null;
        } catch (error) {
            throw new Error(`查询用户失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }

    /** 查询所有用户（支持分页和筛选） */
    static async findAll(options: UserQueryOptions = {}): Promise<User[]> {
        try {
            const {
                status,
                limit = 50,
                offset = 0,
                orderBy = 'created_at',
                orderDirection = 'DESC'
            } = options;

            let sql = `SELECT * FROM users WHERE 1=1`;
            const params: any[] = [];

            if (status !== undefined) {
                sql += ` AND status = ?`;
                params.push(status);
            }

            sql += ` ORDER BY ${orderBy} ${orderDirection}`;
            sql += ` LIMIT ? OFFSET ?`;
            params.push(limit, offset);

            const [rows]: any = await pool.execute(sql, params);
            return rows;
        } catch (error) {
            throw new Error(`查询用户列表失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }

    /** 更新用户信息 */
    static async update(id: number, updates: UpdateUserDto): Promise<void> {
        try {
            const fields = Object.keys(updates).filter(key => updates[key as keyof UpdateUserDto] !== undefined);
            
            if (fields.length === 0) {
                return; // 没有需要更新的字段
            }

            const setClause = fields.map(field => `${field} = ?`).join(', ');
            const values = fields.map(field => updates[field as keyof UpdateUserDto]);
            
            const sql = `UPDATE users SET ${setClause} WHERE id = ?`;
            await pool.execute(sql, [...values, id]);
        } catch (error) {
            throw new Error(`更新用户失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }

    /** 更新用户头像 */
    static async updatePhoto(id: number, photoImg: string): Promise<void> {
        try {
            const sql = `UPDATE users SET photo_img = ? WHERE id = ?`;
            await pool.execute(sql, [photoImg, id]);
        } catch (error) {
            throw new Error(`更新用户头像失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }

    /** 更新用户状态 */
    static async updateStatus(id: number, status: UserStatus): Promise<void> {
        try {
            const sql = `UPDATE users SET status = ? WHERE id = ?`;
            await pool.execute(sql, [status, id]);
        } catch (error) {
            throw new Error(`更新用户状态失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }

    /** 更新用户密码 */
    static async updatePassword(id: number, newPassword: string): Promise<void> {
        try {
            const sql = `UPDATE users SET passwd = ? WHERE id = ?`;
            await pool.execute(sql, [newPassword, id]);
        } catch (error) {
            throw new Error(`更新用户密码失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }

    /** 删除用户 */
    static async delete(id: number): Promise<void> {
        try {
            const sql = `DELETE FROM users WHERE id = ?`;
            await pool.execute(sql, [id]);
        } catch (error) {
            throw new Error(`删除用户失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }

    /** 软删除用户（设置状态为无效） */
    static async softDelete(id: number): Promise<void> {
        await this.updateStatus(id, UserStatus.INACTIVE);
    }

    /** 检查手机号是否已存在 */
    static async isPhoneExists(phone: string, excludeId?: number): Promise<boolean> {
        try {
            let sql = `SELECT COUNT(*) as count FROM users WHERE phone_num = ?`;
            const params: any[] = [phone];

            if (excludeId) {
                sql += ` AND id != ?`;
                params.push(excludeId);
            }

            const [rows]: any = await pool.execute(sql, params);
            return (rows[0] as any).count > 0;
        } catch (error) {
            throw new Error(`检查手机号失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }

    /** 检查用户名是否已存在 */
    static async isNameExists(name: string, excludeId?: number): Promise<boolean> {
        try {
            let sql = `SELECT COUNT(*) as count FROM users WHERE name = ?`;
            const params: any[] = [name];

            if (excludeId) {
                sql += ` AND id != ?`;
                params.push(excludeId);
            }

            const [rows]: any = await pool.execute(sql, params);
            return (rows[0] as any).count > 0;
        } catch (error) {
            throw new Error(`检查用户名失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }

    /** 获取用户统计信息 */
    static async getStatistics(): Promise<UserStatistics> {
        try {
            const sql = `
                SELECT 
                    COUNT(*) as total_users,
                    SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as active_users,
                    SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as inactive_users
                FROM users
            `;
            const [rows]: any = await pool.execute(sql);
            const userStats = rows[0] as any;

            // 获取用户订单统计
            const orderSql = `
                SELECT 
                    COUNT(*) as total_orders,
                    COALESCE(SUM(gr.total_price), 0) as total_spent
                FROM users u
                LEFT JOIN gift_records gr ON u.id = gr.user_id
            `;
            const [orderRows]: any = await pool.execute(orderSql);
            const orderStats = orderRows[0] as any;

            return {
                total_users: userStats.total_users,
                active_users: userStats.active_users,
                inactive_users: userStats.inactive_users,
                total_orders: orderStats.total_orders,
                total_spent: parseFloat(orderStats.total_spent)
            };
        } catch (error) {
            throw new Error(`获取用户统计失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }

    /** 获取用户的订单列表 */
    static async getUserOrders(userId: number): Promise<any[]> {
        try {
            const sql = `
                SELECT 
                    o.order_id,
                    o.status,
                    o.created_at,
                    p.name as player_name,
                    g.name as game_name
                FROM orders o
                JOIN players p ON o.player_id = p.id
                JOIN games g ON o.game_id = g.id
                WHERE o.user_id = ?
                ORDER BY o.created_at DESC
            `;
            const [rows]: any = await pool.execute(sql, [userId]);
            return rows;
        } catch (error) {
            throw new Error(`获取用户订单失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }

    /** 获取用户的礼物记录 */
    static async getUserGifts(userId: number): Promise<any[]> {
        try {
            const sql = `
                SELECT 
                    gr.id,
                    gr.quantity,
                    gr.total_price,
                    gr.created_at,
                    p.name as player_name,
                    g.name as gift_name,
                    g.image_url as gift_image
                FROM gift_records gr
                JOIN players p ON gr.player_id = p.id
                JOIN gifts g ON gr.gift_id = g.id
                WHERE gr.user_id = ?
                ORDER BY gr.created_at DESC
            `;
            const [rows]: any = await pool.execute(sql, [userId]);
            return rows;
        } catch (error) {
            throw new Error(`获取用户礼物记录失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
}