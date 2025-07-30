"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigDAO = void 0;
// src/dao/ConfigDAO.ts
const db_1 = require("../db");
class ConfigDAO {
    static async getCommissionRate() {
        const [[row]] = await db_1.pool.execute(`SELECT commission_rate FROM platform_config ORDER BY id DESC LIMIT 1`);
        return row.commission_rate;
    }
    static async updateCommissionRate(rate) {
        await db_1.pool.execute(`UPDATE platform_config
         SET commission_rate = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = (SELECT id FROM (SELECT id FROM platform_config ORDER BY id DESC LIMIT 1) tmp)`, [rate]);
    }
}
exports.ConfigDAO = ConfigDAO;
