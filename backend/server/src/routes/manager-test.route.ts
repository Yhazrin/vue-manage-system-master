// 简化的测试路由
import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';

const router = Router();

// 添加调试中间件
router.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`🔍 Manager测试路由收到请求: ${req.method} ${req.originalUrl}`);
    next();
});

// 简单的POST路由测试
router.post('/', (req: Request, res: Response) => {
    console.log('POST /managers 测试路由被调用');
    res.json({ 
        success: true, 
        message: '测试路由工作正常',
        body: req.body 
    });
});

export default router;