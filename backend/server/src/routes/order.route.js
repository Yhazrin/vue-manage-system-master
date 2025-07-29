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
// backend/server/src/routes/order.route.ts
const express_1 = require("express");
const OrderDao_1 = require("../dao/OrderDao");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/orders
 * @desc    创建新订单
 * @body    { order_id, user_id, player_id, game_id, status }
 */
router.post('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { order_id, user_id, player_id, game_id, service_id } = req.body;
        const id = yield OrderDao_1.OrderDAO.create({ order_id, user_id, player_id, game_id, service_id });
        res.status(201).json({ success: true, order_id: id });
    }
    catch (err) {
        next(err);
    }
}));
/**
 * @route   GET /api/orders/player
 * @desc    获取陪玩的订单列表
 * @query   status?
 */
router.get('/player', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 这里应该从JWT token中获取player_id，暂时使用模拟数据
        const status = req.query.status;
        // 模拟陪玩订单数据
        const mockOrders = [
            {
                id: 'order_001',
                gameType: '王者荣耀',
                price: 50.00,
                orderTime: '2024-01-15 14:30:00',
                status: 'pending',
                serviceTime: '2小时',
                description: '需要上分到王者段位',
                user: {
                    id: 'user_001',
                    nickname: '游戏爱好者',
                    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user001'
                },
                player: {
                    id: 'player_001',
                    nickname: '王者小姐姐',
                    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=player001'
                }
            },
            {
                id: 'order_002',
                gameType: '英雄联盟',
                price: 80.00,
                orderTime: '2024-01-15 16:00:00',
                status: 'in_progress',
                serviceTime: '3小时',
                description: '陪玩排位赛',
                user: {
                    id: 'user_002',
                    nickname: 'LOL玩家',
                    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user002'
                },
                player: {
                    id: 'player_001',
                    nickname: '王者小姐姐',
                    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=player001'
                }
            }
        ];
        // 根据状态筛选
        const filteredOrders = status && status !== 'all'
            ? mockOrders.filter(order => order.status === status)
            : mockOrders;
        res.json(filteredOrders);
    }
    catch (err) {
        next(err);
    }
}));
/**
 * @route   GET /api/orders/user
 * @desc    获取用户的订单列表
 * @query   status?
 */
router.get('/user', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 这里应该从JWT token中获取user_id，暂时使用模拟数据
        const status = req.query.status;
        // 模拟用户订单数据
        const mockOrders = [
            {
                id: 'order_003',
                gameType: '王者荣耀',
                price: 50.00,
                orderTime: '2024-01-15 14:30:00',
                status: 'completed',
                serviceTime: '2小时',
                description: '需要上分到王者段位',
                user: {
                    id: 'user_001',
                    nickname: '游戏爱好者',
                    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user001'
                },
                player: {
                    id: 'player_001',
                    nickname: '王者小姐姐',
                    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=player001'
                }
            }
        ];
        // 根据状态筛选
        const filteredOrders = status && status !== 'all'
            ? mockOrders.filter(order => order.status === status)
            : mockOrders;
        res.json(filteredOrders);
    }
    catch (err) {
        next(err);
    }
}));
/**
 * @route   GET /api/orders
 * @desc    分页查询订单列表
 * @query   page, pageSize, status?
 */
router.get('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = Number(req.query.page) || 1;
        const pageSize = Number(req.query.pageSize) || 20;
        const status = req.query.status;
        const result = yield OrderDao_1.OrderDAO.findAll(page, pageSize, status);
        res.json(Object.assign({ success: true }, result));
    }
    catch (err) {
        next(err);
    }
}));
/**
 * @route   GET /api/orders/:order_id
 * @desc    获取单个订单
 */
router.get('/:order_id', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { order_id } = req.params;
        const order = yield OrderDao_1.OrderDAO.findById(order_id);
        if (!order)
            return res.status(404).json({ success: false, error: '订单不存在' });
        res.json({ success: true, order });
    }
    catch (err) {
        next(err);
    }
}));
/**
 * @route   PATCH /api/orders/:order_id/status
 * @desc    更新订单状态
 * @body    { status }
 */
router.patch('/:order_id/status', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { order_id } = req.params;
        const { status } = req.body;
        yield OrderDao_1.OrderDAO.updateStatus(order_id, status);
        res.json({ success: true });
    }
    catch (err) {
        next(err);
    }
}));
/**
 * @route   DELETE /api/orders/:order_id
 * @desc    删除订单
 */
router.delete('/:order_id', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { order_id } = req.params;
        yield OrderDao_1.OrderDAO.deleteById(order_id);
        res.json({ success: true });
    }
    catch (err) {
        next(err);
    }
}));
exports.default = router;
