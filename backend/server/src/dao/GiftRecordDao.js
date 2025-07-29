"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GiftRecordDAO = void 0;
// src/dao/GiftRecordDAO.ts
const db_1 = require("../db");
const ConfigDao_1 = require("./ConfigDao");
class GiftRecordDAO {
    /** 插入打赏记录 */
    static create(record) {
        return __awaiter(this, void 0, void 0, function* () {
            // 1) 拿礼物单价
            const [[gift]] = yield db_1.pool.execute(`SELECT price FROM gifts WHERE id = ?`, [record.gift_id]);
            const total_price = gift.price * record.quantity;
            // 2) 算抽成
            const rate = yield ConfigDao_1.ConfigDAO.getCommissionRate();
            const platform_fee = +(total_price * rate / 100).toFixed(2);
            // 3) 插入打赏记录
            const sql = `
      INSERT INTO gift_records (user_id, player_id, gift_id, quantity, total_price)
      VALUES (?, ?, ?, ?, ?)
    `;
            const [result] = yield db_1.pool.execute(sql, [
                record.user_id,
                record.player_id,
                record.gift_id,
                record.quantity,
                total_price,
                platform_fee,
            ]);
            return result.insertId;
        });
    }
    /** 根据 ID 查询 */
    static findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const sql = `SELECT * FROM gift_records WHERE id = ? LIMIT 1`;
            const [rows] = yield db_1.pool.execute(sql, [id]);
            return (_a = rows[0]) !== null && _a !== void 0 ? _a : null;
        });
    }
    /** 查询某用户的所有打赏记录 */
    static findAllByUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `SELECT * FROM gift_records WHERE user_id = ? ORDER BY created_at DESC`;
            const [rows] = yield db_1.pool.execute(sql, [userId]);
            return rows;
        });
    }
    /** 统计所有打赏记录数 */
    static countAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const [[{ cnt }]] = yield db_1.pool.execute(`SELECT COUNT(*) as cnt FROM gift_records`);
            return cnt;
        });
    }
}
exports.GiftRecordDAO = GiftRecordDAO;
