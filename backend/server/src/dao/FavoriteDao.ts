// backend/server/src/dao/FavoriteDao.ts
import { pool } from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface Favorite extends RowDataPacket {
  id: number;
  user_id: number;
  player_id: number;
  created_at: string;
}

export interface FavoriteWithPlayer extends RowDataPacket {
  id: number;
  user_id: number;
  player_id: number;
  created_at: string;
  player_name: string;
  player_photo_img: string;
  player_intro: string;
  player_status: number;
  player_game_id: number;
}

export class FavoriteDAO {
  /**
   * 添加收藏
   */
  static async addFavorite(userId: number, playerId: number): Promise<number> {
    const sql = `
      INSERT INTO favorites (user_id, player_id)
      VALUES (?, ?)
    `;
    
    const [result] = await pool.execute<ResultSetHeader>(sql, [userId, playerId]);
    return result.insertId;
  }

  /**
   * 移除收藏
   */
  static async removeFavorite(userId: number, playerId: number): Promise<boolean> {
    const sql = `
      DELETE FROM favorites 
      WHERE user_id = ? AND player_id = ?
    `;
    
    const [result] = await pool.execute<ResultSetHeader>(sql, [userId, playerId]);
    return result.affectedRows > 0;
  }

  /**
   * 检查是否已收藏
   */
  static async isFavorite(userId: number, playerId: number): Promise<boolean> {
    const sql = `
      SELECT 1 FROM favorites 
      WHERE user_id = ? AND player_id = ? 
      LIMIT 1
    `;
    
    const [rows] = await pool.execute<RowDataPacket[]>(sql, [userId, playerId]);
    return rows.length > 0;
  }

  /**
   * 获取用户的所有收藏（包含陪玩信息）
   */
  static async getUserFavorites(userId: number): Promise<FavoriteWithPlayer[]> {
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
    
    const [rows] = await pool.execute<FavoriteWithPlayer[]>(sql, [userId]);
    return rows;
  }

  /**
   * 获取用户收藏数量
   */
  static async getUserFavoriteCount(userId: number): Promise<number> {
    const sql = `
      SELECT COUNT(*) as count 
      FROM favorites 
      WHERE user_id = ?
    `;
    
    const [rows] = await pool.execute<RowDataPacket[]>(sql, [userId]);
    return rows[0]?.count || 0;
  }

  /**
   * 获取陪玩被收藏数量
   */
  static async getPlayerFavoriteCount(playerId: number): Promise<number> {
    const sql = `
      SELECT COUNT(*) as count 
      FROM favorites 
      WHERE player_id = ?
    `;
    
    const [rows] = await pool.execute<RowDataPacket[]>(sql, [playerId]);
    return rows[0]?.count || 0;
  }
}