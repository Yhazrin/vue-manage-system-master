// src/dao/GiftRecordDAO.ts
import { pool } from '../db';
import { ConfigDAO } from './ConfigDao';

export interface GiftRecord {
    id: number;
    user_id: number | null;
    player_id: number;
    order_id?: string;
    gift_id: number;
    quantity: number;
    total_price: number;
    created_at: string;
}

export class GiftRecordDAO {
    /** 插入打赏记录 */
    static async create(record: {
        user_id: number | null;
        player_id: number;
        order_id?: string;
        gift_id: number;
        quantity: number;
    }) {
        // 1) 拿礼物单价
        const [[gift]]: any = await pool.execute(
            `SELECT price FROM gifts WHERE id = ?`,
            [record.gift_id]
        );
        const total_price = gift.price * record.quantity;

        // 2) 算抽成 - 使用礼物专用抽成率
        const rate = await ConfigDAO.getGiftCommissionRate();
        const platform_fee = +(total_price * rate / 100).toFixed(2);

        // 3) 插入打赏记录，但不立即更新陪玩收益
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            
            // 检查订单状态，只有已完成的订单才立即结算收益
            let shouldSettleImmediately = false;
            if (record.order_id && record.order_id.trim() !== '') {
                const [[order]]: any = await connection.execute(
                    `SELECT status FROM orders WHERE order_id = ?`,
                    [record.order_id]
                );
                shouldSettleImmediately = order && order.status === 'completed';
            } else if (!record.order_id || record.order_id.trim() === '') {
                // 没有关联订单的礼物（如直接打赏）立即结算
                shouldSettleImmediately = true;
            }
            
            const sql = `
                INSERT INTO gift_records (user_id, player_id, order_id, gift_id, quantity, total_price, platform_fee, is_settled)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const [result]: any = await connection.execute(sql, [
                record.user_id,
                record.player_id,
                record.order_id || null,
                record.gift_id,
                record.quantity,
                total_price,
                platform_fee,
                shouldSettleImmediately ? 1 : 0
            ]);
            
            // 只有在应该立即结算时才更新陪玩余额
            if (shouldSettleImmediately) {
                const playerEarning = total_price - platform_fee;
                
                const updatePlayerSql = `
                    UPDATE players 
                    SET money = money + ? 
                    WHERE id = ?
                `;
                await connection.execute(updatePlayerSql, [playerEarning, record.player_id]);
                
                console.log(`礼物记录 ${result.insertId} 创建并立即结算，陪玩 ${record.player_id} 获得收益: ${playerEarning} 元（礼物总价: ${total_price}，平台抽成: ${platform_fee}，抽成率: ${rate}%）`);
            } else {
                console.log(`礼物记录 ${result.insertId} 创建，等待订单完成后结算（礼物总价: ${total_price}，平台抽成: ${platform_fee}，抽成率: ${rate}%）`);
            }
            
            await connection.commit();
            return result.insertId;
        } catch (error) {
            await connection.rollback();
            console.error('创建礼物记录失败:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    /** 根据 ID 查询 */
    static async findById(id: number): Promise<GiftRecord | null> {
        const sql = `SELECT * FROM gift_records WHERE id = ? LIMIT 1`;
        const [rows]: any = await pool.execute(sql, [id]);
        return rows[0] ?? null;
    }

    /** 查询某用户的所有打赏记录 */
    static async findAllByUser(
        userId: number
    ): Promise<GiftRecord[]> {
        const sql = `SELECT * FROM gift_records WHERE user_id = ? ORDER BY created_at DESC`;
        const [rows]: any = await pool.execute(sql, [userId]);
        return rows;
    }

    /** 统计所有打赏记录数 */
    static async countAll(): Promise<number> {
        const [[{ cnt }]]: any = await pool.execute(`SELECT COUNT(*) as cnt FROM gift_records`);
        return cnt;
    }

    /** 结算指定订单的未结算礼物记录 */
    static async settleGiftsByOrderId(orderId: string): Promise<void> {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            
            // 查找该订单的未结算礼物记录
            const [unsettledGifts]: any = await connection.execute(
                `SELECT id, player_id, total_price, platform_fee FROM gift_records 
                 WHERE order_id = ? AND is_settled = 0`,
                [orderId]
            );
            
            if (unsettledGifts.length === 0) {
                await connection.commit();
                return;
            }
            
            // 计算总收益
            let totalPlayerEarning = 0;
            const giftIds: number[] = [];
            
            for (const gift of unsettledGifts) {
                const playerEarning = gift.total_price - gift.platform_fee;
                totalPlayerEarning += playerEarning;
                giftIds.push(gift.id);
            }
            
            // 更新陪玩余额
            if (totalPlayerEarning > 0 && unsettledGifts.length > 0) {
                const playerId = unsettledGifts[0].player_id;
                const updatePlayerSql = `
                    UPDATE players 
                    SET money = money + ? 
                    WHERE id = ?
                `;
                await connection.execute(updatePlayerSql, [totalPlayerEarning, playerId]);
                
                // 标记礼物记录为已结算
                const updateGiftsSql = `
                    UPDATE gift_records 
                    SET is_settled = 1 
                    WHERE id IN (${giftIds.map(() => '?').join(',')})
                `;
                await connection.execute(updateGiftsSql, giftIds);
                
                console.log(`订单 ${orderId} 的礼物记录已结算，陪玩 ${playerId} 获得收益: ${totalPlayerEarning} 元（共 ${unsettledGifts.length} 个礼物记录）`);
            }
            
            await connection.commit();
        } catch (error) {
            await connection.rollback();
            console.error('结算礼物记录失败:', error);
            throw error;
        } finally {
            connection.release();
        }
    }
}