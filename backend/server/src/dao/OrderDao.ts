// src/dao/OrderDAO.ts
import { pool } from '../db';
import { GiftRecordDAO } from './GiftRecordDao';
export interface Order {
    order_id: string;
    user_id: number;
    player_id: number;
    game_id: number;
    status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
    created_at: string;
    service_id: number;
    amount: number; // 订单金额
    is_paid: boolean; // 是否已打款
    user_confirmed_end: boolean; // 用户确认结束
    player_confirmed_end: boolean; // 陪玩确认结束
}

export class OrderDAO {
    /**
     * 创建订单
     */
    static async create(order: {
        order_id: string;
        user_id: number;
        player_id: number;
        service_id?: number;
        amount?: number;
        status?: string;
    }) {
        let amount = order.amount || 0;
        let game_id = null;
        let service_id = order.service_id;
        
        // 如果提供了service_id，从服务表获取价格和游戏信息
        if (order.service_id) {
            const [[svc]]: any = await pool.execute(
                `SELECT price, hours, game_id FROM services WHERE id = ?`,
                [order.service_id]
            );
            if (svc) {
                amount = order.amount || (svc.price * svc.hours);
                game_id = svc.game_id;
            }
        }
        
        // 如果没有service_id，需要设置默认值
        if (!service_id || !game_id) {
            // 获取第一个可用的游戏和服务作为默认值
            const [[defaultGame]]: any = await pool.execute(
                `SELECT id FROM games LIMIT 1`
            );
            const [[defaultService]]: any = await pool.execute(
                `SELECT id FROM services WHERE services.player_id = ? LIMIT 1`,
                [order.player_id]
            );
            
            game_id = game_id || (defaultGame ? defaultGame.id : 1);
            service_id = service_id || (defaultService ? defaultService.id : 1);
        }
        
        const sql = `
            INSERT INTO orders (order_id, user_id, player_id, game_id, service_id, amount, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        await pool.execute(sql, [
            order.order_id,
            order.user_id,
            order.player_id,
            game_id,
            service_id,
            amount,
            order.status || 'pending'
        ]);
        return order.order_id;
    }

    /** 根据 order_id 查询单条订单 */
    static async findById(id: string): Promise<Order | null> {
        const sql = `SELECT * FROM orders WHERE order_id = ? LIMIT 1`;
        const [rows]: any = await pool.execute(sql, [id]);
        return rows[0] ?? null;
    }

    /** 根据 order_id 查询单条订单（别名方法） */
    static async findByOrderId(orderId: string): Promise<Order | null> {
        return this.findById(orderId);
    }

    /**
     * 创建已完成订单（陪玩专用）
     */
    static async createCompleted(order: {
        order_id: string;
        user_id: number;
        player_id: number;
        game_id: number;
        amount: number;
        status: string;
        service_hours: number;
        description: string;
        created_at: Date;
        // 新增匿名用户支持
        customer_name?: string;
        customer_phone?: string;
        customer_note?: string;
    }) {
        // 创建一个默认的服务记录（如果不存在）
        let service_id = null;
        
        // 尝试找到陪玩的现有服务
        const [[existingService]]: any = await pool.execute(
            `SELECT id FROM services WHERE player_id = ? AND game_id = ? LIMIT 1`,
            [order.player_id, order.game_id]
        );
        
        if (existingService) {
            service_id = existingService.id;
        } else {
            // 创建一个临时服务记录
            const hourlyRate = Math.round(order.amount / order.service_hours);
            const [serviceResult]: any = await pool.execute(
                `INSERT INTO services (player_id, game_id, price, hours, description) VALUES (?, ?, ?, ?, ?)`,
                [order.player_id, order.game_id, hourlyRate, order.service_hours, order.description]
            );
            service_id = serviceResult.insertId;
        }
        
        const sql = `
            INSERT INTO orders (
                order_id, user_id, player_id, game_id, service_id, 
                amount, status, created_at, customer_name, customer_phone, customer_note
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await pool.execute(sql, [
            order.order_id,
            order.user_id,
            order.player_id,
            order.game_id,
            service_id,
            order.amount,
            order.status,
            order.created_at,
            order.customer_name || null,
            order.customer_phone || null,
            order.customer_note || null
        ]);
        
        return order.order_id;
    }

    /** 分页查询订单，可按状态过滤，返回 { total, orders } */
    static async findAll(
        page: number = 1,
        pageSize: number = 20,
        status?: Order['status']
    ): Promise<{ total: number; orders: Order[] }> {
        try {
            const offset = (page - 1) * pageSize;
            let whereClause = '';
            const countParams: any[] = [];
            
            if (status) {
                whereClause = ` WHERE o.status = ?`;
                countParams.push(status);
            }
            
            // 获取总数
            const countSql = `SELECT COUNT(*) as cnt FROM orders o${whereClause}`;
            const [[{ cnt }]]: any = await pool.execute(countSql, countParams);

            // 获取数据，包含完整的关联信息
            const dataSql = `
                SELECT o.order_id as id, o.order_id, o.user_id, o.player_id, o.game_id, o.service_id, 
                       o.status, o.created_at, o.amount as price, o.is_paid,
                       o.customer_name, o.customer_phone, o.customer_note,
                       p.name as playerNickname, p.phone_num as playerUid, p.photo_img as player_avatar,
                       CASE 
                           WHEN o.user_id IS NULL THEN o.customer_name
                           ELSE u.name
                       END as userNickname,
                       CASE 
                           WHEN o.user_id IS NULL THEN o.customer_phone
                           ELSE u.phone_num
                       END as userUid,
                       CASE 
                           WHEN o.user_id IS NULL THEN NULL
                           ELSE u.photo_img
                       END as user_avatar,
                       g.name as gameType, s.price as servicePrice, s.hours,
                       DATE_FORMAT(o.created_at, '%Y-%m-%d %H:%i:%s') as orderTime,
                       CASE 
                           WHEN s.hours IS NOT NULL THEN CONCAT(s.hours, '小时')
                           ELSE '待定'
                       END as serviceTime,
                       COALESCE(gs.gift_count, 0) as gift_count,
                       COALESCE(gs.gift_total, 0) as gift_total,
                       COALESCE(gs.gift_details, '') as gift_details
                FROM orders o
                LEFT JOIN players p ON o.player_id = p.id
                LEFT JOIN users u ON o.user_id = u.id AND o.user_id IS NOT NULL
                LEFT JOIN games g ON o.game_id = g.id
                LEFT JOIN services s ON o.service_id = s.id
                LEFT JOIN (
                    SELECT 
                        gr.order_id,
                        SUM(gr.quantity) as gift_count,
                        SUM(gr.total_price) as gift_total,
                        GROUP_CONCAT(CONCAT(gi.name, ' x', gr.quantity) SEPARATOR ', ') as gift_details
                    FROM gift_records gr
                    LEFT JOIN gifts gi ON gr.gift_id = gi.id
                    WHERE gr.order_id IS NOT NULL
                    GROUP BY gr.order_id
                ) gs ON o.order_id = gs.order_id
                ${whereClause}
                ORDER BY o.created_at DESC 
                LIMIT ${pageSize} OFFSET ${offset}
            `;
            const [rows]: any = await pool.execute(dataSql, countParams);
            
            return { total: cnt, orders: rows };
        } catch (error) {
            console.error('OrderDAO.findAll error:', error);
            throw error;
        }
    }

    /** 更新订单状态 */
    static async updateStatus(
        id: string,
        status: Order['status']
    ): Promise<void> {
        const sql = `UPDATE orders SET status = ? WHERE order_id = ?`;
        await pool.execute(sql, [status, id]);
        
        // 如果订单状态更新为completed，更新陪玩余额
        if (status === 'completed') {
            await this.updatePlayerBalance(id);
        }
    }

    /** 更新订单打款状态 */
    static async updatePaymentStatus(
        id: string,
        isPaid: boolean
    ): Promise<void> {
        const sql = `UPDATE orders SET is_paid = ? WHERE order_id = ?`;
        await pool.execute(sql, [isPaid, id]);
    }

    /** 删除订单 */
    static async deleteById(id: string): Promise<void> {
        const sql = `DELETE FROM orders WHERE order_id = ?`;
        await pool.execute(sql, [id]);
    }

    /** 根据用户ID查询订单列表 */
    static async findByUserId(
        userId: number,
        status?: Order['status']
    ): Promise<Order[]> {
        let whereClause = 'WHERE o.user_id = ?';
        const params: any[] = [userId];
        
        if (status) {
            whereClause += ' AND o.status = ?';
            params.push(status);
        }
        
        const sql = `
            SELECT o.order_id, o.user_id, o.player_id, o.game_id, o.service_id, o.status, 
                   DATE_FORMAT(CONVERT_TZ(o.created_at, '+00:00', '+08:00'), '%Y-%m-%d %H:%i:%s') as orderTime,
                   o.amount, o.service_hours,
                   o.customer_name, o.customer_phone, o.customer_note,
                   p.name as player_name, p.photo_img as player_avatar,
                   CASE 
                       WHEN o.user_id IS NULL THEN o.customer_name
                       ELSE u.name
                   END as user_name,
                   CASE 
                       WHEN o.user_id IS NULL THEN NULL
                       ELSE u.photo_img
                   END as user_avatar,
                   g.name as game_name, s.price, s.hours,
                   CASE WHEN c.id IS NOT NULL THEN 1 ELSE 0 END as is_rated,
                   COALESCE(gs.gift_count, 0) as gift_count,
                   COALESCE(gs.gift_total, 0) as gift_total,
                   COALESCE(gs.gift_details, '') as gift_details
            FROM orders o
            LEFT JOIN players p ON o.player_id = p.id
            LEFT JOIN users u ON o.user_id = u.id AND o.user_id IS NOT NULL
            LEFT JOIN games g ON o.game_id = g.id
             LEFT JOIN services s ON o.service_id = s.id
             LEFT JOIN comments c ON o.order_id = c.order_id AND c.user_id = o.user_id
             LEFT JOIN (
                 SELECT 
                     gr.order_id,
                     SUM(gr.quantity) as gift_count,
                     SUM(gr.total_price) as gift_total,
                     GROUP_CONCAT(CONCAT(gi.name, ' x', gr.quantity) SEPARATOR ', ') as gift_details
                 FROM gift_records gr
                 LEFT JOIN gifts gi ON gr.gift_id = gi.id
                 WHERE gr.order_id IS NOT NULL
                 GROUP BY gr.order_id
             ) gs ON o.order_id = gs.order_id
            ${whereClause}
            ORDER BY o.created_at DESC
        `;
        const [rows]: any = await pool.execute(sql, params);
        return rows;
    }

    /** 根据陪玩ID查询订单列表 */
    static async findByPlayerId(
        playerId: number,
        status?: Order['status']
    ): Promise<Order[]> {
        console.log('=== OrderDAO.findByPlayerId 开始执行 ===');
        console.log('调用参数:', { playerId, status });
        console.log('当前时间:', new Date().toISOString());
        
        let whereClause = 'WHERE o.player_id = ?';
        const params: any[] = [playerId];
        
        if (status) {
            whereClause += ' AND o.status = ?';
            params.push(status);
        }
        
        const sql = `
            SELECT o.order_id, o.user_id, o.player_id, o.game_id, o.service_id, o.status, o.created_at, o.amount,
                   o.customer_name, o.customer_phone, o.customer_note,
                   p.name as player_name, p.photo_img as player_avatar,
                   CASE 
                       WHEN o.user_id IS NULL THEN o.customer_name
                       ELSE u.name
                   END as user_name,
                   CASE 
                       WHEN o.user_id IS NULL THEN NULL
                       ELSE u.photo_img
                   END as user_avatar,
                   g.name as game_name, s.price, s.hours,
                   COALESCE(gs.gift_count, 0) as gift_count,
                   COALESCE(gs.gift_total, 0) as gift_total,
                   COALESCE(gs.gift_details, '') as gift_details
            FROM orders o
            LEFT JOIN players p ON o.player_id = p.id
            LEFT JOIN users u ON o.user_id = u.id AND o.user_id IS NOT NULL
            LEFT JOIN games g ON o.game_id = g.id
            LEFT JOIN services s ON o.service_id = s.id
            LEFT JOIN (
                SELECT 
                    gr.order_id,
                    SUM(gr.quantity) as gift_count,
                    SUM(gr.total_price) as gift_total,
                    GROUP_CONCAT(CONCAT(gi.name, ' x', gr.quantity) SEPARATOR ', ') as gift_details
                FROM gift_records gr
                LEFT JOIN gifts gi ON gr.gift_id = gi.id
                WHERE gr.order_id IS NOT NULL
                GROUP BY gr.order_id
            ) gs ON o.order_id = gs.order_id
            ${whereClause}
            ORDER BY o.created_at DESC
        `;
        
        console.log('=== 准备执行SQL ===');
        console.log('SQL语句:', sql);
        console.log('SQL参数:', params);
        
        try {
            console.log('=== 开始执行数据库查询 ===');
            const [rows]: any = await pool.execute(sql, params);
            console.log('=== 查询执行成功 ===');
            console.log('查询结果行数:', rows.length);
            console.log('查询结果:', JSON.stringify(rows, null, 2));
            return rows;
        } catch (error) {
            console.error('=== SQL执行错误 ===');
            console.error('错误详情:', error);
            console.error('错误消息:', (error as any).message);
            console.error('错误代码:', (error as any).code);
            console.error('SQL状态:', (error as any).sqlState);
            throw error;
        }
    }

    /** 用户确认结束订单 */
    static async confirmEndByUser(orderId: string): Promise<void> {
        const sql = `UPDATE orders SET user_confirmed_end = 1 WHERE order_id = ?`;
        await pool.execute(sql, [orderId]);
        
        // 检查是否双方都确认了，如果是则更新状态为completed
        await this.checkAndCompleteOrder(orderId);
    }

    /** 陪玩确认结束订单 */
    static async confirmEndByPlayer(orderId: string): Promise<void> {
        const sql = `UPDATE orders SET player_confirmed_end = 1 WHERE order_id = ?`;
        await pool.execute(sql, [orderId]);
        
        // 检查是否双方都确认了，如果是则更新状态为completed
        await this.checkAndCompleteOrder(orderId);
    }

    /** 检查并完成订单（当双方都确认时） */
    private static async checkAndCompleteOrder(orderId: string): Promise<void> {
        const [[order]]: any = await pool.execute(
            `SELECT user_confirmed_end, player_confirmed_end, status FROM orders WHERE order_id = ?`,
            [orderId]
        );
        
        if (order && order.user_confirmed_end && order.player_confirmed_end && order.status !== 'completed' && order.status !== 'pending_review') {
            await this.updateStatus(orderId, 'pending_review');
        }
    }

    /** 重置确认状态（用于测试或管理员操作） */
    static async resetConfirmations(orderId: string): Promise<void> {
        const sql = `UPDATE orders SET user_confirmed_end = 0, player_confirmed_end = 0 WHERE order_id = ?`;
        await pool.execute(sql, [orderId]);
    }

    /** 统计订单总数 */
    static async countAll(): Promise<number> {
        const [[{ cnt }]]: any = await pool.execute(`SELECT COUNT(*) as cnt FROM orders`);
        return cnt;
    }

    /** 审核订单 */
    static async reviewOrder(
        orderId: string,
        approved: boolean,
        reviewerId: number,
        note?: string
    ): Promise<void> {
        const newStatus = approved ? 'completed' : 'cancelled';
        const sql = `
            UPDATE orders 
            SET status = ?, reviewed_by = ?, review_note = ?, reviewed_at = NOW() 
            WHERE order_id = ?
        `;
        await pool.execute(sql, [newStatus, reviewerId, note || null, orderId]);
        
        // 如果审核通过，结算该订单的礼物记录并更新陪玩余额
        if (approved) {
            try {
                await GiftRecordDAO.settleGiftsByOrderId(orderId);
                console.log(`订单 ${orderId} 审核通过，礼物记录已结算`);
            } catch (error) {
                console.error(`订单 ${orderId} 礼物记录结算失败:`, error);
                // 不抛出错误，避免影响订单审核流程
            }
            
            // 更新陪玩余额
            await this.updatePlayerBalance(orderId);
        }
    }

    /** 更新订单实际服务时长 */
    static async updateServiceHours(
        orderId: string,
        serviceHours: number
    ): Promise<void> {
        const sql = `UPDATE orders SET service_hours = ? WHERE order_id = ?`;
        await pool.execute(sql, [serviceHours, orderId]);
    }

    /** 更新陪玩余额（订单完成时） */
    private static async updatePlayerBalance(orderId: string): Promise<void> {
        try {
            // 获取订单信息
            const [[order]]: any = await pool.execute(
                `SELECT player_id, amount FROM orders WHERE order_id = ?`,
                [orderId]
            );
            
            if (!order) {
                console.error(`订单 ${orderId} 不存在`);
                return;
            }

            // 获取抽成率
            let commissionRate = 10; // 默认抽成率
            try {
                const [[config]]: any = await pool.execute(
                    'SELECT commission_rate FROM commission_config LIMIT 1'
                );
                if (config) {
                    commissionRate = parseFloat(config.commission_rate);
                }
            } catch (error) {
                console.log('使用默认抽成率10%');
            }

            // 计算订单收益（扣除平台抽成）
            const orderAmount = parseFloat(order.amount);
            const orderEarnings = orderAmount * (1 - commissionRate / 100);

            // 更新陪玩余额
            await pool.execute(
                'UPDATE players SET money = money + ? WHERE id = ?',
                [orderEarnings, order.player_id]
            );

            console.log(`订单 ${orderId} 完成，陪玩 ${order.player_id} 余额增加 ¥${orderEarnings.toFixed(2)}`);
        } catch (error) {
            console.error(`更新陪玩余额失败 (订单: ${orderId}):`, error);
            // 不抛出错误，避免影响订单完成流程
        }
    }
}
