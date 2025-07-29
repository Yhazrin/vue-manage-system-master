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
exports.GameDAO = void 0;
// src/dao/GameDAO.ts
const db_1 = require("../db");
class GameDAO {
    /** 创建新游戏 */
    static create(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `INSERT INTO games (name) VALUES (?)`;
            const [result] = yield db_1.pool.execute(sql, [name]);
            return result.insertId;
        });
    }
    /** 根据 name 模糊查询游戏 */
    static findByName(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `SELECT * FROM games WHERE name LIKE ?`;
            const [rows] = yield db_1.pool.execute(sql, [`%${name}%`]);
            return rows;
        });
    }
    /** 根据 ID 查询单个游戏 */
    static findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `SELECT * FROM games WHERE id = ?`;
            const [[row]] = yield db_1.pool.execute(sql, [id]);
            return row || null;
        });
    }
    /** 查询所有游戏 */
    static findAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `SELECT * FROM games ORDER BY name ASC`;
            const [rows] = yield db_1.pool.execute(sql);
            return rows;
        });
    }
    /** 更新游戏名称 */
    static updateById(id, name) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `UPDATE games SET name = ? WHERE id = ?`;
            yield db_1.pool.execute(sql, [name, id]);
        });
    }
    /** 删除游戏 */
    static deleteById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `DELETE FROM games WHERE id = ?`;
            yield db_1.pool.execute(sql, [id]);
        });
    }
    /** 统计游戏总数 */
    static countAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `SELECT COUNT(*) as cnt FROM games`;
            const [[{ cnt }]] = yield db_1.pool.execute(sql);
            return cnt;
        });
    }
}
exports.GameDAO = GameDAO;
