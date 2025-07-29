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
exports.OrderDAO = void 0;
// src/dao/OrderDAO.ts
const db_1 = require("../db");
class OrderDAO {
    /**
     * 创建订单
     */
    static create(order) {
        return __awaiter(this, void 0, void 0, function* () {
            // 1) 先查 price, hours
            const [[svc]] = yield db_1.pool.execute(`SELECT price, hours FROM services WHERE id = ?`, [order.service_id]);
            const amount = svc.price * svc.hours;
            const sql = `
      INSERT INTO orders (order_id, user_id, player_id, game_id, service_id, amount)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
            yield db_1.pool.execute(sql, [
                order.order_id,
                order.user_id,
                order.player_id,
                order.game_id,
                order.service_id,
                amount
            ]);
            return order.order_id;
        });
    }
    /** 根据 order_id 查询单条订单 */
    static findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const sql = `SELECT * FROM orders WHERE order_id = ? LIMIT 1`;
            const [rows] = yield db_1.pool.execute(sql, [id]);
            return (_a = rows[0]) !== null && _a !== void 0 ? _a : null;
        });
    }
    /** 分页查询订单，可按状态过滤，返回 { total, orders } */
    static findAll() {
        return __awaiter(this, arguments, void 0, function* (page = 1, pageSize = 20, status) {
            try {
                const offset = (page - 1) * pageSize;
                let whereClause = '';
                const countParams = [];
                if (status) {
                    whereClause = ` WHERE status = ?`;
                    countParams.push(status);
                }
                // 获取总数
                const countSql = `SELECT COUNT(*) as cnt FROM orders${whereClause}`;
                const [[{ cnt }]] = yield db_1.pool.execute(countSql, countParams);
                // 获取数据，使用固定的LIMIT值而不是参数
                const dataSql = `
                SELECT * FROM orders${whereClause}
                ORDER BY created_at DESC 
                LIMIT ${pageSize} OFFSET ${offset}
            `;
                const [rows] = yield db_1.pool.execute(dataSql, countParams);
                return { total: cnt, orders: rows };
            }
            catch (error) {
                console.error('OrderDAO.findAll error:', error);
                throw error;
            }
        });
    }
    /** 更新订单状态 */
    static updateStatus(id, status) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `UPDATE orders SET status = ? WHERE order_id = ?`;
            yield db_1.pool.execute(sql, [status, id]);
        });
    }
    /** 删除订单 */
    static deleteById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `DELETE FROM orders WHERE order_id = ?`;
            yield db_1.pool.execute(sql, [id]);
        });
    }
    /** 统计订单总数 */
    static countAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const [[{ cnt }]] = yield db_1.pool.execute(`SELECT COUNT(*) as cnt FROM orders`);
            return cnt;
        });
    }
}
exports.OrderDAO = OrderDAO;
