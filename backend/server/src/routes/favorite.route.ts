// backend/server/src/routes/favorite.route.ts
import { Router } from 'express';
import { FavoriteDAO } from '../dao/FavoriteDAO';
import { auth, AuthRequest } from '../middleware/auth';
import { Request, Response, NextFunction } from 'express';
import { param, validationResult } from 'express-validator';

const router = Router();

// 根路径 - 返回可用的收藏接口
router.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: '收藏API',
    endpoints: {
      getUserFavorites: 'GET /api/favorites',
      addFavorite: 'POST /api/favorites',
      removeFavorite: 'DELETE /api/favorites/:playerId',
      checkFavorite: 'GET /api/favorites/check/:playerId'
    }
  });
});

/**
 * 获取用户收藏列表
 */
router.get('/list', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    console.log('🔍 获取用户收藏列表，用户ID:', userId);
    const favorites = await FavoriteDAO.getUserFavorites(userId);
    console.log('📋 查询到的收藏数量:', favorites.length);
    
    // 获取游戏和服务信息
    const { GameDAO } = require('../dao/GameDao');
    const { ServiceDAO } = require('../dao/ServiceDao');
    const games = await GameDAO.findAll();
    const gameMap = new Map(games.map((game: any) => [game.id, game.name]));
    
    // 为每个收藏的陪玩获取服务和价格信息
    const { CommentDAO } = require('../dao/CommentDao');
    const formattedFavorites = await Promise.all(favorites.map(async (fav) => {
      // 获取该陪玩的所有服务
      const services = await ServiceDAO.findByPlayerId(fav.player_id);
      
      // 获取该陪玩的评论统计
      const comments = await CommentDAO.findByPlayerId(fav.player_id);
      const reviewCount = comments.length;
      const averageRating = reviewCount > 0 
        ? (comments.reduce((sum: number, comment: any) => sum + comment.rating, 0) / reviewCount).toFixed(1)
        : 5.0;
      
      // 提取服务中的游戏名称，去重
      const serviceGames = [...new Set(services.map((service: any) => service.game_name).filter(Boolean))];
      
      // 如果没有服务，则使用个人资料中的游戏
      const playerGames = serviceGames.length > 0 
        ? serviceGames 
        : (fav.player_game_id ? [gameMap.get(fav.player_game_id) || '未知游戏'] : []);
      
      // 计算最低价格
      const prices = services.map((service: any) => service.price).filter(Boolean);
      const minPrice = prices.length > 0 ? Math.min(...prices) : null;
      
      // 提取服务名称
      const serviceNames = services.map((service: any) => service.game_name).filter(Boolean);
      
      return {
        favoriteId: fav.id,
        favoritedAt: fav.created_at,
        player: {
          id: fav.player_id,
          name: fav.player_name,
          photo_img: fav.player_photo_img,
          intro: fav.player_intro,
          status: fav.player_status,
          game_id: fav.player_game_id,
          games: playerGames,
          services: serviceNames,
          price: minPrice,
          rating: Number(averageRating),
          reviews: reviewCount
        }
      };
    }));
    
    res.json({
      success: true,
      data: formattedFavorites
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 添加收藏
 */
router.post('/', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { playerId } = req.body;
    
    console.log('➕ 添加收藏请求，用户ID:', userId, '陪玩ID:', playerId);
    
    if (!playerId) {
      return res.status(400).json({
        success: false,
        error: '缺少陪玩ID'
      });
    }
    
    // 检查是否已经收藏
    const isAlreadyFavorite = await FavoriteDAO.isFavorite(userId, playerId);
    if (isAlreadyFavorite) {
      return res.status(400).json({
        success: false,
        error: '已经收藏过该陪玩'
      });
    }
    
    const favoriteId = await FavoriteDAO.addFavorite(userId, playerId);
    
    res.json({
      success: true,
      message: '收藏成功',
      data: { favoriteId }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 移除收藏
 */
router.delete('/:playerId', 
  auth,
  param('playerId').isInt({ min: 1 }).withMessage('陪玩ID必须是正整数'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: '参数验证失败',
          details: errors.array()
        });
      }
      
      const userId = req.user!.id;
      const playerId = parseInt(req.params.playerId);
      
      const removed = await FavoriteDAO.removeFavorite(userId, playerId);
      
      if (!removed) {
        return res.status(404).json({
          success: false,
          error: '收藏记录不存在'
        });
      }
      
      res.json({
        success: true,
        message: '取消收藏成功'
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * 检查是否已收藏
 */
router.get('/check/:playerId',
  auth,
  param('playerId').isInt({ min: 1 }).withMessage('陪玩ID必须是正整数'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: '参数验证失败',
          details: errors.array()
        });
      }
      
      const userId = req.user!.id;
      const playerId = parseInt(req.params.playerId);
      
      const isFavorite = await FavoriteDAO.isFavorite(userId, playerId);
      
      res.json({
        success: true,
        data: { isFavorite }
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;