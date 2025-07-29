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
exports.CommentDAO = void 0;
// src/dao/CommentDAO.ts
const db_1 = require("../db");
class CommentDAO {
    /** 插入新评论 */
    static create(c) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `
      INSERT INTO comments (user_id, player_id, order_id, content, rating)
      VALUES (?, ?, ?, ?, ?)
    `;
            const [result] = yield db_1.pool.execute(sql, [
                c.user_id,
                c.player_id,
                c.order_id,
                c.content,
                c.rating
            ]);
            return result.insertId;
        });
    }
    /** 根据评论 ID 查询 */
    static findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const sql = `SELECT * FROM comments WHERE id = ? LIMIT 1`;
            const [rows] = yield db_1.pool.execute(sql, [id]);
            return (_a = rows[0]) !== null && _a !== void 0 ? _a : null;
        });
    }
    /** 根据 order_id 查询该订单下所有评论 */
    static findByOrder(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `SELECT * FROM comments WHERE order_id = ?`;
            const [rows] = yield db_1.pool.execute(sql, [orderId]);
            return rows;
        });
    }
    /** 查询所有评论 */
    static findAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `SELECT * FROM comments ORDER BY created_at DESC`;
            const [rows] = yield db_1.pool.execute(sql, []);
            return rows;
        });
    }
    /** 统计评论总数 */
    static countAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const [[{ cnt }]] = yield db_1.pool.execute(`SELECT COUNT(*) as cnt FROM comments`);
            return cnt;
        });
    }
}
exports.CommentDAO = CommentDAO;
