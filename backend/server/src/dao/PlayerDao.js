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
exports.PlayerDAO = void 0;
// src/dao/PlayerDAO.ts
const db_1 = require("../db");
class PlayerDAO {
    /** 插入新玩家，返回新生成的 id */
    static create(name, passwd, phone_num, game_id, QR_img, intro, photo_img) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `
            INSERT INTO players (name, passwd, phone_num, game_id, QR_img, intro, photo_img)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
            const [result] = yield db_1.pool.execute(sql, [
                name,
                passwd,
                phone_num,
                game_id || null,
                QR_img || null,
                intro || null,
                photo_img || null
            ]);
            return result.insertId;
        });
    }
    /** 根据 id 查询玩家 */
    static findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const sql = `SELECT * FROM players WHERE id = ? LIMIT 1`;
            const [rows] = yield db_1.pool.execute(sql, [id]);
            return (_a = rows[0]) !== null && _a !== void 0 ? _a : null;
        });
    }
    /** 根据 game_id 查询所有玩家 */
    static findByGameId(gameId) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `SELECT * FROM players WHERE game_id = ?`;
            const [rows] = yield db_1.pool.execute(sql, [gameId]);
            return rows;
        });
    }
    /** 根据昵称查询玩家 */
    static findByName(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `SELECT * FROM players WHERE name LIKE ?`;
            const [rows] = yield db_1.pool.execute(sql, [`%${name}%`]);
            return rows;
        });
    }
    /** 根据手机号查询玩家 */
    static findByPhoneNum(phoneNum) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const sql = `SELECT * FROM players WHERE phone_num = ? LIMIT 1`;
            const [rows] = yield db_1.pool.execute(sql, [phoneNum]);
            return (_a = rows[0]) !== null && _a !== void 0 ? _a : null;
        });
    }
    /** 分页查询玩家，可选按在线状态和关键词过滤 */
    static findAll() {
        return __awaiter(this, arguments, void 0, function* (page = 1, pageSize = 20, status, keyword) {
            // 确保参数是有效的整数
            const validPage = Math.max(1, Math.floor(Number(page) || 1));
            const validPageSize = Math.max(1, Math.min(100, Math.floor(Number(pageSize) || 20)));
            const offset = (validPage - 1) * validPageSize;
            let where = '';
            const params = [];
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
            const [[{ cnt }]] = yield db_1.pool.execute(countSql, params);
            // 数据查询 - 直接拼接LIMIT和OFFSET到SQL字符串中
            const dataSql = `
            SELECT * FROM players WHERE 1=1 ${where}
            ORDER BY created_at DESC
            LIMIT ${validPageSize} OFFSET ${offset}
        `;
            const [rows] = yield db_1.pool.execute(dataSql, params);
            return { total: cnt, players: rows };
        });
    }
    /** 更新玩家基础信息 */
    static updateById(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const fields = Object.keys(data);
            if (!fields.length)
                return;
            // 如果包含game_id，需要验证其是否存在
            if (data.game_id !== undefined) {
                if (data.game_id === null || data.game_id === 0) {
                    // 允许设置为null
                    data.game_id = null;
                }
                else {
                    // 验证game_id是否存在
                    const gameCheckSql = `SELECT id FROM games WHERE id = ?`;
                    const [gameRows] = yield db_1.pool.execute(gameCheckSql, [data.game_id]);
                    if (!gameRows.length) {
                        throw new Error(`游戏ID ${data.game_id} 不存在`);
                    }
                }
            }
            const sets = fields.map(key => `${key} = ?`).join(', ');
            const params = fields.map(key => data[key]);
            params.push(id);
            const sql = `UPDATE players SET ${sets} WHERE id = ?`;
            yield db_1.pool.execute(sql, params);
        });
    }
    /** 更新状态 */
    static updateStatus(id, status) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `UPDATE players SET status = ? WHERE id = ?`;
            yield db_1.pool.execute(sql, [status ? 1 : 0, id]);
        });
    }
    /** 更新余额和提现金额 */
    static updateFinancials(id, money, profit) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `UPDATE players SET money = ?, profit = ? WHERE id = ?`;
            yield db_1.pool.execute(sql, [money, profit, id]);
        });
    }
    /** 更新录音路径 */
    static updateVoice(id, voicePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `UPDATE players SET voice = ? WHERE id = ?`;
            yield db_1.pool.execute(sql, [voicePath, id]);
        });
    }
    /** 更新二维码图片路径 */
    static updateQR(id, QR_img) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `UPDATE players SET QR_img = ? WHERE id = ?`;
            yield db_1.pool.execute(sql, [QR_img, id]);
        });
    }
    /** 更新密码 */
    static updatePassword(id, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `UPDATE players SET passwd = ? WHERE id = ?`;
            yield db_1.pool.execute(sql, [newPassword, id]);
        });
    }
    /** 删除玩家 */
    static deleteById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `DELETE FROM players WHERE id = ?`;
            yield db_1.pool.execute(sql, [id]);
        });
    }
    /** 统计玩家总数 */
    static countAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `SELECT COUNT(*) as cnt FROM players`;
            const [[{ cnt }]] = yield db_1.pool.execute(sql);
            return cnt;
        });
    }
}
exports.PlayerDAO = PlayerDAO;
