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
// backend/server/src/routes/favorite.route.ts
const express_1 = require("express");
const FavoriteDao_1 = require("../dao/FavoriteDao");
const auth_1 = require("../middleware/auth");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
// 根路径 - 返回可用的收藏接口
router.get('/', (req, res) => {
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
router.get('/list', auth_1.auth, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const favorites = yield FavoriteDao_1.FavoriteDAO.getUserFavorites(userId);
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
    }
    catch (err) {
        next(err);
    }
}));
/**
 * 添加收藏
 */
router.post('/', auth_1.auth, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { playerId } = req.body;
        if (!playerId) {
            return res.status(400).json({
                success: false,
                error: '缺少陪玩ID'
            });
        }
        // 检查是否已经收藏
        const isAlreadyFavorite = yield FavoriteDao_1.FavoriteDAO.isFavorite(userId, playerId);
        if (isAlreadyFavorite) {
            return res.status(400).json({
                success: false,
                error: '已经收藏过该陪玩'
            });
        }
        const favoriteId = yield FavoriteDao_1.FavoriteDAO.addFavorite(userId, playerId);
        res.json({
            success: true,
            message: '收藏成功',
            data: { favoriteId }
        });
    }
    catch (err) {
        next(err);
    }
}));
/**
 * 移除收藏
 */
router.delete('/:playerId', auth_1.auth, (0, express_validator_1.param)('playerId').isInt({ min: 1 }).withMessage('陪玩ID必须是正整数'), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: '参数验证失败',
                details: errors.array()
            });
        }
        const userId = req.user.id;
        const playerId = parseInt(req.params.playerId);
        const removed = yield FavoriteDao_1.FavoriteDAO.removeFavorite(userId, playerId);
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
    }
    catch (err) {
        next(err);
    }
}));
/**
 * 检查是否已收藏
 */
router.get('/check/:playerId', auth_1.auth, (0, express_validator_1.param)('playerId').isInt({ min: 1 }).withMessage('陪玩ID必须是正整数'), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: '参数验证失败',
                details: errors.array()
            });
        }
        const userId = req.user.id;
        const playerId = parseInt(req.params.playerId);
        const isFavorite = yield FavoriteDao_1.FavoriteDAO.isFavorite(userId, playerId);
        res.json({
            success: true,
            data: { isFavorite }
        });
    }
    catch (err) {
        next(err);
    }
}));
exports.default = router;
