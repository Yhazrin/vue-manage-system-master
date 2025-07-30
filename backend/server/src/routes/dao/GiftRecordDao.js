"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GiftRecordDAO = void 0;
// src/dao/GiftRecordDAO.ts
const db_1 = require("../db");
const ConfigDao_1 = require("./ConfigDao");
class GiftRecordDAO {
    /** 插入打赏记录 */
    static async create(record) {
        // 1) 拿礼物单价
        const [[gift]] = await db_1.pool.execute(`SELECT price FROM gifts WHERE id = ?`, [record.gift_id]);
        const total_price = gift.price * record.quantity;
        // 2) 算抽成
        const rate = await ConfigDao_1.ConfigDAO.getCommissionRate();
        const platform_fee = +(total_price * rate / 100).toFixed(2);
        // 3) 插入打赏记录
        const sql = `
      INSERT INTO gift_records (user_id, player_id, gift_id, quantity, total_price)
      VALUES (?, ?, ?, ?, ?)
    `;
        const [result] = await db_1.pool.execute(sql, [
            record.user_id,
            record.player_id,
            record.gift_id,
            record.quantity,
            total_price,
            platform_fee,
        ]);
        return result.insertId;
    }
    /** 根据 ID 查询 */
    static async findById(id) {
        const sql = `SELECT * FROM gift_records WHERE id = ? LIMIT 1`;
        const [rows] = await db_1.pool.execute(sql, [id]);
        return rows[0] ?? null;
    }
    /** 查询某用户的所有打赏记录 */
    static async findAllByUser(userId) {
        const sql = `SELECT * FROM gift_records WHERE user_id = ? ORDER BY created_at DESC`;
        const [rows] = await db_1.pool.execute(sql, [userId]);
        return rows;
    }
    /** 统计所有打赏记录数 */
    static async countAll() {
        const [[{ cnt }]] = await db_1.pool.execute(`SELECT COUNT(*) as cnt FROM gift_records`);
        return cnt;
    }
}
exports.GiftRecordDAO = GiftRecordDAO;
