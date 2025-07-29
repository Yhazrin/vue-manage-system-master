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
exports.ConfigDAO = void 0;
// src/dao/ConfigDAO.ts
const db_1 = require("../db");
class ConfigDAO {
    static getCommissionRate() {
        return __awaiter(this, void 0, void 0, function* () {
            const [[row]] = yield db_1.pool.execute(`SELECT commission_rate FROM platform_config ORDER BY id DESC LIMIT 1`);
            return row.commission_rate;
        });
    }
    static updateCommissionRate(rate) {
        return __awaiter(this, void 0, void 0, function* () {
            yield db_1.pool.execute(`UPDATE platform_config
         SET commission_rate = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = (SELECT id FROM (SELECT id FROM platform_config ORDER BY id DESC LIMIT 1) tmp)`, [rate]);
        });
    }
}
exports.ConfigDAO = ConfigDAO;
