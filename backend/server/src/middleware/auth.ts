// backend/server/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export interface AuthRequest extends Request {
    user?: { id: number; phone_num: string; role: string; authority?: number };
}

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// 验证 JWT 并挂载用户信息到 req.user
export function auth(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: '未提供 token' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = jwt.verify(token, JWT_SECRET) as any;
        req.user = { id: payload.id, phone_num: payload.phone_num, role: payload.role, authority: payload.authority };
        next();
    } catch (err) {
        return res.status(401).json({ success: false, error: '无效的 token' });
    }
}

// 签发 JWT Token
export function signToken(userId: number, phoneNum: string, role: string, authority?: number) {
    const payload = { id: userId, phone_num: phoneNum, role, authority };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });  // 设置 24 小时过期
}