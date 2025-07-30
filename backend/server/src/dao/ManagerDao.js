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
exports.ManagerDAO = void 0;
// src/dao/ManagerDAO.ts
const db_1 = require("../db");
class ManagerDAO {
    /**
     * 创建新管理员
     * @returns 新生成的管理员 ID
     */
    static create(name, passwd, phone_num, authority, photo_img) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `
            INSERT INTO managers
                (name, passwd, phone_num, status, authority, photo_img)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
            const [result] = yield db_1.pool.execute(sql, [
                name,
                passwd,
                phone_num,
                1,
                authority,
                photo_img || null
            ]);
            return result.insertId;
        });
    }
    /**
     * 根据 ID 查询管理员
     */
    static findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `SELECT * FROM managers WHERE id = ? LIMIT 1`;
            const [rows] = yield db_1.pool.execute(sql, [id]);
            if (!rows.length)
                return null;
            const m = rows[0];
            return Object.assign(Object.assign({}, m), { status: Boolean(m.status) });
        });
    }
    /**
     * 根据手机号查询管理员
     */
    static findByPhone(phone) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `SELECT * FROM managers WHERE phone_num = ? LIMIT 1`;
            const [rows] = yield db_1.pool.execute(sql, [phone]);
            if (!rows.length)
                return null;
            const m = rows[0];
            return Object.assign(Object.assign({}, m), { status: Boolean(m.status) });
        });
    }
    /**
     * 根据名称模糊查询管理员
     */
    static findByName(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `SELECT * FROM managers WHERE name LIKE ?`;
            const [rows] = yield db_1.pool.execute(sql, [`%${name}%`]);
            return rows.map((m) => (Object.assign(Object.assign({}, m), { status: Boolean(m.status) })));
        });
    }
    /**
     * 分页查询管理员列表，可选按状态、权限和关键字过滤
     */
    static findAll() {
        return __awaiter(this, arguments, void 0, function* (page = 1, pageSize = 20, status, authority, keyword) {
            const offset = (page - 1) * pageSize;
            let where = ' WHERE 1=1';
            const params = [];
            if (status !== undefined) {
                where += ' AND status = ?';
                params.push(status ? 1 : 0);
            }
            if (authority !== undefined) {
                where += ' AND authority = ?';
                params.push(authority);
            }
            if (keyword) {
                where += ' AND (name LIKE ? OR phone_num LIKE ?)';
                params.push(`%${keyword}%`, `%${keyword}%`);
            }
            // 查询总数
            const countSql = `SELECT COUNT(*) as cnt FROM managers${where}`;
            const [[{ cnt }]] = yield db_1.pool.execute(countSql, params);
            // 查询数据
            const dataSql = `
      SELECT * FROM managers${where}
      ORDER BY created_at DESC
      LIMIT ${offset}, ${pageSize}
    `;
            const [rows] = yield db_1.pool.execute(dataSql, params);
            const managers = rows.map((m) => (Object.assign(Object.assign({}, m), { status: Boolean(m.status) })));
            return { total: cnt, managers };
        });
    }
    /**
     * 更新管理员基本信息（name, phone_num, status, authority, photo_img）
     */
    static updateById(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const keys = Object.keys(data);
            if (!keys.length)
                return;
            const sets = keys.map(k => `${k} = ?`).join(', ');
            const params = keys.map(k => data[k]);
            params.push(id);
            const sql = `UPDATE managers SET ${sets} WHERE id = ?`;
            yield db_1.pool.execute(sql, params);
        });
    }
    /**
     * 更新启用/禁用状态
     */
    static updateStatus(id, status) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `UPDATE managers SET status = ? WHERE id = ?`;
            yield db_1.pool.execute(sql, [status ? 1 : 0, id]);
        });
    }
    /**
     * 更新权限等级
     */
    static updateAuthority(id, authority) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `UPDATE managers SET authority = ? WHERE id = ?`;
            yield db_1.pool.execute(sql, [authority, id]);
        });
    }
    /**
     * 更新密码
     */
    static updatePassword(id, passwd) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `UPDATE managers SET passwd = ? WHERE id = ?`;
            yield db_1.pool.execute(sql, [passwd, id]);
        });
    }
    /**
     * 删除管理员
     */
    static deleteById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `DELETE FROM managers WHERE id = ?`;
            yield db_1.pool.execute(sql, [id]);
        });
    }
    /**
     * 统计管理员总数
     */
    static countAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `SELECT COUNT(*) as cnt FROM managers`;
            const [[{ cnt }]] = yield db_1.pool.execute(sql);
            return cnt;
        });
    }
}
exports.ManagerDAO = ManagerDAO;
