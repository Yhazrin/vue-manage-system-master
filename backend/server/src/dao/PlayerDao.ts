// src/dao/PlayerDAO.ts
import { pool } from '../db';

export interface Player {
    id: number;
    name: string;
    passwd: string;
    phone_num: string;
    status: boolean;
    QR_img: string | null;
    game_id: number | null;
    money: number;
    profit: number;
    voice: string | null;
    intro: string | null;
    created_at: string;
    photo_img: string | null;
}

export class PlayerDAO {
    /** 插入新玩家，返回新生成的 id */
    static async create(
        name: string,
        passwd: string,
        phone_num: string,
        game_id?: number,
        QR_img?: string | null,
        intro?: string,
        photo_img?: string | null
    ): Promise<number> {
        const sql = `
            INSERT INTO players (name, passwd, phone_num, game_id, QR_img, intro, photo_img)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const [result]: any = await pool.execute(sql, [
            name,
            passwd,
            phone_num,
            game_id || null,
            QR_img || null,
            intro || null,
            photo_img || null
        ]);
        return result.insertId;
    }

    /** 根据 id 查询玩家 */
    static async findById(id: number): Promise<Player | null> {
        const sql = `SELECT * FROM players WHERE id = ? LIMIT 1`;
        const [rows]: any = await pool.execute(sql, [id]);
        return rows[0] ?? null;
    }

    /** 根据 game_id 查询所有玩家 */
    static async findByGameId(gameId: number): Promise<Player[]> {
        const sql = `SELECT * FROM players WHERE game_id = ?`;
        const [rows]: any = await pool.execute(sql, [gameId]);
        return rows;
    }

    /** 根据昵称查询玩家 */
    static async findByName(name: string): Promise<Player[]> {
        const sql = `SELECT * FROM players WHERE name LIKE ?`;
        const [rows]: any = await pool.execute(sql, [`%${name}%`]);
        return rows;
    }

    /** 根据手机号查询玩家 */
    static async findByPhoneNum(phoneNum: string): Promise<Player | null> {
        const sql = `SELECT * FROM players WHERE phone_num = ? LIMIT 1`;
        const [rows]: any = await pool.execute(sql, [phoneNum]);
        return rows[0] ?? null;
    }

    /** 分页查询玩家，可选按在线状态和关键词过滤 */
    static async findAll(
        page: number = 1,
        pageSize: number = 20,
        status?: boolean,
        keyword?: string
    ): Promise<{ total: number; players: Player[] }> {
        // 确保参数是有效的整数
        const validPage = Math.max(1, Math.floor(Number(page) || 1));
        const validPageSize = Math.max(1, Math.min(100, Math.floor(Number(pageSize) || 20)));
        const offset = (validPage - 1) * validPageSize;
        
        let where = '';
        const params: any[] = [];
        
        if (status !== undefined) {
            where += ` AND status = ?`;
            params.push(status ? 1 : 0);
        }
        if (keyword) {
            where += ` AND name LIKE ?`;
            params.push(`%${keyword}%`);
        }
        
        // 总数查询
        const countSql = `SELECT COUNT(*) as cnt FROM players WHERE 1=1 ${where}`;
        const [[{ cnt }]]: any = await pool.execute(countSql, params);
        
        // 数据查询 - 直接拼接LIMIT和OFFSET到SQL字符串中
        const dataSql = `
            SELECT * FROM players WHERE 1=1 ${where}
            ORDER BY created_at DESC
            LIMIT ${validPageSize} OFFSET ${offset}
        `;
        const [rows]: any = await pool.execute(dataSql, params);
        
        return { total: cnt, players: rows };
    }

    /** 更新玩家基础信息 */
    static async updateById(
        id: number,
        data: Partial<Pick<Player, 'name' | 'phone_num' | 'intro' | 'game_id' | 'photo_img'>>
    ): Promise<void> {
        const fields = Object.keys(data);
        if (!fields.length) return;
        
        // 如果包含game_id，需要验证其是否存在
        if (data.game_id !== undefined) {
            if (data.game_id === null || data.game_id === 0) {
                // 允许设置为null
                data.game_id = null;
            } else {
                // 验证game_id是否存在
                const gameCheckSql = `SELECT id FROM games WHERE id = ?`;
                const [gameRows]: any = await pool.execute(gameCheckSql, [data.game_id]);
                if (!gameRows.length) {
                    throw new Error(`游戏ID ${data.game_id} 不存在`);
                }
            }
        }
        
        const sets = fields.map(key => `${key} = ?`).join(', ');
        const params = fields.map(key => (data as any)[key]);
        params.push(id);
        const sql = `UPDATE players SET ${sets} WHERE id = ?`;
        await pool.execute(sql, params);
    }

    /** 更新状态 */
    static async updateStatus(id: number, status: boolean): Promise<void> {
        const sql = `UPDATE players SET status = ? WHERE id = ?`;
        await pool.execute(sql, [status ? 1 : 0, id]);
    }

    /** 更新余额和提现金额 */
    static async updateFinancials(
        id: number,
        money: number,
        profit: number
    ): Promise<void> {
        const sql = `UPDATE players SET money = ?, profit = ? WHERE id = ?`;
        await pool.execute(sql, [money, profit, id]);
    }

    /** 更新录音路径 */
    static async updateVoice(id: number, voicePath: string | null): Promise<void> {
        const sql = `UPDATE players SET voice = ? WHERE id = ?`;
        await pool.execute(sql, [voicePath, id]);
    }

    /** 更新二维码图片路径 */
    static async updateQR(id: number, QR_img: string): Promise<void> {
        const sql = `UPDATE players SET QR_img = ? WHERE id = ?`;
        await pool.execute(sql, [QR_img, id]);
    }

    /** 更新密码 */
    static async updatePassword(id: number, newPassword: string): Promise<void> {
        const sql = `UPDATE players SET passwd = ? WHERE id = ?`;
        await pool.execute(sql, [newPassword, id]);
    }

    /** 删除玩家 */
    static async deleteById(id: number): Promise<void> {
        const sql = `DELETE FROM players WHERE id = ?`;
        await pool.execute(sql, [id]);
    }

    /** 统计玩家总数 */
    static async countAll(): Promise<number> {
        const sql = `SELECT COUNT(*) as cnt FROM players`;
        const [[{ cnt }]]: any = await pool.execute(sql);
        return cnt;
    }
}
