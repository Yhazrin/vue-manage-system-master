// backend/server/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import { UserDAO } from '../dao/UserDao';
import { PlayerDAO } from '../dao/PlayerDao';
import { CustomerServiceDao } from '../dao/CustomerServiceDao';
import { ManagerDAO } from '../dao/ManagerDao';

dotenv.config();

export interface AuthRequest extends Request {
    user?: { id: number; phone_num: string; role: string; username?: string };
}

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// 验证 JWT 并挂载用户信息到 req.user
export async function auth(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: '未提供 token' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = jwt.verify(token, JWT_SECRET) as any;
        
        // 实时检查用户封禁状态
        let currentUser = null;
        if (payload.role === 'user') {
            currentUser = await UserDAO.findById(payload.id);
        } else if (payload.role === 'player') {
            currentUser = await PlayerDAO.findById(payload.id);
        } else if (payload.role === 'customer_service') {
            currentUser = await CustomerServiceDao.findById(payload.id);
        } else if (payload.role === 'admin') {
            currentUser = await ManagerDAO.findById(payload.id);
        }
        
        // 如果找到用户且用户被封禁，返回封禁错误
        if (currentUser) {
            // 对于不同角色，status字段的类型可能不同
            let isBanned = false;
            if (payload.role === 'customer_service') {
                // 客服的status是字符串类型：'active', 'inactive', 'suspended'
                isBanned = currentUser.status === 'inactive' || currentUser.status === 'suspended';
            } else {
                // 用户、陪玩、管理员的status是boolean类型
                isBanned = currentUser.status === false || currentUser.status === 0;
            }
            
            if (isBanned) {
                return res.status(403).json({ 
                    success: false, 
                    error: payload.role === 'customer_service' ? '账户已被禁用，请联系管理员' : '账号已被封禁，请联系客服', 
                    banned: true 
                });
            }
        }
        
        req.user = { id: payload.id, phone_num: payload.phone_num, role: payload.role, username: payload.username };
        next();
    } catch (err) {
        return res.status(401).json({ success: false, error: '无效的 token' });
    }
}

// 签发 JWT Token
export function signToken(userId: number, phoneNum: string, role: string) {
    const payload = { id: userId, phone_num: phoneNum, role };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });  // 设置 24 小时过期
}