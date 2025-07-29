// src/dao/ConfigDAO.ts
import { pool } from '../db';

export class ConfigDAO {
    static async getCommissionRate(): Promise<number> {
        const [[row]]: any = await pool.execute(
            `SELECT commission_rate FROM platform_config ORDER BY id DESC LIMIT 1`
        );
        return row.commission_rate;
    }
    static async updateCommissionRate(rate: number): Promise<void> {
        await pool.execute(
            `UPDATE platform_config
         SET commission_rate = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = (SELECT id FROM (SELECT id FROM platform_config ORDER BY id DESC LIMIT 1) tmp)`,
            [rate]
        );
    }
}
