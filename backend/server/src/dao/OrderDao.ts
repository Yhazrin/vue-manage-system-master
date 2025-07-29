// src/dao/OrderDAO.ts
import { pool } from '../db';
export interface Order {
    order_id: string;
    user_id: number;
    player_id: number;
    game_id: number;
    status: '进行中' | '已完成' | '已取消';
    created_at: string;
    service_id: number;
    amount: number; // 订单金额
}

export class OrderDAO {
    /**
     * 创建订单
     */
    static async create(order: {
        order_id: string;
        user_id: number;
        player_id: number;
        game_id: number;
        service_id: number;
    }) {
        // 1) 先查 price, hours
        const [[svc]]: any = await pool.execute(
            `SELECT price, hours FROM services WHERE id = ?`,
            [order.service_id]
        );
        const amount = svc.price * svc.hours;
        const sql = `
      INSERT INTO orders (order_id, user_id, player_id, game_id, service_id, amount)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
        await pool.execute(sql, [
            order.order_id,
            order.user_id,
            order.player_id,
            order.game_id,
            order.service_id,
            amount
        ]);
        return order.order_id;
    }

    /** 根据 order_id 查询单条订单 */
    static async findById(id: string): Promise<Order | null> {
        const sql = `SELECT * FROM orders WHERE order_id = ? LIMIT 1`;
        const [rows]: any = await pool.execute(sql, [id]);
        return rows[0] ?? null;
    }

    /** 分页查询订单，可按状态过滤，返回 { total, orders } */
    static async findAll(
        page: number = 1,
        pageSize: number = 20,
        status?: Order['status']
    ): Promise<{ total: number; orders: Order[] }> {
        const offset = (page - 1) * pageSize;
        let where = '';
        const params: any[] = [];
        if (status) {
            where = ` WHERE status = ?`;
            params.push(status);
        }
        const countSql = `SELECT COUNT(*) as cnt FROM orders${where}`;
        const [[{ cnt }]]: any = await pool.execute(countSql, params);

        const dataSql = `
      SELECT * FROM orders${where}
      ORDER BY created_at DESC LIMIT ?, ?
    `;
        params.push(offset, pageSize);
        const [rows]: any = await pool.execute(dataSql, params);
        return { total: cnt, orders: rows };
    }

    /** 更新订单状态 */
    static async updateStatus(
        id: string,
        status: Order['status']
    ): Promise<void> {
        const sql = `UPDATE orders SET status = ? WHERE order_id = ?`;
        await pool.execute(sql, [status, id]);
    }

    /** 删除订单 */
    static async deleteById(id: string): Promise<void> {
        const sql = `DELETE FROM orders WHERE order_id = ?`;
        await pool.execute(sql, [id]);
    }

    /** 统计订单总数 */
    static async countAll(): Promise<number> {
        const [[{ cnt }]]: any = await pool.execute(`SELECT COUNT(*) as cnt FROM orders`);
        return cnt;
    }
}
