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
exports.ServiceDAO = void 0;
// src/dao/ServiceDAO.ts
const db_1 = require("../db");
class ServiceDAO {
    /** 创建服务 */
    static create(s) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `INSERT INTO services (player_id, game_id, price, hours) VALUES (?, ?, ?, ?)`;
            const [result] = yield db_1.pool.execute(sql, [
                s.player_id,
                s.game_id,
                s.price,
                s.hours
            ]);
            return result.insertId;
        });
    }
    /** 根据 ID 查询服务 */
    static findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const sql = `SELECT * FROM services WHERE id = ? LIMIT 1`;
            const [rows] = yield db_1.pool.execute(sql, [id]);
            return (_a = rows[0]) !== null && _a !== void 0 ? _a : null;
        });
    }
    /** 分页查询服务 */
    static findAll() {
        return __awaiter(this, arguments, void 0, function* (page = 1, pageSize = 20) {
            const offset = (page - 1) * pageSize;
            // 总数
            const [[{ cnt }]] = yield db_1.pool.execute(`SELECT COUNT(*) as cnt FROM services`);
            // 数据
            const [rows] = yield db_1.pool.execute(`SELECT * FROM services ORDER BY created_at DESC LIMIT ${offset}, ${pageSize}`);
            return { total: cnt, services: rows };
        });
    }
    /** 根据陪玩ID查询服务列表 */
    static findByPlayerId(playerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `
            SELECT s.*, g.name as game_name 
            FROM services s 
            LEFT JOIN games g ON s.game_id = g.id 
            WHERE s.player_id = ? 
            ORDER BY s.created_at DESC
        `;
            const [rows] = yield db_1.pool.execute(sql, [playerId]);
            return rows;
        });
    }
    /** 更新服务 */
    static updateById(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const keys = Object.keys(data);
            if (!keys.length)
                return;
            const sets = keys.map(k => `${k} = ?`).join(', ');
            const params = keys.map(k => data[k]);
            params.push(id);
            const sql = `UPDATE services SET ${sets} WHERE id = ?`;
            yield db_1.pool.execute(sql, params);
        });
    }
    /** 删除服务 */
    static deleteById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `DELETE FROM services WHERE id = ?`;
            yield db_1.pool.execute(sql, [id]);
        });
    }
    /** 统计服务总数 */
    static countAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const [[{ cnt }]] = yield db_1.pool.execute(`SELECT COUNT(*) as cnt FROM services`);
            return cnt;
        });
    }
}
exports.ServiceDAO = ServiceDAO;
