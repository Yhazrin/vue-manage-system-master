// backend/server/src/index.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from "path";

console.log('🔥 载入了最新的 index.ts - 强制重新加载')

// 加载 .env 配置
dotenv.config();

// 导入路由
import userRouter from './routes/user.route';
import playerRouter from './routes/player.route';
import managerRouter from './routes/manager.route';
import gameRouter from './routes/game.route';
import orderRouter from './routes/order.route';
import commentRouter from './routes/comment.route';
import giftRouter from './routes/gift.route';
import giftRecordRouter from './routes/giftRecord.route';
import withdrawalRouter from './routes/withdrawal.route';
import statisticsRouter from './routes/statistics.route';
import serviceRouter from './routes/service.route';
import monitorRouter from './routes/monitor.route';
import favoriteRouter from './routes/favorite.route';
import notificationRouter from './routes/notification.route';
import configRouter from './routes/config.route';
import ratingRouter from './routes/rating.route';
import adminRouter from './routes/admin.route';
import attendanceRouter from './routes/attendance.route';
import customerServiceRouter from './routes/customer-service.route';
import { apiMonitorMiddleware } from './middleware/apiMonitor';

// 检查路由是否正确导入
const routes = [
    { name: 'userRouter', router: userRouter },
    { name: 'playerRouter', router: playerRouter },
    { name: 'managerRouter', router: managerRouter },
    { name: 'gameRouter', router: gameRouter },
    { name: 'orderRouter', router: orderRouter },
    { name: 'commentRouter', router: commentRouter },
    { name: 'giftRouter', router: giftRouter },
    { name: 'giftRecordRouter', router: giftRecordRouter },
    { name: 'withdrawalRouter', router: withdrawalRouter },
    { name: 'statisticsRouter', router: statisticsRouter },
    { name: 'serviceRouter', router: serviceRouter },
    { name: 'monitorRouter', router: monitorRouter },
    { name: 'favoriteRouter', router: favoriteRouter },
    { name: 'notificationRouter', router: notificationRouter },
    { name: 'configRouter', router: configRouter },
    { name: 'ratingRouter', router: ratingRouter },
    { name: 'adminRouter', router: adminRouter },
    { name: 'attendanceRouter', router: attendanceRouter },
    { name: 'customerServiceRouter', router: customerServiceRouter },
];

routes.forEach(({ name, router }) => {
    if (!router) {
        console.error(`❌ 路由 ${name} 未正确导入，请检查文件是否存在和导出是否正确`);
    } else { // @ts-ignore
        if (typeof router !== 'function' && !router.stack) {
                console.error(`❌ 路由 ${name} 导出格式不正确，应该导出 express.Router() 实例`);
            } else {
                console.log(`✅ 路由 ${name} 已正确导入`);
            }
    }
});

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件：跨域 & 解析 JSON
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 全局调试中间件
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log('🚨🚨🚨 全局中间件被调用！🚨🚨🚨');
    console.log(`🌐 全局中间件收到请求: ${req.method} ${req.originalUrl}`);
    console.log('请求头:', req.headers);
    console.log('请求体:', req.body);
    next();
});

// API监控中间件（在所有路由之前）
app.use(apiMonitorMiddleware);
// 在路由挂载之前 - 配置静态文件服务并添加CORS头
app.use('/uploads', (req: Request, res: Response, next: NextFunction) => {
    // 添加CORS头
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // 为图片文件设置正确的Content-Type
    const ext = path.extname(req.path).toLowerCase();
    if (ext === '.png') {
        res.type('image/png');
    } else if (ext === '.jpg' || ext === '.jpeg') {
        res.type('image/jpeg');
    } else if (ext === '.gif') {
        res.type('image/gif');
    } else if (ext === '.svg') {
        res.type('image/svg+xml');
    } else if (ext === '.webp') {
        res.type('image/webp');
    }
    
    next();
}, express.static(path.join(__dirname, '../uploads')));

// 路由挂载
app.use('/api/users', userRouter);
app.use('/api/players', playerRouter);
app.use('/api/managers', managerRouter);
app.use('/api/games', gameRouter);
app.use('/api/orders', orderRouter);
app.use('/api/comments', commentRouter);
app.use('/api/gifts', giftRouter);
app.use('/api/gift-records', giftRecordRouter);
app.use('/api/withdrawals', withdrawalRouter);
app.use('/api/statistics', statisticsRouter);
app.use('/api/services', serviceRouter);
app.use('/api/monitor', monitorRouter);
app.use('/api/favorites', favoriteRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/config', configRouter);
app.use('/api/ratings', ratingRouter);
app.use('/api/admin', adminRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/customer-service', customerServiceRouter);

// 添加一个简单的测试路由
app.post('/api/test-managers', (req, res) => {
    console.log('🧪 测试路由被调用:', req.body);
    res.json({ success: true, message: '测试路由工作正常', body: req.body });
});

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
            favorites: '/api/favorites',
            ratings: '/api/ratings'
        }
    });
});

app.get('/api/test', (req, res) => {
    res.send('测试路由');
});

// 全局错误处理
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    const statusCode = err.status || 500;
    const message = err.message || '服务器内部错误';
    res.status(statusCode).json({ success: false, error: message });
});

// 处理 404
app.use((req: Request, res: Response) => {
    res.status(404).json({ success: false, error: '接口不存在' });
});

// 测试数据库连接
import { pool } from './db';

// 启动服务
app.listen(PORT, async () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    
    // 测试数据库连接
    try {
        const connection = await pool.getConnection();
        console.log('✅ 数据库连接成功');
        connection.release();
    } catch (error) {
        console.error('❌ 数据库连接失败:', error);
    }
});
