"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/server/src/index.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
console.log('🔥 载入了最新的 index.ts');
// 加载 .env 配置
dotenv_1.default.config();
// 导入路由
const user_route_1 = __importDefault(require("./routes/user.route"));
const player_route_1 = __importDefault(require("./routes/player.route"));
const manager_route_1 = __importDefault(require("./routes/manager.route"));
const game_route_1 = __importDefault(require("./routes/game.route"));
const order_route_1 = __importDefault(require("./routes/order.route"));
const comment_route_1 = __importDefault(require("./routes/comment.route"));
const gift_route_1 = __importDefault(require("./routes/gift.route"));
const giftRecord_route_1 = __importDefault(require("./routes/giftRecord.route"));
const withdrawal_route_1 = __importDefault(require("./routes/withdrawal.route"));
const statistics_route_1 = __importDefault(require("./routes/statistics.route"));
const service_route_1 = __importDefault(require("./routes/service.route"));
const monitor_route_1 = __importDefault(require("./routes/monitor.route"));
const favorite_route_1 = __importDefault(require("./routes/favorite.route"));
const apiMonitor_1 = require("./middleware/apiMonitor");
// 检查路由是否正确导入
const routes = [
    { name: 'userRouter', router: user_route_1.default },
    { name: 'playerRouter', router: player_route_1.default },
    { name: 'managerRouter', router: manager_route_1.default },
    { name: 'gameRouter', router: game_route_1.default },
    { name: 'orderRouter', router: order_route_1.default },
    { name: 'commentRouter', router: comment_route_1.default },
    { name: 'giftRouter', router: gift_route_1.default },
    { name: 'giftRecordRouter', router: giftRecord_route_1.default },
    { name: 'withdrawalRouter', router: withdrawal_route_1.default },
    { name: 'statisticsRouter', router: statistics_route_1.default },
    { name: 'serviceRouter', router: service_route_1.default },
    { name: 'monitorRouter', router: monitor_route_1.default },
    { name: 'favoriteRouter', router: favorite_route_1.default },
];
routes.forEach(({ name, router }) => {
    if (!router) {
        console.error(`❌ 路由 ${name} 未正确导入，请检查文件是否存在和导出是否正确`);
    }
    else { // @ts-ignore
        if (typeof router !== 'function' && !router.stack) {
            console.error(`❌ 路由 ${name} 导出格式不正确，应该导出 express.Router() 实例`);
        }
        else {
            console.log(`✅ 路由 ${name} 已正确导入`);
        }
    }
});
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// 中间件：跨域 & 解析 JSON
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
// API监控中间件（在所有路由之前）
app.use(apiMonitor_1.apiMonitorMiddleware);
// 在路由挂载之前
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../../../uploads')));
// 路由挂载
app.use('/api/users', user_route_1.default);
app.use('/api/players', player_route_1.default);
app.use('/api/managers', manager_route_1.default);
app.use('/api/games', game_route_1.default);
app.use('/api/orders', order_route_1.default);
app.use('/api/comments', comment_route_1.default);
app.use('/api/gifts', gift_route_1.default);
app.use('/api/gift-records', giftRecord_route_1.default);
app.use('/api/withdrawals', withdrawal_route_1.default);
app.use('/api/statistics', statistics_route_1.default);
app.use('/api/services', service_route_1.default);
app.use('/api/monitor', monitor_route_1.default);
app.use('/api/favorites', favorite_route_1.default);
// 根路径欢迎页面
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '陪玩系统后端API服务',
        version: '1.0.0',
        endpoints: {
            users: '/api/users',
            players: '/api/players',
            managers: '/api/managers',
            games: '/api/games',
            orders: '/api/orders',
            comments: '/api/comments',
            gifts: '/api/gifts',
            services: '/api/services',
            statistics: '/api/statistics',
            monitor: '/api/monitor',
            favorites: '/api/favorites'
        }
    });
});
app.get('/api/test', (req, res) => {
    res.send('测试路由');
});
// 全局错误处理
app.use((err, req, res, next) => {
    console.error(err);
    const statusCode = err.status || 500;
    const message = err.message || '服务器内部错误';
    res.status(statusCode).json({ success: false, error: message });
});
// 处理 404
app.use((req, res) => {
    res.status(404).json({ success: false, error: '接口不存在' });
});
// 启动服务
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
