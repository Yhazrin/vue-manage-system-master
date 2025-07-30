// backend/server/src/routes/favorite.route.ts
import { Router } from 'express';
import { FavoriteDAO } from '../dao/FavoriteDao';
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
    const favorites = await FavoriteDAO.getUserFavorites(userId);
    
    // 转换数据格式以匹配前端期望
    const formattedFavorites = favorites.map(fav => ({
      favoriteId: fav.id,
      favoritedAt: fav.created_at,
      player: {
        id: fav.player_id,
        name: fav.player_name,
        photo_img: fav.player_photo_img,
        intro: fav.player_intro,
        status: fav.player_status,
        game_id: fav.player_game_id
      }
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