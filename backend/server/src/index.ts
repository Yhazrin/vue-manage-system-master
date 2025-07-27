// backend/server/src/index.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

// 加载 .env 配置
dotenv.config();

// 导入路由
import userRouter from './routes/user.route';
// import playerRouter from './routes/player.route';
// import managerRouter from './routes/manager.route';
// import roleRouter from './routes/role.route';
// import gameRouter from './routes/game.route';
// import orderRouter from './routes/order.route';
// import commentRouter from './routes/comment.route';
// import giftRouter from './routes/gift.route';
// import giftRecordRouter from './routes/giftRecord.route';
// import withdrawalRouter from './routes/withdrawal.route';
// import statisticsRouter from './routes/statistics.route';

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件：跨域 & 解析 JSON
app.use(cors());
app.use(bodyParser.json());

// 路由挂载
app.use('/api/users', userRouter);
// app.use('/api/players', playerRouter);
// app.use('/api/managers', managerRouter);
// app.use('/api/roles', roleRouter);
// app.use('/api/games', gameRouter);
// app.use('/api/orders', orderRouter);
// app.use('/api/comments', commentRouter);
// app.use('/api/gifts', giftRouter);
// app.use('/api/gift-records', giftRecordRouter);
// app.use('/api/withdrawals', withdrawalRouter);
// app.use('/api/statistics', statisticsRouter);

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

// 启动服务
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
