// src/dao/ConfigDAO.ts
import { pool } from '../db';

export interface CommissionRates {
    order_commission_rate: number;
    gift_commission_rate: number;
}

export class ConfigDAO {
    // 保留原方法以保证向后兼容性
    static async getCommissionRate(): Promise<number> {
        const [[row]]: any = await pool.execute(
            `SELECT commission_rate FROM platform_config ORDER BY id DESC LIMIT 1`
        );
        return row.commission_rate;
    }
    
    // 获取订单抽成率
    static async getOrderCommissionRate(): Promise<number> {
        const [[row]]: any = await pool.execute(
            `SELECT order_commission_rate FROM platform_config ORDER BY id DESC LIMIT 1`
        );
        return row.order_commission_rate;
    }
    
    // 获取礼物抽成率
    static async getGiftCommissionRate(): Promise<number> {
        const [[row]]: any = await pool.execute(
            `SELECT gift_commission_rate FROM platform_config ORDER BY id DESC LIMIT 1`
        );
        return row.gift_commission_rate;
    }
    
    // 获取所有抽成率
    static async getCommissionRates(): Promise<CommissionRates> {
        const [[row]]: any = await pool.execute(
            `SELECT order_commission_rate, gift_commission_rate FROM platform_config ORDER BY id DESC LIMIT 1`
        );
        return {
            order_commission_rate: row.order_commission_rate,
            gift_commission_rate: row.gift_commission_rate
        };
    }
    
    // 保留原方法以保证向后兼容性
    static async updateCommissionRate(rate: number): Promise<void> {
        await pool.execute(
            `UPDATE platform_config
         SET commission_rate = ?, order_commission_rate = ?, gift_commission_rate = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = (SELECT id FROM (SELECT id FROM platform_config ORDER BY id DESC LIMIT 1) tmp)`,
            [rate, rate, rate]
        );
    }
    
    // 分别更新订单抽成率
    static async updateOrderCommissionRate(rate: number): Promise<void> {
        await pool.execute(
            `UPDATE platform_config
         SET order_commission_rate = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = (SELECT id FROM (SELECT id FROM platform_config ORDER BY id DESC LIMIT 1) tmp)`,
            [rate]
        );
    }
    
    // 分别更新礼物抽成率
    static async updateGiftCommissionRate(rate: number): Promise<void> {
        await pool.execute(
            `UPDATE platform_config
         SET gift_commission_rate = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = (SELECT id FROM (SELECT id FROM platform_config ORDER BY id DESC LIMIT 1) tmp)`,
            [rate]
        );
    }
    
    // 同时更新两个抽成率
    static async updateCommissionRates(orderRate: number, giftRate: number): Promise<void> {
        await pool.execute(
            `UPDATE platform_config
         SET order_commission_rate = ?, gift_commission_rate = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = (SELECT id FROM (SELECT id FROM platform_config ORDER BY id DESC LIMIT 1) tmp)`,
            [orderRate, giftRate]
        );
    }
}
