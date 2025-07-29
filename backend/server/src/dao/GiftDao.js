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
exports.GiftDAO = void 0;
// src/dao/GiftDAO.ts
const db_1 = require("../db");
class GiftDAO {
    /** 创建礼物 */
    static create(g) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `INSERT INTO gifts (name, price, image_url) VALUES (?, ?, ?, ?)`;
            const [result] = yield db_1.pool.execute(sql, [
                g.name,
                g.price,
                g.image_url
            ]);
            return result.insertId;
        });
    }
    /** 按 ID 查询礼物 */
    static findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const sql = `SELECT * FROM gifts WHERE id = ? LIMIT 1`;
            const [rows] = yield db_1.pool.execute(sql, [id]);
            return (_a = rows[0]) !== null && _a !== void 0 ? _a : null;
        });
    }
    /** 查询所有礼物 */
    static findAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `SELECT * FROM gifts ORDER BY id ASC`;
            const [rows] = yield db_1.pool.execute(sql);
            return rows;
        });
    }
    /** 更新礼物（可部分更新） */
    static update(id, g) {
        return __awaiter(this, void 0, void 0, function* () {
            const fields = [];
            const params = [];
            if (g.name !== undefined) {
                fields.push('name = ?');
                params.push(g.name);
            }
            if (g.price !== undefined) {
                fields.push('price = ?');
                params.push(g.price);
            }
            if (g.image_url !== undefined) {
                fields.push('image_url = ?');
                params.push(g.image_url);
            }
            if (fields.length === 0) {
                return;
            }
            const sql = `UPDATE gifts SET ${fields.join(', ')} WHERE id = ?`;
            params.push(id);
            yield db_1.pool.execute(sql, params);
        });
    }
    /** 按名称模糊查询礼物 */
    static findByNameLike(keyword) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `SELECT * FROM gifts WHERE name LIKE ? ORDER BY id ASC`;
            const [rows] = yield db_1.pool.execute(sql, [`%${keyword}%`]);
            return rows;
        });
    }
    /** 按 ID 删除礼物 */
    static deleteById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `DELETE FROM gifts WHERE id = ?`;
            yield db_1.pool.execute(sql, [id]);
        });
    }
    /** 计算礼物总数 */
    static countAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const [[{ cnt }]] = yield db_1.pool.execute(`SELECT COUNT(*) as cnt FROM gifts`);
            return cnt;
        });
    }
}
exports.GiftDAO = GiftDAO;
