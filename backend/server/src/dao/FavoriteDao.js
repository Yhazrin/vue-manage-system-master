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
exports.FavoriteDAO = void 0;
// backend/server/src/dao/FavoriteDao.ts
const db_1 = require("../db");
class FavoriteDAO {
    /**
     * 添加收藏
     */
    static addFavorite(userId, playerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `
      INSERT INTO favorites (user_id, player_id)
      VALUES (?, ?)
    `;
            const [result] = yield db_1.pool.execute(sql, [userId, playerId]);
            return result.insertId;
        });
    }
    /**
     * 移除收藏
     */
    static removeFavorite(userId, playerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `
      DELETE FROM favorites 
      WHERE user_id = ? AND player_id = ?
    `;
            const [result] = yield db_1.pool.execute(sql, [userId, playerId]);
            return result.affectedRows > 0;
        });
    }
    /**
     * 检查是否已收藏
     */
    static isFavorite(userId, playerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `
      SELECT 1 FROM favorites 
      WHERE user_id = ? AND player_id = ? 
      LIMIT 1
    `;
            const [rows] = yield db_1.pool.execute(sql, [userId, playerId]);
            return rows.length > 0;
        });
    }
    /**
     * 获取用户的所有收藏（包含陪玩信息）
     */
    static getUserFavorites(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `
      SELECT 
        f.id,
        f.user_id,
        f.player_id,
        f.created_at,
        p.name as player_name,
        p.photo_img as player_photo_img,
        p.intro as player_intro,
        p.status as player_status,
        p.game_id as player_game_id
      FROM favorites f
      JOIN players p ON f.player_id = p.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `;
            const [rows] = yield db_1.pool.execute(sql, [userId]);
            return rows;
        });
    }
    /**
     * 获取用户收藏数量
     */
    static getUserFavoriteCount(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const sql = `
      SELECT COUNT(*) as count 
      FROM favorites 
      WHERE user_id = ?
    `;
            const [rows] = yield db_1.pool.execute(sql, [userId]);
            return ((_a = rows[0]) === null || _a === void 0 ? void 0 : _a.count) || 0;
        });
    }
    /**
     * 获取陪玩被收藏数量
     */
    static getPlayerFavoriteCount(playerId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const sql = `
      SELECT COUNT(*) as count 
      FROM favorites 
      WHERE player_id = ?
    `;
            const [rows] = yield db_1.pool.execute(sql, [playerId]);
            return ((_a = rows[0]) === null || _a === void 0 ? void 0 : _a.count) || 0;
        });
    }
}
exports.FavoriteDAO = FavoriteDAO;
