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
exports.UserDAO = void 0;
// src/dao/UserDAO.ts
const db_1 = require("../db");
class UserDAO {
    /** 插入新用户，返回新生成的 id */
    static create(name_1, passwd_1, phone_num_1, photo_img_1) {
        return __awaiter(this, arguments, void 0, function* (name, passwd, phone_num, photo_img, role = 'user') {
            const sql = `
            INSERT INTO users (name, passwd, phone_num, photo_img, role)
            VALUES (?, ?, ?, ?, ?)
        `;
            const [result] = yield db_1.pool.execute(sql, [
                name,
                passwd,
                phone_num,
                photo_img || null,
                role,
            ]);
            return result.insertId;
        });
    }
    /** 根据主键 id 查询用户 */
    static findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const sql = `SELECT * FROM users WHERE id = ? LIMIT 1`;
            const [rows] = yield db_1.pool.execute(sql, [id]);
            return (_a = rows[0]) !== null && _a !== void 0 ? _a : null;
        });
    }
    /** 根据手机号查询用户 */
    static findByPhone(phone) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const sql = `SELECT * FROM users WHERE phone_num = ? LIMIT 1`;
            const [rows] = yield db_1.pool.execute(sql, [phone]);
            return (_a = rows[0]) !== null && _a !== void 0 ? _a : null;
        });
    }
    /** 根据用户名查询用户 */
    static findByName(name) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const sql = `SELECT * FROM users WHERE name = ? LIMIT 1`;
            const [rows] = yield db_1.pool.execute(sql, [name]);
            return (_a = rows[0]) !== null && _a !== void 0 ? _a : null;
        });
    }
    /** 分页查询所有用户，可选按状态或关键字过滤
     *  大概率不会使用 */
    static findAll() {
        return __awaiter(this, arguments, void 0, function* (page = 1, pageSize = 20, status, keyword) {
            const offset = (page - 1) * pageSize;
            let where = '';
            const params = [];
            if (status !== undefined) {
                where += ` AND status = ?`;
                params.push(status ? 1 : 0);
            }
            if (keyword) {
                where += ` AND (name LIKE ? OR phone_num LIKE ?)`;
                params.push(`%${keyword}%`, `%${keyword}%`);
            }
            // 总数
            const countSql = `SELECT COUNT(*) as cnt FROM users WHERE 1=1 ${where}`;
            const [[{ cnt }]] = yield db_1.pool.execute(countSql, params);
            // 数据
            const dataSql = `
      SELECT * FROM users WHERE 1=1 ${where}
      ORDER BY created_at DESC
      LIMIT ${offset}, ${pageSize}
    `;
            const [rows] = yield db_1.pool.execute(dataSql, params);
            return { total: cnt, users: rows };
        });
    }
    /** 更新用户基本信息（除密码外） */
    static updateById(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const fields = Object.keys(data);
            if (!fields.length)
                return;
            const sets = fields.map(key => `${key} = ?`).join(', ');
            const params = fields.map(key => data[key]);
            params.push(id);
            const sql = `UPDATE users SET ${sets} WHERE id = ?`;
            yield db_1.pool.execute(sql, params);
        });
    }
    /** 更新密码 */
    static updatePassword(id, newPasswd) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `UPDATE users SET passwd = ? WHERE id = ?`;
            yield db_1.pool.execute(sql, [newPasswd, id]);
        });
    }
    /** 更新状态 */
    static updateStatus(id, status) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `UPDATE users SET status = ? WHERE id = ?`;
            yield db_1.pool.execute(sql, [status ? 1 : 0, id]);
        });
    }
    /** 删除用户 */
    static deleteById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `DELETE FROM users WHERE id = ?`;
            yield db_1.pool.execute(sql, [id]);
        });
    }
    /** 统计用户数量 */
    static countAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `SELECT COUNT(*) as cnt FROM users`;
            const [[{ cnt }]] = yield db_1.pool.execute(sql);
            return cnt;
        });
    }
}
exports.UserDAO = UserDAO;
