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
            let amount = order.amount || 0;
            let game_id = null;
            let service_id = order.service_id;
            // 如果提供了service_id，从服务表获取价格和游戏信息
            if (order.service_id) {
                const [[svc]] = yield db_1.pool.execute(`SELECT price, hours, game_id FROM services WHERE id = ?`, [order.service_id]);
                if (svc) {
                    amount = order.amount || (svc.price * svc.hours);
                    game_id = svc.game_id;
                }
            }
            // 如果没有service_id，需要设置默认值
            if (!service_id || !game_id) {
                // 获取第一个可用的游戏和服务作为默认值
                const [[defaultGame]] = yield db_1.pool.execute(`SELECT id FROM games LIMIT 1`);
                const [[defaultService]] = yield db_1.pool.execute(`SELECT id FROM services WHERE player_id = ? LIMIT 1`, [order.player_id]);
                game_id = game_id || (defaultGame ? defaultGame.id : 1);
                service_id = service_id || (defaultService ? defaultService.id : 1);
            }
            const sql = `
            INSERT INTO orders (order_id, user_id, player_id, game_id, service_id, amount, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
            yield db_1.pool.execute(sql, [
                order.order_id,
                order.user_id,
                order.player_id,
                game_id,
                service_id,
                amount,
                order.status || '进行中'
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
    /** 根据用户ID查询订单列表 */
    static findByUserId(userId, status) {
        return __awaiter(this, void 0, void 0, function* () {
            let whereClause = 'WHERE user_id = ?';
            const params = [userId];
            if (status) {
                whereClause += ' AND status = ?';
                params.push(status);
            }
            const sql = `
            SELECT o.*, p.name as player_name, p.photo_img as player_avatar,
                   u.name as user_name, u.photo_img as user_avatar,
                   g.name as game_name, s.price, s.hours
            FROM orders o
            LEFT JOIN players p ON o.player_id = p.id
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN games g ON o.game_id = g.id
            LEFT JOIN services s ON o.service_id = s.id
            ${whereClause}
            ORDER BY o.created_at DESC
        `;
            const [rows] = yield db_1.pool.execute(sql, params);
            return rows;
        });
    }
    /** 根据陪玩ID查询订单列表 */
    static findByPlayerId(playerId, status) {
        return __awaiter(this, void 0, void 0, function* () {
            let whereClause = 'WHERE player_id = ?';
            const params = [playerId];
            if (status) {
                whereClause += ' AND status = ?';
                params.push(status);
            }
            const sql = `
            SELECT o.*, p.name as player_name, p.photo_img as player_avatar,
                   u.name as user_name, u.photo_img as user_avatar,
                   g.name as game_name, s.price, s.hours
            FROM orders o
            LEFT JOIN players p ON o.player_id = p.id
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN games g ON o.game_id = g.id
            LEFT JOIN services s ON o.service_id = s.id
            ${whereClause}
            ORDER BY o.created_at DESC
        `;
            const [rows] = yield db_1.pool.execute(sql, params);
            return rows;
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
