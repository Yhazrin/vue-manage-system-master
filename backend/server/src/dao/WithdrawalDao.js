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
exports.WithdrawalDAO = void 0;
// src/dao/WithdrawalDAO.ts
const db_1 = require("../db");
const ConfigDao_1 = require("./ConfigDao");
class WithdrawalDAO {
    /** 创建提现记录 */
    static create(withdrawal) {
        return __awaiter(this, void 0, void 0, function* () {
            // 1) 拿当前抽成率
            const rate = yield ConfigDao_1.ConfigDAO.getCommissionRate(); // e.g. 10
            const platform_fee = +(withdrawal.amount * rate / 100).toFixed(2);
            const sql = `
      INSERT INTO withdrawals (withdrawal_id, player_id, amount, platform_fee)
      VALUES (?, ?, ?, ?)
    `;
            yield db_1.pool.execute(sql, [
                withdrawal.withdrawal_id,
                withdrawal.player_id,
                withdrawal.amount,
                platform_fee,
            ]);
            return withdrawal.withdrawal_id;
        });
    }
    /** 根据提现 ID 查询 */
    static findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const sql = `SELECT * FROM withdrawals WHERE withdrawal_id = ? LIMIT 1`;
            const [rows] = yield db_1.pool.execute(sql, [id]);
            return (_a = rows[0]) !== null && _a !== void 0 ? _a : null;
        });
    }
    /** 根据玩家 ID 分页查询提现记录（支持状态筛选） */
    static findByPlayerId(player_id_1) {
        return __awaiter(this, arguments, void 0, function* (player_id, page = 1, pageSize = 20, status) {
            // 确保参数是有效的整数
            const validPage = Math.max(1, Math.floor(Number(page) || 1));
            const validPageSize = Math.max(1, Math.min(100, Math.floor(Number(pageSize) || 20)));
            const offset = (validPage - 1) * validPageSize;
            // 基础 SQL 和参数
            let sql = `SELECT * FROM withdrawals WHERE player_id = ?`;
            let countSql = `SELECT COUNT(*) as total FROM withdrawals WHERE player_id = ?`;
            const params = [player_id];
            const countParams = [player_id];
            // 如果有状态筛选，添加条件
            if (status) {
                sql += ` AND status = ?`;
                countSql += ` AND status = ?`;
                params.push(status);
                countParams.push(status);
            }
            // 添加排序和分页 - 使用字符串拼接而不是参数化查询
            sql += ` ORDER BY created_at DESC LIMIT ${validPageSize} OFFSET ${offset}`;
            // 执行查询
            const [rows] = yield db_1.pool.execute(sql, params);
            const [countResult] = yield db_1.pool.execute(countSql, countParams);
            return {
                list: rows,
                total: countResult[0].total
            };
        });
    }
    /** 分页查询并按状态过滤 */
    static findAll() {
        return __awaiter(this, arguments, void 0, function* (page = 1, pageSize = 20, status) {
            // 确保参数是有效的整数
            const validPage = Math.max(1, Math.floor(Number(page) || 1));
            const validPageSize = Math.max(1, Math.min(100, Math.floor(Number(pageSize) || 20)));
            const offset = (validPage - 1) * validPageSize;
            let where = '';
            const params = [];
            if (status) {
                where = ` WHERE status = ?`;
                params.push(status);
            }
            const countSql = `SELECT COUNT(*) as cnt FROM withdrawals${where}`;
            const [[{ cnt }]] = yield db_1.pool.execute(countSql, params);
            const dataSql = `
      SELECT * FROM withdrawals${where}
      ORDER BY created_at DESC LIMIT ${validPageSize} OFFSET ${offset}
    `;
            const [rows] = yield db_1.pool.execute(dataSql, params);
            return { total: cnt, withdrawals: rows };
        });
    }
}
exports.WithdrawalDAO = WithdrawalDAO;
