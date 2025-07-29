"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const apiMonitor_1 = require("../middleware/apiMonitor");
const router = express_1.default.Router();
// 获取所有API请求记录
router.get('/requests', (req, res) => {
    try {
        const { page = 1, limit = 50, status, method, path } = req.query;
        let requests = apiMonitor_1.apiMonitor.getAllRequests();
        // 过滤
        if (status) {
            const statusCode = parseInt(status);
            requests = requests.filter(req => req.status === statusCode);
        }
        if (method) {
            requests = requests.filter(req => req.method === method);
        }
        if (path) {
            requests = requests.filter(req => req.url.includes(path));
        }
        // 分页
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;
        const paginatedRequests = requests.slice(startIndex, endIndex);
        res.json({
            success: true,
            data: {
                requests: paginatedRequests,
                total: requests.length,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(requests.length / limitNum)
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: '获取API请求记录失败',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// 获取API统计信息
router.get('/stats', (req, res) => {
    try {
        const stats = apiMonitor_1.apiMonitor.getStats();
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: '获取API统计信息失败',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// 获取实时API状态
router.get('/status', (req, res) => {
    try {
        const recentRequests = apiMonitor_1.apiMonitor.getAllRequests().slice(0, 10);
        const stats = apiMonitor_1.apiMonitor.getStats();
        res.json({
            success: true,
            data: {
                recentRequests,
                stats,
                serverTime: new Date(),
                uptime: process.uptime()
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: '获取API状态失败',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// 清空API记录
router.delete('/clear', (req, res) => {
    try {
        apiMonitor_1.apiMonitor.clear();
        res.json({
            success: true,
            message: 'API记录已清空'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: '清空API记录失败',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// 获取特定请求详情
router.get('/requests/:id', (req, res) => {
    try {
        const { id } = req.params;
        const request = apiMonitor_1.apiMonitor.getAllRequests().find(req => req.id === id);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: '请求记录不存在'
            });
        }
        res.json({
            success: true,
            data: request
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: '获取请求详情失败',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// 获取API路径列表
router.get('/paths', (req, res) => {
    try {
        const requests = apiMonitor_1.apiMonitor.getAllRequests();
        const paths = [...new Set(requests.map(req => req.url.split('?')[0]))];
        res.json({
            success: true,
            data: paths.sort()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: '获取API路径列表失败',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
